/**
 * Lifecycle Hooks for Auto One-Click Admin addon.
 * Configures one-click admin when sites are added (created, imported, or cloned).
 *
 * KEY INSIGHT: Local has TWO mechanisms for site events:
 * 1. HooksMain.doActions('siteAdded') - Used by AddSiteService and CloneSiteService
 * 2. sendIPCEvent('siteAdded') - Used by ALL flows including ImporterLocalExport
 *
 * Since ImporterLocalExport (used for imports AND blueprints) only calls sendIPCEvent
 * and NOT HooksMain.doActions, we must listen for the IPC event to catch all cases.
 *
 * All site creation flows call sendIPCEvent('siteAdded'), which emits on ipcMain,
 * so we use ipcMain.on('siteAdded', ...) to handle ALL cases uniformly.
 *
 * @module main/lifecycle-hooks
 */

import * as LocalMain from '@getflywheel/local/main';
import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { ADDON_NAME, STORAGE_KEYS, IPC_CHANNELS } from '../common/constants';
import type { LocalServices, Site, WPUser, ConfiguredEventData } from '../common/types';

/**
 * Validates that a value is a valid WPUser array.
 *
 * @param users - The value to validate
 * @returns True if users is a valid WPUser array
 */
function isValidWPUserArray(users: unknown): users is WPUser[] {
  if (!Array.isArray(users)) {
    return false;
  }
  return users.every(
    (user) =>
      typeof user === 'object' &&
      user !== null &&
      typeof user.ID === 'string' &&
      typeof user.user_login === 'string'
  );
}

/**
 * Parses a user ID string to a number, with validation.
 *
 * @param idString - The ID string to parse
 * @returns The parsed number, or null if invalid
 */
function parseUserId(idString: string): number | null {
  const id = parseInt(idString, 10);
  if (isNaN(id) || id <= 0) {
    return null;
  }
  return id;
}

/**
 * Registers event listeners for automatic one-click admin configuration.
 * Note: We use ipcMain.on('siteAdded') instead of context.hooks because
 * ImporterLocalExport (imports/blueprints) only emits IPC events, not hooks.
 *
 * @param _context - The addon main context (unused but required by interface)
 */
export function registerLifecycleHooks(_context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as unknown as LocalServices;
  const { localLogger, userData, siteData, wpCli } = services;

  if (!localLogger || !userData || !siteData || !wpCli) {
    throw new Error('Required services not available');
  }

  /**
   * Helper to check if the feature is enabled.
   *
   * @returns True if auto one-click admin is enabled
   */
  const isEnabled = (): boolean => {
    return userData.get<boolean>(STORAGE_KEYS.ENABLED, true);
  };

  /**
   * Configure one-click admin for a site.
   * Extracted into a function so it can be called from multiple event sources.
   *
   * @param site - The site to configure
   */
  const configureOneClickAdmin = async (site: Site): Promise<void> => {
    try {
      localLogger.info(`[${ADDON_NAME}] Site added: "${site.name}" (${site.id})`);

      // Check if feature is enabled
      if (!isEnabled()) {
        localLogger.info(`[${ADDON_NAME}] Feature disabled, skipping`);
        return;
      }

      // Check if site already has one-click admin configured
      if (site.oneClickAdminID) {
        localLogger.info(`[${ADDON_NAME}] Site already has one-click admin configured`);
        return;
      }

      // For new sites, the site is already running when siteAdded fires
      // Run WP-CLI to get administrator users
      localLogger.info(`[${ADDON_NAME}] Fetching admin users for "${site.name}"...`);

      let users: WPUser[];
      try {
        const result = await wpCli.run(site, [
          'user',
          'list',
          '--role=administrator',
          '--format=json',
        ]);

        if (!result || typeof result !== 'string') {
          localLogger.warn(`[${ADDON_NAME}] WP-CLI returned empty result`);
          return;
        }

        const parsed: unknown = JSON.parse(result);
        if (!isValidWPUserArray(parsed)) {
          localLogger.warn(`[${ADDON_NAME}] WP-CLI returned invalid user data`);
          return;
        }
        users = parsed;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        localLogger.error(`[${ADDON_NAME}] Failed to get admin users: ${errorMessage}`);
        return;
      }

      // Validate we have admin users
      if (users.length === 0) {
        localLogger.warn(`[${ADDON_NAME}] No administrator users found for "${site.name}"`);
        return;
      }

      // Get the first admin user
      const firstAdmin = users[0];
      const userId = parseUserId(firstAdmin.ID);

      if (userId === null) {
        localLogger.error(`[${ADDON_NAME}] Invalid user ID: ${firstAdmin.ID}`);
        return;
      }

      const displayName = firstAdmin.display_name || firstAdmin.user_login;

      // Update site with one-click admin settings
      try {
        siteData.updateSite(site.id, {
          oneClickAdminID: userId,
          oneClickAdminDisplayName: displayName,
        });

        localLogger.info(
          `[${ADDON_NAME}] Successfully configured one-click admin for "${site.name}": ` +
            `User ${userId} (${displayName})`
        );

        // Send custom IPC event to notify renderer that one-click admin was configured
        // The renderer will force a page refresh to update the Apollo cache
        sendConfiguredEvent(site.id, site.name, userId, displayName);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        localLogger.error(`[${ADDON_NAME}] Failed to update site: ${errorMessage}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      localLogger.error(`[${ADDON_NAME}] Error configuring one-click admin: ${errorMessage}`);
    }
  };

  /**
   * Sends the CONFIGURED IPC event to all renderer windows.
   *
   * @param siteId - The site ID
   * @param siteName - The site name
   * @param userId - The configured user ID
   * @param displayName - The user's display name
   */
  const sendConfiguredEvent = (
    siteId: string,
    siteName: string,
    userId: number,
    displayName: string
  ): void => {
    try {
      const windows = BrowserWindow.getAllWindows();
      localLogger.info(`[${ADDON_NAME}] Sending CONFIGURED IPC to ${windows.length} window(s)...`);

      const eventData: ConfiguredEventData = {
        siteId,
        siteName,
        userId,
        displayName,
      };

      windows.forEach((window) => {
        window.webContents.send(IPC_CHANNELS.CONFIGURED, eventData);
      });

      localLogger.info(`[${ADDON_NAME}] Sent CONFIGURED event to renderer`);
    } catch (ipcError: unknown) {
      const errorMessage = ipcError instanceof Error ? ipcError.message : String(ipcError);
      localLogger.error(`[${ADDON_NAME}] Could not send configured event: ${errorMessage}`);
    }
  };

  /**
   * IPC Event Listener for 'siteAdded'.
   *
   * This fires for ALL site creation flows because Local's sendIPCEvent() function
   * emits on ipcMain in addition to sending to renderer. This handles:
   * - Regular site creation (AddSiteService)
   * - Site cloning (CloneSiteService)
   * - Site import (ImporterLocalExport, ImporterGeneric)
   * - Blueprint creation (uses ImporterLocalExport)
   *
   * IMPORTANT: The site object from IPC is serialized data, not a full Site instance.
   * It's missing methods (getSiteServiceByRole) and some properties (paths).
   * We must fetch the full site from siteData using the site ID.
   */
  ipcMain.on('siteAdded', async (_event: IpcMainEvent, siteFromIpc: unknown) => {
    // Validate the IPC data has required properties
    if (
      typeof siteFromIpc !== 'object' ||
      siteFromIpc === null ||
      !('id' in siteFromIpc) ||
      typeof (siteFromIpc as { id: unknown }).id !== 'string'
    ) {
      localLogger.warn(`[${ADDON_NAME}] Invalid siteAdded IPC event data, skipping`);
      return;
    }

    const siteData_ = siteFromIpc as { id: string; name?: string };
    localLogger.info(
      `[${ADDON_NAME}] Received siteAdded IPC event for: "${siteData_.name ?? 'unknown'}" (${siteData_.id})`
    );

    // The IPC event gives us serialized data - we need the full Site instance
    // from siteData to have access to paths and methods that wpCli.run() needs
    const fullSite = siteData.getSite(siteData_.id) as Site | null;

    if (!fullSite) {
      localLogger.warn(
        `[${ADDON_NAME}] Could not find site ${siteData_.id} in siteData, skipping`
      );
      return;
    }

    await configureOneClickAdmin(fullSite);
  });

  localLogger.info(`[${ADDON_NAME}] IPC listener registered for siteAdded events`);
}

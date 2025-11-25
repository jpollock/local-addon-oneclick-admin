/**
 * Lifecycle Hooks for Auto One-Click Admin addon
 * Configures one-click admin when sites are added (created, imported, or cloned)
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
 */

import * as LocalMain from '@getflywheel/local/main';
import { ipcMain } from 'electron';
import { ADDON_NAME, STORAGE_KEYS, IPC_CHANNELS } from '../common/constants';

/**
 * WordPress user structure from WP-CLI user list
 */
interface WPUser {
  ID: string;
  user_login: string;
  display_name: string;
  user_email: string;
  roles: string;
}

/**
 * Registers event listeners for automatic one-click admin configuration
 * Note: We use ipcMain.on('siteAdded') instead of context.hooks because
 * ImporterLocalExport (imports/blueprints) only emits IPC events, not hooks.
 */
export function registerLifecycleHooks(_context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as any;
  const { localLogger, userData, siteData, wpCli } = services;

  /**
   * Helper to check if the feature is enabled
   */
  const isEnabled = (): boolean => {
    return userData.get(STORAGE_KEYS.ENABLED, true);
  };

  /**
   * Configure one-click admin for a site
   * Extracted into a function so it can be called from multiple event sources
   */
  const configureOneClickAdmin = async (site: any): Promise<void> => {
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

        if (!result) {
          localLogger.warn(`[${ADDON_NAME}] WP-CLI returned empty result`);
          return;
        }

        users = JSON.parse(result);
      } catch (error: any) {
        localLogger.error(`[${ADDON_NAME}] Failed to get admin users:`, error);
        return;
      }

      // Validate we have admin users
      if (!Array.isArray(users) || users.length === 0) {
        localLogger.warn(`[${ADDON_NAME}] No administrator users found for "${site.name}"`);
        return;
      }

      // Get the first admin user
      const firstAdmin = users[0];
      const userId = parseInt(firstAdmin.ID, 10);
      const displayName = firstAdmin.display_name || firstAdmin.user_login;

      if (isNaN(userId) || userId <= 0) {
        localLogger.error(`[${ADDON_NAME}] Invalid user ID: ${firstAdmin.ID}`);
        return;
      }

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
        try {
          const { BrowserWindow } = require('electron');
          const windows = BrowserWindow.getAllWindows();
          localLogger.info(`[${ADDON_NAME}] Sending CONFIGURED IPC to ${windows.length} window(s)...`);
          windows.forEach((window: any) => {
            window.webContents.send(IPC_CHANNELS.CONFIGURED, {
              siteId: site.id,
              siteName: site.name,
              userId,
              displayName,
            });
          });
          localLogger.info(`[${ADDON_NAME}] Sent CONFIGURED event to renderer`);
        } catch (ipcError) {
          localLogger.error(`[${ADDON_NAME}] Could not send configured event:`, ipcError);
        }
      } catch (error: any) {
        localLogger.error(`[${ADDON_NAME}] Failed to update site:`, error);
      }
    } catch (error) {
      localLogger.error(`[${ADDON_NAME}] Error configuring one-click admin:`, error);
    }
  };

  /**
   * IPC Event Listener for 'siteAdded'
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
  ipcMain.on('siteAdded', async (_event: any, siteFromIpc: any) => {
    localLogger.info(`[${ADDON_NAME}] Received siteAdded IPC event for: "${siteFromIpc?.name}" (${siteFromIpc?.id})`);

    if (!siteFromIpc?.id) {
      localLogger.warn(`[${ADDON_NAME}] No site ID in IPC event, skipping`);
      return;
    }

    // The IPC event gives us serialized data - we need the full Site instance
    // from siteData to have access to paths and methods that wpCli.run() needs
    const fullSite = siteData.getSite(siteFromIpc.id);

    if (!fullSite) {
      localLogger.warn(`[${ADDON_NAME}] Could not find site ${siteFromIpc.id} in siteData, skipping`);
      return;
    }

    await configureOneClickAdmin(fullSite);
  });

  localLogger.info(`[${ADDON_NAME}] IPC listener registered for siteAdded events`);
}

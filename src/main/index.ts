/**
 * Auto One-Click Admin - Main Process Entry Point
 *
 * This addon automatically enables one-click admin for new sites
 * by fetching the first administrator user and configuring the site.
 *
 * @module main/index
 */

import * as LocalMain from '@getflywheel/local/main';
import { ADDON_NAME, ADDON_VERSION } from '../common/constants';
import { registerIpcHandlers } from './ipc-handlers';
import { registerLifecycleHooks } from './lifecycle-hooks';
import type { LocalServices } from '../common/types';

/**
 * Main addon initialization function.
 * Called when Local loads the addon.
 *
 * @param context - The addon main context provided by Local
 */
export default function (context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as unknown as LocalServices;
  const { localLogger } = services;

  if (!localLogger) {
    // Cannot log error - just return gracefully
    return;
  }

  try {
    localLogger.info(`[${ADDON_NAME}] Initializing version ${ADDON_VERSION}`);

    // Register IPC handlers for settings management
    registerIpcHandlers(context);

    // Register lifecycle hooks for site creation
    registerLifecycleHooks(context);

    localLogger.info(`[${ADDON_NAME}] Successfully initialized`);
  } catch (error: unknown) {
    // Don't crash Local on addon initialization failure
    const errorMessage = error instanceof Error ? error.message : String(error);
    localLogger.error(`[${ADDON_NAME}] Failed to initialize: ${errorMessage}`);
  }
}

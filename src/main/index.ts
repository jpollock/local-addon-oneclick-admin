/**
 * Auto One-Click Admin - Main Process Entry Point
 *
 * This addon automatically enables one-click admin for new sites
 * by fetching the first administrator user and configuring the site.
 */

import * as LocalMain from '@getflywheel/local/main';
import { ADDON_NAME, ADDON_VERSION } from '../common/constants';
import { registerIpcHandlers } from './ipc-handlers';
import { registerLifecycleHooks } from './lifecycle-hooks';

/**
 * Main addon initialization function
 * Called when Local loads the addon
 */
export default function (context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as any;
  const { localLogger } = services;

  try {
    localLogger.info(`[${ADDON_NAME}] Initializing version ${ADDON_VERSION}`);

    // Register IPC handlers for settings management
    registerIpcHandlers(context);

    // Register lifecycle hooks for site creation
    registerLifecycleHooks(context);

    localLogger.info(`[${ADDON_NAME}] Successfully initialized`);
  } catch (error: any) {
    // Don't crash Local on addon initialization failure
    localLogger.error(`[${ADDON_NAME}] Failed to initialize:`, error);
  }
}

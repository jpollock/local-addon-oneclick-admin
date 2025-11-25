/**
 * IPC Handlers for Auto One-Click Admin addon
 * Uses ipcMain.handle() for main-renderer communication
 */

import * as LocalMain from '@getflywheel/local/main';
import { ADDON_NAME, IPC_CHANNELS, STORAGE_KEYS } from '../common/constants';

/**
 * Registers IPC handlers for settings management
 */
export function registerIpcHandlers(context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as any;
  const { localLogger, userData } = services;
  const { ipcMain } = require('electron');

  /**
   * Helper to create consistent IPC responses
   */
  const createResponse = <T>(success: boolean, data?: T, error?: string) => ({
    success,
    data,
    error,
    timestamp: Date.now(),
  });

  /**
   * GET_SETTINGS handler
   * Returns current addon settings
   */
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    try {
      const enabled = userData.get(STORAGE_KEYS.ENABLED, true);
      localLogger.debug(`[${ADDON_NAME}] Get settings: enabled=${enabled}`);
      return createResponse(true, { enabled });
    } catch (error: any) {
      localLogger.error(`[${ADDON_NAME}] Failed to get settings:`, error);
      return createResponse(false, undefined, error.message);
    }
  });

  /**
   * SAVE_SETTINGS handler
   * Persists addon settings to userData
   */
  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_event: any, data: { enabled: boolean }) => {
    try {
      if (typeof data?.enabled !== 'boolean') {
        return createResponse(false, undefined, 'Invalid settings: enabled must be a boolean');
      }

      userData.set(STORAGE_KEYS.ENABLED, data.enabled);
      localLogger.info(`[${ADDON_NAME}] Settings saved: enabled=${data.enabled}`);
      return createResponse(true, { enabled: data.enabled });
    } catch (error: any) {
      localLogger.error(`[${ADDON_NAME}] Failed to save settings:`, error);
      return createResponse(false, undefined, error.message);
    }
  });

  localLogger.info(`[${ADDON_NAME}] IPC handlers registered`);
}

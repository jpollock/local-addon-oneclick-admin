/**
 * IPC Handlers for Auto One-Click Admin addon.
 * Uses ipcMain.handle() for main-renderer communication.
 *
 * @module main/ipc-handlers
 */

import * as LocalMain from '@getflywheel/local/main';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { ADDON_NAME, IPC_CHANNELS, STORAGE_KEYS } from '../common/constants';
import type { LocalServices, IPCResponse, SettingsData } from '../common/types';

/**
 * Creates a consistent IPC response object.
 *
 * @param success - Whether the operation succeeded
 * @param data - Optional response data
 * @param error - Optional error message
 * @returns Formatted IPC response
 */
function createResponse<T>(success: boolean, data?: T, error?: string): IPCResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: Date.now(),
  };
}

/**
 * Validates settings data structure.
 *
 * @param data - The data to validate
 * @returns True if data is a valid SettingsData object
 */
function isValidSettingsData(data: unknown): data is SettingsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'enabled' in data &&
    typeof (data as SettingsData).enabled === 'boolean'
  );
}

/**
 * Registers IPC handlers for settings management.
 *
 * @param _context - The addon main context (unused but required by interface)
 */
export function registerIpcHandlers(_context: LocalMain.AddonMainContext): void {
  const services = LocalMain.getServiceContainer().cradle as unknown as LocalServices;
  const { localLogger, userData } = services;

  if (!localLogger || !userData) {
    throw new Error('Required services (localLogger, userData) not available');
  }

  /**
   * GET_SETTINGS handler.
   * Returns current addon settings.
   */
  ipcMain.handle(
    IPC_CHANNELS.GET_SETTINGS,
    async (): Promise<IPCResponse<SettingsData | undefined>> => {
      try {
        const enabled = userData.get<boolean>(STORAGE_KEYS.ENABLED, true);
        localLogger.debug(`[${ADDON_NAME}] Get settings: enabled=${enabled}`);
        return createResponse(true, { enabled });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        localLogger.error(`[${ADDON_NAME}] Failed to get settings: ${errorMessage}`);
        return createResponse(false, undefined, errorMessage);
      }
    }
  );

  /**
   * SAVE_SETTINGS handler.
   * Persists addon settings to userData.
   */
  ipcMain.handle(
    IPC_CHANNELS.SAVE_SETTINGS,
    async (
      _event: IpcMainInvokeEvent,
      data: unknown
    ): Promise<IPCResponse<SettingsData | undefined>> => {
      try {
        // Validate input data
        if (!isValidSettingsData(data)) {
          return createResponse(false, undefined, 'Invalid settings: enabled must be a boolean');
        }

        userData.set(STORAGE_KEYS.ENABLED, data.enabled);
        localLogger.info(`[${ADDON_NAME}] Settings saved: enabled=${data.enabled}`);
        return createResponse(true, { enabled: data.enabled });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        localLogger.error(`[${ADDON_NAME}] Failed to save settings: ${errorMessage}`);
        return createResponse(false, undefined, errorMessage);
      }
    }
  );

  localLogger.info(`[${ADDON_NAME}] IPC handlers registered`);
}

/**
 * Constants for the Auto One-Click Admin addon
 */

export const ADDON_NAME = 'Auto One-Click Admin';
export const ADDON_SLUG = 'oneclick-admin';
export const ADDON_VERSION = '1.0.0';

/**
 * Storage keys for userData persistence
 */
export const STORAGE_KEYS = {
  /** Whether the feature is enabled (default: true) */
  ENABLED: `${ADDON_SLUG}_enabled`,
} as const;

/**
 * IPC channel names for main-renderer communication
 */
export const IPC_CHANNELS = {
  /** Get current addon settings */
  GET_SETTINGS: `${ADDON_SLUG}:get-settings`,
  /** Save addon settings */
  SAVE_SETTINGS: `${ADDON_SLUG}:save-settings`,
  /** Notify renderer that one-click admin was configured */
  CONFIGURED: `${ADDON_SLUG}:configured`,
} as const;

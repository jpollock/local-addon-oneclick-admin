/**
 * Type definitions for Auto One-Click Admin addon
 * Provides type safety for Local's services and addon interfaces
 */

/**
 * Logger interface from Local's service container
 */
export interface LocalLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

/**
 * UserData interface for persistent storage
 */
export interface UserData {
  get: <T>(key: string, defaultValue?: T) => T;
  set: (key: string, value: unknown) => void;
}

/**
 * Site object from Local
 */
export interface Site {
  id: string;
  name: string;
  domain?: string;
  path?: string;
  paths?: {
    webRoot: string;
    [key: string]: string;
  };
  oneClickAdminID?: number;
  oneClickAdminDisplayName?: string;
}

/**
 * SiteData service interface
 */
export interface SiteData {
  getSite: (siteId: string) => unknown;
  updateSite: (siteId: string, updates: Record<string, unknown>) => void;
}

/**
 * WP-CLI service interface
 */
export interface WpCli {
  run: (site: unknown, args: string[]) => Promise<string | null>;
}

/**
 * Local service container services
 */
export interface LocalServices {
  localLogger: LocalLogger;
  userData: UserData;
  siteData: SiteData;
  wpCli: WpCli;
}

/**
 * WordPress user structure from WP-CLI user list.
 * Note: ID can be string or number depending on WP-CLI version/platform.
 */
export interface WPUser {
  ID: string | number;
  user_login: string;
  display_name: string;
  user_email: string;
  roles: string;
}

/**
 * IPC Response wrapper type
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Settings data structure
 */
export interface SettingsData {
  enabled: boolean;
}

/**
 * Electron IPC Renderer interface
 */
export interface ElectronIpcRenderer {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
  on: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => void;
}

/**
 * Electron API exposed to renderer
 */
export interface ElectronAPI {
  ipcRenderer: ElectronIpcRenderer;
}

/**
 * React type (from Local's context)
 */
export type ReactType = typeof import('react');

/**
 * Local addon hooks interface
 */
export interface LocalHooks {
  addContent: (location: string, component: unknown) => void;
  addFilter: <T>(name: string, callback: (value: T, ...args: unknown[]) => T) => void;
}

/**
 * Component context provided by Local to renderer
 */
export interface ComponentContext {
  React: ReactType;
  hooks: LocalHooks;
  electron?: ElectronAPI;
}

/**
 * Preferences panel props
 */
export interface PreferencesPanelProps {
  context: ComponentContext;
  onSettingsChange?: (settings: SettingsData) => void;
  setApplyButtonDisabled?: (disabled: boolean) => void;
}

/**
 * Preferences panel state
 */
export interface PreferencesPanelState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Configured event data sent from main to renderer
 */
export interface ConfiguredEventData {
  siteId: string;
  siteName: string;
  userId: number;
  displayName: string;
}

/**
 * Preferences menu item structure
 */
export interface PreferencesMenuItem {
  path: string;
  displayName: string;
  sections: (props: { setApplyButtonDisabled?: (disabled: boolean) => void }) => unknown;
  onApply: () => Promise<void>;
}

/**
 * Auto One-Click Admin - Renderer Process Entry Point.
 * Registers the preferences panel in Local's UI.
 *
 * @module renderer/index
 */

import { ADDON_NAME, IPC_CHANNELS } from '../common/constants';
import { PreferencesPanel } from './PreferencesPanel';
import type {
  ComponentContext,
  ConfiguredEventData,
  SettingsData,
  PreferencesMenuItem,
  IPCResponse,
} from '../common/types';

/**
 * Extended window interface for Apollo Client access.
 */
interface WindowWithApollo extends Window {
  __APOLLO_CLIENT__?: ApolloClient;
  __APOLLO_DEVTOOLS_GLOBAL_HOOK__?: {
    ApolloClient?: ApolloClient;
  };
  electron?: ComponentContext['electron'];
}

/**
 * Minimal Apollo Client interface for cache operations.
 */
interface ApolloClient {
  cache?: {
    evict: (options: { id: string; fieldName: string; args?: Record<string, unknown> }) => boolean;
    gc: () => void;
  };
  refetchQueries: (options: { include: string }) => Promise<unknown>;
}

/**
 * Finds Apollo Client instance from window globals.
 * Local uses Apollo Client for state management, exposed via DevTools hooks.
 *
 * @returns Apollo Client instance or null if not found
 */
function findApolloClient(): ApolloClient | null {
  const win = window as WindowWithApollo;

  // Standard Apollo DevTools hook (connectToDevTools: true)
  if (win.__APOLLO_CLIENT__) {
    return win.__APOLLO_CLIENT__;
  }

  // Try Apollo DevTools inspector
  if (win.__APOLLO_DEVTOOLS_GLOBAL_HOOK__?.ApolloClient) {
    return win.__APOLLO_DEVTOOLS_GLOBAL_HOOK__.ApolloClient;
  }

  return null;
}

/**
 * Gets electron API from context or window.
 *
 * @param context - Component context
 * @returns Electron API or null
 */
function getElectron(context: ComponentContext): ComponentContext['electron'] | null {
  const win = window as WindowWithApollo;
  return context.electron ?? win.electron ?? null;
}

/**
 * Main renderer initialization.
 * Called when Local loads the addon in the renderer process.
 *
 * @param context - Component context provided by Local
 */
export default function (context: ComponentContext): void {
  const { React, hooks } = context;

  // eslint-disable-next-line no-console
  console.log(`[${ADDON_NAME}] Renderer initializing...`);

  // Store pending settings for Apply button
  let pendingSettings: SettingsData | null = null;

  try {
    // Listen for one-click admin configuration events from main process
    // When received, evict Apollo cache and trigger refetch
    const electron = getElectron(context);
    if (electron?.ipcRenderer?.on) {
      electron.ipcRenderer.on(IPC_CHANNELS.CONFIGURED, (_event: unknown, ...args: unknown[]) => {
        const data = args[0] as ConfiguredEventData;
        // eslint-disable-next-line no-console
        console.log(
          `[${ADDON_NAME}] Received CONFIGURED event for site "${data.siteName}" (${data.siteId})`
        );

        const currentHash = window.location.hash;
        const isViewingSite = currentHash.includes(data.siteId);

        // Try to find Apollo Client and evict cache
        // ALWAYS evict cache regardless of current view - ensures fresh data when user navigates to site
        const apolloClient = findApolloClient();

        if (apolloClient?.cache) {
          // eslint-disable-next-line no-console
          console.log(
            `[${ADDON_NAME}] Found Apollo client, evicting cache for site ${data.siteId}...`
          );

          try {
            // Evict the specific site query from cache
            apolloClient.cache.evict({
              id: 'ROOT_QUERY',
              fieldName: 'site',
              args: { id: data.siteId },
            });

            // Garbage collect orphaned references
            apolloClient.cache.gc();

            // Only refetch active queries if user is currently viewing this site
            // If not viewing, the cache eviction alone ensures fresh data when they navigate there
            if (isViewingSite) {
              apolloClient.refetchQueries({
                include: 'active',
              });
              // eslint-disable-next-line no-console
              console.log(
                `[${ADDON_NAME}] User viewing site - cache evicted and refetch triggered`
              );
            } else {
              // eslint-disable-next-line no-console
              console.log(`[${ADDON_NAME}] User not viewing site - cache evicted for later`);
            }
          } catch (err) {
            console.error(`[${ADDON_NAME}] Error evicting cache:`, err);
          }
        } else {
          console.error(`[${ADDON_NAME}] Apollo client not found on window`);
        }
      });
      // eslint-disable-next-line no-console
      console.log(`[${ADDON_NAME}] IPC listener registered for CONFIGURED events`);
    } else {
      console.error(`[${ADDON_NAME}] electron.ipcRenderer.on not available`);
    }

    // Register preferences menu item
    hooks.addFilter('preferencesMenuItems', (items: PreferencesMenuItem[]) => {
      const newItem: PreferencesMenuItem = {
        path: '/oneclick-admin',
        displayName: 'Auto One-Click Admin',
        sections: (props: { setApplyButtonDisabled?: (disabled: boolean) => void }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          React.createElement(PreferencesPanel as any, {
            context,
            setApplyButtonDisabled: props?.setApplyButtonDisabled,
            onSettingsChange: (settings: SettingsData) => {
              pendingSettings = settings;
            },
          }),
        onApply: async () => {
          // eslint-disable-next-line no-console
          console.log(`[${ADDON_NAME}] Applying preferences...`);

          if (!pendingSettings) {
            // eslint-disable-next-line no-console
            console.log(`[${ADDON_NAME}] No changes to apply`);
            return;
          }

          const electronApi = getElectron(context);
          if (!electronApi) {
            console.error(`[${ADDON_NAME}] Electron not available`);
            return;
          }

          try {
            const response = (await electronApi.ipcRenderer.invoke(
              IPC_CHANNELS.SAVE_SETTINGS,
              pendingSettings
            )) as IPCResponse<SettingsData | undefined>;

            if (response.success) {
              // eslint-disable-next-line no-console
              console.log(`[${ADDON_NAME}] Settings saved successfully`);
              pendingSettings = null;
            } else {
              console.error(`[${ADDON_NAME}] Failed to save settings:`, response.error);
            }
          } catch (error) {
            console.error(`[${ADDON_NAME}] Error saving settings:`, error);
          }
        },
      };

      return [...items, newItem];
    });

    // eslint-disable-next-line no-console
    console.log(`[${ADDON_NAME}] Renderer initialized successfully`);
    // eslint-disable-next-line no-console
    console.log(`[${ADDON_NAME}] Preferences panel registered at: Settings > Auto One-Click Admin`);
  } catch (error) {
    console.error(`[${ADDON_NAME}] Renderer initialization failed:`, error);
  }
}

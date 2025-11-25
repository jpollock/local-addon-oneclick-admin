/**
 * Auto One-Click Admin - Renderer Process Entry Point
 * Registers the preferences panel in Local's UI
 */

import { ADDON_NAME, IPC_CHANNELS } from '../common/constants';
import { PreferencesPanel } from './PreferencesPanel';

interface ComponentContext {
  React: any;
  hooks: {
    addContent: (location: string, component: any) => void;
    addFilter: <T>(name: string, callback: (value: T, ...args: any[]) => T) => void;
  };
  electron?: {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
    };
  };
}

/**
 * Helper to find Apollo Client - it may be exposed in different ways
 */
function findApolloClient(): any {
  // Standard Apollo DevTools hook (connectToDevTools: true)
  if ((window as any).__APOLLO_CLIENT__) {
    return (window as any).__APOLLO_CLIENT__;
  }

  // Try Apollo DevTools inspector
  if ((window as any).__APOLLO_DEVTOOLS_GLOBAL_HOOK__?.ApolloClient) {
    return (window as any).__APOLLO_DEVTOOLS_GLOBAL_HOOK__.ApolloClient;
  }

  return null;
}

/**
 * Main renderer initialization
 */
export default function (context: ComponentContext): void {
  const { React, hooks } = context;

  console.log(`[${ADDON_NAME}] Renderer initializing...`);

  // Debug: Check for Apollo client at init time
  console.log(`[${ADDON_NAME}] Checking for Apollo client...`);
  console.log(`[${ADDON_NAME}] __APOLLO_CLIENT__:`, !!(window as any).__APOLLO_CLIENT__);
  console.log(`[${ADDON_NAME}] __APOLLO_DEVTOOLS_GLOBAL_HOOK__:`, !!(window as any).__APOLLO_DEVTOOLS_GLOBAL_HOOK__);

  // Store pending settings for Apply button
  let pendingSettings: { enabled: boolean } | null = null;

  try {
    // Listen for one-click admin configuration events from main process
    // When received, evict Apollo cache and trigger refetch
    const electron = context.electron || (window as any).electron;
    if (electron?.ipcRenderer?.on) {
      electron.ipcRenderer.on(IPC_CHANNELS.CONFIGURED, (_event: any, data: any) => {
        console.log(`[${ADDON_NAME}] Received CONFIGURED event for site "${data.siteName}" (${data.siteId})`);

        const currentHash = window.location.hash;
        const isViewingSite = currentHash.includes(data.siteId);
        console.log(`[${ADDON_NAME}] Current hash: ${currentHash}, viewing this site: ${isViewingSite}`);

        // Try to find Apollo Client and evict cache
        // ALWAYS evict cache regardless of current view - ensures fresh data when user navigates to site
        const apolloClient = findApolloClient();

        if (apolloClient?.cache) {
          console.log(`[${ADDON_NAME}] Found Apollo client, evicting cache for site ${data.siteId}...`);

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
              console.log(`[${ADDON_NAME}] User viewing site - cache evicted and refetch triggered`);
            } else {
              console.log(`[${ADDON_NAME}] User not viewing site - cache evicted for later (will fetch fresh data on navigation)`);
            }
          } catch (err) {
            console.error(`[${ADDON_NAME}] Error evicting cache:`, err);
          }
        } else {
          console.warn(`[${ADDON_NAME}] Apollo client not found on window`);
          const apolloKeys = Object.keys(window).filter(k => k.toLowerCase().includes('apollo'));
          console.log(`[${ADDON_NAME}] Available Apollo-related window keys:`, apolloKeys);
        }
      });
      console.log(`[${ADDON_NAME}] IPC listener registered for CONFIGURED events`);
    } else {
      console.error(`[${ADDON_NAME}] electron.ipcRenderer.on not available`);
    }

    // Register preferences menu item
    hooks.addFilter('preferencesMenuItems', (items: any[]) => {
      return [
        ...items,
        {
          path: '/oneclick-admin',
          displayName: 'Auto One-Click Admin',
          sections: (props: any) => React.createElement(PreferencesPanel as any, {
            context,
            setApplyButtonDisabled: props?.setApplyButtonDisabled,
            onSettingsChange: (settings: { enabled: boolean }) => {
              pendingSettings = settings;
            },
          }),
          onApply: async () => {
            console.log(`[${ADDON_NAME}] Applying preferences...`);

            if (!pendingSettings) {
              console.log(`[${ADDON_NAME}] No changes to apply`);
              return;
            }

            const electron = context.electron || (window as any).electron;
            if (!electron) {
              console.error(`[${ADDON_NAME}] Electron not available`);
              return;
            }

            try {
              const response = await electron.ipcRenderer.invoke(
                IPC_CHANNELS.SAVE_SETTINGS,
                pendingSettings
              );

              if (response.success) {
                console.log(`[${ADDON_NAME}] Settings saved successfully`);
                pendingSettings = null;
              } else {
                console.error(`[${ADDON_NAME}] Failed to save settings:`, response.error);
              }
            } catch (error) {
              console.error(`[${ADDON_NAME}] Error saving settings:`, error);
            }
          },
        },
      ];
    });

    console.log(`[${ADDON_NAME}] Renderer initialized successfully`);
    console.log(`[${ADDON_NAME}] Preferences panel registered at: Settings > Auto One-Click Admin`);

  } catch (error) {
    console.error(`[${ADDON_NAME}] Renderer initialization failed:`, error);
  }
}

# Developer Guide

Technical documentation for developers who want to understand, modify, or extend the Auto One-Click Admin addon.

## Architecture Overview

The addon follows Local's standard two-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  index.ts       │  │ lifecycle-hooks │                   │
│  │  (entry point)  │  │  (siteAdded)    │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ipc-handlers.ts │  │   WP-CLI        │                   │
│  │ (settings IPC)  │  │   siteData      │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │ IPC                 │ IPC (CONFIGURED event)
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  index.tsx      │  │ PreferencesPanel│                   │
│  │  (entry point)  │  │  (settings UI)  │                   │
│  └────────┬────────┘  └─────────────────┘                   │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Apollo Cache    │                                        │
│  │   Eviction      │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
local-addon-oneclick-admin/
├── package.json              # Addon manifest and dependencies
├── tsconfig.json            # TypeScript configuration
├── README.md                # Quick reference
├── docs/
│   ├── USER_GUIDE.md        # End-user documentation
│   ├── DEVELOPER_GUIDE.md   # This file
│   └── TROUBLESHOOTING.md   # Common issues
├── src/
│   ├── common/
│   │   └── constants.ts     # Shared constants (IPC channels, storage keys)
│   ├── main/
│   │   ├── index.ts         # Main process entry point
│   │   ├── ipc-handlers.ts  # IPC handlers for settings
│   │   └── lifecycle-hooks.ts # Site lifecycle hooks
│   └── renderer/
│       ├── index.tsx        # Renderer entry point
│       └── PreferencesPanel.tsx # Settings UI component
└── lib/                     # Compiled JavaScript output
```

## Key Technical Patterns

### 1. Two Event Mechanisms for Site Events

**Critical Discovery**: Local has TWO different mechanisms for site events:

1. **`HooksMain.doActions('siteAdded')`** - The addon hooks API (`context.hooks.addAction`)
2. **`sendIPCEvent('siteAdded')`** - IPC event that emits on `ipcMain`

**Which services use which:**

| Service | HooksMain.doActions | sendIPCEvent |
|---------|---------------------|--------------|
| AddSiteService (regular create) | ✅ Line 249 | ✅ Line 250 |
| CloneSiteService (clone) | ✅ Line 214 | ✅ Line 215 |
| ImporterLocalExport (import/blueprint) | ❌ | ✅ Line 64 |
| ImporterGeneric (generic import) | ❌ | ✅ Line 57 |

**The Problem**: If you use `context.hooks.addAction('siteAdded', ...)`, your addon will NOT receive events for imported sites or sites created from blueprints!

**The Solution**: Use `ipcMain.on('siteAdded', ...)` because Local's `sendIPCEvent()` function emits on `ipcMain` (see `app/shared/helpers/send-ipc-event.ts` line 36):

```typescript
import { ipcMain } from 'electron';

// This fires for ALL site creation flows
ipcMain.on('siteAdded', async (_event, site) => {
  if (!isEnabled()) return;
  if (site.oneClickAdminID) return; // Already configured

  // Site is already running - safe to use WP-CLI
  const users = await wpCli.run(site, [
    'user', 'list', '--role=administrator', '--format=json'
  ]);
  // ... configure one-click admin
});
```

### 2. Why `siteAdded` Instead of `siteStarted`

**Additional Discovery**: For **new sites**, the `siteStarted` hook is NEVER called!

When Local creates a new site, the flow is:
1. Site record created
2. Site provisioned
3. WordPress installed
4. Site finalized
5. Status set to 'running'
6. **`siteAdded` fires** (site is already running!)

The `siteStarted` hook only fires when you manually start an **existing** site. New site creation has its own flow that doesn't use `SiteProcessManagerService`.

### 3. Apollo Cache Eviction for UI Refresh

**Problem**: When we call `siteData.updateSite()`, the data is persisted but Local's UI doesn't update because:
- The `SiteInfoOneClickAdmin` component uses Apollo GraphQL
- The `sitesUpdated` subscription does NOT include `oneClickAdminID` fields
- Apollo's `InMemoryCache` never receives the updated values

**Solution**: Access Apollo Client directly and evict the cache:

```typescript
function findApolloClient(): any {
  // Local exposes Apollo via connectToDevTools: true
  if ((window as any).__APOLLO_CLIENT__) {
    return (window as any).__APOLLO_CLIENT__;
  }
  return null;
}

// On receiving CONFIGURED IPC event:
const apolloClient = findApolloClient();
if (apolloClient?.cache) {
  apolloClient.cache.evict({
    id: 'ROOT_QUERY',
    fieldName: 'site',
    args: { id: siteId },
  });
  apolloClient.cache.gc();
  apolloClient.refetchQueries({ include: 'active' });
}
```

### 4. Class Components (No React Hooks)

Local's addon system does **NOT** support React hooks. All components must be class-based:

```typescript
// WRONG - will crash
const MyComponent = () => {
  const [state, setState] = useState(); // Error!
};

// CORRECT
class MyComponent extends React.Component {
  state = { enabled: true };

  componentDidMount() {
    // Load data here
  }

  render() {
    return React.createElement('div', null, 'Content');
  }
}
```

### 5. IPC Pattern with `ipcMain.handle()`

Always use `ipcMain.handle()` for IPC handlers, NOT `LocalMain.addIpcAsyncListener`:

```typescript
// Main process
import { ipcMain } from 'electron';

ipcMain.handle('addon:get-settings', async () => {
  const enabled = userData.get(STORAGE_KEYS.ENABLED, true);
  return { success: true, data: { enabled } };
});

// Renderer process
const electron = context.electron || (window as any).electron;
const response = await electron.ipcRenderer.invoke('addon:get-settings');
```

## Data Flow

### Site Creation Flow

```
User creates site
       │
       ▼
Local provisions site & installs WordPress
       │
       ▼
`siteAdded` hook fires (site already running)
       │
       ▼
Check if addon enabled & site not configured
       │
       ▼
WP-CLI: `wp user list --role=administrator --format=json`
       │
       ▼
Parse JSON, get first admin user
       │
       ▼
siteData.updateSite(siteId, { oneClickAdminID, oneClickAdminDisplayName })
       │
       ▼
Send IPC CONFIGURED event to renderer
       │
       ▼
Renderer receives event, checks if viewing this site
       │
       ▼
Apollo cache evict + refetch
       │
       ▼
UI updates with one-click admin button
```

### Settings Flow

```
User opens Settings > Auto One-Click Admin
       │
       ▼
PreferencesPanel.componentDidMount()
       │
       ▼
IPC: invoke('oneclick-admin:get-settings')
       │
       ▼
Main process: userData.get(STORAGE_KEYS.ENABLED, true)
       │
       ▼
Response: { success: true, data: { enabled: true } }
       │
       ▼
User toggles checkbox → setApplyButtonDisabled(false)
       │
       ▼
User clicks Apply → onApply() callback
       │
       ▼
IPC: invoke('oneclick-admin:save-settings', { enabled })
       │
       ▼
Main process: userData.set(STORAGE_KEYS.ENABLED, enabled)
       │
       ▼
Apply button auto-disables
```

## Key Discoveries / Learnings

### From Local Source Code Analysis

1. **Two Event Mechanisms**: Local has `HooksMain.doActions()` for addon hooks AND `sendIPCEvent()` for IPC. ImporterLocalExport (imports/blueprints) ONLY uses `sendIPCEvent`, not hooks! Use `ipcMain.on()` to catch all events.

2. **`siteStarted` vs `siteAdded`**: The `siteStarted` hook only fires for manual starts of existing sites, not new site creation

3. **Apollo Subscription Gap**: The `sitesUpdated` GraphQL subscription includes:
   ```graphql
   subscription sitesUpdated {
     sitesUpdated { id, name, domain, status, siteLastStartedTimestamp, path }
     # oneClickAdminID NOT included!
   }
   ```

4. **Apollo Client Access**: Local's Apollo Client is created with `connectToDevTools: true`, exposing it via `window.__APOLLO_CLIENT__`

5. **MobX Legacy**: `refreshSites` IPC only updates MobX store, not Apollo cache

6. **sendIPCEvent internals** (from `app/shared/helpers/send-ipc-event.ts`):
   - From main process: sends to renderer via `webContents.send()` AND emits on `ipcMain.emit()`
   - This is why `ipcMain.on('siteAdded', ...)` works for catching all site creation events

7. **IPC site objects are serialized**: When receiving site data via IPC, the object is serialized (via `simpleSerialize`). It's missing:
   - Methods like `getSiteServiceByRole()`
   - Some properties like `paths`
   - Always fetch the full site from `siteData.getSite(siteId)` before using services like `wpCli.run()`

## How to Modify

### Change User Selection Logic

Edit `src/main/lifecycle-hooks.ts`:

```typescript
// Current: First admin user
const firstAdmin = users[0];

// Alternative: User with specific role
const superAdmin = users.find(u => u.roles.includes('administrator'));

// Alternative: Most recently created admin
const newestAdmin = users.sort((a, b) =>
  parseInt(b.ID) - parseInt(a.ID)
)[0];
```

### Add More Preferences

1. Update `src/common/constants.ts`:
   ```typescript
   export const STORAGE_KEYS = {
     ENABLED: `${ADDON_SLUG}_enabled`,
     PREFER_ROLE: `${ADDON_SLUG}_prefer_role`, // New
   };
   ```

2. Update `src/main/ipc-handlers.ts` to handle new settings

3. Update `src/renderer/PreferencesPanel.tsx` with new UI controls

### Listen for Additional Events

Edit `src/main/lifecycle-hooks.ts` to add more event listeners. Remember to check if the event uses `HooksMain.doActions()` or `sendIPCEvent()`:

```typescript
// For events that use sendIPCEvent (like siteAdded)
ipcMain.on('someEvent', async (_event, data) => {
  // Handle event
});

// For events that only use HooksMain.doActions (like siteStarted)
context.hooks.addAction('siteStarted', async (site: any) => {
  // Handle event
});
```

## Building

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Output in lib/ directory
```

After building, restart Local to load the updated addon.

## Testing

### Manual Testing Checklist

- [ ] Create new site - one-click admin appears
- [ ] Import site - one-click admin configured
- [ ] Clone site - one-click admin on clone
- [ ] Disable addon - new sites not configured
- [ ] Settings persist after restart
- [ ] UI updates immediately after site creation

### Debug Commands (in DevTools Console)

```javascript
// Check if addon loaded
console.log(window.__APOLLO_CLIENT__);

// Check current hash (for site ID matching)
console.log(window.location.hash);

// Manually trigger cache eviction
window.__APOLLO_CLIENT__.cache.evict({ id: 'ROOT_QUERY' });
window.__APOLLO_CLIENT__.refetchQueries({ include: 'active' });
```

## Dependencies

- `@getflywheel/local` - Local addon API types
- `electron` - IPC communication
- `typescript` - Type checking and compilation

## Resources

- [Local Addon Documentation](https://localwp.com/help-docs/advanced/creating-add-ons/)
- [Kitchen Sink Reference Addon](https://github.com/getflywheel/local-addon-kitchen-sink)
- Local Source Code (for hook discovery)

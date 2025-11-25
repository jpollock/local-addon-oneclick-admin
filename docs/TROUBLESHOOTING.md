# Troubleshooting Guide

Common issues and solutions for the Auto One-Click Admin addon.

## One-Click Admin Not Appearing

### Check if the addon is enabled

1. Go to **Local > Settings > Auto One-Click Admin**
2. Ensure the toggle is **ON**
3. Click **Apply** if you made changes

### Check if the site has administrator users

The addon requires at least one WordPress user with the Administrator role:

1. Start your site in Local
2. Click **WP Admin** to access the WordPress admin
3. Go to **Users > All Users**
4. Ensure at least one user has the "Administrator" role

### Check if the site was created before addon installation

The addon only configures **new** sites created after installation. For existing sites:

1. Click on the site in Local
2. Look for the **One-Click Admin** section in the overview
3. Manually select an administrator from the dropdown

### Verify the site is running

One-click admin configuration requires the site to be running:

1. Check if the site shows "Running" status in Local
2. If stopped, click **Start Site**
3. Wait for the site to fully start

## UI Not Updating After Site Creation

If one-click admin is configured but the button doesn't appear immediately:

### Check browser console for Apollo messages

1. Open DevTools: **View > Toggle Developer Tools** (or Cmd+Option+I / Ctrl+Shift+I)
2. Go to the **Console** tab
3. Look for these messages:
   - `[Auto One-Click Admin] Found Apollo client, evicting cache...` - Good
   - `[Auto One-Click Admin] Apollo client not found on window` - Problem

### Manual workaround

If the UI doesn't update:

1. Navigate away from the site (click "Sites" in sidebar)
2. Navigate back to the site
3. The one-click admin button should now appear

### Force Apollo cache refresh

In DevTools Console:
```javascript
window.__APOLLO_CLIENT__.cache.evict({ id: 'ROOT_QUERY' });
window.__APOLLO_CLIENT__.refetchQueries({ include: 'active' });
```

## Debug Mode

### Viewing addon logs

**Main Process Logs (Local's logs):**
- **macOS**: `~/Library/Logs/Local/local.log`
- **Windows**: `%APPDATA%\Local\logs\local.log`
- **Linux**: `~/.config/Local/logs/local.log`

Look for lines containing `[Auto One-Click Admin]`:
```
[Auto One-Click Admin] Site added: "My Site" (abc123)
[Auto One-Click Admin] Fetching admin users...
[Auto One-Click Admin] Successfully configured one-click admin
```

**Renderer Process Logs (Browser Console):**
1. Open DevTools: **View > Toggle Developer Tools**
2. Go to **Console** tab
3. Filter by "Auto One-Click Admin"

### Enable verbose logging

The addon logs key events automatically. To see all logs:

1. Open DevTools Console
2. Ensure log level is set to "Verbose" or "All"
3. Look for `[Auto One-Click Admin]` prefix

## Common Console Messages

| Message | Meaning | Action |
|---------|---------|--------|
| `Renderer initializing...` | Addon loaded successfully | None needed |
| `IPC listener registered for CONFIGURED events` | Ready to receive updates | None needed |
| `Received CONFIGURED event for site...` | Main process configured a site | UI should update |
| `Found Apollo client, evicting cache...` | Cache refresh in progress | Wait for update |
| `Apollo cache evicted and refetch triggered` | Success | UI should show button |
| `Apollo client not found on window` | Can't refresh cache | Navigate away and back |
| `User not viewing this site, skipping refresh` | Normal - you're on a different site | None needed |
| `Feature disabled, skipping` | Addon is disabled | Enable in Settings |
| `Site already has one-click admin configured` | Not overwriting existing | None needed |
| `No administrator users found` | Site has no admins | Create admin user in WordPress |

## Settings Not Persisting

### Check Local's userData

Settings are stored in Local's userData. If settings don't persist:

1. Restart Local completely
2. Check Settings again
3. If still not working, check Local's logs for errors

### Reset addon settings

To reset to defaults:

1. Go to **Settings > Auto One-Click Admin**
2. Toggle OFF, click Apply
3. Toggle ON, click Apply
4. Restart Local

## Addon Not Loading

### Verify installation location

The addon must be in the correct directory:

- **macOS**: `~/Library/Application Support/Local/addons/local-addon-oneclick-admin/`
- **Windows**: `%APPDATA%\Local\addons\local-addon-oneclick-admin\`
- **Linux**: `~/.config/Local/addons/local-addon-oneclick-admin/`

### Check for required files

The addon folder should contain:
```
local-addon-oneclick-admin/
├── package.json
├── lib/
│   ├── main.js
│   └── renderer.js
└── ... (other files)
```

### Verify package.json

The `package.json` must have correct entries:
```json
{
  "main": "lib/main.js",
  "renderer": "lib/renderer.js"
}
```

### Check Local's addon loading

1. Open Local
2. Open DevTools Console
3. Look for addon loading messages
4. Check for any error messages mentioning "oneclick-admin"

## WP-CLI Errors

If you see WP-CLI errors in the logs:

### Site not fully provisioned

Wait for the site to fully start. WP-CLI requires:
- MySQL/MariaDB running
- PHP running
- WordPress installed

### WordPress database issues

If WP-CLI can't connect:
1. Stop the site
2. Start the site again
3. Wait for "Running" status

## Reporting Issues

If you can't resolve an issue:

1. **Gather information**:
   - Local version (Help > About Local)
   - Operating system and version
   - Addon version (check package.json)
   - Relevant log messages

2. **Reproduce the issue**:
   - Note exact steps to reproduce
   - Note expected vs actual behavior

3. **Report**:
   - Create an issue with all gathered information
   - Include sanitized log excerpts (remove sensitive data)

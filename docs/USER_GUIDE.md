# User Guide

## Overview

Auto One-Click Admin saves you time by automatically configuring one-click admin access for every new WordPress site you create in Local. Instead of manually selecting an admin user for one-click login, the addon does it for you.

## Installation

### For Development (with symlink)

If you're developing or testing the addon:

```bash
# Clone the repository
git clone https://github.com/jpollock/local-addon-oneclick-admin.git
cd local-addon-oneclick-admin

# Install dependencies and build
npm install
npm run build

# Install symlink to Local's addons directory
npm run install-addon

# Restart Local, then enable the addon:
# Local > Add-ons > Installed > Auto One-Click Admin > Enable
```

### For Production (manual copy)

1. Download the latest release from GitHub
2. Copy the `local-addon-oneclick-admin` folder to your Local addons directory:
   - **macOS**: `~/Library/Application Support/Local/addons/`
   - **Windows**: `%APPDATA%\Local\addons\`
   - **Linux**: `~/.config/Local/addons/`
3. Restart Local
4. Enable the addon: **Local > Add-ons > Installed > Auto One-Click Admin > Enable**

## Uninstallation

### If installed via npm script

```bash
cd local-addon-oneclick-admin
npm run uninstall-addon
```

Then restart Local.

### If installed manually

1. Navigate to your Local addons directory (see paths above)
2. Delete the `local-addon-oneclick-admin` folder
3. Restart Local

## How It Works

When you create, import, or clone a site in Local:

1. **Site Creation**: You create a new site as usual (or import/clone an existing one)
2. **Automatic Detection**: The addon detects the new site and queries WordPress for administrator users
3. **Configuration**: The first administrator user is automatically set as the one-click admin user
4. **Ready to Use**: The one-click admin button appears on the site overview - click it to log in instantly

## Configuration

### Accessing Settings

1. Open Local
2. Click the **Settings** gear icon (or go to Local > Settings on macOS)
3. In the left sidebar, click **Auto One-Click Admin**

### Settings Options

| Setting | Description | Default |
|---------|-------------|---------|
| Enable Auto One-Click Admin | When enabled, automatically configures one-click admin for new sites | Enabled |

### Applying Changes

After changing settings:
1. Click the **Apply** button
2. Changes take effect immediately for new sites
3. Existing sites are not affected

## Supported Scenarios

### New Site Creation

When you create a new site:
- The addon waits for WordPress to be fully installed
- Queries for administrator users
- Configures one-click admin with the first admin found

### Site Import

When you import a site from a backup or ZIP file:
- The addon detects the import completion
- Reads the existing WordPress users
- Configures one-click admin if not already set

### Site Cloning

When you clone an existing site:
- The addon treats the clone as a new site
- Configures one-click admin on the cloned site
- Original site's settings are not affected

## What This Addon Does NOT Do

- **Override existing settings**: If a site already has one-click admin configured, the addon won't change it
- **Work without admin users**: Sites without WordPress administrator users won't be configured
- **Modify user accounts**: The addon only reads user information - it doesn't create or modify users
- **Work on stopped sites**: The site must be running for configuration to occur

## Changing the Selected User

If you want to use a different user for one-click admin:

1. Click on your site in Local
2. In the site overview, find the **One-Click Admin** section
3. Use the dropdown to select a different administrator
4. The change is saved automatically

## FAQ

### Why doesn't one-click admin appear on my site?

Possible reasons:
- The addon is disabled (check Settings > Auto One-Click Admin)
- The site has no administrator users
- The site was created before installing the addon
- The site isn't running (start it first)

### Can I disable this for specific sites?

Currently, the addon applies to all new sites. To disable for a specific site:
1. Create the site with the addon enabled
2. Manually change or remove the one-click admin setting in Local's UI

### Does this work with multisite?

The addon configures one-click admin at the site level. For multisite installations, it uses the first administrator of the main site.

### What happens if I change WordPress users after setup?

One-click admin will continue to use the originally configured user. If that user is deleted, you'll need to select a new user manually in Local.

### Is this addon safe?

Yes. The addon:
- Only reads WordPress user information
- Stores settings locally in your Local installation
- Doesn't transmit any data externally
- Uses standard Local addon APIs

# Auto One-Click Admin

A Local addon that automatically enables one-click admin for all new sites by selecting the first administrator user.

## Features

- Automatically configures one-click admin when creating new sites
- Works with imported and cloned sites
- Configurable via Local's preferences
- No manual setup required - just install and create sites

## Installation

1. Copy the `local-addon-oneclick-admin` folder to your Local addons directory:
   - **macOS**: `~/Library/Application Support/Local/addons/`
   - **Windows**: `%APPDATA%\Local\addons\`
   - **Linux**: `~/.config/Local/addons/`

2. Restart Local

3. The addon is enabled by default - new sites will automatically have one-click admin configured

## Configuration

1. Open Local
2. Go to **Settings** (gear icon or Local > Settings)
3. Click **Auto One-Click Admin** in the left sidebar
4. Toggle the feature on or off
5. Click **Apply** to save

When enabled, the addon will:
- Detect when a new site is created, imported, or cloned
- Find the first administrator user in WordPress
- Configure one-click admin with that user
- Update the UI to show the one-click admin button

## Requirements

- Local v9.0.0 or higher
- Sites must have at least one WordPress administrator user

## For Developers

See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for:
- Architecture overview
- File structure
- Key technical patterns
- How to modify and extend

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for:
- Common issues and solutions
- How to enable debug logging
- Console message reference

## License

MIT

## Version

1.0.0

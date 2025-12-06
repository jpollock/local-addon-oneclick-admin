# Auto One-Click Admin

[![CI](https://github.com/jpollock/local-addon-oneclick-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/jpollock/local-addon-oneclick-admin/actions/workflows/ci.yml)
![Beta](https://img.shields.io/badge/status-beta-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Local](https://img.shields.io/badge/Local-v9.0%2B-green)

A Local addon that automatically enables one-click admin for all new sites by selecting the first administrator user.

## Features

- Automatically configures one-click admin when creating new sites
- Works with imported and cloned sites
- Configurable via Local's preferences
- No manual setup required - just install and create sites

## Installation

### Method 1: Pre-built Release (Recommended)

The easiest way to install the addon.

1. Go to the [Releases page](https://github.com/jpollock/local-addon-oneclick-admin/releases)
2. Download the `.tgz` file from the latest release (e.g., `local-labs-local-addon-oneclick-admin-0.1.0.tgz`)
3. Open **Local**
4. Go to **Add-ons** (in the left sidebar)
5. Click **Install from disk** (top right)
6. Select the `.tgz` file you downloaded
7. Toggle the addon **ON** to enable
8. Click **Relaunch** when prompted

### Method 2: Build from Source

For developers or contributors:

```bash
# Clone the repository
git clone https://github.com/jpollock/local-addon-oneclick-admin.git
cd local-addon-oneclick-admin

# Install dependencies
npm install

# Build the addon
npm run build

# Install symlink to Local's addons directory
npm run install-addon

# Restart Local, then enable the addon:
# Local > Add-ons > Installed > Auto One-Click Admin > Enable
```

## Uninstallation

### If installed from disk (Method 1)

1. Open **Local**
2. Go to **Add-ons** (in the left sidebar)
3. Find **Auto One-Click Admin**
4. Toggle it **OFF**
5. Click the **trash icon** or **Remove** button
6. Restart Local

### If installed via npm script (Method 2)

```bash
npm run uninstall-addon
```

Then restart Local.

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

## Development

### Available Scripts

```bash
# Install dependencies
npm install

# Build the addon
npm run build

# Watch for changes (development)
npm run watch

# Install symlink to Local addons directory
npm run install-addon

# Uninstall symlink from Local addons directory
npm run uninstall-addon

# Run linting
npm run lint
npm run lint:fix

# Check code formatting
npm run format:check
npm run format

# Run type checking
npm run typecheck

# Run tests
npm run test
npm run test:watch
npm run test:coverage
```

### Project Structure

```
local-addon-oneclick-admin/
├── .github/workflows/    # CI/CD workflows
├── docs/                 # Documentation
├── scripts/              # Install/uninstall scripts
├── src/
│   ├── common/           # Shared constants and types
│   ├── main/             # Main process code
│   └── renderer/         # Renderer process code
├── tests/                # Test files
└── lib/                  # Compiled output (git-ignored)
```

## Documentation

- [User Guide](docs/USER_GUIDE.md) - End-user documentation
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Technical documentation for contributors
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Feedback & Issues

This addon is currently in **beta**. We welcome your feedback!

- **Report bugs or request features**: [Open an issue](https://github.com/jpollock/local-addon-oneclick-admin/issues)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT

## Version

0.1.0

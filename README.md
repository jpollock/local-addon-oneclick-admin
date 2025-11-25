# Auto One-Click Admin

[![CI](https://github.com/jpollock/local-addon-oneclick-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/jpollock/local-addon-oneclick-admin/actions/workflows/ci.yml)

A Local addon that automatically enables one-click admin for all new sites by selecting the first administrator user.

## Features

- Automatically configures one-click admin when creating new sites
- Works with imported and cloned sites
- Configurable via Local's preferences
- No manual setup required - just install and create sites

## Installation

### For Development (with symlink)

Clone the repository and use the install script to create a symlink:

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

### For Production (manual copy)

1. Download the latest release
2. Copy the `local-addon-oneclick-admin` folder to your Local addons directory:
   - **macOS**: `~/Library/Application Support/Local/addons/`
   - **Windows**: `%APPDATA%\Local\addons\`
   - **Linux**: `~/.config/Local/addons/`
3. Restart Local
4. Enable the addon: **Local > Add-ons > Installed > Auto One-Click Admin > Enable**

## Uninstallation

### If installed via npm script

```bash
npm run uninstall-addon
```

### If installed manually

Delete the `local-addon-oneclick-admin` folder from your Local addons directory and restart Local.

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

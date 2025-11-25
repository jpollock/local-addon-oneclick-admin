---
layout: default
title: Home
---

# Auto One-Click Admin

![Beta](https://img.shields.io/badge/status-beta-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Local](https://img.shields.io/badge/Local-v9.0%2B-green)

A Local addon that automatically enables one-click admin for all new sites by selecting the first administrator user.

![Demo of Auto One-Click Admin](docs/assets/one-click-admin.gif)

## Features

- **Automatic Configuration**: Configures one-click admin when creating new sites
- **Universal Support**: Works with imported and cloned sites
- **Easy Management**: Configurable via Local's preferences
- **Zero Setup**: Just install and create sites

## Quick Start

### Installation

```bash
# Clone and build
git clone https://github.com/jpollock/local-addon-oneclick-admin.git
cd local-addon-oneclick-admin
npm install
npm run build

# Install to Local
npm run install-addon

# Restart Local, then enable the addon:
# Local > Add-ons > Installed > Auto One-Click Admin > Enable
```

### Configuration

1. Open Local
2. Go to **Settings** > **Auto One-Click Admin**
3. Toggle the feature on or off
4. Click **Apply** to save

## Documentation

- [User Guide](docs/USER_GUIDE.md) - Complete guide for end users
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Technical documentation for contributors
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Requirements

- Local v9.0.0 or higher
- Sites must have at least one WordPress administrator user

## Feedback & Issues

This addon is currently in **beta**. We welcome your feedback!

- **Report bugs or request features**: [GitHub Issues](https://github.com/jpollock/local-addon-oneclick-admin/issues)
- **View source code**: [GitHub Repository](https://github.com/jpollock/local-addon-oneclick-admin)

## License

MIT License - see the repository for full license text.

#!/usr/bin/env node

/**
 * Install addon script
 * Creates a symlink from this addon to Local's addons directory
 * Cross-platform compatible (macOS, Windows, Linux)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ADDON_NAME = 'local-addon-oneclick-admin';

/**
 * Get the platform-specific Local addons directory path
 * @returns {string} Path to Local's addons directory
 */
function getAddonsPath() {
  const platform = os.platform();

  switch (platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Local', 'addons');
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Local', 'addons');
    case 'linux':
      return path.join(os.homedir(), '.config', 'Local', 'addons');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Main installation function
 */
function main() {
  try {
    const sourcePath = path.resolve(__dirname, '..');
    const addonsPath = getAddonsPath();
    const targetPath = path.join(addonsPath, ADDON_NAME);

    console.log(`Installing ${ADDON_NAME}...`);
    console.log(`  Source: ${sourcePath}`);
    console.log(`  Target: ${targetPath}`);

    // Ensure addons directory exists
    if (!fs.existsSync(addonsPath)) {
      console.log(`  Creating addons directory: ${addonsPath}`);
      fs.mkdirSync(addonsPath, { recursive: true });
    }

    // Remove existing symlink/directory if present
    if (fs.existsSync(targetPath)) {
      console.log(`  Removing existing installation at: ${targetPath}`);
      const stats = fs.lstatSync(targetPath);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(targetPath);
      } else {
        fs.rmSync(targetPath, { recursive: true });
      }
    }

    // Create symlink
    // On Windows, use 'junction' type for directories
    const symlinkType = os.platform() === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(sourcePath, targetPath, symlinkType);

    console.log('');
    console.log('Installation successful!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Build the addon: npm run build');
    console.log('  2. Restart Local to load the addon');
    console.log('');
  } catch (error) {
    console.error('Installation failed:', error.message);
    process.exit(1);
  }
}

main();

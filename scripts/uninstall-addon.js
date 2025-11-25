#!/usr/bin/env node

/**
 * Uninstall addon script
 * Removes the symlink from Local's addons directory
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
 * Main uninstallation function
 */
function main() {
  try {
    const addonsPath = getAddonsPath();
    const targetPath = path.join(addonsPath, ADDON_NAME);

    console.log(`Uninstalling ${ADDON_NAME}...`);
    console.log(`  Target: ${targetPath}`);

    if (!fs.existsSync(targetPath)) {
      console.log('');
      console.log('Addon is not installed.');
      return;
    }

    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(targetPath);
    } else {
      fs.rmSync(targetPath, { recursive: true });
    }

    console.log('');
    console.log('Uninstallation successful!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart Local to unload the addon');
    console.log('');
  } catch (error) {
    console.error('Uninstallation failed:', error.message);
    process.exit(1);
  }
}

main();

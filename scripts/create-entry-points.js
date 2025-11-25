#!/usr/bin/env node

/**
 * Create entry points script
 * Generates the main and renderer entry point files in the lib directory
 * These files are required by Local to load the addon
 */

const fs = require('fs');
const path = require('path');

const LIB_DIR = path.resolve(__dirname, '..', 'lib');

/**
 * Main entry point content
 * Exports the default export from the compiled main/index.js
 */
const MAIN_ENTRY = `module.exports = require('./main/index').default;
`;

/**
 * Renderer entry point content
 * Exports the default export from the compiled renderer/index.js
 */
const RENDERER_ENTRY = `module.exports = require('./renderer/index').default;
`;

/**
 * Main function to create entry points
 */
function main() {
  try {
    // Ensure lib directory exists
    if (!fs.existsSync(LIB_DIR)) {
      console.error('Error: lib directory does not exist. Run "npm run compile" first.');
      process.exit(1);
    }

    // Create main entry point
    const mainPath = path.join(LIB_DIR, 'main.js');
    fs.writeFileSync(mainPath, MAIN_ENTRY);
    console.log(`Created: ${mainPath}`);

    // Create renderer entry point
    const rendererPath = path.join(LIB_DIR, 'renderer.js');
    fs.writeFileSync(rendererPath, RENDERER_ENTRY);
    console.log(`Created: ${rendererPath}`);

    console.log('');
    console.log('Entry points created successfully!');
  } catch (error) {
    console.error('Failed to create entry points:', error.message);
    process.exit(1);
  }
}

main();

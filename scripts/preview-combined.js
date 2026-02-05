#!/usr/bin/env node

/**
 * Combined Preview Script for iSaaSIT
 * 
 * This script:
 * 1. Builds the combined app (main app + docs)
 * 2. Starts the main app server
 * 3. Starts the docs server
 * 
 * Usage: npm run preview:combined
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${CYAN}`);
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  iSaaSIT Combined Preview                              ║');
console.log('║  Main app + Docs + Blog                                ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`${RESET}\n`);

// Check if build exists
if (!existsSync('dist/docs')) {
  console.log(`${YELLOW}⚠ Build not found. Building first...${RESET}\n`);
  
  const build = spawn('npm', ['run', 'build:combined'], { 
    stdio: 'inherit',
    shell: true
  });
  
  build.on('close', (code) => {
    if (code !== 0) {
      console.error(`${YELLOW}Build failed${RESET}`);
      process.exit(1);
    }
    startServers();
  });
} else {
  console.log(`${GREEN}✓ Build found${RESET}\n`);
  startServers();
}

function startServers() {
  console.log(`${CYAN}Starting servers...${RESET}\n`);
  
  // Start main app
  const mainApp = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });
  
  // Start docs
  const docsApp = spawn('npm', ['run', 'preview:docs'], {
    stdio: 'inherit',
    shell: true,
    cwd: 'docs'
  });
  
  console.log(`${GREEN}✓ Servers starting...${RESET}\n`);
  console.log('Main app: http://localhost:3000');
  console.log('Docs/Blog: http://localhost:4321');
  console.log('');
  
  // Handle cleanup
  process.on('SIGINT', () => {
    console.log(`\n${CYAN}Shutting down...${RESET}`);
    mainApp.kill();
    docsApp.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    mainApp.kill();
    docsApp.kill();
    process.exit(0);
  });
}

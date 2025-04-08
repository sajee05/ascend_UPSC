/**
 * Ascend UPSC Application Starter
 * 
 * This script starts the Ascend UPSC application with proper environment
 * settings and error handling.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set environment variables
process.env.DB_TYPE = 'sqlite';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Display welcome message
console.log(`${colors.cyan}${colors.bright}===============================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}   Ascend UPSC - Starting Application...      ${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}===============================================${colors.reset}`);
console.log();

// Check if node_modules exists, if not, install dependencies
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
  
  try {
    // Run npm install synchronously
    require('child_process').execSync('npm install', {
      stdio: 'inherit',
      cwd: __dirname
    });
  } catch (error) {
    console.error(`${colors.red}Failed to install dependencies. Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

console.log(`${colors.green}Starting Ascend UPSC application...${colors.reset}`);
console.log(`${colors.cyan}The application will open in your default browser momentarily.${colors.reset}`);
console.log();
console.log(`${colors.yellow}[Press Ctrl+C to stop the application when done]${colors.reset}`);
console.log();

// Start the application
const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCmd, ['run', 'dev'], { 
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, DB_TYPE: 'sqlite' }
});

server.on('error', (err) => {
  console.error(`${colors.red}Failed to start the application: ${err.message}${colors.reset}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(`${colors.yellow}Stopping the application...${colors.reset}`);
  server.kill('SIGINT');
  process.exit(0);
});
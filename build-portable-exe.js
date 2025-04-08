/**
 * Build script for creating a portable Windows .exe file
 * This script automates the build process for the Electron app
 */

import { exec as execCallback, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec for easier usage
import { promisify } from 'util';
const exec = promisify(execCallback);

console.log('=============================================');
console.log('Starting build process for portable executable');
console.log('=============================================');

// Verify that all necessary tools are installed
try {
  console.log('Checking for required tools...');
  execSync('electron-builder --version', { stdio: 'pipe' });
  execSync('esbuild --version', { stdio: 'pipe' });
  execSync('pkg --version', { stdio: 'pipe' });
  console.log('✓ All required tools found');
} catch (error) {
  console.error('Error: Required build tools are missing. Please run:');
  console.error('npm install -g electron-builder esbuild typescript pkg');
  process.exit(1);
}

// Ensure the database exists before starting the build
const dbSource = path.join(__dirname, 'ascend-upsc.db');
if (!fs.existsSync(dbSource)) {
  console.warn('WARNING: Database file not found at ' + dbSource);
  console.warn('Running database initialization script...');
  
  try {
    execSync('node initdb.cjs', { stdio: 'inherit' });
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

// Create electron-builder configuration for portable app
const electronBuilderConfig = `
appId: "com.ascendupsc.app"
productName: "Ascend UPSC"
copyright: "Copyright © ${new Date().getFullYear()}"

# Windows configuration  
win:
  target: 
    - "portable"
  icon: "resources/icon.ico"
  
# Configuration for portable executable  
portable:
  artifactName: "AscendUPSC-Portable.exe"
  
# Distribution files
files:
  - "dist/**/*"
  - "resources/**/*"
  - "node_modules/**/*"
  - "server-starter.js"
  - "package.json"
  - "electron.js"
  - "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
  - "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}"
  - "!**/node_modules/.bin"
  - "!**/node_modules/electron-builder"
  
# Extra resources to be included
extraResources:
  - from: "resources/db"
    to: "db"
    filter: "**/*"
`;

// Write the configuration file
fs.writeFileSync('electron-builder-portable.yml', electronBuilderConfig);
console.log('✓ Created electron-builder-portable.yml configuration');

// Main build function using async/await
async function buildPortable() {
  try {
    // Step 1: Build the Vite app
    console.log('\n1. Building Vite app...');
    try {
      const { stdout, stderr } = await exec('npm run build');
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✓ Vite build completed');
    } catch (error) {
      console.error('Error building Vite app:', error);
      process.exit(1);
    }
    
    // Step 2: Compile TypeScript files for Electron
    console.log('\n2. Compiling Electron TypeScript files...');
    try {
      const { stdout, stderr } = await exec('tsc -p electron');
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✓ TypeScript compilation completed');
    } catch (error) {
      console.error('Error compiling Electron TypeScript:', error);
      process.exit(1);
    }
    
    // Step 3: Bundle Electron main process
    console.log('\n3. Bundling Electron main process...');
    try {
      const { stdout, stderr } = await exec('esbuild electron/main.ts --platform=node --packages=external --bundle --outfile=dist/electron.js');
      console.log(stdout);
      // Only show stderr if it's not just about the duplicate methods in storage.ts
      if (stderr && !stderr.includes('duplicate-class-member')) {
        console.error(stderr);
      } else if (stderr) {
        console.log('NOTE: Ignoring known warnings about duplicate methods in storage.ts');
      }
      console.log('✓ Electron main process bundled');
    } catch (error) {
      console.error('Error bundling Electron main process:', error);
      process.exit(1);
    }
    
    // Step 4: Create resources directory and prepare database
    console.log('\n4. Preparing resources for packaging...');
    
    // Create resources directory if it doesn't exist
    const resourcesDir = path.join(__dirname, 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
      console.log('Created directory:', resourcesDir);
    }
    
    // Create db directory if it doesn't exist
    const dbDir = path.join(resourcesDir, 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created directory:', dbDir);
    }
    
    // Copy the SQLite database to resources/db
    const dbDest = path.join(dbDir, 'ascend-upsc.db');
    
    if (fs.existsSync(dbSource)) {
      // Get file sizes for verification
      const srcSize = fs.statSync(dbSource).size;
      
      // Copy the file
      fs.copyFileSync(dbSource, dbDest);
      
      // Verify the copy
      const destSize = fs.statSync(dbDest).size;
      
      if (srcSize === destSize) {
        console.log(`✓ Database copied successfully (${(srcSize / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error(`Error: Database copy verification failed. Size mismatch: ${srcSize} vs ${destSize}`);
        process.exit(1);
      }
    } else {
      console.error(`Error: Database file not found at ${dbSource}`);
      process.exit(1);
    }
    
    // Step 5: Build Electron portable app
    console.log('\n5. Building portable executable...');
    try {
      // Check if a temporary package.json is needed (if electron/electron-builder are in wrong section)
      let packageJson;
      try {
        packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check if package.json already has the required fields
        const needsMetadataFix = !packageJson.author || !packageJson.description;
        
        // Check if electron packages are in the wrong section
        const needsDependencyFix = packageJson.dependencies && 
                       (packageJson.dependencies['electron'] || 
                        packageJson.dependencies['electron-builder']);
        
        // Fix if either or both issues exist
        if (needsDependencyFix || needsMetadataFix) {
          console.log('⚠️ Detected issues in package.json for electron-builder');
          console.log('Creating temporary package.json for build with fixes...');
          
          // Create a fixed package.json
          const fixedPackageJson = { ...packageJson };
          
          // Initialize devDependencies if it doesn't exist
          if (!fixedPackageJson.devDependencies) {
            fixedPackageJson.devDependencies = {};
          }
          
          // Move electron to devDependencies if it exists in dependencies
          if (fixedPackageJson.dependencies.electron) {
            fixedPackageJson.devDependencies.electron = fixedPackageJson.dependencies.electron;
            delete fixedPackageJson.dependencies.electron;
          }
          
          // Move electron-builder to devDependencies if it exists in dependencies
          if (fixedPackageJson.dependencies['electron-builder']) {
            fixedPackageJson.devDependencies['electron-builder'] = fixedPackageJson.dependencies['electron-builder'];
            delete fixedPackageJson.dependencies['electron-builder'];
          }
          
          // Add required author and description for electron-builder
          fixedPackageJson.author = "Ascend UPSC Team";
          fixedPackageJson.description = "AI-powered UPSC exam preparation platform";
          
          // Save original package.json
          fs.copyFileSync('package.json', 'package.json.original');
          console.log('✓ Backed up original package.json to package.json.original');
          
          // Write the fixed package.json
          fs.writeFileSync('package.json', JSON.stringify(fixedPackageJson, null, 2));
          console.log('✓ Created temporary package.json with correct metadata and dependencies');
        }
      } catch (error) {
        console.error('Error checking package.json:', error.message);
        // Continue with the build, it might still work
      }
      
      // Run the electron-builder command
      const { stdout, stderr } = await exec('electron-builder --win --config=electron-builder-portable.yml');
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      // Restore original package.json if we made a temporary one
      if (fs.existsSync('package.json.original')) {
        fs.copyFileSync('package.json.original', 'package.json');
        fs.unlinkSync('package.json.original');
        console.log('✓ Restored original package.json');
      }
      
      // Find the output file and display its path
      const outputDir = path.join(__dirname, 'dist_electron');
      
      if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        const portableFiles = files.filter(file => file.includes('Portable') && file.endsWith('.exe'));
        
        if (portableFiles.length > 0) {
          console.log('\n=============================================');
          console.log('Build completed successfully!');
          console.log('=============================================');
          console.log('Portable executable created at:');
          portableFiles.forEach(file => {
            const filePath = path.join(outputDir, file);
            const fileSize = fs.statSync(filePath).size;
            console.log(`${filePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
          });
          console.log('\nNext steps:');
          console.log('1. Test the portable app on a clean Windows system');
          console.log('2. Distribute to users - they can run it directly without installation!');
          console.log('=============================================');
        } else {
          console.log('Build completed, but no portable executable found in the output directory.');
        }
      } else {
        console.log('Build completed, but output directory not found.');
      }
    } catch (error) {
      console.error('Error building portable executable:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Build process failed:', error);
    process.exit(1);
  }
}

// Run the build process
buildPortable().catch(error => {
  console.error('Error during build:', error);
  process.exit(1);
});
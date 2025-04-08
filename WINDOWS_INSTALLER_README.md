# Windows Installer for Ascend UPSC

This document provides detailed information about the Windows installer for the Ascend UPSC application.

## Installation Types

The Ascend UPSC application is available in two installation formats:

1. **Standard Installation** (.exe installer)
   - Installs to Program Files
   - Creates desktop and start menu shortcuts
   - Registers with Windows Add/Remove Programs
   - Suitable for most users

2. **Portable Version** (standalone .exe)
   - No installation required
   - Can be run from any location, including USB drives
   - All data stored in the application directory
   - Suitable for users who need mobility or lack admin privileges

## Build Instructions

### Prerequisites

Before building the installer, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (included with Node.js)
- Administrator privileges (for installing tools)

### Building the Standard Installer

1. Open a Command Prompt or PowerShell window as Administrator
2. Navigate to the project directory
3. Run the installer build script:
   ```
   build-installer.bat
   ```
4. The installer will be created in the `dist_electron` directory with the name `AscendUPSC-Setup-[version].exe`

### Building the Portable Version

1. Open a Command Prompt or PowerShell window as Administrator
2. Navigate to the project directory
3. Run the portable app build script:
   ```
   build-portable.bat
   ```
4. The portable executable will be created in the `dist_electron` directory with the name `AscendUPSC-Portable.exe`

## What the Installer Does

The standard installer performs these actions:

1. Extracts application files to `%ProgramFiles%\Ascend UPSC`
2. Creates shortcuts on the desktop and in the start menu
3. Initializes the SQLite database with initial data if needed
4. Sets up file associations with `.upsc` files (for exam data)
5. Registers uninstaller in Add/Remove Programs

The portable version:

1. Bundles all files into a single executable
2. Creates a SQLite database in the same directory when first run
3. Stores all user data in the same directory as the executable

## Installation Path Information

### Standard Installation

- Application files: `%ProgramFiles%\Ascend UPSC\`
- Database: `%APPDATA%\ascend-upsc\db\ascend-upsc.db`
- User data: `%APPDATA%\ascend-upsc\user_data\`
- Log files: `%APPDATA%\ascend-upsc\logs\`

### Portable Version

- All files in the directory where the executable is placed
- Database: `[ExeDirectory]\resources\db\ascend-upsc.db`

## Troubleshooting

If the installer fails to run:

1. Ensure you have administrator privileges
2. Check Windows SmartScreen settings (may need to allow the app)
3. Verify your antivirus isn't blocking the installation

If the application fails to start after installation:

1. Check for error logs in `%APPDATA%\ascend-upsc\logs\`
2. Try running as administrator
3. Ensure all prerequisites are met

## Uninstallation

To uninstall the standard version:

1. Go to Windows Settings > Apps > Apps & features
2. Find "Ascend UPSC" in the list
3. Click Uninstall and follow the prompts

For the portable version, simply delete the executable and its associated files.

## Creating a Distribution Package

To create a distribution package for users:

1. Build both the installer and portable versions
2. Add the following files to a zip archive:
   - AscendUPSC-Setup-[version].exe
   - AscendUPSC-Portable.exe
   - USER_GUIDE.md
   - README.md
3. Distribute the zip file to users

## Technical Details

### SQLite Database

The application uses SQLite for data storage:

- Database file: `ascend-upsc.db`
- Tables include: tests, questions, attempts, flashcards, etc.
- Initial sample data is included

### Electron Configuration

The Electron configuration is defined in:

- `electron-builder.yml` (standard installer)
- `electron-builder-portable.yml` (portable version)

### Build Process

The build process:

1. Compiles the React/Vite frontend app
2. Compiles TypeScript files for Electron
3. Bundles Electron main process
4. Prepares resources (database, icons)
5. Builds the final executable using electron-builder
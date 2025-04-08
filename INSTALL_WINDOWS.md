# Installing Ascend UPSC on Windows

This guide will help you install Ascend UPSC on your Windows computer.

## System Requirements

- Windows 10 (64-bit) or higher
- At least 4GB of RAM
- 500MB of free disk space
- Intel or AMD processor

## Installation Steps

1. Download the latest Windows installer (AscendUPSC-Setup.exe) from the releases page
2. Double-click the downloaded .exe file to start the installer
3. If a Windows Defender SmartScreen warning appears, click "More info" and then "Run anyway"
4. Follow the installation wizard:
   - Read and accept the license agreement
   - Choose an installation location (or use the default)
   - Select installation options (desktop shortcut, start menu entry)
   - Click "Install" to complete the installation

## Starting the Application

- Launch Ascend UPSC from the desktop shortcut or Start menu
- The application may take a few moments to start the first time as it initializes the local database

## Updating the Application

- The application will check for updates when launched
- If an update is available, you'll be prompted to install it
- Follow the on-screen instructions to complete the update

## Troubleshooting

If you encounter issues during installation or while using the application:

1. Make sure your Windows version is up to date
2. Try running the installer as Administrator by right-clicking the .exe file and selecting "Run as administrator"
3. Temporarily disable your antivirus software during installation (some antivirus programs may interfere with the installation process)
4. If you receive a ".NET Framework" error, install the latest .NET Framework from Microsoft's website

## Uninstalling

To remove Ascend UPSC from your computer:

1. Open the Windows Control Panel
2. Go to "Programs and Features" (or "Apps & features" in Windows 10/11)
3. Find "Ascend UPSC" in the list of installed programs
4. Click "Uninstall" and follow the prompts

### Removing User Data

If you want to completely remove all data, you can also delete the application data:

1. Press Windows+R to open the Run dialog
2. Type `%APPDATA%\ascend-upsc` and press Enter
3. Delete the entire folder

## Data Storage

Ascend UPSC stores your data in a local SQLite database. This database is located in:
```
%APPDATA%\ascend-upsc\db\ascend-upsc.db
```

To back up your data, make a copy of this file before uninstalling the application.

## Contact Support

If you need assistance with the installation or have questions about the application, please contact our support team at support@ascendupsc.com.
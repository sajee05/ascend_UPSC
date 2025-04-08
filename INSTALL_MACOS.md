# Installing Ascend UPSC on macOS

This guide will help you install Ascend UPSC on your Mac computer.

## System Requirements

- macOS 11.0 (Big Sur) or later
- Intel or Apple Silicon (M1/M2) processor
- At least 4GB of RAM
- 500MB of free disk space

## Installation Steps

1. Download the latest macOS installer (AscendUPSC.dmg) from the releases page
2. Double-click the downloaded .dmg file to mount it
3. Drag the Ascend UPSC application icon to the Applications folder
4. Eject the mounted disk image

## First Launch

When launching Ascend UPSC for the first time:

1. Open the Applications folder in Finder
2. Right-click (or Control-click) on Ascend UPSC
3. Select "Open" from the context menu
4. A security dialog may appear saying the app is from an unidentified developer
5. Click "Open" to confirm you want to run the application
6. The application may take a few moments to start as it initializes the local database

Note: This security verification is only needed the first time you run the application.

## Updating the Application

- The application will check for updates when launched
- If an update is available, you'll be prompted to install it
- Follow the on-screen instructions to complete the update

## Troubleshooting

If you encounter issues during installation or while using the application:

1. Make sure your macOS version is up to date
2. If you receive a message about the application being damaged:
   - Open System Preferences > Security & Privacy
   - Under the General tab, click "Open Anyway" if that option is available
3. If the application won't open due to security settings:
   - Open Terminal
   - Run the command: `xattr -d com.apple.quarantine /Applications/Ascend\ UPSC.app`
   - Try opening the application again

## Uninstalling

To remove Ascend UPSC from your Mac:

1. Open Finder and navigate to the Applications folder
2. Drag the Ascend UPSC application to the Trash
3. Empty the Trash

### Removing User Data

If you want to completely remove all data, you can also delete the application data:

1. Open Finder
2. Press Command+Shift+G to open the "Go to Folder" dialog
3. Enter `~/Library/Application Support/ascend-upsc` and click Go
4. Delete the entire folder

## Data Storage

Ascend UPSC stores your data in a local SQLite database. This database is located in:
```
~/Library/Application Support/ascend-upsc/db/ascend-upsc.db
```

To back up your data, make a copy of this file before uninstalling the application.

## Apple Silicon (M1/M2) Compatibility

Ascend UPSC is a universal application that runs natively on both Intel and Apple Silicon Macs. No Rosetta translation is required.

## Contact Support

If you need assistance with the installation or have questions about the application, please contact our support team at support@ascendupsc.com.
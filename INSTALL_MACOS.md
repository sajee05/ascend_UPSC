# Installation Guide for macOS

This document provides detailed instructions for installing and using the Ascend UPSC application on macOS.

## System Requirements

- macOS 10.14 (Mojave) or later
- 4GB RAM (minimum)
- 500MB free disk space
- Administrator privileges for installation

## Installation

### Installing the Application

1. Download the `AscendUPSC.dmg` file from the provided link
2. Double-click the downloaded DMG file to mount it
3. Drag the Ascend UPSC application to your Applications folder
4. The first time you open the application, right-click (or Control-click) on the app icon and select "Open"
5. Click "Open" when prompted to confirm opening the application
6. The application will start and initialize its database

*Note: The right-click method is required only the first time you run the application because it's not signed with an Apple Developer certificate.*

## First-Time Setup

When running the application for the first time:

1. The application will start automatically and initialize its database
2. You'll see the home page with available tests
3. No login or registration is required
4. You can start using the application immediately

## Using the Application

### Taking Tests

1. From the home page, select a test you want to attempt
2. Click "Start Test" to begin
3. Answer the questions within the allotted time
4. Review your answers before submitting
5. View your test results and analytics

### Viewing Analytics

1. After completing a test, you can view detailed analytics
2. Navigate to the "Overall Analytics" section to see your performance across all tests
3. Review subject-wise performance, time spent, and accuracy metrics
4. Use the insights to focus on weaker areas

### Using Flashcards

1. Navigate to the "Flashcards" section
2. Review flashcards created from your previous incorrect answers
3. Rate your understanding of each concept
4. The spaced repetition system will schedule reviews based on your ratings

## Troubleshooting

If you encounter any issues:

### Application Doesn't Start

1. Check "System Preferences > Security & Privacy > General" and click "Open Anyway" if the app is blocked
2. Make sure your macOS version meets the minimum requirements
3. Try restarting your computer and launching the application again

### "App is damaged" Warning

If you see a message saying the app is damaged and can't be opened:
1. Open Terminal (from Applications > Utilities)
2. Run the following command:
   ```
   xattr -d com.apple.quarantine /Applications/AscendUPSC.app
   ```
3. Try opening the application again

### Database Issues

1. The application might show an error if the database is corrupted
2. Try reinstalling the application if you encounter database errors

### Performance Issues

1. Close other applications to free up system resources
2. Restart the application if it becomes slow after extended use
3. Ensure your computer meets the minimum system requirements

## Data Storage

The application stores all data in the following location:
`~/Library/Application Support/ascend-upsc/`

This includes:
- Your test attempts
- Performance analytics
- Flashcards
- Application settings

## Updates

When a new version is available:
1. Download the new DMG file
2. Follow the same installation steps as above
3. Your existing data will be preserved

## Uninstallation

To uninstall the application:

1. Drag the Ascend UPSC application from the Applications folder to the Trash
2. Empty the Trash
3. To completely remove all application data, delete the folder:
   `~/Library/Application Support/ascend-upsc/`

*Note: The Library folder is hidden by default. To access it, in Finder, hold down the Option key and click on the "Go" menu, then select "Library".*
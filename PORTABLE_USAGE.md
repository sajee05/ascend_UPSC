# Portable Version Usage Guide

This guide provides information about the portable version of Ascend UPSC.

## What is the Portable Version?

The portable version of Ascend UPSC is a self-contained executable file that:

- Runs without installation
- Requires no administrator privileges
- Can be carried on a USB drive or portable storage
- Stores all data in its own directory

## Getting Started

### Running the Application

1. Download the `AscendUPSC-Portable.exe` file
2. Place it in any location where you have write permissions:
   - Your Documents folder
   - A USB flash drive
   - Any folder on your computer
3. Double-click the executable to run the application
4. On first run, the application will create necessary database files

### Data Storage

All data is stored in the same directory as the executable:

- `resources/db/ascend-upsc.db`: Main database file
- `resources/user_data/`: User preferences and settings

### File Management

To back up your data:

1. Close the application if it's running
2. Copy the entire folder containing the executable
3. Store the copy in a safe location

To move the application to a new location:

1. Close the application if it's running
2. Copy the entire folder to the new location
3. Run the executable from the new location

## Advantages of Portable Version

### Mobility

- Use on multiple computers without reinstalling
- Carry your study materials and progress with you
- No need to sync data between devices

### No Administrator Rights Required

- Perfect for computers where you can't install software
- Works in restricted environments (school/workplace)
- No registry modifications or system changes

### Privacy

- All your data stays in one location under your control
- No cloud storage or synchronization

## Limitations

- Cannot be launched from read-only media
- May run slightly slower than the installed version
- Window position/size preferences may not persist when moved between different screen resolutions

## System Requirements

- Windows 10 or Windows 11 (64-bit)
- 4GB RAM (minimum)
- 500MB free disk space
- 1280x720 screen resolution (minimum)

## Troubleshooting

### Application Won't Start

- Ensure you have write permissions to the folder
- Try moving to a different location
- Check if antivirus software is blocking the executable

### "Missing DLL" Errors

- Install the latest Visual C++ Redistributable package from Microsoft
- Update your Windows to the latest version

### Slow Performance

- Consider defragmenting the USB drive if you're running from removable storage
- Close other applications to free system resources

## Additional Notes

### Security Considerations

When using the portable version:

- Use on trusted computers only
- Be aware that anyone with access to the executable can access your data
- Consider encrypting the USB drive if you're storing sensitive information

### Differences from Installed Version

The portable version has identical features to the installed version, with these differences:

- No desktop shortcuts
- No Start menu entries
- No automatic updates
- All data stored locally in the application directory
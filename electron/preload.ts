/**
 * Electron preload script
 * This script runs in an isolated context and provides a secure bridge
 * between the renderer process and the main process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose a limited set of Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get the app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Get the user data path for the app
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Check if running in Electron
  isElectron: true,
});

// Log when preload script is executed
console.log('Electron preload script initialized');
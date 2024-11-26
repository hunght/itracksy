import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is loading...');

// Add debug logging
const electronAPI = {
  getActiveWindow: async () => {
    console.log('Preload: Calling getActiveWindow');
    const result = await ipcRenderer.invoke('get-active-window');
    console.log('Preload: getActiveWindow result:', result);
    return result;
  },
  startTracking: async () => {
    console.log('Preload: Calling startTracking');
    const result = await ipcRenderer.invoke('start-tracking');
    console.log('Preload: startTracking result:', result);
    return result;
  },
  stopTracking: async () => {
    console.log('Preload: Calling stopTracking');
    const result = await ipcRenderer.invoke('stop-tracking');
    console.log('Preload: stopTracking result:', result);
    return result;
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args)
    }
  }
})

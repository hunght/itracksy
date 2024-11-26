export interface IElectronAPI {
  getActiveWindow: () => Promise<any>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

export {}; 
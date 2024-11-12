import { ipcMain } from 'electron';
import activeWin from 'active-win';

export class ActivityTracker {
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('ActivityTracker: Initializing');
    this.setupIPC();
  }

  private setupIPC() {
    console.log('ActivityTracker: Setting up IPC handlers');
    
    // Handle requests for current active window
    ipcMain.handle('get-active-window', async () => {
      console.log('ActivityTracker: Handling get-active-window');
      try {
        const result = await activeWin();
        console.log('ActivityTracker: Active window result:', result);
        return result;
      } catch (error) {
        console.error('ActivityTracker: Error getting active window:', error);
        return null;
      }
    });

    // Start tracking
    ipcMain.handle('start-tracking', () => {
      console.log('ActivityTracker: Handling start-tracking');
      return this.startTracking();
    });

    // Stop tracking
    ipcMain.handle('stop-tracking', () => {
      console.log('ActivityTracker: Handling stop-tracking');
      return this.stopTracking();
    });
  }

  private startTracking(): boolean {
    console.log('ActivityTracker: Starting tracking');
    if (this.interval) {
      console.log('ActivityTracker: Already tracking');
      return false;
    }

    this.interval = setInterval(async () => {
      try {
        const result = await activeWin();
        console.log('ActivityTracker: Active window:', result);
      } catch (error) {
        console.error('ActivityTracker: Error tracking window:', error);
      }
    }, 1000) as unknown as NodeJS.Timeout;

    return true;
  }

  private stopTracking(): boolean {
    console.log('ActivityTracker: Stopping tracking');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      return true;
    }
    return false;
  }
} 
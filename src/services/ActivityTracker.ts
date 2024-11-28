import { ipcMain } from "electron";
import activeWindow from "active-win";
import Store from "electron-store";

interface ActivityRecord {
  timestamp: number;
  title: string;
  owner: {
    name: string;
    path: string;
  };
}

export class ActivityTracker {
  private interval: NodeJS.Timeout | null = null;
  private readonly store: Store;
  private readonly STORAGE_KEY = "window-activity-data";

  constructor() {
    console.log("ActivityTracker: Initializing");
    this.store = new Store();
    this.setupIPC();
  }

  private async getActiveWindow() {
    try {
      const window = await activeWindow();
      return window;
    } catch (error) {
      console.error("ActivityTracker: Error getting active window:", error);
      return null;
    }
  }

  private setupIPC() {
    console.log("ActivityTracker: Setting up IPC handlers");

    // Handle requests for current active window
    ipcMain.handle("get-active-window", async () => {
      console.log("ActivityTracker: Handling get-active-window");
      try {
        const window = await this.getActiveWindow();
        
        if (!window) {
          console.log("ActivityTracker: No active window found");
          return null;
        }

        const windows = {
          title: window.title || "",
          owner: {
            name: window.owner.name || "Unknown",
            path: window.owner.path || "",
          },
        };
        console.log("ActivityTracker: Active window result:", windows);
        return windows;
      } catch (error) {
        console.error("ActivityTracker: Error getting active window:", error);
        return null;
      }
    });

    // Start tracking
    ipcMain.handle("start-tracking", () => {
      console.log("ActivityTracker: Handling start-tracking");
      return this.startTracking();
    });

    // Stop tracking
    ipcMain.handle("stop-tracking", () => {
      console.log("ActivityTracker: Handling stop-tracking");
      return this.stopTracking();
    });

    // New handlers for data retrieval
    ipcMain.handle(
      "get-activity-data",
      (event, timeRange?: { start: number; end: number }) => {
        console.log("ActivityTracker: Handling get-activity-data");
        return this.getActivityData(timeRange);
      }
    );

    ipcMain.handle("clear-activity-data", () => {
      console.log("ActivityTracker: Handling clear-activity-data");
      return this.clearActivityData();
    });
  }

  private startTracking(): boolean {
    console.log("ActivityTracker: Starting tracking");
    if (this.interval) {
      console.log("ActivityTracker: Already tracking");
      return false;
    }

    this.interval = setInterval(async () => {
      try {
        const window = await this.getActiveWindow();
        
        if (!window) {
          console.log("ActivityTracker: No active window found");
          return;
        }

        console.log("ActivityTracker: Active window:", window);
        const windows = {
          title: window.title || "",
          owner: {
            name: window.owner.name || "Unknown",
            path: window.owner.path || "",
          },
        };
        console.log("ActivityTracker: Active window result:", windows);
        if (windows) {
          const activityRecord: ActivityRecord = {
            timestamp: Date.now(),
            title: windows.title,
            owner: {
              name: windows.owner.name,
              path: windows.owner.path,
            },
          };
          this.saveActivityRecord(activityRecord);
        }
      } catch (error) {
        console.error("ActivityTracker: Error tracking window:", error);
      }
    }, 1000) as unknown as NodeJS.Timeout;

    return true;
  }

  private saveActivityRecord(record: ActivityRecord): void {
    try {
      const activities: ActivityRecord[] = this.store.get(
        this.STORAGE_KEY,
        []
      ) as ActivityRecord[];
      activities.push(record);
      this.store.set(this.STORAGE_KEY, activities);
    } catch (error) {
      console.error("ActivityTracker: Error saving activity record:", error);
    }
  }

  private getActivityData(timeRange?: {
    start: number;
    end: number;
  }): ActivityRecord[] {
    try {
      const activities: ActivityRecord[] = this.store.get(
        this.STORAGE_KEY,
        []
      ) as ActivityRecord[];

      if (timeRange) {
        return activities.filter(
          (activity) =>
            activity.timestamp >= timeRange.start &&
            activity.timestamp <= timeRange.end
        );
      }

      return activities;
    } catch (error) {
      console.error("ActivityTracker: Error retrieving activity data:", error);
      return [];
    }
  }

  private clearActivityData(): boolean {
    try {
      this.store.delete(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("ActivityTracker: Error clearing activity data:", error);
      return false;
    }
  }

  private stopTracking(): boolean {
    console.log("ActivityTracker: Stopping tracking");
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      return true;
    }
    return false;
  }
}

import { ipcMain } from "electron";
import type Store from "electron-store";

import {
  WIN_GET_ACTIVE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_CLEAR_ACTIVITY_DATA_CHANNEL,
  WIN_GET_TRACKING_STATE_CHANNEL,
  WIN_GET_ACCESSIBILITY_PERMISSION_CHANNEL,
  WIN_GET_SCREEN_RECORDING_PERMISSION_CHANNEL,
  WIN_SET_ACCESSIBILITY_PERMISSION_CHANNEL,
  WIN_SET_SCREEN_RECORDING_PERMISSION_CHANNEL,
} from "../helpers/ipc/window/window-channels";
import { ActivityRecord } from "@/types/activity";

export class ActivityTracker {
  private interval: NodeJS.Timeout | null = null;

  private readonly STORAGE_KEY = "window-activity-data";
  private readonly TRACKING_STATE_KEY = "tracking-enabled";
  private readonly ACCESSIBILITY_PERMISSION_KEY = "accessibility-permission";
  private readonly SCREEN_RECORDING_PERMISSION_KEY = "screen-recording-permission";
  private store!: Store;

  constructor() {
    console.log("ActivityTracker: Initializing");
  }

  public async setupIPC(): Promise<void> {
    console.log("ActivityTracker: Setting up IPC handlers");
    const electronStore = await import("electron-store");
    this.store = new electronStore.default();
    // Check if tracking was enabled in previous session
    const wasTracking = this.store.get(this.TRACKING_STATE_KEY, false) as boolean;
    this.clearActivityData();

    if (wasTracking) {
      console.log("ActivityTracker: Auto-starting tracking from previous session");
      this.startTracking();
    }

    // Handle requests for current active window
    ipcMain.handle(WIN_GET_ACTIVE_CHANNEL, async () => {
      console.log("ActivityTracker: Handling get-get-windowsdow");
      try {
        const result = this.getAllActivityData();
        // console.log("ActivityTracker: Active window result:", result);
        return result;
      } catch (error) {
        console.error("ActivityTracker: Error getting active window:", error);
        return null;
      }
    });

    // Get tracking state
    ipcMain.handle(WIN_GET_TRACKING_STATE_CHANNEL, () => {
      console.log("ActivityTracker: Handling get-tracking-state");
      return this.getTrackingState();
    });

    // Get accessibility permission
    ipcMain.handle(WIN_GET_ACCESSIBILITY_PERMISSION_CHANNEL, () => {
      console.log("ActivityTracker: Handling get-accessibility-permission");
      return this.getAccessibilityPermission();
    });

    // Get screen recording permission
    ipcMain.handle(WIN_GET_SCREEN_RECORDING_PERMISSION_CHANNEL, () => {
      console.log("ActivityTracker: Handling get-screen-recording-permission");
      return this.getScreenRecordingPermission();
    });

    // Set accessibility permission
    ipcMain.handle(WIN_SET_ACCESSIBILITY_PERMISSION_CHANNEL, (_, enabled: boolean) => {
      console.log("ActivityTracker: Handling set-accessibility-permission", enabled);
      this.setAccessibilityPermission(enabled);
      return enabled;
    });

    // Set screen recording permission
    ipcMain.handle(WIN_SET_SCREEN_RECORDING_PERMISSION_CHANNEL, (_, enabled: boolean) => {
      console.log("ActivityTracker: Handling set-screen-recording-permission", enabled);
      this.setScreenRecordingPermission(enabled);
      return enabled;
    });

    // Start tracking
    ipcMain.handle(WIN_START_TRACKING_CHANNEL, () => {
      console.log("ActivityTracker: Handling start-tracking");
      return this.startTracking();
    });

    // Stop tracking
    ipcMain.handle(WIN_STOP_TRACKING_CHANNEL, () => {
      console.log("ActivityTracker: Handling stop-tracking");
      return this.stopTracking();
    });

    ipcMain.handle(WIN_CLEAR_ACTIVITY_DATA_CHANNEL, () => {
      console.log("ActivityTracker: Handling clear-activity-data");
      return this.clearActivityData();
    });
  }

  private getTrackingState(): boolean {
    return this.store.get(this.TRACKING_STATE_KEY, false) as boolean;
  }

  private getAccessibilityPermission(): boolean {
    return this.store.get(this.ACCESSIBILITY_PERMISSION_KEY, true) as boolean;
  }

  private getScreenRecordingPermission(): boolean {
    return this.store.get(this.SCREEN_RECORDING_PERMISSION_KEY, true) as boolean;
  }

  private setAccessibilityPermission(enabled: boolean): void {
    this.store.set(this.ACCESSIBILITY_PERMISSION_KEY, enabled);
    if (enabled) {
      // Restart tracking if it's turned on
      this.stopTracking();
      this.startTracking();
    }
  }

  private setScreenRecordingPermission(enabled: boolean): void {
    this.store.set(this.SCREEN_RECORDING_PERMISSION_KEY, enabled);
    if (enabled) {
      // Restart tracking if it's turned on
      this.stopTracking();
      this.startTracking();
    }
  }

  private startTracking(): boolean {
    if (this.interval) {
      return false;
    }

    this.store.set(this.TRACKING_STATE_KEY, true);
    this.interval = setInterval(async () => {
      try {
        const getWindows = await import("get-windows");
        const result = await getWindows.activeWindow({
          accessibilityPermission: this.getAccessibilityPermission(),
          screenRecordingPermission: this.getScreenRecordingPermission(),
        });
        console.log("ActivityTracker: permissions", {
          accessibilityPermission: this.getAccessibilityPermission(),
          screenRecordingPermission: this.getScreenRecordingPermission(),
        });
        if (result) {
          if (result.platform === "macos") {
            console.log(
              `ActivityTracker: Active window - ${result.title} (Bundle ID: ${result.owner.bundleId})`
            );
          } else {
            console.log(
              `ActivityTracker: Active window - ${result.title} (Path: ${result.owner.path})`
            );
          }

          const activityRecord: ActivityRecord = {
            ...result,
            timestamp: Date.now(),
          };
          this.saveActivityRecord(activityRecord);
        }
      } catch (error) {
        console.error("ActivityTracker: Error tracking window:", error);
      }
    }, 3000);

    return true;
  }

  public stopTracking(): boolean {
    console.log("ActivityTracker: Stopping tracking");
    if (!this.interval) {
      console.log("ActivityTracker: Not tracking");
      return false;
    }

    clearInterval(this.interval);
    this.interval = null;
    this.store.set(this.TRACKING_STATE_KEY, false);
    return true;
  }

  private saveActivityRecord(record: ActivityRecord): void {
    try {
      const activities = this.store.get(this.STORAGE_KEY, []) as ActivityRecord[];
      activities.push(record);
      this.store.set(this.STORAGE_KEY, activities);
    } catch (error) {
      console.error("ActivityTracker: Error saving activity record:", error);
    }
  }

  private clearActivityData(): boolean {
    try {
      this.store.set(this.STORAGE_KEY, []);
      return true;
    } catch (error) {
      console.error("ActivityTracker: Error clearing activity data:", error);
      return false;
    }
  }

  private getAllActivityData(): ActivityRecord[] {
    return this.store.get(this.STORAGE_KEY, []) as ActivityRecord[];
  }
}

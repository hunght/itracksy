import { contextBridge, ipcRenderer } from "electron";
import {
  WIN_MINIMIZE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_GET_ACTIVE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_CLEAR_ACTIVITY_DATA_CHANNEL,
  WIN_GET_TRACKING_STATE_CHANNEL,
  STORE_CHANNELS,
} from "./window-channels";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),
    store: {
      get: async (key: string) => await ipcRenderer.invoke(STORE_CHANNELS.GET, key),
      set: async (key: string, value: any) => await ipcRenderer.invoke(STORE_CHANNELS.SET, key, value),
    },
    getActiveWindow: async () => {
      console.log("Window: Calling getActiveWindow");
      const result = await ipcRenderer.invoke(WIN_GET_ACTIVE_CHANNEL);
      console.log("Window: getActiveWindow result:", result);
      return result;
    },
    startTracking: async () => {
      console.log("Window: Calling startTracking");
      const result = await ipcRenderer.invoke(WIN_START_TRACKING_CHANNEL);
      console.log("Window: startTracking result:", result);
      return result;
    },
    stopTracking: async () => {
      console.log("Window: Calling stopTracking");
      const result = await ipcRenderer.invoke(WIN_STOP_TRACKING_CHANNEL);
      console.log("Window: stopTracking result:", result);
      return result;
    },
    clearActivityData: async () => {
      console.log("Window: Calling clearActivityData");
      const result = await ipcRenderer.invoke(WIN_CLEAR_ACTIVITY_DATA_CHANNEL);
      console.log("Window: clearActivityData result:", result);
      return result;
    },
    getTrackingState: async () => {
      console.log("Window: Calling getTrackingState");
      const result = await ipcRenderer.invoke(WIN_GET_TRACKING_STATE_CHANNEL);
      console.log("Window: getTrackingState result:", result);
      return result;
    },
  });
}

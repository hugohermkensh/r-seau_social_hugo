// Real-time synchronization manager for local network
import { dataSync, ExportedData } from "./dataSync";

const SYNC_CHANNEL_NAME = "reseau_potes_sync";
const SYNC_VERSION_KEY = "reseau_potes_sync_version";
const SYNC_LAST_UPDATE_KEY = "reseau_potes_last_update";

// BroadcastChannel for same-browser tab sync
let broadcastChannel: BroadcastChannel | null = null;

export const syncManager = {
  // Initialize sync system
  init: () => {
    try {
      broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === "DATA_UPDATE") {
          // Another tab updated data, reload
          window.location.reload();
        } else if (event.data.type === "REQUEST_SYNC") {
          // Another tab is requesting current data
          syncManager.broadcastCurrentData();
        }
      };
    } catch (e) {
      console.log("BroadcastChannel not supported");
    }
  },

  // Notify other tabs that data changed
  notifyDataChange: () => {
    const version = Date.now().toString();
    localStorage.setItem(SYNC_VERSION_KEY, version);
    localStorage.setItem(SYNC_LAST_UPDATE_KEY, new Date().toISOString());
    
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "DATA_UPDATE", version });
    }
  },

  // Broadcast current data to other tabs
  broadcastCurrentData: () => {
    if (broadcastChannel) {
      const data = dataSync.exportAllData();
      broadcastChannel.postMessage({ type: "SYNC_DATA", data });
    }
  },

  // Get sync version
  getSyncVersion: (): string => {
    return localStorage.getItem(SYNC_VERSION_KEY) || "0";
  },

  // Get last update time
  getLastUpdate: (): string | null => {
    return localStorage.getItem(SYNC_LAST_UPDATE_KEY);
  },

  // Generate sync code (compressed data as base64)
  generateSyncCode: (): string => {
    try {
      const data = dataSync.exportAllData();
      const jsonString = JSON.stringify(data);
      const compressed = btoa(encodeURIComponent(jsonString));
      return compressed;
    } catch (e) {
      console.error("Failed to generate sync code", e);
      return "";
    }
  },

  // Apply sync code
  applySyncCode: (code: string, mergeMode: "replace" | "merge" = "merge"): boolean => {
    try {
      const jsonString = decodeURIComponent(atob(code));
      const data: ExportedData = JSON.parse(jsonString);
      const success = dataSync.importData(data, mergeMode);
      if (success) {
        syncManager.notifyDataChange();
      }
      return success;
    } catch (e) {
      console.error("Failed to apply sync code", e);
      return false;
    }
  },

  // Setup storage event listener for cross-tab sync
  setupStorageListener: (callback: () => void) => {
    const handler = (event: StorageEvent) => {
      if (event.key === SYNC_VERSION_KEY) {
        callback();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },

  // Cleanup
  destroy: () => {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  },
};

// Auto-initialize on import
if (typeof window !== "undefined") {
  syncManager.init();
}

// Data synchronization utilities for local network sharing
import { userStorage, postStorage, storyStorage, messageStorage, groupStorage, eventStorage } from "@/lib/storage";

export interface ExportedData {
  version: string;
  exportedAt: string;
  users: any[];
  posts: any[];
  stories: any[];
  messages: any[];
  groups: any[];
  events: any[];
  notifications: any[];
  blockedUsers: any[];
}

const STORAGE_KEYS = {
  notifications: "reseau_potes_notifications",
  blockedUsers: "reseau_potes_blocked_users",
};

export const dataSync = {
  // Export all data to JSON
  exportAllData: (): ExportedData => {
    const data: ExportedData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      users: userStorage.getAll(),
      posts: postStorage.getAll(),
      stories: storyStorage.getAll(),
      messages: messageStorage.getAll(),
      groups: groupStorage.getAll(),
      events: eventStorage.getAll(),
      notifications: JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || "[]"),
      blockedUsers: JSON.parse(localStorage.getItem(STORAGE_KEYS.blockedUsers) || "[]"),
    };
    return data;
  },

  // Download data as JSON file
  downloadData: () => {
    const data = dataSync.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reseau-potes-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import data from JSON
  importData: (data: ExportedData, mergeMode: "replace" | "merge" = "merge"): boolean => {
    try {
      if (!data.version) {
        throw new Error("Invalid data format");
      }

      if (mergeMode === "replace") {
        // Clear all existing data
        localStorage.setItem("reseau_potes_users", JSON.stringify(data.users || []));
        localStorage.setItem("reseau_potes_posts", JSON.stringify(data.posts || []));
        localStorage.setItem("reseau_potes_stories", JSON.stringify(data.stories || []));
        localStorage.setItem("reseau_potes_messages", JSON.stringify(data.messages || []));
        localStorage.setItem("reseau_potes_groups", JSON.stringify(data.groups || []));
        localStorage.setItem("reseau_potes_events", JSON.stringify(data.events || []));
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(data.notifications || []));
        localStorage.setItem(STORAGE_KEYS.blockedUsers, JSON.stringify(data.blockedUsers || []));
      } else {
        // Merge mode - combine data, avoiding duplicates
        const mergeArrays = (existing: any[], imported: any[]) => {
          const merged = [...existing];
          imported.forEach((item) => {
            if (!merged.find((e) => e.id === item.id)) {
              merged.push(item);
            }
          });
          return merged;
        };

        const existingUsers = userStorage.getAll();
        const existingPosts = postStorage.getAll();
        const existingStories = storyStorage.getAll();
        const existingMessages = messageStorage.getAll();
        const existingGroups = groupStorage.getAll();
        const existingEvents = eventStorage.getAll();
        const existingNotifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || "[]");
        const existingBlocked = JSON.parse(localStorage.getItem(STORAGE_KEYS.blockedUsers) || "[]");

        localStorage.setItem("reseau_potes_users", JSON.stringify(mergeArrays(existingUsers, data.users || [])));
        localStorage.setItem("reseau_potes_posts", JSON.stringify(mergeArrays(existingPosts, data.posts || [])));
        localStorage.setItem("reseau_potes_stories", JSON.stringify(mergeArrays(existingStories, data.stories || [])));
        localStorage.setItem("reseau_potes_messages", JSON.stringify(mergeArrays(existingMessages, data.messages || [])));
        localStorage.setItem("reseau_potes_groups", JSON.stringify(mergeArrays(existingGroups, data.groups || [])));
        localStorage.setItem("reseau_potes_events", JSON.stringify(mergeArrays(existingEvents, data.events || [])));
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(mergeArrays(existingNotifications, data.notifications || [])));
        localStorage.setItem(STORAGE_KEYS.blockedUsers, JSON.stringify(mergeArrays(existingBlocked, data.blockedUsers || [])));
      }

      return true;
    } catch (error) {
      console.error("Import error:", error);
      return false;
    }
  },

  // Read file and parse JSON
  readFile: (file: File): Promise<ExportedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  },

  // Get data stats
  getStats: () => {
    return {
      users: userStorage.getAll().length,
      posts: postStorage.getAll().length,
      stories: storyStorage.getAll().length,
      messages: messageStorage.getAll().length,
      groups: groupStorage.getAll().length,
      events: eventStorage.getAll().length,
    };
  },
};

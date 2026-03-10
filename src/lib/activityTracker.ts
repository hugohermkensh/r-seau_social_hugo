// User activity & online status tracker
import { getFromStorage, saveToStorage } from "@/lib/storage";

export interface UserActivity {
  userId: string;
  lastSeen: string;
  status: "online" | "away" | "offline";
  currentPage?: string;
}

const ACTIVITY_KEY = "reseau_potes_activity";
const ONLINE_THRESHOLD = 30_000; // 30 seconds
const AWAY_THRESHOLD = 120_000; // 2 minutes

export const activityTracker = {
  update: (userId: string, page?: string): void => {
    const activities = getFromStorage<UserActivity>(ACTIVITY_KEY);
    const index = activities.findIndex(a => a.userId === userId);
    
    const activity: UserActivity = {
      userId,
      lastSeen: new Date().toISOString(),
      status: "online",
      currentPage: page,
    };

    if (index >= 0) {
      activities[index] = activity;
    } else {
      activities.push(activity);
    }
    saveToStorage(ACTIVITY_KEY, activities);
  },

  getStatus: (userId: string): UserActivity["status"] => {
    const activities = getFromStorage<UserActivity>(ACTIVITY_KEY);
    const activity = activities.find(a => a.userId === userId);
    if (!activity) return "offline";

    const elapsed = Date.now() - new Date(activity.lastSeen).getTime();
    if (elapsed < ONLINE_THRESHOLD) return "online";
    if (elapsed < AWAY_THRESHOLD) return "away";
    return "offline";
  },

  getAll: (): UserActivity[] => {
    return getFromStorage<UserActivity>(ACTIVITY_KEY).map(a => ({
      ...a,
      status: activityTracker.getStatus(a.userId),
    }));
  },

  getOnlineUsers: (): string[] => {
    return activityTracker.getAll()
      .filter(a => a.status === "online")
      .map(a => a.userId);
  },

  getOnlineCount: (): number => {
    return activityTracker.getOnlineUsers().length;
  },

  setOffline: (userId: string): void => {
    const activities = getFromStorage<UserActivity>(ACTIVITY_KEY);
    const index = activities.findIndex(a => a.userId === userId);
    if (index >= 0) {
      activities[index].status = "offline";
      saveToStorage(ACTIVITY_KEY, activities);
    }
  },
};

// Auto-tracker hook helper
let trackingInterval: ReturnType<typeof setInterval> | null = null;

export const startTracking = (userId: string): (() => void) => {
  activityTracker.update(userId);
  
  trackingInterval = setInterval(() => {
    activityTracker.update(userId, window.location.pathname);
  }, 15_000); // Update every 15s

  const handleVisibility = () => {
    if (document.hidden) {
      activityTracker.setOffline(userId);
    } else {
      activityTracker.update(userId, window.location.pathname);
    }
  };

  const handleBeforeUnload = () => {
    activityTracker.setOffline(userId);
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    if (trackingInterval) clearInterval(trackingInterval);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    activityTracker.setOffline(userId);
  };
};

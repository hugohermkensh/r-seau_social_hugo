// Notification system
import { getFromStorage, saveToStorage } from "@/lib/storage";

export interface Notification {
  id: string;
  userId: string;
  type: "message" | "post" | "story" | "event" | "group" | "like" | "comment";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

const NOTIFICATIONS_KEY = "reseau_potes_notifications";

export const notificationStorage = {
  getAll: (): Notification[] => {
    return getFromStorage<Notification>(NOTIFICATIONS_KEY);
  },

  getByUser: (userId: string): Notification[] => {
    return notificationStorage.getAll().filter(n => n.userId === userId);
  },

  getUnread: (userId: string): Notification[] => {
    return notificationStorage.getByUser(userId).filter(n => !n.read);
  },

  getUnreadCount: (userId: string): number => {
    return notificationStorage.getUnread(userId).length;
  },

  create: (data: Omit<Notification, "id" | "timestamp" | "read">): Notification => {
    const notifications = notificationStorage.getAll();
    const newNotification: Notification = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification);
    saveToStorage(NOTIFICATIONS_KEY, notifications);
    
    // Play notification sound
    playNotificationSound();
    
    return newNotification;
  },

  markAsRead: (notificationId: string): void => {
    const notifications = notificationStorage.getAll();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      saveToStorage(NOTIFICATIONS_KEY, notifications);
    }
  },

  markAllAsRead: (userId: string): void => {
    const notifications = notificationStorage.getAll();
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    saveToStorage(NOTIFICATIONS_KEY, notifications);
  },

  delete: (notificationId: string): void => {
    const notifications = notificationStorage.getAll().filter(n => n.id !== notificationId);
    saveToStorage(NOTIFICATIONS_KEY, notifications);
  },

  clearAll: (userId: string): void => {
    const notifications = notificationStorage.getAll().filter(n => n.userId !== userId);
    saveToStorage(NOTIFICATIONS_KEY, notifications);
  },
};

// Notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log("Sound not available");
  }
};

// User blocking system
export interface BlockedUser {
  id: string;
  userId: string;
  blockedAt: string;
  unlockCode: string;
  reason?: string;
}

const BLOCKED_USERS_KEY = "reseau_potes_blocked_users";

export const blockStorage = {
  getAll: (): BlockedUser[] => {
    return getFromStorage<BlockedUser>(BLOCKED_USERS_KEY);
  },

  isBlocked: (userId: string): boolean => {
    return blockStorage.getAll().some(b => b.userId === userId);
  },

  getBlockInfo: (userId: string): BlockedUser | undefined => {
    return blockStorage.getAll().find(b => b.userId === userId);
  },

  block: (userId: string, unlockCode: string, reason?: string): BlockedUser => {
    const blocks = blockStorage.getAll();
    
    // Remove existing block if any
    const filtered = blocks.filter(b => b.userId !== userId);
    
    const newBlock: BlockedUser = {
      id: crypto.randomUUID(),
      userId,
      blockedAt: new Date().toISOString(),
      unlockCode,
      reason,
    };
    
    filtered.push(newBlock);
    saveToStorage(BLOCKED_USERS_KEY, filtered);
    
    return newBlock;
  },

  unblock: (userId: string, code: string): boolean => {
    const blockInfo = blockStorage.getBlockInfo(userId);
    
    if (!blockInfo) return true;
    
    if (blockInfo.unlockCode !== code) {
      return false;
    }
    
    const blocks = blockStorage.getAll().filter(b => b.userId !== userId);
    saveToStorage(BLOCKED_USERS_KEY, blocks);
    return true;
  },

  forceUnblock: (userId: string): void => {
    const blocks = blockStorage.getAll().filter(b => b.userId !== userId);
    saveToStorage(BLOCKED_USERS_KEY, blocks);
  },
};

// Helper function to send notifications when actions happen
export const sendNotification = {
  newMessage: (toUserId: string, fromUserName: string) => {
    notificationStorage.create({
      userId: toUserId,
      type: "message",
      title: "Nouveau message",
      message: `${fromUserName} vous a envoyé un message`,
    });
  },

  newLike: (toUserId: string, fromUserName: string) => {
    notificationStorage.create({
      userId: toUserId,
      type: "like",
      title: "Nouveau like",
      message: `${fromUserName} a aimé votre publication`,
    });
  },

  newComment: (toUserId: string, fromUserName: string) => {
    notificationStorage.create({
      userId: toUserId,
      type: "comment",
      title: "Nouveau commentaire",
      message: `${fromUserName} a commenté votre publication`,
    });
  },

  newEvent: (toUserId: string, eventName: string) => {
    notificationStorage.create({
      userId: toUserId,
      type: "event",
      title: "Nouvel événement",
      message: `Vous êtes invité à ${eventName}`,
    });
  },

  addedToGroup: (toUserId: string, groupName: string) => {
    notificationStorage.create({
      userId: toUserId,
      type: "group",
      title: "Ajouté au groupe",
      message: `Vous avez été ajouté au groupe ${groupName}`,
    });
  },
};

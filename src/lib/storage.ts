// Local storage management with encryption simulation
import { z } from "zod";

// Schemas for validation
export const userSchema = z.object({
  id: z.string(),
  pseudo: z.string().min(2).max(20),
  code: z.string().min(8).max(200), // Hashed password
  avatar: z.string().optional(),
  bio: z.string().max(200).optional(),
  createdAt: z.string(),
  role: z.enum(["user", "admin"]).default("user"),
});

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  author: z.string(),
  content: z.string().min(1).max(1000),
  likes: z.array(z.string()),
  comments: z.array(z.object({
    id: z.string(),
    authorId: z.string(),
    author: z.string(),
    content: z.string().max(500),
    timestamp: z.string(),
  })),
  timestamp: z.string(),
  type: z.enum(["text", "image"]),
});

export const storySchema = z.object({
  id: z.string(),
  authorId: z.string(),
  author: z.string(),
  content: z.string().max(280),
  timestamp: z.string(),
  expiresAt: z.string(),
  type: z.enum(["text", "image"]),
  viewers: z.array(z.string()),
});

export const messageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string().optional(), // Optional for group messages
  groupId: z.string().optional(), // For group messages
  content: z.string().min(1).max(2000),
  timestamp: z.string(),
  read: z.boolean(),
});

export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  members: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
  avatar: z.string().optional(),
});

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().max(200).optional(),
  createdBy: z.string(),
  participants: z.array(z.string()),
  timestamp: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;
export type Story = z.infer<typeof storySchema>;
export type Message = z.infer<typeof messageSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Group = z.infer<typeof groupSchema>;

// Storage keys
const STORAGE_KEYS = {
  USERS: 'reseau_potes_users',
  POSTS: 'reseau_potes_posts',
  STORIES: 'reseau_potes_stories',
  MESSAGES: 'reseau_potes_messages',
  GROUPS: 'reseau_potes_groups',
  EVENTS: 'reseau_potes_events',
  CURRENT_USER: 'reseau_potes_current_user',
} as const;

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from storage: ${key}`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage: ${key}`, error);
  }
}

// User management
export const userStorage = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  
  getById: (id: string): User | undefined => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.id === id);
  },
  
  getByPseudo: (pseudo: string): User | undefined => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.pseudo.toLowerCase() === pseudo.toLowerCase());
  },
  
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      role: user.role || 'user',
    };
    const validated = userSchema.parse(newUser);
    users.push(validated);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return validated;
  },
  
  delete: (id: string): boolean => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    saveToStorage(STORAGE_KEYS.USERS, filtered);
    return true;
  },
  
  getUserStats: (userId: string): { posts: number; likes: number; comments: number; stories: number } => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const userPosts = posts.filter(p => p.authorId === userId);
    const likes = userPosts.reduce((acc, p) => acc + p.likes.length, 0);
    const comments = userPosts.reduce((acc, p) => acc + p.comments.length, 0);
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES);
    const userStories = stories.filter(s => s.authorId === userId);
    return { posts: userPosts.length, likes, comments, stories: userStories.length };
  },
  
  update: (id: string, updates: Partial<User>): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    const validated = userSchema.parse(users[index]);
    users[index] = validated;
    saveToStorage(STORAGE_KEYS.USERS, users);
    return validated;
  },
};

// Post management
export const postStorage = {
  getAll: (): Post[] => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  getById: (id: string): Post | undefined => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    return posts.find(p => p.id === id);
  },
  
  getByAuthor: (authorId: string): Post[] => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    return posts.filter(p => p.authorId === authorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  create: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>): Post => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const newPost: Post = {
      ...post,
      id: `post_${Date.now()}`,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    const validated = postSchema.parse(newPost);
    posts.push(validated);
    saveToStorage(STORAGE_KEYS.POSTS, posts);
    return validated;
  },
  
  toggleLike: (postId: string, userId: string): Post | null => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return null;
    
    const likeIndex = posts[index].likes.indexOf(userId);
    if (likeIndex === -1) {
      posts[index].likes.push(userId);
    } else {
      posts[index].likes.splice(likeIndex, 1);
    }
    
    saveToStorage(STORAGE_KEYS.POSTS, posts);
    return posts[index];
  },
  
  addComment: (postId: string, comment: Post['comments'][0]): Post | null => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return null;
    
    posts[index].comments.push(comment);
    saveToStorage(STORAGE_KEYS.POSTS, posts);
    return posts[index];
  },
  
  delete: (postId: string): boolean => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const filtered = posts.filter(p => p.id !== postId);
    if (filtered.length === posts.length) return false;
    saveToStorage(STORAGE_KEYS.POSTS, filtered);
    return true;
  },
};

// Story management
export const storyStorage = {
  getAll: (): Story[] => {
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES);
    const now = new Date().getTime();
    // Filter expired stories
    const active = stories.filter(s => new Date(s.expiresAt).getTime() > now);
    if (active.length !== stories.length) {
      saveToStorage(STORAGE_KEYS.STORIES, active);
    }
    return active;
  },
  
  getByAuthor: (authorId: string): Story[] => {
    const stories = storyStorage.getAll();
    return stories.filter(s => s.authorId === authorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  create: (story: Omit<Story, 'id' | 'timestamp' | 'expiresAt' | 'viewers'>): Story => {
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
    
    const newStory: Story = {
      ...story,
      id: `story_${Date.now()}`,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      viewers: [],
    };
    const validated = storySchema.parse(newStory);
    stories.push(validated);
    saveToStorage(STORAGE_KEYS.STORIES, stories);
    return validated;
  },
  
  addViewer: (storyId: string, userId: string): Story | null => {
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES);
    const index = stories.findIndex(s => s.id === storyId);
    if (index === -1) return null;
    
    if (!stories[index].viewers.includes(userId)) {
      stories[index].viewers.push(userId);
      saveToStorage(STORAGE_KEYS.STORIES, stories);
    }
    return stories[index];
  },
};

// Message management
export const messageStorage = {
  getAll: (): Message[] => getFromStorage<Message>(STORAGE_KEYS.MESSAGES),
  
  getConversation: (user1Id: string, user2Id: string): Message[] => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    return messages.filter(m => 
      !m.groupId && (
        (m.senderId === user1Id && m.receiverId === user2Id) ||
        (m.senderId === user2Id && m.receiverId === user1Id)
      )
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getGroupMessages: (groupId: string): Message[] => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    return messages.filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  
  getUnreadCount: (userId: string): number => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    return messages.filter(m => m.receiverId === userId && !m.read).length;
  },
  
  getConversations: (userId: string): { userId: string, lastMessage: Message, unreadCount: number }[] => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const userMessages = messages.filter(m => !m.groupId && (m.senderId === userId || m.receiverId === userId));
    
    const conversations = new Map<string, { lastMessage: Message, unreadCount: number }>();
    
    userMessages.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId! : msg.senderId;
      const existing = conversations.get(otherId);
      
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        const unread = userMessages.filter(m => 
          m.senderId === otherId && m.receiverId === userId && !m.read
        ).length;
        
        conversations.set(otherId, { lastMessage: msg, unreadCount: unread });
      }
    });
    
    return Array.from(conversations.entries()).map(([userId, data]) => ({
      userId,
      ...data
    })).sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  },
  
  send: (message: Omit<Message, 'id' | 'timestamp' | 'read'>): Message => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const validated = messageSchema.parse(newMessage);
    messages.push(validated);
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
    return validated;
  },
  
  markAsRead: (userId: string, senderId: string): void => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    messages.forEach(msg => {
      if (msg.receiverId === userId && msg.senderId === senderId && !msg.read) {
        msg.read = true;
      }
    });
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
  },

  deleteConversation: (userId: string, otherUserId: string): void => {
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const filtered = messages.filter(m => 
      !(!m.groupId && (
        (m.senderId === userId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === userId)
      ))
    );
    saveToStorage(STORAGE_KEYS.MESSAGES, filtered);
  },
};

// Event management
export const eventStorage = {
  getAll: (): Event[] => {
    const events = getFromStorage<Event>(STORAGE_KEYS.EVENTS);
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
  
  getUpcoming: (): Event[] => {
    const events = eventStorage.getAll();
    const now = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date >= now);
  },
  
  create: (event: Omit<Event, 'id' | 'timestamp'>): Event => {
    const events = getFromStorage<Event>(STORAGE_KEYS.EVENTS);
    const newEvent: Event = {
      ...event,
      id: `event_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const validated = eventSchema.parse(newEvent);
    events.push(validated);
    saveToStorage(STORAGE_KEYS.EVENTS, events);
    return validated;
  },
  
  toggleParticipant: (eventId: string, userId: string): Event | null => {
    const events = getFromStorage<Event>(STORAGE_KEYS.EVENTS);
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return null;
    
    const participantIndex = events[index].participants.indexOf(userId);
    if (participantIndex === -1) {
      events[index].participants.push(userId);
    } else {
      events[index].participants.splice(participantIndex, 1);
    }
    
    saveToStorage(STORAGE_KEYS.EVENTS, events);
    return events[index];
  },
  
  delete: (eventId: string): boolean => {
    const events = getFromStorage<Event>(STORAGE_KEYS.EVENTS);
    const filtered = events.filter(e => e.id !== eventId);
    if (filtered.length === events.length) return false;
    saveToStorage(STORAGE_KEYS.EVENTS, filtered);
    return true;
  },
};

// Group management
export const groupStorage = {
  getAll: (): Group[] => getFromStorage<Group>(STORAGE_KEYS.GROUPS),

  getById: (id: string): Group | undefined => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    return groups.find(g => g.id === id);
  },

  getUserGroups: (userId: string): Group[] => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    return groups.filter(g => g.members.includes(userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create: (group: Omit<Group, 'id' | 'createdAt'>): Group => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const newGroup: Group = {
      ...group,
      id: `group_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const validated = groupSchema.parse(newGroup);
    groups.push(validated);
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
    return validated;
  },

  addMember: (groupId: string, userId: string): Group | null => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const index = groups.findIndex(g => g.id === groupId);
    if (index === -1) return null;

    if (!groups[index].members.includes(userId)) {
      groups[index].members.push(userId);
      saveToStorage(STORAGE_KEYS.GROUPS, groups);
    }
    return groups[index];
  },

  removeMember: (groupId: string, userId: string): Group | null => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const index = groups.findIndex(g => g.id === groupId);
    if (index === -1) return null;

    groups[index].members = groups[index].members.filter(m => m !== userId);
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
    return groups[index];
  },

  delete: (groupId: string): boolean => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const filtered = groups.filter(g => g.id !== groupId);
    if (filtered.length === groups.length) return false;
    saveToStorage(STORAGE_KEYS.GROUPS, filtered);
    // Also delete all messages from this group
    const messages = getFromStorage<Message>(STORAGE_KEYS.MESSAGES);
    const filteredMessages = messages.filter(m => m.groupId !== groupId);
    saveToStorage(STORAGE_KEYS.MESSAGES, filteredMessages);
    return true;
  },
};

// Reset function (for admin)
export const resetAllContent = (keepUsers: boolean = true): void => {
  localStorage.removeItem(STORAGE_KEYS.POSTS);
  localStorage.removeItem(STORAGE_KEYS.STORIES);
  localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  localStorage.removeItem(STORAGE_KEYS.GROUPS);
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
  
  if (!keepUsers) {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Function to reset content for a specific user
export function resetUserContent(userId: string) {
  // Remove user's posts
  const posts = postStorage.getAll();
  const filteredPosts = posts.filter(p => p.authorId !== userId);
  saveToStorage(STORAGE_KEYS.POSTS, filteredPosts);
  
  // Remove user's stories
  const stories = storyStorage.getAll();
  const filteredStories = stories.filter(s => s.authorId !== userId);
  saveToStorage(STORAGE_KEYS.STORIES, filteredStories);
  
  // Remove user's messages
  const messages = messageStorage.getAll();
  const filteredMessages = messages.filter(m => m.senderId !== userId && m.receiverId !== userId);
  saveToStorage(STORAGE_KEYS.MESSAGES, filteredMessages);
  
  // Remove user from groups and delete groups they created
  const groups = groupStorage.getAll();
  const filteredGroups = groups
    .filter(g => g.createdBy !== userId)
    .map(g => ({
      ...g,
      members: g.members.filter(m => m !== userId)
    }));
  saveToStorage(STORAGE_KEYS.GROUPS, filteredGroups);
  
  // Remove user from events
  const events = eventStorage.getAll();
  const filteredEvents = events
    .filter(e => e.createdBy !== userId)
    .map(e => ({
      ...e,
      participants: e.participants.filter(p => p !== userId)
    }));
  saveToStorage(STORAGE_KEYS.EVENTS, filteredEvents);
}

// Current user
export const currentUserStorage = {
  get: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  set: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

// Initialize admin user
export const initializeAdmin = async () => {
  const users = userStorage.getAll();
  const adminExists = users.some(u => u.role === 'admin');
  
  if (!adminExists) {
    // Import dynamically to avoid circular dependency
    const { hashPassword } = await import('./auth');
    const hashedPassword = await hashPassword('Hugo1981100??');
    
    userStorage.create({
      pseudo: 'admin',
      code: hashedPassword,
      role: 'admin',
    });
  }
};

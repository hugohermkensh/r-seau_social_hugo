// Advanced secure local storage engine with encryption, sessions, and audit logging

// Simple XOR-based obfuscation for localStorage data (not true encryption but deters casual inspection)
const OBFUSCATION_KEY = "R3s34uP0t3s_S3cur3_K3y_2024!";

const obfuscate = (data: string): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
    );
  }
  return btoa(result);
};

const deobfuscate = (encoded: string): string => {
  try {
    const decoded = atob(encoded);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      );
    }
    return result;
  } catch {
    return encoded; // Fallback for unencoded data
  }
};

// Secure storage wrapper
export const secureStorage = {
  set: (key: string, data: any): void => {
    try {
      const json = JSON.stringify(data);
      const encoded = obfuscate(json);
      localStorage.setItem(key, encoded);
    } catch (e) {
      console.error(`SecureStorage write error: ${key}`, e);
    }
  },

  get: <T>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      
      // Try deobfuscate first, fallback to raw JSON parse
      try {
        const decoded = deobfuscate(raw);
        return JSON.parse(decoded) as T;
      } catch {
        return JSON.parse(raw) as T;
      }
    } catch {
      return fallback;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// Session management
export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  userAgent: string;
  ipHint: string;
}

const SESSION_KEY = "reseau_potes_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

export const sessionManager = {
  create: (userId: string): Session => {
    const now = new Date();
    const session: Session = {
      id: `sess_${crypto.randomUUID()}`,
      userId,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_DURATION).toISOString(),
      lastActivity: now.toISOString(),
      userAgent: navigator.userAgent.substring(0, 100),
      ipHint: "local",
    };
    secureStorage.set(SESSION_KEY, session);
    auditLog.log("session_created", userId, { sessionId: session.id });
    return session;
  },

  get: (): Session | null => {
    const session = secureStorage.get<Session | null>(SESSION_KEY, null);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      sessionManager.destroy();
      return null;
    }

    return session;
  },

  refresh: (): void => {
    const session = sessionManager.get();
    if (session) {
      session.lastActivity = new Date().toISOString();
      session.expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
      secureStorage.set(SESSION_KEY, session);
    }
  },

  isValid: (): boolean => {
    return sessionManager.get() !== null;
  },

  destroy: (): void => {
    const session = secureStorage.get<Session | null>(SESSION_KEY, null);
    if (session) {
      auditLog.log("session_destroyed", session.userId, { sessionId: session.id });
    }
    secureStorage.remove(SESSION_KEY);
  },
};

// Audit logging system
export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details?: Record<string, any>;
}

const AUDIT_LOG_KEY = "reseau_potes_audit_log";
const MAX_AUDIT_ENTRIES = 500;

export const auditLog = {
  log: (action: string, userId: string, details?: Record<string, any>): void => {
    try {
      const entries = secureStorage.get<AuditEntry[]>(AUDIT_LOG_KEY, []);
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        userId,
        details,
      };
      entries.unshift(entry);
      
      // Keep only last MAX entries
      if (entries.length > MAX_AUDIT_ENTRIES) {
        entries.splice(MAX_AUDIT_ENTRIES);
      }
      
      secureStorage.set(AUDIT_LOG_KEY, entries);
    } catch (e) {
      console.error("Audit log error:", e);
    }
  },

  getAll: (): AuditEntry[] => {
    return secureStorage.get<AuditEntry[]>(AUDIT_LOG_KEY, []);
  },

  getByUser: (userId: string): AuditEntry[] => {
    return auditLog.getAll().filter(e => e.userId === userId);
  },

  getByAction: (action: string): AuditEntry[] => {
    return auditLog.getAll().filter(e => e.action === action);
  },

  getRecent: (count: number = 50): AuditEntry[] => {
    return auditLog.getAll().slice(0, count);
  },

  clear: (): void => {
    secureStorage.set(AUDIT_LOG_KEY, []);
  },
};

// XSS Protection helpers
export const sanitize = {
  text: (input: string): string => {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
  },

  html: (input: string): string => {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  // Prevent script injection in user content
  userContent: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/data:text\/html/gi, "");
  },
};

// CSRF token for form protection
export const csrfToken = {
  generate: (): string => {
    const token = crypto.randomUUID();
    sessionStorage.setItem("csrf_token", token);
    return token;
  },

  validate: (token: string): boolean => {
    const stored = sessionStorage.getItem("csrf_token");
    return stored === token;
  },
};

// Storage usage monitor
export const storageMonitor = {
  getUsage: (): { used: number; total: number; percentage: number } => {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += (localStorage.getItem(key) || "").length * 2; // UTF-16
      }
    }
    const total = 5 * 1024 * 1024; // ~5MB typical limit
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    };
  },

  getBreakdown: (): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("reseau_potes_")) {
        breakdown[key] = (localStorage.getItem(key) || "").length * 2;
      }
    }
    return breakdown;
  },

  isNearLimit: (): boolean => {
    return storageMonitor.getUsage().percentage > 80;
  },
};

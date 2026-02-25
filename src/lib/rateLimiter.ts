// Rate limiter for login attempts - prevents brute force
const RATE_LIMIT_KEY = "reseau_potes_rate_limit";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

export const rateLimiter = {
  getEntry: (key: string): RateLimitEntry => {
    try {
      const data = localStorage.getItem(`${RATE_LIMIT_KEY}_${key}`);
      if (!data) return { attempts: 0, lastAttempt: 0, lockedUntil: null };
      return JSON.parse(data);
    } catch {
      return { attempts: 0, lastAttempt: 0, lockedUntil: null };
    }
  },

  isLocked: (key: string): { locked: boolean; remainingMs: number } => {
    const entry = rateLimiter.getEntry(key);
    if (!entry.lockedUntil) return { locked: false, remainingMs: 0 };
    
    const now = Date.now();
    if (now >= entry.lockedUntil) {
      // Lock expired, reset
      rateLimiter.reset(key);
      return { locked: false, remainingMs: 0 };
    }
    
    return { locked: true, remainingMs: entry.lockedUntil - now };
  },

  recordAttempt: (key: string): { blocked: boolean; remainingAttempts: number; lockoutMs: number } => {
    const entry = rateLimiter.getEntry(key);
    const now = Date.now();

    // Reset if last attempt was more than lockout duration ago
    if (now - entry.lastAttempt > LOCKOUT_DURATION) {
      entry.attempts = 0;
      entry.lockedUntil = null;
    }

    entry.attempts++;
    entry.lastAttempt = now;

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION;
      localStorage.setItem(`${RATE_LIMIT_KEY}_${key}`, JSON.stringify(entry));
      return { blocked: true, remainingAttempts: 0, lockoutMs: LOCKOUT_DURATION };
    }

    localStorage.setItem(`${RATE_LIMIT_KEY}_${key}`, JSON.stringify(entry));
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - entry.attempts, lockoutMs: 0 };
  },

  reset: (key: string): void => {
    localStorage.removeItem(`${RATE_LIMIT_KEY}_${key}`);
  },

  formatTime: (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.ceil((ms % 60000) / 1000);
    if (minutes > 0) return `${minutes}min ${seconds}s`;
    return `${seconds}s`;
  },
};

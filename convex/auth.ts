import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for passwords (in production, use bcrypt via action)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add salt-like prefix for basic security
  return `chatx_${Math.abs(hash).toString(36)}_${password.length}`;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const AVATAR_COLORS = [
  '#E63946', '#2A9D8F', '#E9C46A', '#264653', '#F4A261',
  '#6A4C93', '#1982C4', '#8AC926', '#FF595E', '#6A0572'
];

export const register = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (args.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (args.displayName.length < 1) {
      throw new Error("Display name is required");
    }

    // Check if username exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("Username already taken");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username.toLowerCase(),
      passwordHash: simpleHash(args.password),
      displayName: args.displayName,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      lastSeen: Date.now(),
      isOnline: true,
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: Date.now(),
    });

    return { userId, token };
  },
});

export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (user.passwordHash !== simpleHash(args.password)) {
      throw new Error("Invalid username or password");
    }

    // Update online status
    await ctx.db.patch(user._id, {
      isOnline: true,
      lastSeen: Date.now(),
    });

    // Create new session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    return { userId: user._id, token };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      // Update user offline status
      await ctx.db.patch(session.userId, {
        isOnline: false,
        lastSeen: Date.now(),
      });
      await ctx.db.delete(session._id);
    }
  },
});

export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isOnline: user.isOnline,
    };
  },
});

export const updatePresence = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.patch(session.userId, {
        isOnline: true,
        lastSeen: Date.now(),
      });
    }
  },
});

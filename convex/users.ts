import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isOnline: user.isOnline && (now - user.lastSeen) < ONLINE_THRESHOLD,
      lastSeen: user.lastSeen,
    }));
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const now = Date.now();
    const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isOnline: user.isOnline && (now - user.lastSeen) < ONLINE_THRESHOLD,
      lastSeen: user.lastSeen,
    };
  },
});

export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    const users = await ctx.db
      .query("users")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();
    // Filter to only truly online users (active in last 2 minutes)
    return users
      .filter((user) => (now - user.lastSeen) < ONLINE_THRESHOLD)
      .map((user) => ({
        _id: user._id,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
      }));
  },
});

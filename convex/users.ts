import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  },
});

export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();
    return users.map((user) => ({
      _id: user._id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
    }));
  },
});

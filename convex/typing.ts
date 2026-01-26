import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_TIMEOUT = 3000; // 3 seconds

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const userIndicator = existing.find((i) => i.userId === args.userId);

    if (args.isTyping) {
      if (userIndicator) {
        // Update expiry
        await ctx.db.patch(userIndicator._id, {
          expiresAt: Date.now() + TYPING_TIMEOUT,
        });
      } else {
        // Create new indicator
        await ctx.db.insert("typingIndicators", {
          conversationId: args.conversationId,
          userId: args.userId,
          expiresAt: Date.now() + TYPING_TIMEOUT,
        });
      }
    } else {
      // Remove indicator
      if (userIndicator) {
        await ctx.db.delete(userIndicator._id);
      }
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const now = Date.now();
    const activeIndicators = indicators.filter(
      (i) => i.expiresAt > now && i.userId !== args.currentUserId
    );

    const typingUsers = await Promise.all(
      activeIndicators.map(async (i) => {
        const user = await ctx.db.get(i.userId);
        return user ? { _id: user._id, displayName: user.displayName } : null;
      })
    );

    return typingUsers.filter(Boolean);
  },
});

export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("typingIndicators")
      .withIndex("by_expiry")
      .collect();

    const now = Date.now();
    for (const indicator of expired) {
      if (indicator.expiresAt < now) {
        await ctx.db.delete(indicator._id);
      }
    }
  },
});

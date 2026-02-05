import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_MESSAGE_LIMIT } from "./constants";

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content.trim(),
      readBy: [args.senderId],
      createdAt: Date.now(),
    });

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    // Clear typing indicator
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const indicator of typingIndicators) {
      if (indicator.userId === args.senderId) {
        await ctx.db.delete(indicator._id);
      }
    }

    return messageId;
  },
});

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_MESSAGE_LIMIT;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(limit);

    // Enrich with sender info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: sender
            ? {
                _id: sender._id,
                displayName: sender.displayName,
                avatarColor: sender.avatarColor,
              }
            : null,
        };
      })
    );

    // Return in chronological order
    return enriched.reverse();
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      if (!msg.readBy.includes(args.userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, args.userId],
        });
      }
    }
  },
});

export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();
    const userConversations = conversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    let totalUnread = 0;
    for (const conv of userConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      totalUnread += messages.filter(
        (msg) => !msg.readBy.includes(args.userId) && msg.senderId !== args.userId
      ).length;
    }

    return totalUnread;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow sender to delete their own messages
    if (message.senderId !== args.userId) {
      throw new Error("You can only delete your own messages");
    }

    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});

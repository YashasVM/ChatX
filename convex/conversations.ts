import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ONLINE_THRESHOLD_MS } from "./constants";

export const create = mutation({
  args: {
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // For 1-on-1 chats, check if conversation already exists
    if (!args.isGroup && args.participants.length === 2) {
      const existing = await ctx.db.query("conversations").collect();
      const found = existing.find(
        (conv) =>
          !conv.isGroup &&
          conv.participants.length === 2 &&
          conv.participants.includes(args.participants[0]) &&
          conv.participants.includes(args.participants[1])
      );
      if (found) {
        return found._id;
      }
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: args.participants,
      isGroup: args.isGroup,
      groupName: args.groupName,
      createdBy: args.creatorId,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessage")
      .order("desc")
      .collect();

    // Filter to only conversations this user is part of
    const userConversations = conversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    // Enrich with participant info and last message
    const enriched = await Promise.all(
      userConversations.map(async (conv) => {
        const now = Date.now();
        const participants = await Promise.all(
          conv.participants.map(async (pid) => {
            const user = await ctx.db.get(pid);
            return user
              ? {
                  _id: user._id,
                  displayName: user.displayName,
                  avatarColor: user.avatarColor,
                  isOnline: user.isOnline && (now - user.lastSeen) < ONLINE_THRESHOLD_MS,
                }
              : null;
          })
        );

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        // Get unread count
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        const unreadCount = messages.filter(
          (msg) => !msg.readBy.includes(args.userId) && msg.senderId !== args.userId
        ).length;

        return {
          ...conv,
          participants: participants.filter(Boolean),
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    return enriched;
  },
});

export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;

    const now = Date.now();
    const participants = await Promise.all(
      conv.participants.map(async (pid) => {
        const user = await ctx.db.get(pid);
        return user
          ? {
              _id: user._id,
              displayName: user.displayName,
              avatarColor: user.avatarColor,
              isOnline: user.isOnline && (now - user.lastSeen) < ONLINE_THRESHOLD_MS,
            }
          : null;
      })
    );

    return {
      ...conv,
      participants: participants.filter(Boolean),
    };
  },
});

export const addParticipant = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (!conv.isGroup) throw new Error("Cannot add participants to direct messages");

    if (!conv.participants.includes(args.userId)) {
      await ctx.db.patch(args.conversationId, {
        participants: [...conv.participants, args.userId],
      });
    }
  },
});

export const removeParticipant = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    requesterId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (!conv.isGroup) throw new Error("Cannot remove participants from direct messages");

    // Only the group creator can remove others, or users can remove themselves
    if (args.requesterId !== conv.createdBy && args.requesterId !== args.userId) {
      throw new Error("Only the group creator can remove other participants");
    }

    if (conv.participants.includes(args.userId)) {
      const newParticipants = conv.participants.filter((p) => p !== args.userId);
      if (newParticipants.length < 2) {
        throw new Error("Group must have at least 2 participants");
      }
      await ctx.db.patch(args.conversationId, {
        participants: newParticipants,
      });
    }
  },
});

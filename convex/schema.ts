import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    displayName: v.string(),
    avatarColor: v.string(),
    lastSeen: v.number(),
    isOnline: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_online", ["isOnline"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupAvatar: v.optional(v.string()),
    createdBy: v.id("users"),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_lastMessage", ["lastMessageAt"])
    .index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    readBy: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_expiry", ["expiresAt"]),
});

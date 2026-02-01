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

  // Voice call tables
  activeCalls: defineTable({
    conversationId: v.id("conversations"),
    initiatorId: v.id("users"),
    participants: v.array(v.id("users")),
    status: v.string(), // "ringing" | "active" | "ended"
    callType: v.string(), // "1-on-1" | "group"
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_status", ["status"]),

  callSignals: defineTable({
    callId: v.id("activeCalls"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    signalType: v.string(), // "offer" | "answer" | "ice-candidate"
    signalData: v.string(), // JSON stringified WebRTC data
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_call_and_recipient", ["callId", "toUserId"])
    .index("by_expiry", ["expiresAt"]),
});

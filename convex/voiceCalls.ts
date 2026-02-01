import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SIGNAL_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Initiate a new voice call
export const initiateCall = mutation({
  args: {
    conversationId: v.id("conversations"),
    initiatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active call in this conversation
    const existingCall = await ctx.db
      .query("activeCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();

    if (existingCall) {
      throw new Error("Call already in progress");
    }

    // Get conversation to determine call type
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const callId = await ctx.db.insert("activeCalls", {
      conversationId: args.conversationId,
      initiatorId: args.initiatorId,
      participants: [args.initiatorId],
      status: "ringing",
      callType: conversation.isGroup ? "group" : "1-on-1",
      startedAt: Date.now(),
    });

    return callId;
  },
});

// Join/answer an existing call
export const joinCall = mutation({
  args: {
    callId: v.id("activeCalls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.status === "ended") {
      throw new Error("Call has ended");
    }

    if (!call.participants.includes(args.userId)) {
      await ctx.db.patch(args.callId, {
        participants: [...call.participants, args.userId],
        status: "active",
      });
    }
  },
});

// Leave a call
export const leaveCall = mutation({
  args: {
    callId: v.id("activeCalls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;

    const remainingParticipants = call.participants.filter((id) => id !== args.userId);

    if (remainingParticipants.length === 0 || call.callType === "1-on-1") {
      // Last person left or 1-on-1 call - end the call
      await ctx.db.patch(args.callId, {
        status: "ended",
        endedAt: Date.now(),
        participants: remainingParticipants,
      });
    } else {
      // Group call with remaining participants
      await ctx.db.patch(args.callId, {
        participants: remainingParticipants,
      });
    }
  },
});

// Decline an incoming call (for the receiver)
export const declineCall = mutation({
  args: {
    callId: v.id("activeCalls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;

    // For 1-on-1 calls, end the call when declined
    if (call.callType === "1-on-1") {
      await ctx.db.patch(args.callId, {
        status: "ended",
        endedAt: Date.now(),
      });
    }
    // For group calls, just don't join - no action needed
  },
});

// Send WebRTC signaling data
export const sendSignal = mutation({
  args: {
    callId: v.id("activeCalls"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    signalType: v.string(),
    signalData: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("callSignals", {
      callId: args.callId,
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      signalType: args.signalType,
      signalData: args.signalData,
      createdAt: Date.now(),
      expiresAt: Date.now() + SIGNAL_TIMEOUT,
    });
  },
});

// Get pending signals for a user in a call
export const getSignals = query({
  args: {
    callId: v.id("activeCalls"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("callSignals")
      .withIndex("by_call_and_recipient", (q) =>
        q.eq("callId", args.callId).eq("toUserId", args.userId)
      )
      .collect();

    const now = Date.now();
    return signals.filter((s) => s.expiresAt > now);
  },
});

// Delete a consumed signal
export const deleteSignal = mutation({
  args: {
    signalId: v.id("callSignals"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.signalId);
  },
});

// Get active call for a conversation
export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("activeCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();

    if (!call) return null;

    // Enrich with participant data
    const participants = await Promise.all(
      call.participants.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user
          ? {
              _id: user._id,
              displayName: user.displayName,
              avatarColor: user.avatarColor,
            }
          : null;
      })
    );

    // Get initiator info
    const initiator = await ctx.db.get(call.initiatorId);

    return {
      ...call,
      participants: participants.filter(Boolean),
      initiator: initiator
        ? {
            _id: initiator._id,
            displayName: initiator.displayName,
            avatarColor: initiator.avatarColor,
          }
        : null,
    };
  },
});

// Get call by ID
export const getCallById = query({
  args: {
    callId: v.id("activeCalls"),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return null;

    // Enrich with participant data
    const participants = await Promise.all(
      call.participants.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user
          ? {
              _id: user._id,
              displayName: user.displayName,
              avatarColor: user.avatarColor,
            }
          : null;
      })
    );

    const initiator = await ctx.db.get(call.initiatorId);

    return {
      ...call,
      participants: participants.filter(Boolean),
      initiator: initiator
        ? {
            _id: initiator._id,
            displayName: initiator.displayName,
            avatarColor: initiator.avatarColor,
          }
        : null,
    };
  },
});

// Check for incoming calls across all user's conversations
export const getIncomingCalls = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all conversations user is part of
    const conversations = await ctx.db.query("conversations").collect();
    const userConversations = conversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    // Find ringing calls where user is not yet a participant
    const incomingCalls = [];
    for (const conv of userConversations) {
      const call = await ctx.db
        .query("activeCalls")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .filter((q) => q.eq(q.field("status"), "ringing"))
        .first();

      if (call && !call.participants.includes(args.userId)) {
        const initiator = await ctx.db.get(call.initiatorId);
        incomingCalls.push({
          ...call,
          conversationId: conv._id,
          initiator: initiator
            ? {
                _id: initiator._id,
                displayName: initiator.displayName,
                avatarColor: initiator.avatarColor,
              }
            : null,
        });
      }
    }

    return incomingCalls;
  },
});

// Cleanup expired signals
export const cleanupExpiredSignals = mutation({
  args: {},
  handler: async (ctx) => {
    const signals = await ctx.db.query("callSignals").withIndex("by_expiry").collect();

    const now = Date.now();
    for (const signal of signals) {
      if (signal.expiresAt < now) {
        await ctx.db.delete(signal._id);
      }
    }
  },
});

// Cleanup stale calls (ringing for more than 60 seconds)
export const cleanupStaleCalls = mutation({
  args: {},
  handler: async (ctx) => {
    const calls = await ctx.db
      .query("activeCalls")
      .withIndex("by_status", (q) => q.eq("status", "ringing"))
      .collect();

    const now = Date.now();
    const CALL_TIMEOUT = 60 * 1000; // 60 seconds

    for (const call of calls) {
      if (now - call.startedAt > CALL_TIMEOUT) {
        await ctx.db.patch(call._id, {
          status: "ended",
          endedAt: now,
        });
      }
    }
  },
});

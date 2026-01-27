import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all data counts
    const users = await ctx.db.query("users").collect();
    const conversations = await ctx.db.query("conversations").collect();
    const messages = await ctx.db.query("messages").collect();
    const sessions = await ctx.db.query("sessions").collect();

    // Calculate stats
    const totalUsers = users.length;
    const onlineUsers = users.filter((u) => u.isOnline).length;
    const totalConversations = conversations.length;
    const groupChats = conversations.filter((c) => c.isGroup).length;
    const directChats = totalConversations - groupChats;
    const totalMessages = messages.length;
    const activeSessions = sessions.length;

    // Messages per day (last 7 days)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const messagesPerDay: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const count = messages.filter(
        (m) => m.createdAt >= dayStart && m.createdAt < dayEnd
      ).length;
      const date = new Date(dayStart).toLocaleDateString("en-US", {
        weekday: "short",
      });
      messagesPerDay.push({ date, count });
    }

    // Messages per conversation (top 5)
    const conversationMessageCounts: { name: string; count: number }[] = [];
    for (const conv of conversations.slice(0, 5)) {
      const count = messages.filter(
        (m) => m.conversationId === conv._id
      ).length;
      const name = conv.isGroup
        ? conv.groupName || "Group"
        : `Chat ${conv._id.slice(-4)}`;
      conversationMessageCounts.push({ name, count });
    }

    // User activity (messages per user)
    const userMessageCounts: { name: string; count: number }[] = [];
    for (const user of users) {
      const count = messages.filter((m) => m.senderId === user._id).length;
      userMessageCounts.push({ name: user.displayName, count });
    }
    userMessageCounts.sort((a, b) => b.count - a.count);

    // Convex limits info (estimates based on free tier)
    const convexLimits = {
      database: {
        used: totalMessages + totalUsers + totalConversations + activeSessions,
        limit: 1000000, // 1M documents free tier estimate
        label: "Documents",
      },
      bandwidth: {
        used: totalMessages * 0.5, // Rough KB estimate
        limit: 1000000, // 1GB in KB
        label: "Bandwidth (KB)",
      },
      functions: {
        used: messages.length * 2, // Rough function call estimate
        limit: 1000000,
        label: "Function Calls",
      },
    };

    return {
      totalUsers,
      onlineUsers,
      totalConversations,
      groupChats,
      directChats,
      totalMessages,
      activeSessions,
      messagesPerDay,
      conversationMessageCounts,
      userMessageCounts: userMessageCounts.slice(0, 5),
      convexLimits,
    };
  },
});

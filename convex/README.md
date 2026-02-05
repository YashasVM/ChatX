# ChatX - Convex Backend

This directory contains all the Convex serverless functions for the ChatX messaging application.

## Structure

| File | Description |
|------|-------------|
| `schema.ts` | Database schema definitions for all tables |
| `auth.ts` | Authentication functions (login, register, logout, session management) |
| `messages.ts` | Message CRUD operations and read receipts |
| `conversations.ts` | Conversation management (create, list, participants) |
| `typing.ts` | Real-time typing indicators |
| `voiceCalls.ts` | WebRTC voice/video call signaling |
| `users.ts` | User queries and online status |
| `constants.ts` | Shared configuration constants |
| `admin.ts` | Admin utilities |

## Database Tables

- **users** - User accounts with authentication
- **sessions** - Active login sessions
- **conversations** - Chat threads (1-on-1 and groups)
- **messages** - Chat messages with read receipts
- **typingIndicators** - Real-time typing status
- **activeCalls** - Voice/video call sessions
- **callSignals** - WebRTC signaling data

## Usage

### Development

```bash
npx convex dev
```

### Deployment

```bash
npx convex deploy
```

## Documentation

For more information about Convex:
- [Convex Documentation](https://docs.convex.dev)
- [Convex Functions](https://docs.convex.dev/functions)
- [Database Reading](https://docs.convex.dev/database/reading-data)
- [Database Writing](https://docs.convex.dev/database/writing-data)

---

<p align="center">
  <b>Made by @Yashas.VM</b><br>
  <i>Co-Powered by Claude</i>
</p>

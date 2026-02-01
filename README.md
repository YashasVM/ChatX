# ChatX

A secure, real-time messaging application with a Bauhaus-inspired minimal design. Built for small teams and personal use with full message sync between web and Android.

## Features

- **Real-time Messaging** - Instant message delivery with live updates
- **Voice Calls** - Free peer-to-peer voice calling (1-on-1 and group calls)
- **Typing Indicators** - See when others are typing
- **Online/Offline Status** - Know who's available
- **Read Receipts** - Message delivery confirmation
- **Group Chats** - Create groups with multiple participants
- **1-on-1 Chats** - Private direct messaging
- **Cross-Platform Sync** - Messages sync between web and Android app
- **PWA Support** - Install as an app on any device
- **Native Android App** - Full Android APK available
- **Secure Authentication** - Username/password login with session tokens

## Voice Calling

ChatX now supports free voice calling using WebRTC:

- **1-on-1 Calls** - Private voice calls between two users
- **Group Calls** - Voice calls with up to 6 participants (mesh topology)
- **Mute/Unmute** - Toggle your microphone during calls
- **Call Notifications** - Real-time incoming call alerts
- **No Server Costs** - Peer-to-peer connections using free Google STUN servers

### How it works

1. Click the phone icon in any conversation header
2. The other user(s) will see an incoming call notification
3. Accept or decline the call
4. Voice is transmitted directly between browsers (P2P)
5. Click the red end button to hang up

**Note:** Voice calls require microphone permissions. Works best on modern browsers (Chrome, Firefox, Edge, Safari).

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Backend
- **Convex** - Real-time database with serverless functions
- **Session-based Auth** - Secure token authentication

### Mobile
- **Capacitor** - Native Android app wrapper
- **PWA** - Progressive Web App for cross-platform support

### Hosting
- **Cloudflare Pages** - Frontend hosting (free tier)
- **Convex Cloud** - Backend hosting

## Design System

Bauhaus-inspired minimal design with:

| Color | Hex | Usage |
|-------|-----|-------|
| Cream | `#FAF8F5` | Background |
| Charcoal | `#1a1a1a` | Text, primary buttons |
| Red | `#E63946` | Accent, notifications |
| Gray | `#6B7280` | Secondary text |

**Font:** Space Grotesk

## Project Structure

```
ChatX/
├── convex/                 # Backend (Convex)
│   ├── schema.ts           # Database schema
│   ├── auth.ts             # Authentication functions
│   ├── messages.ts         # Message CRUD operations
│   ├── conversations.ts    # Conversation management
│   ├── typing.ts           # Typing indicators
│   ├── voiceCalls.ts       # Voice call signaling
│   └── users.ts            # User queries
├── src/
│   ├── components/         # React components
│   │   ├── ChatLayout.tsx  # Main layout
│   │   ├── ChatView.tsx    # Message view
│   │   ├── Sidebar.tsx     # Conversation list
│   │   ├── LoginPage.tsx   # Authentication UI
│   │   ├── VoiceCallModal.tsx    # Active call UI
│   │   ├── IncomingCallModal.tsx # Incoming call notification
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Auth state management
│   │   ├── ChatContext.tsx # Chat state management
│   │   └── VoiceCallContext.tsx  # Voice call state
│   ├── hooks/              # Custom React hooks
│   │   └── useWebRTC.ts    # WebRTC connection management
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles & theme
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── chatx-logo.svg      # App logo
├── App-files/              # Android app files
│   └── ChatX.apk           # Android installer
└── index.html
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex Backend

Create a Convex account at https://convex.dev, then:

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new project
- Generate the `convex/_generated` folder
- Create `.env.local` with your `VITE_CONVEX_URL`

### 3. Run Development Server

Run both frontend and backend together:

```bash
npm run dev:all
```

Or separately:

```bash
# Terminal 1 - Convex backend
npm run dev:backend

# Terminal 2 - Vite frontend
npm run dev
```

### 4. Open the App

Visit http://localhost:5173

## Deployment

### Deploy Backend (Convex)

```bash
npx convex deploy
```

### Deploy Frontend (Cloudflare Pages)

1. Build the project:
   ```bash
   set VITE_CONVEX_URL=https://your-project.convex.cloud
   npm run build
   ```

2. Upload the `dist/` folder to Cloudflare Pages

3. Set environment variable in Cloudflare:
   - `VITE_CONVEX_URL` = your Convex production URL

## Android App

### Install from APK

1. Download `ChatX.apk` from the `App-files/` folder
2. Transfer to your Android device
3. Enable "Install from unknown sources" if prompted
4. Install and open the app

### Build from Source

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build APK (requires Android Studio)
cd android
./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

## PWA Installation

### Android (Chrome)
1. Open the web app in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"

### iOS (Safari)
1. Open the web app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## License

MIT

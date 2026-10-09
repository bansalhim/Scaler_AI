# Signal AI Chat Application

A full-stack, real-time messaging application inspired by Signal, featuring instant bidirectional chat, automated contact replies, live typing indicators, image uploads, and customizable conversations.

## 🚀 Live Demo
- **Frontend (Vercel):** [https://scaler-ai-ivory.vercel.app](https://scaler-ai-ivory.vercel.app)
- **Backend API (Render):** Hosted via Render (Access `/docs` for Swagger UI documentation)

## ✨ Features
- ⚡ **Real-Time WebSockets:** Instant message delivery and status updates with automatic reconnect handling.
- 💬 **Bot Auto-Replies:** Simulated automated responses and dynamic live typing indicators (`...is typing`).
- 📸 **Media Attachments:** Support for uploading image files with instant inline chat previews.
- 📌 **Read Receipts & Timestamps:** Real-time delivered double-check indicators (✓✓) and formatted message timestamps.
- ➕ **Direct Message Creation:** Start new direct message channels dynamically via modal dialogs.
- 😀 **Interactive Emoji Palette:** Integrated quick-insert emoji drawer for expressiveness.
- 🔒 **E2E Visual Design:** High-fidelity Signal dark mode styled using Tailwind CSS and Lucide icons.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Protocol:** WebSockets & REST API

### Backend
- **Framework:** FastAPI (Python 3.12)
- **Database:** SQLite with SQLAlchemy ORM
- **Real-Time Engine:** WebSockets (`ConnectionManager`)
- **File Uploads:** `python-multipart` with static directory serving

## 📁 Project Structure
```text
Scaler_AI/
├── backend/
│   ├── main.py              # FastAPI application, WebSocket handlers & REST routes
│   ├── database.py          # SQLite database connection setup
│   ├── models.py            # SQLAlchemy models (User, Conversation, Message)
│   ├── requirements.txt     # Python backend dependencies
│   ├── seed.py              # Database seeding script
│   ├── signal.db            # SQLite database file
│   └── uploads/             # Static file storage directory for images
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── signal/
    │   │       └── SignalApp.tsx  # Main UI, WebSocket client & chat state management
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts

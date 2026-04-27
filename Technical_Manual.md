# UBEP Technical Manual (Developer Guide)
**Version 1.1 (Updated April 2026)**

## 1. Project Overview
The Used Book Exchange Portal (UBEP) is a community-driven full-stack platform for sharing and trading books. This manual provides technical details for developers to maintain and extend the system.

## 2. System Architecture
- **Backend**: Node.js & Express.js.
- **Database**: PostgreSQL (Relational) with auto-migration support.
- **Real-time**: Socket.io for P2P messaging.
- **Frontend**: Vanilla JS Single Page Application (SPA).
- **File Storage**: Local filesystem storage with Multer.

## 3. Directory Structure
```text
Yank-UBE/
├── public/                 # Static Assets & Frontend
│   ├── uploads/            # User-uploaded book covers (git-ignored)
│   ├── index.html          # SPA Entry Point
│   ├── ember.js            # Core Frontend Logic & Socket Client
│   └── ember.css           # Global Styles & Landing Page Design
├── server.js               # Main Server (API, Sockets, DB Migrations)
├── Dockerfile              # Production Build Config
├── docker-compose.yml      # Orchestration (App + DB)
├── .env                    # Local Environment Config (git-ignored)
└── package.json            # NPM Scripts & Dependencies
```

## 4. Database Schema & Initialization
### Schema Details
- **Users**: Stores profile data, phone numbers, and `roles` ('user' or 'admin').
- **Books**: Stores listings with `image` paths and `owner_id`.
- **Exchanges**: Tracks trade requests between users.
- **Messages**: Stores chat history between users.

### Auto-Initialization (`initDb`)
Upon server start, the system:
1.  Creates all tables if they do not exist.
2.  Ensures the `roles` column exists in the `users` table via `ADD COLUMN IF NOT EXISTS`.
3.  **Seeding**: Checks for `admin@ubep.com`. If missing, it creates the default admin (`admin123`).
4.  Seeds demo users (`alex@ubep.com`, `jamie@ubep.com`) if the table is empty.

## 5. Media Handling (Image Uploads)
UBEP uses **Multer** for handling book cover uploads:
- **Restriction**: Only `.jpg`, `.jpeg`, and `.png` are accepted.
- **Storage**: Files are saved to `public/uploads/` with a unique name (`Date.now() + random_suffix`).
- **DB Record**: The `books` table stores the relative URL (e.g., `/uploads/image.png`).

## 6. API Reference
### Authentication
- `POST /api/users`: Registration (Multipart support for potential future avatars, currently JSON).
- `POST /api/login`: Returns User object on success.

### Book Management
- `POST /api/books`: **Requires Multipart/Form-Data**. Fields: `title`, `author`, `category`, `condition`, `price`, `ownerId`. File field: `image`.
- `GET /api/books`: Returns all available books.

### Admin Tools
- `GET /api/admin/stats`: Returns JSON with total users, books, and exchanges.
- `GET /api/admin/users`: Returns list of all registered users (Admin only).

## 7. Real-time Messaging (WebSockets)
- **Room Strategy**: Every user joins a private room named `user_{id}`.
- **Flow**: When a message is sent, the server saves it to the DB and emits it to both the sender and receiver rooms using `io.to()`.

## 8. Frontend Navigation Logic
- **Landing Page**: Controlled by `showLoginScreen()`. Navigation links are hidden.
- **Main App**: Controlled by `renderCurrentView()`. Navigation tabs are revealed after `currentUser` session is established.
- **State Management**: Uses `localStorage` for session persistence.

## 9. Setup & Deployment
### Docker (Recommended)
```bash
docker-compose down -v  # Wipe old volumes if schema changed
docker-compose up --build
```
- **Port**: 9000
- **Admin**: `admin@ubep.com` / `admin123`

### Manual Run
1. Setup PostgreSQL database `ubep`.
2. Configure `.env` with `DATABASE_URL`.
3. `npm install`
4. `npm start`
- **Port**: 3000

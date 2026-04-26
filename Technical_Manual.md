# UBEP Technical Manual (Developer Guide)
**Version 1.0**

## 1. Project Overview
The Used Book Exchange Portal (UBEP) is a full-stack application built to facilitate book trading and sales. It follows a client-server architecture with real-time capabilities.

## 2. System Architecture
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL (Relational)
- **Real-time**: Socket.io (WebSockets)
- **Frontend**: Vanilla JS (Modular ES6), CSS3, HTML5

## 3. Directory Structure
```text
Yank-UBE/
├── public/                 # Static frontend files
│   ├── index.html          # Main SPA container
│   ├── ember.js            # Frontend logic (API & Sockets)
│   └── ember.css           # Global styles & variables
├── server.js               # Express server, API, & DB Init
├── Dockerfile              # App containerization
├── docker-compose.yml      # Multi-container orchestration (App + Postgres)
└── package.json            # Dependencies & Scripts
```

## 4. Database Schema
### Users Table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | SERIAL | Primary Key |
| name | VARCHAR(100) | Full Name |
| email | VARCHAR(100) | Unique Email |
| phone | VARCHAR(20) | Contact Number |
| password | VARCHAR(255) | Bcrypt Hashed Password |
| roles | VARCHAR(20) | 'user' or 'admin' |

### Books Table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | SERIAL | Primary Key |
| title | VARCHAR(255) | Book Title |
| author | VARCHAR(255) | Author Name |
| category | VARCHAR(100) | e.g., 'Fiction', 'Tech' |
| condition | VARCHAR(100) | e.g., 'Good', 'New' |
| price | INTEGER | Sale price |
| status | VARCHAR(20) | 'available', 'sold', 'exchanged' |
| owner_id | INTEGER | FK to Users(id) |

### Exchanges Table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | SERIAL | Primary Key |
| from_user_id | INTEGER | Initiator (FK) |
| to_user_id | INTEGER | Receiver (FK) |
| offered_book_id | INTEGER | Book offered by initiator (FK) |
| requested_book_id | INTEGER | Book requested (FK) |
| status | VARCHAR(20) | 'pending', 'accepted', 'rejected' |

## 5. API Reference
### Authentication
- `POST /api/users`: Register new user. Payload: `{name, email, phone, password}`.
- `POST /api/login`: Authenticate user. Payload: `{email, password}`.

### Books
- `GET /api/books`: Fetch all books with owner info.
- `POST /api/books`: List new book. Payload: `{title, author, category, condition, price, ownerId, image}`.
- `DELETE /api/books/:id`: Remove listing.

### Messaging & Exchanges
- `GET /api/messages/:userId`: History for a user.
- `POST /api/exchanges`: Propose exchange. Payload: `{fromUserId, toUserId, offeredBookId, requestedBookId}`.

## 6. Socket.io Integration
The server listens for `join` and `send_message` events.
- **Join**: Associates a socket with a user ID room (`user_{userId}`).
- **Send Message**: Stores the message in DB and emits `receive_message` to both sender and receiver rooms.

## 7. Setup & Development
1. Clone repo.
2. Ensure Docker Desktop is running.
3. Run `docker-compose up --build`.
4. Access at `http://localhost:9000`.

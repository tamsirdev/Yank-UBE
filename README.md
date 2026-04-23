# UBEP | Used Book Exchange Portal

UBEP is a full-stack platform designed to facilitate the sharing, selling, and exchanging of used books within a community. It allows users to list their own books, browse a common marketplace, and interact with other book enthusiasts.

---

## 🚀 Features

- **Secure User Authentication**: Sign-up and login with **BCrypt password hashing**.
- **User Roles**: Separate roles for **Regular Users** and **Administrators**.
- **Admin Panel**: Dedicated dashboard for monitoring system statistics (Users, Books, Exchanges).
- **Book Marketplace**: Browse books with search and category filtering.
- **Personal Dashboard**: Manage listings, update book status (Available, Sold, Exchanged).
- **Real-time Messaging**: Instant chat powered by **Socket.io**.
- **Exchange System**: Propose and track book-for-book exchange requests.
- **Responsive UI**: Modern interface with color-coded status badges and dynamic navigation.

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Modular logic).
- **Backend**: Node.js, Express.js, **Socket.io**.
- **Database**: PostgreSQL (Relational persistence).
- **Security**: BCryptJS for password encryption.
- **Containerization**: Docker & Docker Compose.
- **Remote Access**: Cloudflare Tunnel & GitHub Pages.

---

## 📁 Project Structure

```text
Yank-UBE/
├── public/                 # Static frontend files
│   ├── index.html          # Main application entry point
│   ├── ember.js            # Frontend logic & API communication
│   ├── ember.css           # Custom styling & SRS badges
│   └── *.jpg               # Product/Book images
├── server.js               # Node.js/Express backend, Socket.io & DB initialization
├── Dockerfile              # Docker image configuration for the Node.js app
├── docker-compose.yml      # Orchestrates the App and PostgreSQL database
├── package.json            # Node.js dependencies (express, pg, socket.io, bcryptjs)
├── README.md               # Project documentation
└── .dockerignore           # Files excluded from the Docker build
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### Running the App
1. **Clone the repository**:
   ```bash
   git clone https://github.com/tamsirdev/Yank-UBE.git
   cd Yank-UBE
   ```

2. **Start the application**:
   Use Docker Compose to launch both the web server and the PostgreSQL database:
   ```bash
   docker-compose up --build
   ```

3. **Access the app**:
   Open your browser and navigate to:
   [http://localhost:9000](http://localhost:9000)

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ubep.com` | `admin123` |
| **Demo User** | `alex@ubep.com` | `123` |

---

## 🌐 Remote Access & Deployment

### 1. Static Frontend (GitHub Pages)
- **Live URL**: [https://tamsirdev.github.io/Yank-UBE/](https://tamsirdev.github.io/Yank-UBE/)
- *Note: Uses `localStorage` for simplified static demonstration.*

### 2. Full-Stack Remote Access (Cloudflare Tunnel)
- **Tunnel URL**: `https://connected-visitor-reduced-recipes.trycloudflare.com`

---

## 📄 License
This project was developed as part of a Capstone project by **Yankuba Fabureh**.

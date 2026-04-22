# UBEP | Used Book Exchange Portal

UBEP is a full-stack platform designed to facilitate the sharing, selling, and exchanging of used books within a community. It allows users to list their own books, browse a common marketplace, and interact with other book enthusiasts.

---

## 🚀 Features

- **User Authentication**: Secure sign-up and login functionality.
- **Book Marketplace**: Browse books listed by other users with search and category filtering.
- **Personal Dashboard**: Manage your own book listings and track exchange requests.
- **Exchange System**: Propose book-for-book exchanges with other users.
- **Direct Messaging**: Connect with sellers and exchangers through an integrated chat system.
- **Responsive UI**: Clean, modern interface designed for both desktop and mobile use.

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3 (Custom styles), JavaScript (Ember-inspired modular logic).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL.
- **Containerization**: Docker & Docker Compose.
- **Deployment**: GitHub Pages (Static Frontend) & Cloudflare Tunnel (Remote Access).

---

## 📁 Project Structure

```text
Yank-UBE/
├── public/                 # Static frontend files
│   ├── index.html          # Main application entry point
│   ├── ember.js            # Frontend logic & API communication
│   ├── ember.css           # Custom styling
│   └── *.jpg               # Product/Book images
├── server.js               # Node.js/Express backend & DB initialization
├── Dockerfile              # Docker image configuration for the Node.js app
├── docker-compose.yml      # Orchestrates the App and PostgreSQL database
├── package.json            # Node.js dependencies and scripts
└── .dockerignore           # Files excluded from the Docker build
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine.

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

## 🌐 Remote Access & Deployment

### 1. Static Frontend (GitHub Pages)
The frontend is deployed to GitHub Pages for fast, free static hosting.
- **Live URL**: [https://tamsirdev.github.io/Yank-UBE/](https://tamsirdev.github.io/Yank-UBE/)
- *Note: The static version uses `localStorage` for data persistence as it lacks a live backend.*

### 2. Full-Stack Remote Access (Cloudflare Tunnel)
To allow remote users to access the full-stack version (Node.js + Postgres) running on your local machine:
- **Tunnel URL**: `https://connected-visitor-reduced-recipes.trycloudflare.com`

---

## 🔌 API Endpoints (Brief)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | `POST` | Create a new user account |
| `/api/login` | `POST` | Authenticate user and start session |
| `/api/books` | `GET` | Retrieve all available books |
| `/api/books` | `POST` | List a new book for sale/exchange |
| `/api/books/:id` | `DELETE` | Remove a book listing |

---

## 📄 License
This project was developed as part of a Capstone project by **Yankuba Fabureh**.

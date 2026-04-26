# UBEP Manual Installation Guide (Non-Docker)

This guide provides step-by-step instructions to install and run the **Used Book Exchange Portal (UBEP)** on your local machine without using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:
1.  **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2.  **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
3.  **Git** - [Download here](https://git-scm.com/)

---

## Step 1: Clone the Repository

Open your terminal or command prompt and run:
```bash
git clone https://github.com/tamsirdev/Yank-UBE.git
cd Yank-UBE
```

## Step 2: Install Dependencies

Install the required Node.js packages:
```bash
npm install
```

## Step 3: Database Setup

1.  Open your PostgreSQL administration tool (like **pgAdmin** or the **psql** CLI).
2.  Create a new database named `ubep`:
    ```sql
    CREATE DATABASE ubep;
    ```
3.  Create a user (if you don't want to use the default `postgres` user):
    ```sql
    CREATE USER ube_user WITH PASSWORD 'your_secure_password';
    GRANT ALL PRIVILEGES ON DATABASE ubep TO ube_user;
    ```

## Step 4: Configure Environment Variables

1.  Create a file named `.env` in the root directory of the project.
2.  Add the following configuration, replacing the placeholders with your database credentials:
    ```env
    PORT=9000
    DATABASE_URL=postgres://ube_user:your_secure_password@localhost:5432/ubep
    ```
    *Note: If you are using the default postgres user, the URL might look like: `postgres://postgres:mypassword@localhost:5432/ubep`*

## Step 5: Initialize the Application

The application is designed to automatically create the necessary tables and seed initial data upon the first run.

Start the server:
```bash
npm start
```

You should see the following output in your terminal:
```text
Database initialized
Server running on port 9000
```

## Step 6: Access the Portal

Open your web browser and navigate to:
**[http://localhost:9000](http://localhost:9000)**

---

## Troubleshooting

### 1. "roles" column error
If you previously ran an older version of the app, the system will automatically attempt to add the `roles` column. If it fails, run this SQL command manually:
```sql
ALTER TABLE users ADD COLUMN roles VARCHAR(20) DEFAULT 'user';
```

### 2. Image Uploads
Ensure the `public/uploads` folder exists and has write permissions. The server will attempt to create it automatically, but on some systems (Windows), you might need to create it manually if you see upload errors.

### 3. Database Connection Failed
Double-check your `DATABASE_URL` in the `.env` file. Ensure the PostgreSQL service is running on your machine.

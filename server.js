require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// --- Multer Storage Setup ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .jpeg, .jpg and .png files are allowed!'));
  }
});

const io = new Server(server,  {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 9000;

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Socket.io Real-time Messaging ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;
    try {
      const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3) RETURNING *',
        [senderId, receiverId, text]
      );
      const newMessage = result.rows[0];
      io.to(`user_${receiverId}`).emit('receive_message', newMessage);
      io.to(`user_${senderId}`).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// --- API Endpoints ---

// Books
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT books.*, users.name as owner_name FROM books JOIN users ON books.owner_id = users.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', upload.single('image'), async (req, res) => {
  const { title, author, category, condition, price, ownerId } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!imagePath) {
    return res.status(400).json({ error: 'Book image is required and must be jpeg, jpg or png' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, category, condition, price, owner_id, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, author, category, condition, price, ownerId, imagePath]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/books/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE books SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        delete user.password;
        res.json(user);
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, roles',
      [name, email, phone, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT m.*, u_from.name as sender_name, u_to.name as receiver_name FROM messages m JOIN users u_from ON m.sender_id = u_from.id JOIN users u_to ON m.receiver_id = u_to.id WHERE m.sender_id = $1 OR m.receiver_id = $1 ORDER BY m.created_at ASC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exchanges
app.get('/api/exchanges/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, b_offered.title as offered_title, b_requested.title as requested_title 
       FROM exchanges e 
       JOIN books b_offered ON e.offered_book_id = b_offered.id 
       JOIN books b_requested ON e.requested_book_id = b_requested.id 
       WHERE e.from_user_id = $1 OR e.to_user_id = $1`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exchanges', async (req, res) => {
  const { fromUserId, toUserId, offeredBookId, requestedBookId } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO exchanges (from_user_id, to_user_id, offered_book_id, requested_book_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [fromUserId, toUserId, offeredBookId, requestedBookId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, roles FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const bookCount = await pool.query('SELECT COUNT(*) FROM books');
    const exchangeCount = await pool.query('SELECT COUNT(*) FROM exchanges');
    res.json({
      users: userCount.rows[0].count,
      books: bookCount.rows[0].count,
      exchanges: exchangeCount.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Database
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255),
        roles VARCHAR(20) DEFAULT 'user'
      );
      -- Ensure roles column exists if table was created without it
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='roles') THEN 
          ALTER TABLE users ADD COLUMN roles VARCHAR(20) DEFAULT 'user'; 
        END IF; 
      END $$;
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255),
        category VARCHAR(100),
        condition VARCHAR(100),
        price INTEGER,
        status VARCHAR(20) DEFAULT 'available',
        owner_id INTEGER REFERENCES users(id),
        image TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE
      );
      CREATE TABLE IF NOT EXISTS exchanges (
        id SERIAL PRIMARY KEY,
        from_user_id INTEGER REFERENCES users(id),
        to_user_id INTEGER REFERENCES users(id),
        offered_book_id INTEGER REFERENCES books(id),
        requested_book_id INTEGER REFERENCES books(id),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed Users
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(usersCount.rows[0].count) === 0) {
      console.log('Seeding initial users...');
      const adminPass = await bcrypt.hash('admin123', 10);
      const userPass = await bcrypt.hash('123', 10);
      
      await pool.query(
        "INSERT INTO users (name, email, password, roles) VALUES ($1, $2, $3, $4)",
        ['Admin User', 'admin@ubep.com', adminPass, 'admin']
      );
      await pool.query(
        "INSERT INTO users (name, email, password, roles) VALUES ($1, $2, $3, $4)",
        ['Alex Reader', 'alex@ubep.com', userPass, 'user']
      );
      await pool.query(
        "INSERT INTO users (name, email, password, roles) VALUES ($1, $2, $3, $4)",
        ['Jamie Bookworm', 'jamie@ubep.com', userPass, 'user']
      );
    }

    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed', err);
  }
}

initDb().then(() => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

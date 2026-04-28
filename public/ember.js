/* ember.js - UBEP Core Logic | Backend API Integration */

const API_URL = ''; // Relative to origin
let socket = null;

function initSocket(userId) {
  if (socket) socket.disconnect();
  socket = io();
  socket.emit('join', userId);
  socket.on('receive_message', (msg) => {
    showToast(`New message from user ${msg.sender_id}`);
    if (window.location.hash === '#messages') renderMessages();
  });
}

// ========== HELPERS ==========
async function apiFetch(endpoint, options = {}) {
  // Check session timeout before each call
  if (currentUser) {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session && (Date.now() - session.loginTimestamp > SESSION_TIMEOUT_MS)) {
      clearSession();
      showToast('Session expired. Please login again.', true);
      renderCurrentView();
      throw new Error('Session expired');
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data;
  } catch (err) {
    showToast(err.message, true);
    throw err;
  }
}


let currentUser = null;
const SESSION_KEY = 'ubep_session';
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSession() { 
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (session && session.loginTimestamp) {
    const isExpired = (Date.now() - session.loginTimestamp) > SESSION_TIMEOUT_MS;
    if (isExpired) {
      clearSession();
      return null;
    }
    return session;
  }
  return null;
}

function setSession(user) { 
  if (user) {
    user.loginTimestamp = Date.now();
    initSocket(user.id);
  }
  currentUser = user; 
  localStorage.setItem(SESSION_KEY, JSON.stringify(user)); 
}
function clearSession() { localStorage.removeItem(SESSION_KEY); currentUser = null; }

function showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = isError ? '#E07A5F' : '#3D405B';
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ========== LANDING & LOGIN UI ==========
function showLoginScreen() {
  const root = document.getElementById('appRoot');
  root.innerHTML = `
    <div class="landing-hero">
      <div class="hero-content">
        <i class="fas fa-book-open" style="font-size: 4rem; color: #E07A5F; margin-bottom: 1.5rem;"></i>
        <h1>Used Book Exchange Portal</h1>
        <p class="hero-tagline">Join thousands of readers swapping, selling, and discovering books sustainably.</p>
        
        <div class="landing-grid">
          <div class="landing-feature">
            <i class="fas fa-exchange-alt"></i>
            <h3>Easy Exchange</h3>
            <p>Swap books you've read for ones you want.</p>
          </div>
          <div class="landing-feature">
            <i class="fas fa-dollar-sign"></i>
            <h3>Save Money</h3>
            <p>Buy second-hand books at a fraction of the cost.</p>
          </div>
          <div class="landing-feature">
            <i class="fas fa-leaf"></i>
            <h3>Stay Green</h3>
            <p>Help the environment by reusing and recycling.</p>
          </div>
        </div>
      </div>
      
      <div class="auth-section">
        <div class="card auth-card">
          <h2 id="authTitle">Welcome Back</h2>
          <p id="authSubtitle" style="color: #5a5d7a; margin-bottom: 1.5rem;">Please login to your account</p>
          <div id="authForm"></div>
        </div>
      </div>
    </div>
  `;
  
  const loginHtml = `
    <form id="loginForm">
      <input type="email" id="loginEmail" class="input" placeholder="Email" style="margin-bottom: 1rem;" required>
      <input type="password" id="loginPass" class="input" placeholder="Password" style="margin-bottom: 1rem;" required>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
    </form>
    <div style="text-align: right; margin-top: 0.5rem;">
      <a href="#" id="forgotPassBtn" style="font-size: 0.85rem; color: var(--warm); text-decoration: none;">Forgot Password?</a>
    </div>
    <div style="margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">Don't have an account?</p>
      <button id="showSignupBtn" class="btn btn-outline" style="width: 100%;">Create Account</button>
    </div>
  `;
  
  const signupHtml = `
    <form id="signupForm">
      <input id="signupName" class="input" placeholder="Full Name" style="margin-bottom: 1rem;" required>
      <input type="email" id="signupEmail" class="input" placeholder="Email" style="margin-bottom: 1rem;" required>
      <input id="signupPhone" class="input" placeholder="Phone Number" style="margin-bottom: 1rem;" required>
      <input type="password" id="signupPass" class="input" placeholder="Password" style="margin-bottom: 1rem;" required>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
    </form>
    <div style="margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">Already have an account?</p>
      <button id="showLoginBtn" class="btn btn-outline" style="width: 100%;">Back to Login</button>
    </div>
  `;
  
  const container = document.getElementById('authForm');
  container.innerHTML = loginHtml;
  
  function showForgotPasswordScreen() {
    document.getElementById('authTitle').innerText = 'Reset Password';
    document.getElementById('authSubtitle').innerText = 'Enter your email to receive a reset link';
    container.innerHTML = `
      <form id="forgotForm">
        <input type="email" id="forgotEmail" class="input" placeholder="Registered Email" style="margin-bottom: 1rem;" required>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Get Reset Link</button>
      </form>
      <button id="backToLoginFromForgot" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Back to Login</button>
    `;

    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value;
      try {
        const res = await apiFetch('/api/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        showToast(res.message);
        container.innerHTML = `<p style="padding: 1rem; color: #2d3748; background: #ebf8ff; border-radius: 8px;">Check the server console for the reset link (simulating email send).</p>
        <button onclick="location.reload()" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Back to Login</button>`;
      } catch(e) {}
    });

    document.getElementById('backToLoginFromForgot').addEventListener('click', () => {
      document.getElementById('authTitle').innerText = 'Welcome Back';
      document.getElementById('authSubtitle').innerText = 'Please login to your account';
      container.innerHTML = loginHtml;
      attachLogin();
    });
  }

  function showResetPasswordScreen(token) {
    const root = document.getElementById('appRoot');
    root.innerHTML = `
      <div style="max-width: 450px; margin: 5rem auto;">
        <div class="card auth-card">
          <h2>New Password</h2>
          <p style="margin-bottom: 1.5rem;">Enter your new secure password</p>
          <form id="resetForm">
            <input type="password" id="newPass" class="input" placeholder="New Password" style="margin-bottom: 1rem;" required>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Update Password</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('resetForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('newPass').value;
      try {
        const res = await apiFetch('/api/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword })
        });
        showToast(res.message);
        window.location.hash = '';
        location.reload();
      } catch(e) {}
    });
  }

  function attachLogin() {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPass').value;
      try {
        const user = await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setSession(user);
        showToast(`Welcome ${user.name}`);
        renderCurrentView();
      } catch (e) {}
    });

    document.getElementById('forgotPassBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordScreen();
    });

    document.getElementById('showSignupBtn')?.addEventListener('click', () => {
      document.getElementById('authTitle').innerText = 'Join UBEP';
      document.getElementById('authSubtitle').innerText = 'Start your reading journey today';
      container.innerHTML = signupHtml;
      attachSignup();
    });
  }
  
  function attachSignup() {
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const phone = document.getElementById('signupPhone').value;
      const password = document.getElementById('signupPass').value;
      try {
        const user = await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, password }),
        });
        setSession(user);
        showToast(`Welcome ${name}!`);
        renderCurrentView();
      } catch (e) {}
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', () => {
      document.getElementById('authTitle').innerText = 'Welcome Back';
      document.getElementById('authSubtitle').innerText = 'Please login to your account';
      container.innerHTML = loginHtml;
      attachLogin();
    });
  }
  attachLogin();
}

// ========== DASHBOARD ==========
async function renderDashboard() {
  const books = (await apiFetch('/api/books')).filter(b => b.owner_id === currentUser.id);
  const exchanges = await apiFetch(`/api/exchanges/${currentUser.id}`);
  const messagesCount = 0; // Placeholder
  
  document.getElementById('appRoot').innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
      <div style="flex: 2; min-width: 260px;">
        <div class="card">
          <h3><i class="fas fa-book"></i> My Books (${books.length})</h3>
          <div class="grid-3" style="margin-top: 1rem;">
            ${books.map(book => `
              <div class="card">
                <img src="${book.image}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 0.5rem;">
                <h4 style="margin-top: 0.5rem;">${book.title}</h4>
                <p>$${book.price} · ${book.condition}</p>
                <button onclick="window.deleteBook('${book.id}')" class="btn btn-outline" style="margin-top: 0.5rem; width: 100%;">Delete</button>
              </div>
            `).join('') || '<p style="text-align: center;">No books yet. Start selling!</p>'}
          </div>
        </div>
      </div>
      <div style="flex: 1;">
        <div class="card">
          <h3><i class="fas fa-envelope"></i> Messages</h3>
          <p>Unread: ${messagesCount}</p>
          <button class="btn btn-primary" data-nav-messages style="margin-top: 0.5rem;">Go to Messages</button>
        </div>
        <div class="card" style="margin-top: 1rem;">
          <h3><i class="fas fa-exchange-alt"></i> Exchanges (${exchanges.length})</h3>
          ${exchanges.map(ex => `<div style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;"><b>${ex.status}</b>: ${ex.offeredBook?.title || 'book'} ↔ ${ex.requestedBook?.title || 'book'}</div>`).join('') || '<p>No exchange requests</p>'}
        </div>
      </div>
    </div>
  `;
  document.querySelector('[data-nav-messages]')?.addEventListener('click', () => { window.location.hash = 'messages'; renderCurrentView(); });
}

window.deleteBook = async (id) => {
  await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
  showToast('Book removed');
  renderDashboard();
};

// ========== BROWSE BOOKS ==========
async function renderBrowse() {
  const allBooks = await apiFetch('/api/books');
  const currentUserId = currentUser.id;
  
  document.getElementById('appRoot').innerHTML = `
    <div>
      <h2><i class="fas fa-search"></i> Browse Books</h2>
      <div class="card" style="margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem;">
        <input type="text" id="searchTitle" class="input" style="flex: 2;" placeholder="Search by title...">
        <select id="filterCategory" class="input" style="flex: 1;"><option value="">All Categories</option><option>Self-Help</option><option>Tech</option><option>Fiction</option></select>
        <button id="resetFilters" class="btn btn-outline">Reset</button>
      </div>
      <div id="booksGrid" class="grid-3"></div>
    </div>
  `;
  
  function filterAndRender() {
    let filtered = allBooks.filter(b => b.owner_id !== currentUserId);
    const title = document.getElementById('searchTitle')?.value.toLowerCase();
    const cat = document.getElementById('filterCategory')?.value;
    if(title) filtered = filtered.filter(b => b.title.toLowerCase().includes(title));
    if(cat) filtered = filtered.filter(b => b.category === cat);
    
    const grid = document.getElementById('booksGrid');
    if(filtered.length === 0) grid.innerHTML = '<div class="card">No books found</div>';
    else grid.innerHTML = filtered.map(book => `
      <div class="card">
        <img src="${book.image}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 0.5rem;">
        <h3 style="margin-top: 0.5rem;">${book.title}</h3>
        <p>by ${book.author}</p>
        <p><strong>$${book.price}</strong> · ${book.condition}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-primary" data-owner="${book.owner_id}">💬 Message</button>
          <button class="btn btn-outline" data-book='${JSON.stringify(book).replace(/'/g, "&#39;")}'>🔄 Exchange</button>
        </div>
      </div>
    `).join('');
    
    document.querySelectorAll('[data-owner]').forEach(btn => {
      btn.addEventListener('click', () => startChatWithUser(btn.dataset.owner));
    });
    document.querySelectorAll('[data-book]').forEach(btn => {
      btn.addEventListener('click', () => showExchangeModal(JSON.parse(btn.dataset.book)));
    });
  }
  
  document.getElementById('searchTitle')?.addEventListener('input', filterAndRender);
  document.getElementById('filterCategory')?.addEventListener('change', filterAndRender);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    document.getElementById('searchTitle').value = '';
    document.getElementById('filterCategory').value = '';
    filterAndRender();
  });
  filterAndRender();
}

// ========== MESSAGING ==========
let activeChatUserId = null;

async function startChatWithUser(otherUserId) {
  activeChatUserId = otherUserId;
  window.location.hash = 'messages';
  renderCurrentView();
}

async function renderMessages() {
  const messages = await apiFetch(`/api/messages/${currentUser.id}`);
  
  // Group messages by conversation
  const conversations = {};
  messages.forEach(m => {
    const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
    const otherName = m.sender_id === currentUser.id ? m.receiver_name : m.sender_name;
    if (!conversations[otherId]) conversations[otherId] = { name: otherName, messages: [] };
    conversations[otherId].messages.push(m);
  });

  const chatListHtml = Object.keys(conversations).map(id => `
    <div class="chat-item ${activeChatUserId == id ? 'active' : ''}" onclick="window.setActiveChat('${id}')">
      <div class="chat-avatar">${conversations[id].name[0]}</div>
      <div class="chat-info">
        <h4>${conversations[id].name}</h4>
        <p>${conversations[id].messages[conversations[id].messages.length - 1].text.substring(0, 30)}...</p>
      </div>
    </div>
  `).join('');

  const activeConv = activeChatUserId ? conversations[activeChatUserId] : null;
  const chatBoxHtml = activeConv ? `
    <div class="chat-header">
      <h3>${activeConv.name}</h3>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${activeConv.messages.map(m => `
        <div class="message ${m.sender_id === currentUser.id ? 'sent' : 'received'}">
          <div class="message-content">${m.text}</div>
          <div class="message-time">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      `).join('')}
    </div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="msgInput" class="input" placeholder="Type a message..." required>
      <button type="submit" class="btn btn-primary">Send</button>
    </form>
  ` : `
    <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280;">
      <p>Select a conversation to start chatting</p>
    </div>
  `;

  document.getElementById('appRoot').innerHTML = `
    <div class="messaging-container card">
      <div class="chat-sidebar">
        <h3>Chats</h3>
        <div class="chat-list">${chatListHtml || '<p style="padding: 1rem;">No messages yet.</p>'}</div>
      </div>
      <div class="chat-main">
        ${chatBoxHtml}
      </div>
    </div>
  `;

  if (activeConv) {
    const chatMsgs = document.getElementById('chatMessages');
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    
    document.getElementById('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('msgInput').value;
      if (!text) return;
      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: parseInt(activeChatUserId),
        text
      });
      document.getElementById('msgInput').value = '';
    });
  }
}

window.setActiveChat = (id) => {
  activeChatUserId = id;
  renderMessages();
};

// ========== EXCHANGE MODAL ==========
async function showExchangeModal(targetBook) {
  const myBooks = (await apiFetch('/api/books')).filter(b => b.owner_id === currentUser.id);
  if(myBooks.length === 0) return showToast('You need a book to exchange!', true);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="card" style="max-width: 400px;">
      <h3>Propose Exchange</h3>
      <p>You want: <strong>${targetBook.title}</strong></p>
      <select id="exchangeBookSelect" class="input" style="margin: 1rem 0;">
        ${myBooks.map(b => `<option value="${b.id}">${b.title}</option>`).join('')}
      </select>
      <div style="display: flex; gap: 1rem;">
        <button id="confirmExchange" class="btn btn-primary">Send Request</button>
        <button id="cancelExchange" class="btn btn-outline">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('confirmExchange').onclick = async () => {
    const offeredBookId = document.getElementById('exchangeBookSelect').value;
    await apiFetch('/api/exchanges', {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: currentUser.id,
        toUserId: targetBook.owner_id,
        offeredBookId,
        requestedBookId: targetBook.id
      })
    });
    showToast(`Exchange request sent`);
    modal.remove();
  };
  document.getElementById('cancelExchange').onclick = () => modal.remove();
}

// ========== ADMIN PANEL ==========
async function renderAdmin() {
  const stats = await apiFetch('/api/admin/stats');
  const users = await apiFetch('/api/admin/users');
  
  document.getElementById('appRoot').innerHTML = `
    <div>
      <h2><i class="fas fa-user-shield"></i> Admin Panel</h2>
      <div class="grid-3" style="margin-bottom: 2rem;">
        <div class="card" style="text-align: center;">
          <h3>${stats.users}</h3>
          <p>Total Users</p>
        </div>
        <div class="card" style="text-align: center;">
          <h3>${stats.books}</h3>
          <p>Total Books</p>
        </div>
        <div class="card" style="text-align: center;">
          <h3>${stats.exchanges}</h3>
          <p>Exchanges</p>
        </div>
      </div>
      
      <div class="card">
        <h3>User Management</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 0.5rem;">Name</th>
              <th style="padding: 0.5rem;">Email</th>
              <th style="padding: 0.5rem;">Role</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 0.5rem;">${u.name}</td>
                <td style="padding: 0.5rem;">${u.email}</td>
                <td style="padding: 0.5rem;"><span class="badge ${u.roles === 'admin' ? 'badge-primary' : ''}">${u.roles}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ========== ADD BOOK ==========
function renderAddBookForm() {
  document.getElementById('appRoot').innerHTML = `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <h2><i class="fas fa-plus-circle"></i> List a Book</h2>
      <form id="newBookForm">
        <label>Title</label><input id="bookTitle" class="input" required>
        <label>Author</label><input id="bookAuthor" class="input" required>
        <label>Category</label><select id="bookCategory" class="input"><option>Fiction</option><option>Self-Help</option><option>Tech</option></select>
        <label>Condition</label><select id="bookCondition" class="input"><option>Like New</option><option>Very Good</option><option>Good</option></select>
        <label>Price ($)</label><input type="number" id="bookPrice" class="input" required>
        <label>Book Cover Image (JPG, PNG)</label>
        <input type="file" id="bookImage" class="input" accept=".jpg,.jpeg,.png" required>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">List Book</button>
      </form>
    </div>
  `;
  
  document.getElementById('newBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('bookTitle').value);
    formData.append('author', document.getElementById('bookAuthor').value);
    formData.append('category', document.getElementById('bookCategory').value);
    formData.append('condition', document.getElementById('bookCondition').value);
    formData.append('price', document.getElementById('bookPrice').value);
    formData.append('ownerId', currentUser.id);
    
    const imageFile = document.getElementById('bookImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to list book');
      
      showToast('Book listed successfully!');
      window.location.hash = 'dashboard';
      renderCurrentView();
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

// ========== MAIN RENDER ENGINE ==========
function renderCurrentView() {
  const hash = window.location.hash;
  if (hash.startsWith('#reset-password')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    const token = params.get('token');
    return showResetPasswordScreen(token);
  }

  const navbar = document.getElementById('mainNavbar');
  if(!currentUser) {
    if (navbar) navbar.style.display = 'none';
    return showLoginScreen();
  }
  
  if (navbar) navbar.style.display = 'block';
  const currentHash = window.location.hash.slice(1) || 'dashboard';
  document.getElementById('userGreeting').innerHTML = `👋 ${currentUser.name}`;
  const adminLink = document.getElementById('adminLink');
  if (adminLink) adminLink.style.display = currentUser.roles === 'admin' ? 'block' : 'none';

  const views = { dashboard: renderDashboard, browse: renderBrowse, messages: renderMessages, addBook: renderAddBookForm, admin: renderAdmin };
  if(views[currentHash]) views[currentHash]();
  else renderDashboard();
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if(link.dataset.nav === currentHash) link.classList.add('active');
  });
}

// ========== BOOTSTRAP ==========
function init() {
  const sessionUser = getSession();
  if(sessionUser) {
    currentUser = sessionUser;
    initSocket(currentUser.id);
  }
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = link.dataset.nav;
      renderCurrentView();
    });
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearSession();
    showToast('Logged out');
    renderCurrentView();
  });
  
  window.addEventListener('hashchange', () => renderCurrentView());
  renderCurrentView();
}

init();

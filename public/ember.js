/* ember.js - UBEP Core Logic | SRS Aligned */

const API_URL = ''; // Relative to origin
let socket = null;

// ========== HELPERS ==========
async function apiFetch(endpoint, options = {}) {
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

function getSession() { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
function setSession(user) { currentUser = user; localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); currentUser = null; if(socket) socket.disconnect(); }

function showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = isError ? '#E07A5F' : '#3D405B';
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ========== LOGIN UI ==========
function showLoginScreen() {
  const root = document.getElementById('appRoot');
  root.innerHTML = `
    <div style="max-width: 450px; margin: 3rem auto;">
      <div class="card" style="padding: 2rem; text-align: center;">
        <i class="fas fa-book-open" style="font-size: 3rem; color: #E07A5F; margin-bottom: 1rem;"></i>
        <h2 style="margin-bottom: 0.5rem;">Welcome to UBEP</h2>
        <p style="color: #5a5d7a; margin-bottom: 2rem;">Share, Exchange, Discover</p>
        <div id="authForm"></div>
      </div>
    </div>
  `;
  
  const loginHtml = `
    <form id="loginForm">
      <input type="email" id="loginEmail" class="input" placeholder="Email" style="margin-bottom: 1rem;" required>
      <input type="password" id="loginPass" class="input" placeholder="Password" style="margin-bottom: 1rem;" required>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
    </form>
    <button id="showSignupBtn" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Create Account</button>
  `;
  
  const signupHtml = `
    <form id="signupForm">
      <input id="signupName" class="input" placeholder="Full Name" style="margin-bottom: 1rem;" required>
      <input type="email" id="signupEmail" class="input" placeholder="Email" style="margin-bottom: 1rem;" required>
      <input id="signupPhone" class="input" placeholder="Phone Number" style="margin-bottom: 1rem;" required>
      <input type="password" id="signupPass" class="input" placeholder="Password" style="margin-bottom: 1rem;" required>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
    </form>
    <button id="showLoginBtn" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Back to Login</button>
  `;
  
  const container = document.getElementById('authForm');
  container.innerHTML = loginHtml;
  
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
        initSocket();
        showToast(`Welcome ${user.name}`);
        renderCurrentView();
      } catch (e) {}
    });
    document.getElementById('showSignupBtn')?.addEventListener('click', () => {
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
        initSocket();
        showToast(`Welcome ${name}!`);
        renderCurrentView();
      } catch (e) {}
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', () => {
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
  const messages = await apiFetch(`/api/messages/${currentUser.id}`);
  const unreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length;
  
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
                <div class="badge ${book.status}">${book.status}</div>
                <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                  <button onclick="window.updateStatus('${book.id}', 'available')" class="btn btn-outline btn-sm">Set Available</button>
                  <button onclick="window.updateStatus('${book.id}', 'sold')" class="btn btn-outline btn-sm">Set Sold</button>
                  <button onclick="window.updateStatus('${book.id}', 'exchanged')" class="btn btn-outline btn-sm">Set Exchanged</button>
                  <button onclick="window.deleteBook('${book.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            `).join('') || '<p style="text-align: center;">No books yet. Start selling!</p>'}
          </div>
        </div>
      </div>
      <div style="flex: 1;">
        <div class="card">
          <h3><i class="fas fa-envelope"></i> Messages</h3>
          <p>Unread: ${unreadCount}</p>
          <button class="btn btn-primary" onclick="window.location.hash='messages'">Go to Messages</button>
        </div>
        <div class="card" style="margin-top: 1rem;">
          <h3><i class="fas fa-exchange-alt"></i> Exchanges (${exchanges.length})</h3>
          ${exchanges.map(ex => `<div style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;"><b>${ex.status}</b>: ${ex.offered_title} ↔ ${ex.requested_title}</div>`).join('') || '<p>No exchange requests</p>'}
        </div>
      </div>
    </div>
  `;
}

window.deleteBook = async (id) => {
  if(!confirm('Are you sure you want to delete this book?')) return;
  await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
  showToast('Book removed');
  renderDashboard();
};

window.updateStatus = async (id, status) => {
  await apiFetch(`/api/books/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  showToast('Status updated');
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
    let filtered = allBooks.filter(b => b.owner_id !== currentUserId && b.status === 'available');
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
        <p>Seller: ${book.owner_name}</p>
        <p><strong>$${book.price}</strong> · ${book.condition}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-primary" onclick="window.startChatWithUser('${book.owner_id}', '${book.owner_name}')">💬 Message</button>
          <button class="btn btn-outline" data-book='${JSON.stringify(book).replace(/'/g, "&#39;")}'>🔄 Exchange</button>
        </div>
      </div>
    `).join('');
    
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
let activePartnerId = null;

window.startChatWithUser = (userId, name) => {
  activePartnerId = userId;
  window.location.hash = 'messages';
  renderCurrentView();
};

async function renderMessages() {
  const messages = await apiFetch(`/api/messages/${currentUser.id}`);
  const partners = new Map();
  
  messages.forEach(m => {
    const partnerId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
    const partnerName = m.sender_id === currentUser.id ? m.receiver_name : m.sender_name;
    if(!partners.has(partnerId)) partners.set(partnerId, { id: partnerId, name: partnerName, lastMsg: m.text });
  });

  document.getElementById('appRoot').innerHTML = `
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
      <div class="card" style="flex: 1; min-width: 250px;">
        <h3>Conversations</h3>
        <div id="convoList">
          ${Array.from(partners.values()).map(p => `
            <div class="chat-user-item ${activePartnerId == p.id ? 'active' : ''}" onclick="window.selectChat('${p.id}')">
              <strong>${p.name}</strong>
              <div style="font-size: 0.8rem; color: #666;">${p.lastMsg}</div>
            </div>
          `).join('') || '<p>No conversations yet</p>'}
        </div>
      </div>
      <div class="card" style="flex: 2; min-width: 300px;">
        <h3 id="chatHeader">${activePartnerId ? 'Chat' : 'Select a partner'}</h3>
        <div id="chatWindow" style="height: 400px; overflow-y: auto; background: #f9f9fb; padding: 1rem; border-radius: 0.5rem;">
          ${activePartnerId ? messages.filter(m => m.sender_id == activePartnerId || m.receiver_id == activePartnerId).map(m => `
            <div style="margin-bottom: 1rem; text-align: ${m.sender_id == currentUser.id ? 'right' : 'left'};">
              <div style="display: inline-block; padding: 0.5rem 1rem; border-radius: 1rem; background: ${m.sender_id == currentUser.id ? '#E07A5F' : '#f0f0f0'}; color: ${m.sender_id == currentUser.id ? 'white' : 'black'};">
                ${m.text}
              </div>
            </div>
          `).join('') : '<p style="text-align: center; color: #999;">Start a conversation from Browse Books</p>'}
        </div>
        ${activePartnerId ? `
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <input id="messageInput" class="input" placeholder="Type a message...">
            <button onclick="window.sendMessage()" class="btn btn-primary">Send</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  const win = document.getElementById('chatWindow');
  if(win) win.scrollTop = win.scrollHeight;
}

window.selectChat = (userId) => {
  activePartnerId = userId;
  renderMessages();
};

window.sendMessage = () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if(!text || !activePartnerId) return;
  socket.emit('send_message', { senderId: currentUser.id, receiverId: activePartnerId, text });
  input.value = '';
};

function initSocket() {
  if(!currentUser || socket) return;
  socket = io();
  socket.emit('join', currentUser.id);
  socket.on('receive_message', (msg) => {
    if(window.location.hash === '#messages') renderMessages();
    else showToast(`New message from ${msg.sender_name}`);
  });
}

// ========== ADMIN PANEL ==========
async function renderAdmin() {
  if(currentUser.role !== 'admin') return renderDashboard();
  const stats = await apiFetch('/api/admin/stats');
  const users = await apiFetch('/api/admin/users');
  
  document.getElementById('appRoot').innerHTML = `
    <div>
      <h2><i class="fas fa-user-shield"></i> Admin Panel</h2>
      <div class="grid-3" style="margin-bottom: 2rem;">
        <div class="card" style="text-align: center;"><h3>Users</h3><h2 style="color: #E07A5F;">${stats.users}</h2></div>
        <div class="card" style="text-align: center;"><h3>Books</h3><h2 style="color: #E07A5F;">${stats.books}</h2></div>
        <div class="card" style="text-align: center;"><h3>Exchanges</h3><h2 style="color: #E07A5F;">${stats.exchanges}</h2></div>
      </div>
      <div class="card">
        <h3>User Management</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead>
            <tr style="border-bottom: 2px solid #eee; text-align: left;">
              <th>Name</th><th>Email</th><th>Phone</th><th>Role</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 0.75rem 0;">${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td><span class="badge ${u.role}">${u.role}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

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
        <label>Image URL</label><input id="bookImage" class="input" placeholder="https://picsum.photos/id/20/300/200" value="https://picsum.photos/id/20/300/200">
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">List Book</button>
      </form>
    </div>
  `;
  
  document.getElementById('newBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newBook = {
      title: document.getElementById('bookTitle').value,
      author: document.getElementById('bookAuthor').value,
      category: document.getElementById('bookCategory').value,
      condition: document.getElementById('bookCondition').value,
      price: parseInt(document.getElementById('bookPrice').value),
      ownerId: currentUser.id,
      image: document.getElementById('bookImage').value
    };
    await apiFetch('/api/books', {
      method: 'POST',
      body: JSON.stringify(newBook)
    });
    showToast('Book listed successfully!');
    window.location.hash = 'dashboard';
    renderCurrentView();
  });
}

// ========== MAIN RENDER ENGINE ==========
function renderCurrentView() {
  if(!currentUser) return showLoginScreen();
  const hash = window.location.hash.slice(1) || 'dashboard';
  document.getElementById('userGreeting').innerHTML = `👋 ${currentUser.name}`;
  
  // Show/Hide Admin link
  const adminLink = document.getElementById('adminLink');
  if(adminLink) adminLink.style.display = currentUser.role === 'admin' ? 'block' : 'none';

  const views = { dashboard: renderDashboard, browse: renderBrowse, messages: renderMessages, addBook: renderAddBookForm, admin: renderAdmin };
  if(views[hash]) views[hash]();
  else renderDashboard();
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if(link.dataset.nav === hash) link.classList.add('active');
  });
}

// ========== BOOTSTRAP ==========
function init() {
  const sessionUser = getSession();
  if(sessionUser) {
    currentUser = sessionUser;
    initSocket();
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

/* ember.js - UBEP Core Logic | Backend API Integration */

const API_URL = ''; // Relative to origin

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
function clearSession() { localStorage.removeItem(SESSION_KEY); currentUser = null; }

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
      const password = document.getElementById('signupPass').value;
      try {
        const user = await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        setSession(user);
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
function startChatWithUser(otherUserId) {
  window.location.hash = 'messages';
  renderCurrentView();
}

async function renderMessages() {
  const messages = await apiFetch(`/api/messages/${currentUser.id}`);
  document.getElementById('appRoot').innerHTML = `<div class="card">Messaging is currently being migrated to the database.</div>`;
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
        fromUser: currentUser.id,
        toUser: targetBook.owner_id,
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
  const views = { dashboard: renderDashboard, browse: renderBrowse, messages: renderMessages, addBook: renderAddBookForm };
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
  if(sessionUser) currentUser = sessionUser;
  
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

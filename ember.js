/* ember.js - UBEP Core Logic | Session, Storage, UI Magic */

// ========== STORAGE KEYS   
const STORAGE_KEYS = {
  USERS: 'ubep_users',
  BOOKS: 'ubep_books',
  MESSAGES: 'ubep_messages',
  EXCHANGES: 'ubep_exchanges',
  SESSION: 'ubep_session'
};

// ========== HELPERS ==========
function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); }
function saveUsers(users) { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }
function getBooks() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || '[]'); }
function saveBooks(books) { localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books)); }
function getMessages() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]'); }
function saveMessages(msgs) { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs)); }
function getExchanges() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXCHANGES) || '[]'); }
function saveExchanges(ex) { localStorage.setItem(STORAGE_KEYS.EXCHANGES, JSON.stringify(ex)); }

let currentUser = null;
function getSession() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null'); }
function setSession(user) { currentUser = user; localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user)); }
function clearSession() { localStorage.removeItem(STORAGE_KEYS.SESSION); currentUser = null; }

// ========== SEED DATA ==========
function seedInitialData() {
  let users = getUsers();
  if (users.length === 0) {
    users = [
      { id: 'u1', name: 'Alex Reader', email: 'alex@ubep.com', password: '123' },
      { id: 'u2', name: 'Jamie Bookworm', email: 'jamie@ubep.com', password: '123' },
      { id: 'u3', name: 'Admin1', email: 'admin@ubep.com', password: '1234' }
    ];
    saveUsers(users);
  }
  let books = getBooks();
  if (books.length === 0) {
    books = [
      { id: 'b1', title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', condition: 'Like New', price: 12, ownerId: 'u1', image: 'https://picsum.photos/id/20/300/200' },
      { id: 'b2', title: 'Clean Code', author: 'Robert Martin', category: 'Tech', condition: 'Good', price: 18, ownerId: 'u1', image: 'https://picsum.photos/id/0/300/200' },
      { id: 'b3', title: 'The Midnight Library', author: 'Matt Haig', category: 'Fiction', condition: 'Very Good', price: 10, ownerId: 'u2', image: 'https://picsum.photos/id/26/300/200' }
    ];
    saveBooks(books);
  }
  if (getExchanges().length === 0) saveExchanges([]);
  if (getMessages().length === 0) saveMessages([]);
}

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
    <p style="margin-top: 1rem; font-size: 0.8rem;">Demo: admin@gmail.com / Test@123</p>
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
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pwd = document.getElementById('loginPass').value;
      const user = getUsers().find(u => u.email === email && u.password === pwd);
      if(user) { setSession(user); showToast(`Welcome ${user.name}`); renderCurrentView(); }
      else showToast('Invalid credentials', true);
    });
    document.getElementById('showSignupBtn')?.addEventListener('click', () => {
      container.innerHTML = signupHtml;
      attachSignup();
    });
  }
  
  function attachSignup() {
    document.getElementById('signupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const pwd = document.getElementById('signupPass').value;
      if(!name || !email || !pwd) return showToast('Fill all fields', true);
      let users = getUsers();
      if(users.find(u=>u.email===email)) return showToast('Email exists', true);
      const newUser = { id: 'u'+Date.now(), name, email, password: pwd };
      users.push(newUser);
      saveUsers(users);
      setSession(newUser);
      showToast(`Welcome ${name}!`);
      renderCurrentView();
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', () => {
      container.innerHTML = loginHtml;
      attachLogin();
    });
  }
  attachLogin();
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const books = getBooks().filter(b => b.ownerId === currentUser.id);
  const exchanges = getExchanges().filter(ex => ex.fromUser === currentUser.id || ex.toUser === currentUser.id);
  const messagesCount = getMessages().filter(m => m.receiverId === currentUser.id && !m.read).length;
  
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

window.deleteBook = (id) => {
  let books = getBooks();
  books = books.filter(b => b.id !== id);
  saveBooks(books);
  showToast('Book removed');
  renderDashboard();
};

// ========== BROWSE BOOKS ==========
function renderBrowse() {
  let allBooks = getBooks();
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
    let filtered = allBooks.filter(b => b.ownerId !== currentUserId);
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
          <button class="btn btn-primary" data-owner="${book.ownerId}">💬 Message</button>
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
  setTimeout(() => {
    const chatSelect = document.querySelector(`.chat-user-item[data-userid="${otherUserId}"]`);
    if(chatSelect) chatSelect.click();
  }, 100);
}

function renderMessages() {
  const messages = getMessages();
  const users = getUsers();
  const conversations = new Map();
  
  messages.forEach(msg => {
    const partner = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    if(!conversations.has(partner)) conversations.set(partner, []);
    conversations.get(partner).push(msg);
  });
  
  document.getElementById('appRoot').innerHTML = `
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
      <div class="card" style="flex: 1; min-width: 200px;">
        <h3>Conversations</h3>
        <div id="convoList"></div>
      </div>
      <div class="card" style="flex: 2; min-width: 300px;">
        <h3 id="chatHeader">Select a chat</h3>
        <div id="chatWindow" style="height: 350px; overflow-y: auto; background: #F4F1DE; border-radius: 0.75rem; padding: 1rem;"></div>
        <div style="display: flex; margin-top: 1rem; gap: 0.5rem;">
          <input id="messageInput" class="input" placeholder="Type a message...">
          <button id="sendMsgBtn" class="btn btn-primary">Send</button>
        </div>
      </div>
    </div>
  `;
  
  let activePartnerId = null;
  
  function renderConversations() {
    const convoDiv = document.getElementById('convoList');
    convoDiv.innerHTML = '';
    for(let [partnerId, msgs] of conversations) {
      const partner = users.find(u => u.id === partnerId);
      if(!partner) continue;
      const lastMsg = msgs[msgs.length-1];
      const div = document.createElement('div');
      div.className = 'chat-user-item';
      div.setAttribute('data-userid', partnerId);
      div.innerHTML = `<strong>${partner.name}</strong><div style="font-size: 0.8rem;">${lastMsg?.text?.slice(0, 40) || 'Start chatting'}</div>`;
      div.addEventListener('click', () => { activePartnerId = partnerId; loadChat(partnerId); });
      convoDiv.appendChild(div);
    }
    if(convoDiv.children.length === 0) convoDiv.innerHTML = '<p style="text-align: center;">No messages yet</p>';
  }
  
  function loadChat(partnerId) {
    const partner = users.find(u => u.id === partnerId);
    document.getElementById('chatHeader').innerHTML = `Chat with ${partner?.name}`;
    const relevant = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === partnerId) || (m.senderId === partnerId && m.receiverId === currentUser.id));
    const chatDiv = document.getElementById('chatWindow');
    chatDiv.innerHTML = relevant.map(m => `
      <div style="margin: 0.5rem; text-align: ${m.senderId === currentUser.id ? 'right' : 'left'};">
        <span class="card" style="display: inline-block; padding: 0.5rem 1rem; background: ${m.senderId === currentUser.id ? '#E07A5F' : 'white'}; color: ${m.senderId === currentUser.id ? 'white' : '#3D405B'};">${m.text}<br><small>${new Date(m.time).toLocaleTimeString()}</small></span>
      </div>
    `).join('');
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
  
  document.getElementById('sendMsgBtn')?.addEventListener('click', () => {
    if(!activePartnerId) return showToast('Select a conversation first', true);
    const input = document.getElementById('messageInput');
    if(!input.value.trim()) return;
    const newMsg = { senderId: currentUser.id, receiverId: activePartnerId, text: input.value, time: Date.now() };
    let msgs = getMessages();
    msgs.push(newMsg);
    saveMessages(msgs);
    input.value = '';
    renderMessages();
    showToast('Message sent');
  });
  
  renderConversations();
}

// ========== EXCHANGE MODAL ==========
function showExchangeModal(targetBook) {
  const myBooks = getBooks().filter(b => b.ownerId === currentUser.id);
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
  
  document.getElementById('confirmExchange').onclick = () => {
    const offeredBook = myBooks.find(b => b.id === document.getElementById('exchangeBookSelect').value);
    const exchanges = getExchanges();
    exchanges.push({ id: 'ex'+Date.now(), fromUser: currentUser.id, toUser: targetBook.ownerId, offeredBook, requestedBook: targetBook, status: 'Pending' });
    saveExchanges(exchanges);
    showToast(`Exchange request sent for ${offeredBook.title}`);
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
  
  document.getElementById('newBookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newBook = {
      id: 'b'+Date.now(),
      title: document.getElementById('bookTitle').value,
      author: document.getElementById('bookAuthor').value,
      category: document.getElementById('bookCategory').value,
      condition: document.getElementById('bookCondition').value,
      price: parseInt(document.getElementById('bookPrice').value),
      ownerId: currentUser.id,
      image: document.getElementById('bookImage').value
    };
    let books = getBooks();
    books.push(newBook);
    saveBooks(books);
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
  seedInitialData();
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
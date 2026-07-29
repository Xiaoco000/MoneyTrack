// --- STATE & DATA UTAMA (BENAR-BENAR DINAMIS & KOSONG) ---
let currentUser = null;
let activePrivateUser = null;

// Mulai dari array kosong (Tidak ada nama dummy)
let sampleUsers = JSON.parse(localStorage.getItem("moneyS_registeredUsers")) || [];
let sampleGroups = JSON.parse(localStorage.getItem("moneyS_registeredGroups")) || [];

// Database Pesan Real-time
let chatMessagesDB = JSON.parse(localStorage.getItem("moneyS_chatHistory")) || {
  private: {}
};

// Database Transaksi
let transactions = JSON.parse(localStorage.getItem("moneyS_transactions")) || [];

// --- HELPER TOAST NOTIFICATION ---
function showToast(message, icon = "⚡") {
  const toast = document.getElementById("customToast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  
  if (toast && toastMsg) {
    toastMsg.innerText = message;
    if (toastIcon) toastIcon.innerText = icon;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  } else {
    alert(message);
  }
}

// --- WEB PUSH NOTIFICATION ---
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showToast("Notifikasi HP Diaktifkan!", "🔔");
      } else {
        showToast("Izin Notifikasi Ditolak.", "⚠️");
      }
    });
  } else {
    showToast("Browser tidak mendukung notifikasi.", "❌");
  }
}

function sendWebNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const defaultOptions = {
      icon: 'logo.png',
      badge: 'logo.png',
      vibrate: [200, 100, 200],
      ...options
    };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, defaultOptions);
      }).catch(() => new Notification(title, defaultOptions));
    } else {
      new Notification(title, defaultOptions);
    }
  }
}

// --- JAM & SAPAAN REAL-TIME ---
function updateRealTimeClock() {
  const now = new Date();
  const hours = now.getHours();
  
  let greeting = "Selamat Malam 🌙";
  if (hours >= 4 && hours < 11) greeting = "Selamat Pagi 🌅";
  else if (hours >= 11 && hours < 15) greeting = "Selamat Siang ☀️";
  else if (hours >= 15 && hours < 18) greeting = "Selamat Sore 🌆";

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('id-ID', options);

  if (document.getElementById('loginGreeting')) {
    document.getElementById('loginGreeting').innerText = greeting;
    document.getElementById('loginClock').innerText = timeStr;
    document.getElementById('loginDate').innerText = dateStr;
  }

  if (document.getElementById('homeGreeting')) {
    document.getElementById('homeGreeting').innerText = greeting;
    document.getElementById('homeClock').innerText = timeStr;
    document.getElementById('homeDate').innerText = dateStr;
  }
}
setInterval(updateRealTimeClock, 1000);

// --- NAVIGATION & TABS ---
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  const btnMap = { tabHome: 0, tabTrans: 1, tabFeed: 2, tabGroup: 3, tabChat: 4 };
  const navBtns = document.querySelectorAll('.nav-item');
  if (navBtns[btnMap[tabId]]) navBtns[btnMap[tabId]].classList.add('active');

  if (tabId === 'tabChat') {
    renderMessengerFB();
  } else if (tabId === 'tabGroup') {
    renderGroupList();
  }
};

window.closeModal = function(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
};

// --- AUTH & LOGIN LOGIC ---
function handleUserLogin(providerType) {
  const inputVal = document.getElementById("loginIdentifierInput")?.value.trim();
  let username = "User_" + Math.floor(1000 + Math.random() * 9000);
  
  if (inputVal) {
    username = inputVal.split("@")[0];
  }

  currentUser = {
    id: "usr_" + Date.now(),
    name: username,
    bio: "Pengguna moneyS ☕",
    loginMethod: providerType,
    isOnline: true
  };
  
  // Masukkan pengguna ke daftar pengguna terdaftar
  const index = sampleUsers.findIndex(u => u.name === currentUser.name);
  if (index === -1) {
    sampleUsers.unshift(currentUser);
  } else {
    sampleUsers[index].isOnline = true;
  }

  // Simpan ke localStorage
  localStorage.setItem("moneyS_currentUser", JSON.stringify(currentUser));
  localStorage.setItem("moneyS_registeredUsers", JSON.stringify(sampleUsers));
  
  showToast(`Selamat datang, ${username}!`, "🚀");
  
  document.getElementById("authSection")?.classList.add("hidden");
  document.getElementById("appSection")?.classList.remove("hidden");

  updateUserUI();
  updateRealTimeClock();
  requestNotificationPermission();
}

function handleUserLogout() {
  if (currentUser) {
    const found = sampleUsers.find(u => u.id === currentUser.id);
    if (found) found.isOnline = false;
    localStorage.setItem("moneyS_registeredUsers", JSON.stringify(sampleUsers));
  }
  localStorage.removeItem("moneyS_currentUser");
  currentUser = null;
  document.getElementById("appSection")?.classList.add("hidden");
  document.getElementById("authSection")?.classList.remove("hidden");
  showToast("Anda telah keluar.", "🚪");
}

function updateUserUI() {
  if (!currentUser) return;
  const displayUsername = document.getElementById("displayUsername");
  const userAvatarText = document.getElementById("userAvatarText");
  if (displayUsername) displayUsername.innerText = currentUser.name;
  if (userAvatarText) userAvatarText.innerText = currentUser.name.charAt(0).toUpperCase();
}

// --- MESSENGER ENGINE ALA FACEBOOK ---
function renderMessengerFB() {
  const tabChat = document.getElementById('tabChat');
  if (!tabChat) return;

  tabChat.innerHTML = `
    <div class="fb-messenger-container">
      <div class="fb-chat-header">
        <h2>Pesan</h2>
        <div class="fb-header-actions">
          <button class="fb-icon-btn" title="Pengaturan">⚙️</button>
          <button class="fb-icon-btn" title="Pencarian">🔍</button>
        </div>
      </div>

      <!-- Active Stories Horizontal Scroll -->
      <div class="fb-active-users-bar" id="fbActiveUsersBar"></div>

      <!-- Search Box -->
      <div class="fb-search-box">
        <span>🔍</span>
        <input type="text" id="fbSearchInput" placeholder="Cari pesan atau pengguna..." oninput="filterMessengerList(this.value)">
      </div>

      <!-- Chat List Vertikal -->
      <div class="fb-chat-list" id="fbChatListContainer"></div>
    </div>
  `;

  renderActiveStoriesBar();
  renderChatListView(getAvailableChatList());
}

function getAvailableChatList() {
  const otherUsers = sampleUsers.filter(u => currentUser ? u.id !== currentUser.id : true);
  return [...otherUsers, ...sampleGroups];
}

// 1. Render Lingkaran Atas
function renderActiveStoriesBar() {
  const bar = document.getElementById('fbActiveUsersBar');
  if (!bar) return;
  bar.innerHTML = '';

  const activeList = sampleUsers.filter(u => currentUser ? u.id !== currentUser.id : true);

  if (activeList.length === 0) {
    bar.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem; padding:5px;">Belum ada pengguna lain online</span>`;
    return;
  }

  activeList.forEach(user => {
    const item = document.createElement('div');
    item.className = 'fb-active-item';
    item.onclick = () => openUserProfile(user.id, user.name);

    item.innerHTML = `
      <div class="fb-avatar-wrapper">
        <div class="fb-avatar-img">${user.name.charAt(0).toUpperCase()}</div>
        ${user.isOnline ? '<div class="online-dot"></div>' : ''}
      </div>
      <span class="fb-active-name">${user.name.split(' ')[0]}</span>
    `;
    bar.appendChild(item);
  });
}

// 2. Render Daftar Pesan
function renderChatListView(dataList) {
  const container = document.getElementById('fbChatListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (dataList.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:30px;">Belum ada kontak/obrolan tersedia.</div>`;
    return;
  }

  dataList.forEach(item => {
    const chatItem = document.createElement('div');
    chatItem.className = 'fb-chat-item';
    chatItem.onclick = () => openChatRoom(item);

    chatItem.innerHTML = `
      <div class="fb-avatar-wrapper" onclick="event.stopPropagation(); openUserProfile('${item.id}', '${item.name}');">
        <div class="fb-avatar-img" style="${item.isGroup ? 'background: #0088ff;' : ''}">
          ${item.isGroup ? '👥' : item.name.charAt(0).toUpperCase()}
        </div>
        ${item.isOnline ? '<div class="online-dot"></div>' : ''}
      </div>
      <div class="fb-chat-content">
        <div class="fb-chat-title">${item.name}</div>
        <div class="fb-chat-preview">${item.lastMsg || item.desc || 'Ketuk untuk mulai obrolan'}</div>
      </div>
    `;
    container.appendChild(chatItem);
  });
}

function filterMessengerList(keyword) {
  const query = keyword.toLowerCase().trim();
  const allData = getAvailableChatList();
  const filtered = allData.filter(item => item.name.toLowerCase().includes(query));
  renderChatListView(filtered);
}

// 3. Modal Profil Pribadi
window.openUserProfile = function(userId, userName) {
  let modal = document.getElementById('viewUserProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'viewUserProfileModal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div style="background:#0b1120; border:1px solid var(--border-neon); padding:24px; border-radius:20px; text-align:center; width:90%; max-width:320px;">
        <div id="targetProfileAvatar" class="fb-avatar-img" style="width:70px; height:70px; font-size:2rem; margin: 0 auto 12px auto;">U</div>
        <h3 id="targetProfileName" style="color:#fff; margin-bottom:6px;">@Username</h3>
        <p id="targetProfileBio" style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">Bio Pengguna...</p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button id="btnDirectMessageTarget" class="btn-sm" style="padding:8px 16px;">Kirim Pesan</button>
          <button class="btn-sm" style="background:transparent; color:#fff; border:1px solid var(--border-neon);" onclick="closeModal('viewUserProfileModal')">Tutup</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const userObj = sampleUsers.find(u => u.id === userId || u.name === userName) || { bio: 'Pengguna moneyS ☕' };

  document.getElementById('targetProfileName').innerText = "@" + userName;
  document.getElementById('targetProfileBio').innerText = userObj.bio || "Pengguna moneyS ☕";
  document.getElementById('targetProfileAvatar').innerText = userName.charAt(0).toUpperCase();
  
  document.getElementById('btnDirectMessageTarget').onclick = function() {
    closeModal('viewUserProfileModal');
    let targetObj = [...sampleUsers, ...sampleGroups].find(u => u.name === userName) || { id: userId, name: userName };
    openChatRoom(targetObj);
  };

  modal.classList.remove('hidden');
};

// 4. Modal Ruang Obrolan
function openChatRoom(targetUser) {
  activePrivateUser = targetUser;
  
  let roomModal = document.getElementById('fbChatRoomModal');
  if (!roomModal) {
    roomModal = document.createElement('div');
    roomModal.id = 'fbChatRoomModal';
    roomModal.className = 'modal-overlay hidden';
    roomModal.innerHTML = `
      <div style="background:#060913; width:100%; height:100vh; display:flex; flex-direction:column;">
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border-neon);">
          <button onclick="closeModal('fbChatRoomModal')" style="background:none; border:none; color:var(--primary-neon); font-size:1.2rem; cursor:pointer;">❮</button>
          <div id="roomHeaderInfo" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
            <div id="roomHeaderAvatar" class="fb-avatar-img" style="width:36px; height:36px; font-size:1rem;">U</div>
            <div>
              <h4 id="roomHeaderTitle" style="color:#fff; font-size:0.9rem; margin:0;">Nama</h4>
              <span id="roomHeaderSub" style="color:var(--text-muted); font-size:0.7rem;">Aktif sekarang</span>
            </div>
          </div>
        </div>
        
        <div id="roomMessagesArea" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px;"></div>
        
        <form id="roomChatForm" style="display:flex; gap:8px; padding:12px; border-top:1px solid var(--border-neon); background:#080d1a;" onsubmit="handleSendChatMsg(event)">
          <input type="text" id="roomChatInput" placeholder="Ketik pesan..." required style="flex:1; background:rgba(255,255,255,0.08); border:1px solid var(--border-neon); border-radius:20px; padding:10px 16px; color:#fff; outline:none;">
          <button type="submit" style="background:var(--primary-neon); border:none; width:40px; height:40px; border-radius:50%; color:#000; font-weight:bold; cursor:pointer;">➔</button>
        </form>
      </div>
    `;
    document.body.appendChild(roomModal);
  }

  document.getElementById('roomHeaderTitle').innerText = targetUser.name;
  document.getElementById('roomHeaderSub').innerText = targetUser.isOnline ? 'Aktif sekarang' : 'Offline';
  document.getElementById('roomHeaderAvatar').innerText = targetUser.name.charAt(0).toUpperCase();
  document.getElementById('roomHeaderInfo').onclick = () => openUserProfile(targetUser.id, targetUser.name);

  renderRoomMessages();
  roomModal.classList.remove('hidden');
}

function renderRoomMessages() {
  const area = document.getElementById('roomMessagesArea');
  if (!area || !activePrivateUser) return;
  area.innerHTML = '';

  let msgs = chatMessagesDB.private[activePrivateUser.id] || [];

  if (msgs.length === 0) {
    area.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; margin-top:20px;">Belum ada pesan. Mulai obrolan!</div>`;
    return;
  }

  msgs.forEach(msg => {
    const isOwn = currentUser && msg.senderId === currentUser.id;
    const div = document.createElement('div');
    div.style.cssText = `display:flex; flex-direction:column; align-items:${isOwn ? 'flex-end' : 'flex-start'};`;
    div.innerHTML = `
      <div style="background:${isOwn ? 'var(--primary-neon)' : 'rgba(255,255,255,0.1)'}; color:${isOwn ? '#000' : '#fff'}; padding:10px 14px; border-radius:16px; max-width:75%; font-size:0.85rem;">
        ${msg.text}
        <div style="font-size:0.6rem; color:${isOwn ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)'}; text-align:right; margin-top:2px;">${msg.time}</div>
      </div>
    `;
    area.appendChild(div);
  });

  area.scrollTop = area.scrollHeight;
}

function handleSendChatMsg(e) {
  e.preventDefault();
  const input = document.getElementById('roomChatInput');
  const text = input.value.trim();
  if (!text || !currentUser || !activePrivateUser) return;

  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const newMsg = {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: text,
    time: time
  };

  if (!chatMessagesDB.private[activePrivateUser.id]) {
    chatMessagesDB.private[activePrivateUser.id] = [];
  }
  chatMessagesDB.private[activePrivateUser.id].push(newMsg);
  
  activePrivateUser.lastMsg = `You: ${text}`;

  // Simpan riwayat chat ke LocalStorage
  localStorage.setItem("moneyS_chatHistory", JSON.stringify(chatMessagesDB));

  input.value = '';
  renderRoomMessages();
  renderChatListView(getAvailableChatList());

  sendWebNotification(`Pesan baru dari @${currentUser.name} 💬`, { body: text });
}

// --- GRUP & TRANSAKSI MANAGEMENT ---
function renderGroupList() {
  const container = document.getElementById('groupList');
  if (!container) return;
  container.innerHTML = '';

  if (sampleGroups.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px;">Belum ada grup yang dibuat.</div>`;
    return;
  }

  sampleGroups.forEach(grp => {
    const card = document.createElement('div');
    card.className = 'contact-card-item';
    card.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); border-radius:12px; margin-bottom:8px;';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="fb-avatar-img" style="width:40px; height:40px; background:#0088ff;">👥</div>
        <div>
          <div style="font-weight:bold; font-size:0.9rem; color:#fff;">${grp.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${grp.desc || 'Grup Obrolan'}</div>
        </div>
      </div>
      <button class="btn-sm" onclick="openChatRoom({id: '${grp.id}', name: '${grp.name}', isGroup: true})">Chat Grup</button>
    `;
    container.appendChild(card);
  });
}

function handleAddTransaction(e) {
  e.preventDefault();
  const title = document.getElementById('title')?.value.trim();
  const amount = parseFloat(document.getElementById('amount')?.value);
  const type = document.getElementById('type')?.value;

  if (!title || isNaN(amount)) return showToast("Isi data transaksi dengan benar!", "⚠️");

  transactions.unshift({ title, amount, type });
  localStorage.setItem("moneyS_transactions", JSON.stringify(transactions));
  
  updateFinancialUI();

  if (document.getElementById('title')) document.getElementById('title').value = '';
  if (document.getElementById('amount')) document.getElementById('amount').value = '';
  
  showToast("Transaksi disimpan!", "💰");
  const typeLabel = type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)';
  sendWebNotification(`moneyS - Transaksi Baru! 💰`, {
    body: `${typeLabel}: ${title} - Rp ${amount.toLocaleString('id-ID')}`
  });

  switchTab('tabHome');
}

function updateFinancialUI() {
  let income = 0, expense = 0;
  const list = document.getElementById('transactionList');
  if (list) list.innerHTML = '';

  transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;

    if (list) {
      const li = document.createElement('li');
      li.style.cssText = 'background:rgba(15,24,46,0.7); border:1px solid var(--border-neon); padding:10px 14px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:6px;';
      li.innerHTML = `
        <span>${t.title}</span>
        <b style="color:${t.type === 'income' ? '#00ff88' : '#ff3366'}">${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}</b>
      `;
      list.appendChild(li);
    }
  });

  const balance = income - expense;
  if (document.getElementById('balance')) document.getElementById('balance').innerText = `Rp ${balance.toLocaleString('id-ID')}`;
  if (document.getElementById('income')) document.getElementById('income').innerText = `Rp ${income.toLocaleString('id-ID')}`;
  if (document.getElementById('expense')) document.getElementById('expense').innerText = `Rp ${expense.toLocaleString('id-ID')}`;
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gmailLoginBtn")?.addEventListener("click", () => handleUserLogin("Google Gmail"));
  document.getElementById("otpLoginBtn")?.addEventListener("click", () => {
    if (!document.getElementById("loginIdentifierInput").

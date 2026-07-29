// --- STATE & DATA UTAMA ---
let currentUser = null;
let currentChatMode = 'global'; // 'global', 'private', 'group'
let activePrivateUser = null;
let activeGroupId = null;

// Mock Data Pengguna Lain (Dikosongkan agar user bisa tambah sendiri nantinya)
const sampleUsers = [];

// Data Grup (Dikosongkan agar user buat grup sendiri)
let sampleGroups = [];

// Database Pesan Lokal (Kosong)
let chatMessagesDB = {
  global: [],
  private: {},
  group: {}
};

// Database Transaksi (Kosong)
let transactions = [];

// --- HELPER NOTIFIKASI TOAST ---
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
    switchChatMode(currentChatMode);
  } else if (tabId === 'tabGroup') {
    renderGroupList();
  }
};

window.closeModal = function(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
};

// --- AUTH / LOGIN LOGIC ---
function handleUserLogin(providerType) {
  const inputVal = document.getElementById("loginIdentifierInput")?.value.trim();
  let username = "User_" + Math.floor(1000 + Math.random() * 9000);
  
  if (inputVal) {
    username = inputVal.split("@")[0];
  }

  currentUser = {
    id: "usr_" + Date.now(),
    name: username,
    loginMethod: providerType
  };
  
  localStorage.setItem("moneyS_currentUser", JSON.stringify(currentUser));
  showToast(`Berhasil Login via ${providerType}! Selamat datang, ${username}`, "🚀");
  
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");

  updateUserUI();
  updateRealTimeClock();
}

function handleUserLogout() {
  localStorage.removeItem("moneyS_currentUser");
  currentUser = null;
  document.getElementById("appSection").classList.add("hidden");
  document.getElementById("authSection").classList.remove("hidden");
  showToast("Anda telah keluar.", "🚪");
}

function updateUserUI() {
  if (!currentUser) return;
  const displayUsername = document.getElementById("displayUsername");
  const userAvatarText = document.getElementById("userAvatarText");
  if (displayUsername) displayUsername.innerText = currentUser.name;
  if (userAvatarText) userAvatarText.innerText = currentUser.name.charAt(0).toUpperCase();
}

// --- CHAT & MESSENGER LOGIC ---
window.switchChatMode = function(mode) {
  currentChatMode = mode;
  
  document.getElementById('tabChatGlobal').classList.toggle('active', mode === 'global');
  document.getElementById('tabChatPersonal').classList.toggle('active', mode === 'private');
  document.getElementById('tabChatGroup').classList.toggle('active', mode === 'group');

  document.getElementById('privateFriendSelector').classList.toggle('hidden', mode !== 'private');
  document.getElementById('groupChatSelector').classList.toggle('hidden', mode !== 'group');

  if (mode === 'private') {
    renderContactPicker();
  } else if (mode === 'group') {
    renderGroupPicker();
  }

  renderMessages();
};

function renderContactPicker() {
  const container = document.getElementById('contactPickerContainer');
  if (!container) return;
  container.innerHTML = '';

  if (sampleUsers.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:10px; font-size:0.8rem;">Belum ada kontak teman.</div>`;
    return;
  }

  sampleUsers.forEach(user => {
    const isSelected = activePrivateUser && activePrivateUser.id === user.id ? 'selected' : '';
    const item = document.createElement('div');
    item.className = `contact-card-item ${isSelected}`;
    item.innerHTML = `
      <div class="contact-info">
        <div class="contact-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:bold; font-size:0.85rem; color:var(--text-main);">@${user.name}</div>
          <div style="font-size:0.68rem; color:var(--text-muted);">${user.bio || 'Pengguna moneyS'}</div>
        </div>
      </div>
      <span style="font-size:0.8rem; color:var(--primary-neon);">💬</span>
    `;
    item.onclick = () => {
      activePrivateUser = user;
      renderContactPicker();
      renderMessages();
    };
    container.appendChild(item);
  });
}

function renderGroupPicker() {
  const container = document.getElementById('groupPickerContainer');
  if (!container) return;
  container.innerHTML = '';

  if (sampleGroups.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:10px; font-size:0.8rem;">Belum ada grup. Buat grup di tab Grup!</div>`;
    return;
  }

  sampleGroups.forEach(grp => {
    const isSelected = activeGroupId === grp.id ? 'selected' : '';
    const item = document.createElement('div');
    item.className = `contact-card-item ${isSelected}`;
    item.innerHTML = `
      <div class="contact-info">
        <div class="contact-avatar" style="background:#00f0ff; color:#000;">👥</div>
        <div>
          <div style="font-weight:bold; font-size:0.85rem; color:var(--text-main);">${grp.name}</div>
          <div style="font-size:0.68rem; color:var(--text-muted);">${grp.desc}</div>
        </div>
      </div>
      <span style="font-size:0.8rem; color:var(--primary-neon);">🚀</span>
    `;
    item.onclick = () => {
      activeGroupId = grp.id;
      renderGroupPicker();
      renderMessages();
    };
    container.appendChild(item);
  });
}

function renderMessages() {
  const area = document.getElementById('chatMessages');
  if (!area) return;
  area.innerHTML = '';

  let msgList = [];
  if (currentChatMode === 'global') {
    msgList = chatMessagesDB.global || [];
  } else if (currentChatMode === 'private') {
    if (!activePrivateUser) {
      area.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:20px; font-size:0.8rem;">Pilih teman di atas untuk memulai chat.</div>`;
      return;
    }
    msgList = chatMessagesDB.private[activePrivateUser.id] || [];
  } else if (currentChatMode === 'group') {
    if (!activeGroupId) {
      area.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:20px; font-size:0.8rem;">Pilih grup di atas untuk berdiskusi.</div>`;
      return;
    }
    msgList = chatMessagesDB.group[activeGroupId] || [];
  }

  if (msgList.length === 0) {
    area.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:20px; font-size:0.8rem;">Belum ada pesan. Mulai percakapan!</div>`;
    return;
  }

  msgList.forEach(msg => {
    const isOwn = currentUser && msg.senderId === currentUser.id;
    const rowClass = isOwn ? 'own' : 'other';

    const div = document.createElement('div');
    div.className = `chat-bubble-row ${rowClass}`;
    div.innerHTML = `
      <div class="chat-bubble-avatar" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">
        ${msg.senderName.charAt(0).toUpperCase()}
      </div>
      <div>
        <span class="chat-sender-clickable" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">@${msg.senderName}</span>
        <div class="chat-bubble-content">
          ${msg.text}
          <span class="chat-time-stamp">${msg.time}</span>
        </div>
      </div>
    `;
    area.appendChild(div);
  });

  area.scrollTop = area.scrollHeight;
}

// Open Profil Pengguna
window.openUserProfile = function(userId, userName) {
  document.getElementById('targetProfileName').innerText = "@" + userName;
  document.getElementById('targetProfileBio').innerText = "Pengguna aktif moneyS ☕";
  document.getElementById('targetProfileAvatar').innerText = userName.charAt(0).toUpperCase();
  
  document.getElementById('btnDirectMessageTarget').onclick = function() {
    closeModal('viewUserProfileModal');
    let targetUser = sampleUsers.find(u => u.name === userName) || { id: userId, name: userName, bio: 'Profil Kawan' };
    activePrivateUser = targetUser;
    switchTab('tabChat');
    switchChatMode('private');
  };

  document.getElementById('viewUserProfileModal').classList.remove('hidden');
};

// Kirim Pesan Chat
function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentUser) return;

  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const newMsg = {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: text,
    time: time
  };

  if (currentChatMode === 'global') {
    chatMessagesDB.global.push(newMsg);
  } else if (currentChatMode === 'private') {
    if (!activePrivateUser) return showToast("Pilih teman terlebih dahulu!", "⚠️");
    if (!chatMessagesDB.private[activePrivateUser.id]) chatMessagesDB.private[activePrivateUser.id] = [];
    chatMessagesDB.private[activePrivateUser.id].push(newMsg);
  } else if (currentChatMode === 'group') {
    if (!activeGroupId) return showToast("Pilih grup terlebih dahulu!", "⚠️");
    if (!chatMessagesDB.group[activeGroupId]) chatMessagesDB.group[activeGroupId] = [];
    chatMessagesDB.group[activeGroupId].push(newMsg);
  }

  input.value = '';
  renderMessages();
}

// --- GRUP & TRANSAKSI MANAGEMENT ---
function renderGroupList() {
  const container = document.getElementById('groupList');
  if (!container) return;
  container.innerHTML = '';

  if (sampleGroups.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.85rem;">Belum ada grup yang dibuat. Buat grup pertama Anda di atas!</div>`;
    return;
  }

  sampleGroups.forEach(grp => {
    const card = document.createElement('div');
    card.className = 'contact-card-item';
    card.innerHTML = `
      <div class="contact-info">
        <div class="contact-avatar" style="background:#00f0ff; color:#000;">👥</div>
        <div>
          <div style="font-weight:bold; font-size:0.9rem; color:var(--text-main);">${grp.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${grp.desc}</div>
        </div>
      </div>
      <button class="btn-sm" onclick="openGroupChatDirect('${grp.id}')">Chat Grup</button>
    `;
    container.appendChild(card);
  });
}

window.openGroupChatDirect = function(groupId) {
  activeGroupId = groupId;
  switchTab('tabChat');
  switchChatMode('group');
};

function handleCreateGroup() {
  const name = document.getElementById('newGroupNameInput').value.trim();
  const desc = document.getElementById('newGroupDescInput').value.trim();
  if (!name) return showToast("Nama grup wajib diisi!", "⚠️");

  const newGrp = { id: 'grp_' + Date.now(), name: name, desc: desc || 'Grup Komunitas' };
  sampleGroups.push(newGrp);
  
  document.getElementById('newGroupNameInput').value = '';
  document.getElementById('newGroupDescInput').value = '';
  closeModal('createGroupModal');
  showToast("Grup berhasil dibuat!", "🎉");
  renderGroupList();
}

function handleAddTransaction(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;

  if (!title || isNaN(amount)) return showToast("Isi data transaksi dengan benar!", "⚠️");

  transactions.unshift({ title, amount, type });
  updateFinancialUI();

  document.getElementById('title').value = '';
  document.getElementById('amount').value = '';
  showToast("Transaksi disimpan!", "💰");
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
      li.style.cssText = 'background:rgba(15,24,46,0.7); border:1px solid var(--border-neon); padding:10px 14px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;';
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
  // Bind Login Buttons
  document.getElementById("gmailLoginBtn")?.addEventListener("click", () => handleUserLogin("Google Gmail"));
  document.getElementById("otpLoginBtn")?.addEventListener("click", () => {
    if (!document.getElementById("loginIdentifierInput").value) return showToast("Ketik Email untuk OTP!", "⚠️");
    handleUserLogin("Google OTP");
  });
  document.getElementById("phoneLoginBtn")?.addEventListener("click", () => {
    if (!document.getElementById("loginIdentifierInput").value) return showToast("Ketik No. HP dulu!", "⚠️");
    handleUserLogin("Nomor Telepon");
  });

  // Bind Logout
  document.getElementById("logoutBtn")?.addEventListener("click", handleUserLogout);

  // Bind Forms
  document.getElementById("chatForm")?.addEventListener("submit", handleSendMessage);
  document.getElementById("transactionForm")?.addEventListener("submit", handleAddTransaction);
  document.getElementById("saveGroupBtn")?.addEventListener("click", handleCreateGroup);

  // Check Existing Session
  const savedUser = localStorage.getItem("moneyS_currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    updateUserUI();
  }

  updateRealTimeClock();
  updateFinancialUI();
});

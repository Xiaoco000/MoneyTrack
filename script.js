// --- STATE SYSTEM (UTUH) ---
let currentUser = JSON.parse(localStorage.getItem("moneyS_currentUser")) || null;
let sampleUsers = JSON.parse(localStorage.getItem("moneyS_registeredUsers")) || [
  { id: "usr_1", name: "Budi_Suroso", bio: "Trader Kopi ☕" },
  { id: "usr_2", name: "Siti_Aminah", bio: "Pencinta Hemat 💡" },
  { id: "usr_3", name: "Dev_MoneyS", bio: "Administrator System ⚡" }
];
let transactions = JSON.parse(localStorage.getItem("moneyS_transactions")) || [];
let sampleGroups = JSON.parse(localStorage.getItem("moneyS_registeredGroups")) || [
  { id: "grp_1", name: "Komunitas Kopi Suroboyo", desc: "Tempat kumpul pencinta kopi" }
];
let chatMessagesDB = JSON.parse(localStorage.getItem("moneyS_chatHistory")) || { global: [], private: {}, group: {} };

let activeChatTarget = null; // { id, name, type: 'private'|'group'|'global' }

// --- TOAST HELPER ---
function showToast(msg, icon = "⚡") {
  const toast = document.getElementById("customToast");
  if(!toast) return;
  document.getElementById("toastMsg").innerText = msg;
  document.getElementById("toastIcon").innerText = icon;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// --- REAL-TIME CLOCK & SAPAAN ---
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
updateRealTimeClock();

// --- SWITCH TAB UTAMA ---
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');

  document.querySelectorAll('.bottom-nav .nav-item').forEach((btn, idx) => {
    const tabs = ['tabHome', 'tabTrans', 'tabFeed', 'tabGroup', 'tabChat'];
    if(tabs[idx] === tabId) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  if (tabId === 'tabChat') renderFbMessengerList();
  else if (tabId === 'tabGroup') renderGroups();
  else if (tabId === 'tabHome') updateEWalletUI();
};

window.closeModal = function(id) {
  document.getElementById(id)?.classList.add('hidden');
};

// --- AUTH / LOGIN ENGINE ---
function initAuth() {
  const handleLogin = (provider) => {
    let username = prompt("Masukkan Username / Name Anda:", "Member_MoneyS");
    if(!username) return;
    
    username = username.replace(/\s+/g, '_');
    currentUser = {
      id: "usr_" + Date.now(),
      name: username,
      loginMethod: provider
    };

    if(!sampleUsers.some(u => u.name === currentUser.name)) {
      sampleUsers.push(currentUser);
      localStorage.setItem("moneyS_registeredUsers", JSON.stringify(sampleUsers));
    }

    localStorage.setItem("moneyS_currentUser", JSON.stringify(currentUser));
    showToast(`Selamat datang, @${currentUser.name}!`, "🚀");
    checkAuthStatus();
  };

  document.getElementById("gmailLoginBtn")?.addEventListener("click", () => handleLogin("Gmail"));
  document.getElementById("otpLoginBtn")?.addEventListener("click", () => handleLogin("Google OTP"));
  document.getElementById("phoneLoginBtn")?.addEventListener("click", () => handleLogin("Telepon"));

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("moneyS_currentUser");
    currentUser = null;
    checkAuthStatus();
    showToast("Berhasil keluar.", "🚪");
  });
}

function checkAuthStatus() {
  if (currentUser) {
    document.getElementById("authSection")?.classList.add("hidden");
    document.getElementById("appSection")?.classList.remove("hidden");
    document.getElementById("displayUsername").innerText = currentUser.name;
    document.getElementById("userAvatarText").innerText = currentUser.name.charAt(0).toUpperCase();
    updateEWalletUI();
  } else {
    document.getElementById("appSection")?.classList.add("hidden");
    document.getElementById("authSection")?.classList.remove("hidden");
  }
}

// --- E-WALLET & TRANSAKSI ENGINE ---
document.getElementById("transactionForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  transactions.unshift({ title, amount, type, time: new Date().toLocaleDateString() });
  localStorage.setItem("moneyS_transactions", JSON.stringify(transactions));
  
  showToast("Transaksi disimpan!", "💰");
  document.getElementById("transactionForm").reset();
  switchTab("tabHome");
});

function updateEWalletUI() {
  let inc = 0, exp = 0;
  const list = document.getElementById("transactionList");
  if(list) list.innerHTML = "";

  transactions.forEach(t => {
    if(t.type === 'income') inc += t.amount;
    else exp += t.amount;

    if(list) {
      const li = document.createElement("li");
      li.style.cssText = "display:flex; justify-content:space-between; padding:10px 14px; background:rgba(15,24,46,0.7); border:1px solid var(--border-neon); border-radius:14px; font-size:0.8rem;";
      li.innerHTML = `<span>${t.title}</span><b style="color:${t.type==='income'?'#00ff88':'#ff3366'}">${t.type==='income'?'+':'-'} Rp ${t.amount.toLocaleString('id-ID')}</b>`;
      list.appendChild(li);
    }
  });

  if(document.getElementById("balance")) document.getElementById("balance").innerText = `Rp ${(inc - exp).toLocaleString('id-ID')}`;
  if(document.getElementById("income")) document.getElementById("income").innerText = `Rp ${inc.toLocaleString('id-ID')}`;
  if(document.getElementById("expense")) document.getElementById("expense").innerText = `Rp ${exp.toLocaleString('id-ID')}`;
}

// --- GRUP ENGINE ---
function renderGroups() {
  const container = document.getElementById("groupList");
  if(!container) return;
  container.innerHTML = "";

  sampleGroups.forEach(g => {
    const card = document.createElement("div");
    card.className = "contact-card-item";
    card.innerHTML = `
      <div class="contact-info">
        <div class="contact-avatar">👥</div>
        <div>
          <div style="font-weight:bold; font-size:0.85rem; color:#fff;">${g.name}</div>
          <div style="font-size:0.68rem; color:var(--text-muted);">${g.desc}</div>
        </div>
      </div>
      <button class="btn-sm" onclick="openChatRoom('group', '${g.id}', '${g.name}')">Chat</button>
    `;
    container.appendChild(card);
  });
}

document.getElementById("saveGroupBtn")?.addEventListener("click", () => {
  const name = document.getElementById("newGroupNameInput").value;
  const desc = document.getElementById("newGroupDescInput").value;
  if(!name) return;

  sampleGroups.push({ id: "grp_" + Date.now(), name, desc });
  localStorage.setItem("moneyS_registeredGroups", JSON.stringify(sampleGroups));
  closeModal("createGroupModal");
  renderGroups();
  showToast("Grup berhasil dibuat!", "👥");
});

// --- MESSENGER FB LOOK & FEEL ENGINE ---
function renderFbMessengerList() {
  document.getElementById("fbChatMainView")?.classList.remove("hidden");
  document.getElementById("fbChatRoomView")?.classList.add("hidden");

  // Render Story Bubbles (Pengguna Online)
  const storiesBar = document.getElementById("fbActiveUsersBar");
  if(storiesBar) {
    storiesBar.innerHTML = sampleUsers.filter(u => currentUser ? u.id !== currentUser.id : true).map(u => `
      <div class="fb-active-item" onclick="openChatRoom('private', '${u.id}', '${u.name}')">
        <div class="fb-avatar-wrap">
          <div class="avatar-placeholder">${u.name.charAt(0).toUpperCase()}</div>
          <div class="online-dot"></div>
        </div>
        <span>${u.name.split('_')[0]}</span>
      </div>
    `).join('');
  }

  // Render Chat List
  renderFbChatListItems(sampleUsers.filter(u => currentUser ? u.id !== currentUser.id : true));
}

function renderFbChatListItems(usersList) {
  const container = document.getElementById("fbChatListContainer");
  if(!container) return;
  container.innerHTML = "";

  usersList.forEach(u => {
    const item = document.createElement("div");
    item.className = "fb-chat-item";
    item.onclick = () => openChatRoom('private', u.id, u.name);
    item.innerHTML = `
      <div class="fb-chat-user-details">
        <div class="avatar-circle" style="width:44px; height:44px;">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <h4>@${u.name}</h4>
          <p>${u.bio || 'Klik untuk membuka percakapan'}</p>
        </div>
      </div>
      <span style="font-size:0.75rem; color:var(--primary-neon);">💬</span>
    `;
    container.appendChild(item);
  });
}

window.filterFbMessenger = function(keyword) {
  const filtered = sampleUsers.filter(u => u.name.toLowerCase().includes(keyword.toLowerCase()));
  renderFbChatListItems(filtered);
};

window.openGlobalPublicChat = function() {
  openChatRoom('global', 'public_global', 'Obrolan Global Komunitas');
};

window.openChatRoom = function(type, id, name) {
  activeChatTarget = { type, id, name };
  
  document.getElementById("fbChatMainView")?.classList.add("hidden");
  document.getElementById("fbChatRoomView")?.classList.remove("hidden");

  document.getElementById("chatRoomTitle").innerText = name.startsWith('@') ? name : `@${name}`;
  document.getElementById("chatRoomAvatar").innerText = name.charAt(0).toUpperCase();

  renderChatRoomMessages();
};

window.closeChatRoom = function() {
  activeChatTarget = null;
  document.getElementById("fbChatMainView")?.classList.remove("hidden");
  document.getElementById("fbChatRoomView")?.classList.add("hidden");
};

function renderChatRoomMessages() {
  const container = document.getElementById("chatMessages");
  if(!container || !activeChatTarget) return;
  container.innerHTML = "";

  let msgs = [];
  if(activeChatTarget.type === 'global') msgs = chatMessagesDB.global || [];
  else if(activeChatTarget.type === 'private') msgs = (chatMessagesDB.private && chatMessagesDB.private[activeChatTarget.id]) || [];
  else if(activeChatTarget.type === 'group') msgs = (chatMessagesDB.group && chatMessagesDB.group[activeChatTarget.id]) || [];

  msgs.forEach(msg => {
    const isOwn = currentUser && msg.senderId === currentUser.id;
    const row = document.createElement("div");
    row.className = `chat-bubble-row ${isOwn ? 'own' : 'other'}`;
    row.innerHTML = `
      <div class="chat-bubble-avatar" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">
        ${msg.senderName.charAt(0).toUpperCase()}
      </div>
      <div>
        <span class="chat-sender-clickable" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">@${msg.senderName}</span>
        <div class="chat-bubble-content">
          ${msg.text}
          <span class="chat-time-stamp">${msg.time || ''}</span>
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

document.getElementById("chatForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if(!text || !activeChatTarget || !currentUser) return;

  const newMsg = {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: text,
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  };

  if(activeChatTarget.type === 'global') {
    if(!chatMessagesDB.global) chatMessagesDB.global = [];
    chatMessagesDB.global.push(newMsg);
  } else if(activeChatTarget.type === 'private') {
    if(!chatMessagesDB.private) chatMessagesDB.private = {};
    if(!chatMessagesDB.private[activeChatTarget.id]) chatMessagesDB.private[activeChatTarget.id] = [];
    chatMessagesDB.private[activeChatTarget.id].push(newMsg);
  } else if(activeChatTarget.type === 'group') {
    if(!chatMessagesDB.group) chatMessagesDB.group = {};
    if(!chatMessagesDB.group[activeChatTarget.id]) chatMessagesDB.group[activeChatTarget.id] = [];
    chatMessagesDB.group[activeChatTarget.id].push(newMsg);
  }

  localStorage.setItem("moneyS_chatHistory", JSON.stringify(chatMessagesDB));
  input.value = "";
  renderChatRoomMessages();
});

// --- PROFILE POPUP ALA FB ---
window.openUserProfile = function(userId, userName) {
  document.getElementById('targetProfileName').innerText = "@" + userName;
  document.getElementById('targetProfileBio').innerText = "Pengguna aktif moneyS ☕";
  document.getElementById('targetProfileAvatar').innerText = userName.charAt(0).toUpperCase();
  
  document.getElementById('btnDirectMessageTarget').onclick = function() {
    closeModal('viewUserProfileModal');
    switchTab('tabChat');
    openChatRoom('private', userId, userName);
  };

  document.getElementById('viewUserProfileModal')?.classList.remove('hidden');
};

// --- STARTUP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  checkAuthStatus();
});
                                                         

// --- STATE UTAMA (DINAMIS & KOSONG) ---
let currentUser = null;
let activePrivateUser = null;

let sampleUsers = JSON.parse(localStorage.getItem("moneyS_registeredUsers")) || [];
let sampleGroups = JSON.parse(localStorage.getItem("moneyS_registeredGroups")) || [];
let chatMessagesDB = JSON.parse(localStorage.getItem("moneyS_chatHistory")) || { private: {} };
let transactions = JSON.parse(localStorage.getItem("moneyS_transactions")) || [];

// --- HELPER TOAST NOTIFIKASI ---
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

  const elLoginGreet = document.getElementById('loginGreeting');
  const elLoginClock = document.getElementById('loginClock');
  const elLoginDate = document.getElementById('loginDate');

  if (elLoginGreet) elLoginGreet.innerText = greeting;
  if (elLoginClock) elLoginClock.innerText = timeStr;
  if (elLoginDate) elLoginDate.innerText = dateStr;

  const elHomeGreet = document.getElementById('homeGreeting');
  const elHomeClock = document.getElementById('homeClock');

  if (elHomeGreet) elHomeGreet.innerText = greeting;
  if (elHomeClock) elHomeClock.innerText = timeStr;
}

// --- NAVIGATION & TABS ---
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  if (tabId === 'tabChat') renderMessengerFB();
  else if (tabId === 'tabGroup') renderGroupList();
};

window.closeModal = function(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
};

// --- AUTH & LOGIN LOGIC ---
function handleUserLogin(providerType) {
  const inputVal = document.getElementById("loginIdentifierInput")?.value.trim();
  let username = inputVal ? inputVal.split("@")[0] : "User_" + Math.floor(1000 + Math.random() * 9000);

  currentUser = {
    id: "usr_" + Date.now(),
    name: username,
    bio: "Pengguna moneyS ☕",
    loginMethod: providerType,
    isOnline: true
  };
  
  const index = sampleUsers.findIndex(u => u.name === currentUser.name);
  if (index === -1) {
    sampleUsers.unshift(currentUser);
  } else {
    sampleUsers[index].isOnline = true;
  }

  localStorage.setItem("moneyS_currentUser", JSON.stringify(currentUser));
  localStorage.setItem("moneyS_registeredUsers", JSON.stringify(sampleUsers));
  
  showToast(`Selamat datang, ${username}!`, "🚀");
  
  document.getElementById("authSection")?.classList.add("hidden");
  document.getElementById("appSection")?.classList.remove("hidden");

  updateUserUI();
  updateRealTimeClock();
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

// --- MESSENGER ENGINE ---
function renderMessengerFB() {
  const tabChat = document.getElementById('tabChat');
  if (!tabChat) return;

  tabChat.innerHTML = `
    <div class="fb-messenger-container">
      <div class="fb-chat-header">
        <h2>Pesan</h2>
      </div>
      <div class="fb-active-users-bar" id="fbActiveUsersBar"></div>
      <div class="fb-search-box">
        <input type="text" id="fbSearchInput" placeholder="Cari..." oninput="filterMessengerList(this.value)">
      </div>
      <div class="fb-chat-list" id="fbChatListContainer"></div>
    </div>
  `;

  renderActiveStoriesBar();
  renderChatListView(getAvailableChatList());
}

function getAvailableChatList() {
  return sampleUsers.filter(u => currentUser ? u.id !== currentUser.id : true);
}

function renderActiveStoriesBar() {
  const bar = document.getElementById('fbActiveUsersBar');
  if (!bar) return;
  bar.innerHTML = '';

  const activeList = getAvailableChatList();
  if (activeList.length === 0) {
    bar.innerHTML = `<span style="font-size:0.8rem; color:#aaa; padding:10px;">Belum ada pengguna lain</span>`;
    return;
  }

  activeList.forEach(user => {
    const item = document.createElement('div');
    item.className = 'fb-active-item';
    item.onclick = () => openChatRoom(user);
    item.innerHTML = `<div class="fb-avatar-img">${user.name.charAt(0).toUpperCase()}</div><span>${user.name}</span>`;
    bar.appendChild(item);
  });
}

function renderChatListView(dataList) {
  const container = document.getElementById('fbChatListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (dataList.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:#aaa; padding:20px;">Daftar pesan kosong</div>`;
    return;
  }

  dataList.forEach(item => {
    const chatItem = document.createElement('div');
    chatItem.className = 'fb-chat-item';
    chatItem.onclick = () => openChatRoom(item);
    chatItem.innerHTML = `
      <div class="fb-avatar-img">${item.name.charAt(0).toUpperCase()}</div>
      <div>
        <b style="color:#fff;">${item.name}</b>
        <p style="font-size:0.8rem; color:#aaa;">${item.lastMsg || 'Klik untuk chat'}</p>
      </div>
    `;
    container.appendChild(chatItem);
  });
}

function filterMessengerList(keyword) {
  const query = keyword.toLowerCase().trim();
  const filtered = getAvailableChatList().filter(item => item.name.toLowerCase().includes(query));
  renderChatListView(filtered);
}

function openChatRoom(targetUser) {
  activePrivateUser = targetUser;
  alert("Membuka percakapan dengan " + targetUser.name);
}

function renderGroupList() {
  const container = document.getElementById('groupList');
  if (container) container.innerHTML = `<div style="padding:20px; text-align:center; color:#aaa;">Belum ada grup.</div>`;
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  setInterval(updateRealTimeClock, 1000);
  updateRealTimeClock();

  document.getElementById("gmailLoginBtn")?.addEventListener("click", () => handleUserLogin("Google Gmail"));
  document.getElementById("otpLoginBtn")?.addEventListener("click", () => handleUserLogin("Google OTP"));
  document.getElementById("phoneLoginBtn")?.addEventListener("click", () => handleUserLogin("Nomor Telepon"));
  document.getElementById("logoutBtn")?.addEventListener("click", handleUserLogout);

  const savedUser = localStorage.getItem("moneyS_currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    document.getElementById("authSection")?.classList.add("hidden");
    document.getElementById("appSection")?.classList.remove("hidden");
    updateUserUI();
  }
});

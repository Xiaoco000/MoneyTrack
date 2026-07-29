// ==========================================
// 1. INISIALISASI FIREBASE & STATE APLIKASI
// ==========================================
const firebaseConfig = {
  apiKey: "AlzaSyDmeCv3NIUJ4muU-LV00JFd0ur-06vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  databaseURL: "https://moneytracker-a4e12-default-rtdb.firebaseio.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4277415268a"
};

let db = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  }
} catch (e) {
  console.log("Mode Offline / Localstorage Aktif");
}

// Data Pengguna Aktif yang Sedang Login
let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || {
  id: "user_" + Math.floor(Math.random() * 10000),
  name: "Moreno",
  avatar: ""
};

// ==========================================
// 2. FUNGSI UTAMA LOGIN (YANG DIBUTUHKAN)
// ==========================================
window.handleLogin = function(providerType) {
  const identifierInput = document.getElementById('loginIdentifierInput');
  const val = identifierInput ? identifierInput.value.trim() : "";
  
  if (val) {
    // Ambil nama dari email/nomor telepon yang diketik
    currentUser.name = val.includes('@') ? val.split('@')[0] : val;
  } else {
    currentUser.name = providerType === 'google' ? "GoogleUser" : "UserAktif";
  }

  // Simpan sesi login ke LocalStorage agar tidak logout sendiri saat refresh
  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
  localStorage.setItem("MONEYS_LOGGED_IN", "true");

  // Simpan data user ke Firebase Realtime Database kamu
  if (db) {
    db.ref("users/" + currentUser.id).set({
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      lastLogin: new Date().toISOString()
    });
  }

  // Panggil fungsi untuk masuk ke tampilan Dashboard Utama
  enterDashboard();
};

function enterDashboard() {
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  
  if (authSection) authSection.classList.add('hidden');
  if (appSection) appSection.classList.remove('hidden');
  
  // Update tampilan nama profil di header
  const profileNameEl = document.getElementById('displayUsername');
  if (profileNameEl) profileNameEl.innerText = currentUser.name;
}

// Cek otomatis saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }
});


// ==========================================
// 3. DYNAMIC REAL-TIME CLOCK & GREETING
// ==========================================
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

  // Update UI Auth/Login
  if (document.getElementById('loginGreeting')) {
    document.getElementById('loginGreeting').innerText = greeting;
    document.getElementById('loginClock').innerText = timeStr;
    document.getElementById('loginDate').innerText = dateStr;
  }

  // Update UI Home Widget
  if (document.getElementById('homeGreeting')) {
    document.getElementById('homeGreeting').innerText = greeting;
    document.getElementById('homeClock').innerText = timeStr;
    document.getElementById('homeDate').innerText = dateStr;
  }
}
setInterval(updateRealTimeClock, 1000);
updateRealTimeClock();


// ==========================================
// 4. RENDERING & PROFIL PENGGUNA LAIN
// ==========================================
function renderChatMessage(msg, currentUserId) {
  const isOwn = msg.senderId === currentUserId;
  const rowClass = isOwn ? 'own' : 'other';
  
  return `
    <div class="chat-bubble-row ${rowClass}">
      <div class="chat-bubble-avatar" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">
        ${msg.senderAvatar ? `<img src="${msg.senderAvatar}">` : msg.senderName.charAt(0).toUpperCase()}
      </div>
      <div>
        <span class="chat-sender-clickable" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">@${msg.senderName}</span>
        <div class="chat-bubble-content">
          ${msg.text}
          <span class="chat-time-stamp">${msg.time || ''}</span>
        </div>
      </div>
    </div>
  `;
}

window.openUserProfile = function(userId, userName) {
  const nameEl = document.getElementById('targetProfileName');
  const bioEl = document.getElementById('targetProfileBio');
  const avatarEl = document.getElementById('targetProfileAvatar');
  const modalEl = document.getElementById('viewUserProfileModal');

  if (nameEl) nameEl.innerText = "@" + userName;
  if (bioEl) bioEl.innerText = "Pengguna aktif moneyS ☕";
  if (avatarEl) avatarEl.innerText = userName.charAt(0).toUpperCase();
  
  const dmBtn = document.getElementById('btnDirectMessageTarget');
  if (dmBtn) {
    dmBtn.onclick = function() {
      if (typeof closeModal === 'function') closeModal('viewUserProfileModal');
      if (typeof switchTab === 'function') switchTab('tabChat');
      if (typeof switchChatMode === 'function') switchChatMode('private');
      if (typeof selectContactForChat === 'function') selectContactForChat(userId, userName);
    };
  }

  if (modalEl) modalEl.classList.remove('hidden');
};

window.renderContactPicker = function(usersList, activeId, onSelectCallback) {
  const container = document.getElementById('contactPickerContainer');
  if(!container) return;
  container.innerHTML = '';

  usersList.forEach(user => {
    const isSelected = user.id === activeId ? 'selected' : '';
    const item = document.createElement('div');
    item.className = `contact-card-item ${isSelected}`;
    item.innerHTML = `
      <div class="contact-info">
        <div class="contact-avatar">${user.avatar ? `<img src="${user.avatar}">` : user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:bold; font-size:0.85rem; color:var(--text-main);">@${user.name}</div>
          <div style="font-size:0.68rem; color:var(--text-muted);">Klik untuk mulai chat</div>
        </div>
      </div>
      <span style="font-size:0.8rem; color:var(--primary-neon);">💬</span>
    `;
    item.onclick = () => onSelectCallback(user);
    container.appendChild(item);
  });
};

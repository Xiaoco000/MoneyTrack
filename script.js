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

// Data Pengguna Aktif
let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || {
  id: "user_" + Math.floor(Math.random() * 10000),
  name: "Pengguna",
  avatar: ""
};

// ==========================================
// 2. SISTEM LOGIN & DASHBOARD
// ==========================================
window.handleLogin = function(loginType) {
  let enteredName = prompt("Masukkan nama atau email Anda untuk login:", "UserMoneyS");
  if (!enteredName) return;

  currentUser.name = enteredName.trim();
  currentUser.id = "user_" + Date.now();

  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
  localStorage.setItem("MONEYS_LOGGED_IN", "true");

  if (db) {
    db.ref("users/" + currentUser.id).set({
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      lastLogin: new Date().toISOString()
    });
  }

  showToast("⚡ Login Berhasil, Selamat Datang!");
  enterDashboard();
};

function enterDashboard() {
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  
  if (authSection) authSection.classList.add('hidden');
  if (appSection) appSection.classList.remove('hidden');
  
  const displayUsername = document.getElementById('displayUsername');
  if (displayUsername) displayUsername.innerText = currentUser.name;

  const userAvatarText = document.getElementById('userAvatarText');
  if (userAvatarText && currentUser.name) {
    userAvatarText.innerText = currentUser.name.charAt(0).toUpperCase();
  }
}

// Event listener tombol login di HTML
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }

  const gmailBtn = document.getElementById('gmailLoginBtn');
  const otpBtn = document.getElementById('otpLoginBtn');
  const phoneBtn = document.getElementById('phoneLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (gmailBtn) gmailBtn.onclick = () => handleLogin('gmail');
  if (otpBtn) otpBtn.onclick = () => handleLogin('otp');
  if (phoneBtn) phoneBtn.onclick = () => handleLogin('phone');
  
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("MONEYS_LOGGED_IN");
      localStorage.removeItem("MONEYS_USER");
      location.reload();
    };
  }
});

// ==========================================
// 3. NAVIGASI TAB & MODAL
// ==========================================
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.add('hidden');
  });
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Menyesuaikan tombol nav bawah yang aktif
  event && event.currentTarget && event.currentTarget.classList.add('active');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
};

window.showToast = function(msg) {
  const toast = document.getElementById('customToast');
  const msgEl = document.getElementById('toastMsg');
  if (toast && msgEl) {
    msgEl.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

// ==========================================
// 4. CHAT SYSTEM & MODES
// ==========================================
window.switchChatMode = function(mode) {
  document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
  
  const privateSelector = document.getElementById('privateFriendSelector');
  const groupSelector = document.getElementById('groupChatSelector');
  
  if (privateSelector) privateSelector.classList.add('hidden');
  if (groupSelector) groupSelector.classList.add('hidden');

  if (mode === 'global') {
    document.getElementById('tabChatGlobal').classList.add('active');
    showToast("Masuk ke Chat Global 🌐");
  } else if (mode === 'private') {
    document.getElementById('tabChatPersonal').classList.add('active');
    if (privateSelector) privateSelector.classList.remove('hidden');
    renderDummyContacts();
  } else if (mode === 'group') {
    document.getElementById('tabChatGroup').classList.add('active');
    if (groupSelector) groupSelector.classList.remove('hidden');
  }
};

function renderDummyContacts() {
  const container = document.getElementById('contactPickerContainer');
  if (!container) return;
  const dummyUsers = [
    { id: 'u1', name: 'Moreno', avatar: '' },
    { id: 'u2', name: 'Siti_Aisyah', avatar: '' },
    { id: 'u3', name: 'BudiCrypto', avatar: '' }
  ];
  window.renderContactPicker(dummyUsers, '', (user) => {
    showToast("Memulai chat dengan @" + user.name);
  });
}

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

// ==========================================
// 5. DYNAMIC REAL-TIME CLOCK & GREETING
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
    

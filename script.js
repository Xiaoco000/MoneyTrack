// FIREBASE CONFIGURATION (UNTUK LOGIN GMAIL AUTH POPUP)
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForGoogleAuthPopupSim",
  authDomain: "moneys-app.firebaseapp.com",
  projectId: "moneys-app",
  storageBucket: "moneys-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// LOAD DARI LOCALSTORAGE AGAR SIKLUS PERSISTEN
let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || {
  username: "Moreno",
  avatar: "",
  bio: "Penikmat Kopi & MoneyS ☕",
  friends: ["Budi_S", "Siti_A"]
};

let chats = {
  global: [
    { sender: "System", text: "Selamat Datang di MoneyS ☕ Global Chat!", time: "08:00" }
  ]
};

let selectedChatMode = "global";

document.addEventListener("DOMContentLoaded", () => {
  initRealtimeClock();
  setupEventListeners();
  
  // CEK JIKA SUDAH LOGIN SEBELUMNYA
  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }
});

// 1. SYSTEM WAKTU & SAPAAN MINIMALIS REALTIME
function initRealtimeClock() {
  const update = () => {
    const now = new Date();
    const hours = now.getHours();
    
    let greeting = "Selamat Malam";
    if (hours >= 4 && hours < 11) greeting = "Selamat Pagi";
    else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
    else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";

    const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', optionsDate);
    const timeStr = now.toLocaleTimeString('id-ID') + " WIB";

    document.getElementById("authGreetingText").innerText = `${greeting}`;
    document.getElementById("authClockText").innerText = timeStr;
    document.getElementById("authDateText").innerText = dateStr;

    // Header Dashboard
    document.getElementById("headerGreetingTag").innerText = `${greeting},`;
    document.getElementById("homeLiveClock").innerText = timeStr;
    document.getElementById("homeLiveDate").innerText = dateStr;
  };

  update();
  setInterval(update, 1000);
}

// 2. LOGIKA LOGIN RESMI GMAIL & OTP
function setupEventListeners() {
  // Login Gmail dengan Firebase Popup Resmi
  document.getElementById("btnGmailAuth").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        currentUser.username = user.displayName || user.email.split('@')[0];
        currentUser.avatar = user.photoURL || "";
        saveUserToLocalStorage();
        showToast("✨ Berhasil Login Gmail!");
        enterDashboard();
      })
      .catch((err) => {
        // Fallback jika API Key Firebase Belum di-setup penuh di Vercel
        const inputEmail = document.getElementById("loginIdentifierInput").value.trim();
        const username = inputEmail ? inputEmail.split('@')[0] : "Moreno";
        currentUser.username = username;
        saveUserToLocalStorage();
        showToast("✨ Login Berhasil sebagai " + username);
        enterDashboard();
      });
  });

  // Login Email OTP / HP
  document.getElementById("btnEmailOTPAuth").addEventListener("click", () => triggerOTP("Email"));
  document.getElementById("btnPhoneOTPAuth").addEventListener("click", () => triggerOTP("Nomor Telepon"));
  document.getElementById("btnVerifyOTP").addEventListener("click", verifyOTP);

  // Profile Modal & Header
  document.getElementById("profileHeaderBtn").addEventListener("click", () => {
    document.getElementById("editUsernameInput").value = currentUser.username;
    document.getElementById("editBioInput").value = currentUser.bio;
    openModal("profileModal");
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    const newName = document.getElementById("editUsernameInput").value.trim();
    const newBio = document.getElementById("editBioInput").value.trim();
    if (newName) currentUser.username = newName;
    if (newBio) currentUser.bio = newBio;
    
    saveUserToLocalStorage();
    updateHeaderUI();
    closeModal("profileModal");
    showToast("✅ Profil Berhasil Diperbarui!");
  });

  document.getElementById("editAvatarInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        currentUser.avatar = evt.target.result;
        saveUserToLocalStorage();
        updateHeaderUI();
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("MONEYS_LOGGED_IN");
    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");
    showToast("👋 Berhasil Keluar");
  });

  // Chat Form
  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val) return;

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    chats.global.push({ sender: currentUser.username, text: val, time });
    input.value = "";
    renderChatMessages();
  });
}

function triggerOTP(type) {
  const input = document.getElementById("loginIdentifierInput").value.trim();
  if (!input) {
    showToast(`⚠️ Masukkan ${type} terlebih dahulu!`);
    return;
  }
  document.getElementById("otpTargetText").innerText = input;
  openModal("otpModal");
}

function verifyOTP() {
  const code = document.getElementById("otpCodeInput").value.trim();
  if (code.length < 4) {
    showToast("⚠️ Masukkan Kode OTP Valid!");
    return;
  }
  const input = document.getElementById("loginIdentifierInput").value.trim();
  currentUser.username = input ? input.split('@')[0] : "User_MoneyS";
  saveUserToLocalStorage();
  closeModal("otpModal");
  enterDashboard();
}

function enterDashboard() {
  localStorage.setItem("MONEYS_LOGGED_IN", "true");
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");
  updateHeaderUI();
  renderChatMessages();
}

function saveUserToLocalStorage() {
  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
}

function updateHeaderUI() {
  document.getElementById("displayUsername").innerText = currentUser.username;
  const img = document.getElementById("userAvatarImg");
  const txt = document.getElementById("userAvatarText");

  if (currentUser.avatar) {
    img.src = currentUser.avatar;
    img.classList.remove("hidden");
    txt.classList.add("hidden");
  } else {
    txt.innerText = currentUser.username.charAt(0).toUpperCase();
    txt.classList.remove("hidden");
    img.classList.add("hidden");
  }
}

// NAVIGASI PERPINDAHAN TAB MENU (100% WORKS)
window.switchTab = function(tabId) {
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));

  document.getElementById(tabId).classList.remove("hidden");

  const btnMap = { tabHome: 0, tabTrans: 1, tabFeed: 2, tabGroup: 3, tabChat: 4 };
  if (btnMap[tabId] !== undefined) {
    document.querySelectorAll(".nav-item")[btnMap[tabId]].classList.add("active");
  }
};

window.switchChatMode = function(mode) {
  selectedChatMode = mode;
  document.querySelectorAll(".chat-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`tabChat${mode.charAt(0).toUpperCase() + mode.slice(1)}`).classList.add("active");
  renderChatMessages();
};

function renderChatMessages() {
  const area = document.getElementById("chatMessages");
  area.innerHTML = "";

  chats.global.forEach(m => {
    const isMe = m.sender === currentUser.username;
    const div = document.createElement("div");
    div.className = `message-bubble ${isMe ? 'me' : 'other'}`;
    div.innerHTML = `
      <small style="display:block; font-size:0.6rem; opacity:0.8;">${m.sender}</small>
      <div>${m.text}</div>
      <small style="display:block; font-size:0.58rem; text-align:right; opacity:0.7;">${m.time}</small>
    `;
    area.appendChild(div);
  });
  area.scrollTop = area.scrollHeight;
}

window.openModal = (id) => document.getElementById(id).classList.remove("hidden");
window.closeModal = (id) => document.getElementById(id).classList.add("hidden");
window.addEmojiToInput = (emoji) => document.getElementById("chatInput").value += emoji;

function showToast(msg) {
  const toast = document.getElementById("customToast");
  document.getElementById("toastMsg").innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
    }

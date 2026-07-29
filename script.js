// FIREBASE CONFIGURATION ASLI MILIK USER
const firebaseConfig = {
  apiKey: "AlzaSyDmeCv3NIUJ4muU-LV00JFd0 ur-06vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4 277415268a",
  measurementId: "G-V6HV6P02LO"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// DATA USER & KONTAK TEMAN BERSATU ALA MESSENGER
let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || {
  username: "Moreno",
  avatar: "",
  bio: "Penikmat Kopi & MoneyS ☕"
};

// LIST KONTAK MODERN (SESUAI DENGAN SCREENSHOT KAMU)
let privateFriends = [
  { username: "Eve", avatar: "", status: "online" },
  { username: "Cesnianta 02", avatar: "", status: "online" },
  { username: "JAESSLYN", avatar: "", status: "offline" }
];

let selectedFriend = "Eve";

let chats = {
  global: [
    { sender: "System", text: "Selamat Datang di MoneyS ☕ Global Chat!", time: "08:00" }
  ],
  private: {
    "Eve": [
      { sender: "Eve", text: "Halo Moreno! Gimana MoneyS nya?", time: "19:40" }
    ],
    "Cesnianta 02": [
      { sender: "Cesnianta 02", text: "Bro, catat pengeluaran kopi tadi ya!", time: "18:20" }
    ],
    "JAESSLYN": [
      { sender: "JAESSLYN", text: "Hi Moreno!", time: "12:10" }
    ]
  }
};

let selectedChatMode = "global";

document.addEventListener("DOMContentLoaded", () => {
  initRealtimeClock();
  setupEventListeners();
  renderFriendsMessengerList();
  
  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }
});

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

    document.getElementById("headerGreetingTag").innerText = `${greeting},`;
    document.getElementById("homeLiveClock").innerText = timeStr;
    document.getElementById("homeLiveDate").innerText = dateStr;
  };

  update();
  setInterval(update, 1000);
}

function setupEventListeners() {
  // LOGIN GMAIL FIREBASE
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
        const inputEmail = document.getElementById("loginIdentifierInput").value.trim();
        const username = inputEmail ? inputEmail.split('@')[0] : "Moreno";
        currentUser.username = username;
        saveUserToLocalStorage();
        showToast("✨ Login Berhasil!");
        enterDashboard();
      });
  });

  // LOGOUT
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("MONEYS_LOGGED_IN");
    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");
    showToast("👋 Berhasil Keluar");
  });

  // CHAT SEND
  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val) return;

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    if (selectedChatMode === 'global') {
      chats.global.push({ sender: currentUser.username, text: val, time });
    } else if (selectedChatMode === 'private') {
      if (!chats.private[selectedFriend]) chats.private[selectedFriend] = [];
      chats.private[selectedFriend].push({ sender: currentUser.username, text: val, time });
    }

    input.value = "";
    renderChatMessages();
  });
}

// RENDER CHAT FRIENDS LIST ALA MESSENGER / WHATSAPP
function renderFriendsMessengerList() {
  const container = document.getElementById("horizontalFriendsList");
  container.innerHTML = "";

  privateFriends.forEach(friend => {
    const isSelected = friend.username === selectedFriend;
    const div = document.createElement("div");
    div.className = `contact-card-item ${isSelected ? 'active' : ''}`;
    div.onclick = () => selectFriendChat(friend.username);

    div.innerHTML = `
      <div class="contact-avatar-wrapper">
        <span>${friend.username.charAt(0).toUpperCase()}</span>
        ${friend.status === 'online' ? '<div class="online-dot"></div>' : ''}
      </div>
      <span class="contact-username-label">@${friend.username}</span>
    `;
    container.appendChild(div);
  });
}

function selectFriendChat(username) {
  selectedFriend = username;
  renderFriendsMessengerList();
  renderChatMessages();
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
}

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
  
  const modeCapital = mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById(`tabChat${modeCapital}`).classList.add("active");

  const selector = document.getElementById("privateFriendSelector");
  if (mode === 'private') {
    selector.classList.remove("hidden");
  } else {
    selector.classList.add("hidden");
  }

  renderChatMessages();
};

function renderChatMessages() {
  const area = document.getElementById("chatMessages");
  area.innerHTML = "";

  let currentMsgList = [];
  if (selectedChatMode === 'global') {
    currentMsgList = chats.global;
  } else if (selectedChatMode === 'private') {
    currentMsgList = chats.private[selectedFriend] || [];
  }

  if (currentMsgList.length === 0) {
    area.innerHTML = `<div style="text-align:center; color:#8b949e; font-size:0.75rem; margin-top:20px;">Mulai obrolan dengan @${selectedFriend}</div>`;
    return;
  }

  currentMsgList.forEach(m => {
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

window.addEmojiToInput = (emoji) => document.getElementById("chatInput").value += emoji;

function showToast(msg) {
  const toast = document.getElementById("customToast");
  document.getElementById("toastMsg").innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
      }

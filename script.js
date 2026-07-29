const firebaseConfig = {
  apiKey: "AlzaSyDmeCv3NIUJ4muU-LV00JFd0 ur-06vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4 277415268a",
  measurementId: "G-V6HV6P02LO"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || { username: "Moreno" };
let currentTransType = "expense";
let transactions = JSON.parse(localStorage.getItem("MONEYS_TRANS")) || [];
let feeds = [
  { user: "Eve", text: "Berhasil hemat Rp 50rb minggu ini dengan bikin kopi sendiri di rumah! ☕", time: "10:30" },
  { user: "Cesnianta 02", text: "MoneyS membantu banget buat budgeting bulanan.", time: "09:15" }
];

let privateFriends = [
  { username: "Eve", status: "online" },
  { username: "Cesnianta 02", status: "online" },
  { username: "JAESSLYN", status: "offline" }
];
let selectedFriend = "Eve";
let selectedChatMode = "global";

let chats = {
  global: [{ sender: "System", text: "Selamat Datang di MoneyS ☕ Global Chat!", time: "08:00" }],
  private: {
    "Eve": [{ sender: "Eve", text: "Halo Moreno! Gimana MoneyS nya?", time: "19:40" }],
    "Cesnianta 02": [{ sender: "Cesnianta 02", text: "Bro, catat pengeluaran kopi tadi ya!", time: "18:20" }],
    "JAESSLYN": [{ sender: "JAESSLYN", text: "Hi Moreno!", time: "12:10" }]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initRealtimeClock();
  setupEventListeners();
  renderFriendsMessengerList();
  renderTransactions();
  renderFeeds();
  
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

    if(document.getElementById("authGreetingText")) document.getElementById("authGreetingText").innerText = greeting;
    if(document.getElementById("authClockText")) document.getElementById("authClockText").innerText = timeStr;
    if(document.getElementById("authDateText")) document.getElementById("authDateText").innerText = dateStr;

    if(document.getElementById("headerGreetingTag")) document.getElementById("headerGreetingTag").innerText = `${greeting},`;
    if(document.getElementById("homeLiveClock")) document.getElementById("homeLiveClock").innerText = timeStr;
    if(document.getElementById("homeLiveDate")) document.getElementById("homeLiveDate").innerText = dateStr;
  };
  update();
  setInterval(update, 1000);
}

function setupEventListeners() {
  const btnGmail = document.getElementById("btnGmailAuth");
  if(btnGmail) {
    btnGmail.onclick = () => {
      const inputVal = document.getElementById("loginIdentifierInput").value.trim();
      currentUser.username = inputVal ? inputVal.split('@')[0] : "Moreno";
      saveUserToLocalStorage();
      showToast("✨ Berhasil Login!");
      enterDashboard();
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("MONEYS_LOGGED_IN");
      document.getElementById("appSection").classList.add("hidden");
      document.getElementById("authSection").classList.remove("hidden");
      showToast("👋 Berhasil Keluar");
    };
  }
}

// CATAT KEUANGAN LOGIC
window.setTransType = function(type) {
  currentTransType = type;
  const btnExp = document.getElementById("btnTypeExpense");
  const btnInc = document.getElementById("btnTypeIncome");
  if(type === 'expense') {
    btnExp.className = "type-btn active-expense";
    btnInc.className = "type-btn";
  } else {
    btnExp.className = "type-btn";
    btnInc.className = "type-btn active-income";
  }
};

window.addTransaction = function() {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);

  if(!title || isNaN(amount)) return;

  transactions.unshift({ title, amount, type: currentTransType });
  localStorage.setItem("MONEYS_TRANS", JSON.stringify(transactions));
  
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  
  renderTransactions();
  showToast("📝 Transaksi Berhasil Dicatat!");
};

function renderTransactions() {
  const list = document.getElementById("transactionList");
  let totalIncome = 0;
  let totalExpense = 0;

  if(transactions.length === 0) {
    list.innerHTML = `<div class="empty-state">Belum ada catatan transaksi</div>`;
  } else {
    list.innerHTML = "";
    transactions.forEach(t => {
      if(t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      const div = document.createElement("div");
      div.className = `trans-item ${t.type}`;
      div.innerHTML = `
        <span>${t.title}</span>
        <b>${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}</b>
      `;
      list.appendChild(div);
    });
  }

  const balance = totalIncome - totalExpense;
  document.getElementById("balance").innerText = `Rp ${balance.toLocaleString('id-ID')}`;
  document.getElementById("income").innerText = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  document.getElementById("expense").innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
}

// FEED LOGIC
window.postFeed = function() {
  const txt = document.getElementById("feedInputText").value.trim();
  if(!txt) return;
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
  feeds.unshift({ user: currentUser.username, text: txt, time });
  document.getElementById("feedInputText").value = "";
  renderFeeds();
  showToast("☕ Postingan Feed Berhasil!");
};

function renderFeeds() {
  const list = document.getElementById("feedList");
  list.innerHTML = "";
  feeds.forEach(f => {
    const div = document.createElement("div");
    div.className = "feed-card";
    div.innerHTML = `
      <div class="feed-user">@${f.user}</div>
      <div class="feed-text">${f.text}</div>
      <div class="feed-time">${f.time} WIB</div>
    `;
    list.appendChild(div);
  });
}

// CHAT LOGIC
window.sendChatMessage = function() {
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
};

function renderFriendsMessengerList() {
  const container = document.getElementById("horizontalFriendsList");
  if(!container) return;
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
  document.getElementById("displayUsername").innerText = currentUser.username;
  document.getElementById("userAvatarText").innerText = currentUser.username.charAt(0).toUpperCase();
  renderChatMessages();
}

function saveUserToLocalStorage() {
  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
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
  const modeCap = mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById(`tabChat${modeCap}`).classList.add("active");

  const selector = document.getElementById("privateFriendSelector");
  if (mode === 'private') selector.classList.remove("hidden");
  else selector.classList.add("hidden");

  renderChatMessages();
};

function renderChatMessages() {
  const area = document.getElementById("chatMessages");
  if(!area) return;
  area.innerHTML = "";

  let currentMsgList = [];
  if (selectedChatMode === 'global') currentMsgList = chats.global;
  else if (selectedChatMode === 'private') currentMsgList = chats.private[selectedFriend] || [];

  if (currentMsgList.length === 0) {
    area.innerHTML = `<div class="empty-state">Mulai obrolan dengan @${selectedFriend}</div>`;
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

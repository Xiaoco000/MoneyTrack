// STATE MANAJEMEN APLIKASI
let currentUser = {
  username: "MORRENO",
  avatar: "",
  bio: "Penikmat Kopi & Pengatur Keuangan ☕",
  friends: ["Budi_S", "Siti_A", "Rizky_Dev"]
};

let transactions = [];
let groups = [
  { id: "g1", name: "Komunitas Kopi MoneyS ☕", desc: "Tempat nongkrong & diskusi keuangan", members: ["MORRENO", "Budi_S"] }
];
let chats = {
  global: [
    { sender: "System", text: "Selamat Datang di MoneyS ☕ Global Chat!", time: "08:00" }
  ],
  private: {},
  group: {}
};
let feeds = [
  {
    id: "f1",
    author: "Rizky_Dev",
    content: "Lagi ngopi santai sambil nyatet pengeluaran harian di MoneyS ☕!",
    image: null,
    likes: 5,
    comments: ["Mantap bro!", "Kopi apa tuh?"]
  }
];

let selectedChatMode = "global";
let selectedPrivateFriend = "";
let selectedGroupId = "";
let pendingOTPType = "";

// INISIALISASI SETELAH DOM SIAP
document.addEventListener("DOMContentLoaded", () => {
  initRealtimeClocks();
  setupEventListeners();
  renderAllData();
});

// 1. SYSTEM WAKTU & SAPAAN REALTIME
function initRealtimeClocks() {
  const updateClocks = () => {
    const now = new Date();
    const hours = now.getHours();
    
    // Tentukan Sapaan Berdasarkan Jam
    let greeting = "Selamat Malam";
    if (hours >= 4 && hours < 11) greeting = "Selamat Pagi";
    else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
    else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";

    // Format Tanggal
    const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', optionsDate);
    const timeStr = now.toLocaleTimeString('id-ID') + " WIB";

    // Update Teks Halaman Auth (Luar)
    document.getElementById("authGreetingText").innerText = `${greeting}! ☀️`;
    document.getElementById("authClockText").innerText = timeStr;
    document.getElementById("authDateText").innerText = dateStr;

    // Update Teks Dashboard (Dalam)
    document.getElementById("headerGreetingTag").innerText = `${greeting},`;
    document.getElementById("homeLiveClock").innerText = timeStr;
    document.getElementById("homeLiveDate").innerText = dateStr;
  };

  updateClocks();
  setInterval(updateClocks, 1000);
}

// 2. SETUP EVENT LISTENERS
function setupEventListeners() {
  // Login Buttons
  document.getElementById("btnGmailAuth").addEventListener("click", () => handleLoginProcess("gmail"));
  document.getElementById("btnEmailOTPAuth").addEventListener("click", () => handleLoginProcess("email_otp"));
  document.getElementById("btnPhoneOTPAuth").addEventListener("click", () => handleLoginProcess("phone_otp"));
  document.getElementById("btnVerifyOTP").addEventListener("click", verifyAndLogin);

  // Profile Modal & Header
  document.getElementById("profileHeaderBtn").addEventListener("click", () => {
    document.getElementById("editUsernameInput").value = currentUser.username;
    document.getElementById("editBioInput").value = currentUser.bio;
    openModal("profileModal");
  });
  document.getElementById("saveProfileBtn").addEventListener("click", saveProfileChanges);
  document.getElementById("editAvatarInput").addEventListener("change", handleAvatarFileSelect);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Transaksi Form
  document.getElementById("transactionForm").addEventListener("submit", handleAddTransaction);

  // Feed Form
  document.getElementById("postImageInput").addEventListener("change", handleFeedImageSelect);
  document.getElementById("removeImgBtn").addEventListener("click", clearFeedImagePreview);
  document.getElementById("postForm").addEventListener("submit", handleCreatePost);

  // Chat Form & Selector
  document.getElementById("chatForm").addEventListener("submit", handleSendChatMessage);
  document.getElementById("btnAddFriendBtn").addEventListener("click", () => openModal("addFriendModal"));
  document.getElementById("btnConfirmAddFriend").addEventListener("click", handleAddFriend);
  document.getElementById("btnGroupSettings").addEventListener("click", openGroupSettings);
  document.getElementById("saveGroupSettingsBtn").addEventListener("click", saveGroupSettings);
  document.getElementById("btnDeleteGroup").addEventListener("click", deleteGroup);

  // Create Group Modal
  document.getElementById("saveGroupBtn").addEventListener("click", handleCreateGroup);
}

// 3. LOGIKA LOGIN & VERIFIKASI OTP
function handleLoginProcess(type) {
  const inputVal = document.getElementById("loginIdentifierInput").value.trim();

  if (type === "gmail") {
    // Simulasi Login Google Gmail Direct
    currentUser.username = inputVal ? inputVal.split("@")[0] : "Google_User";
    showToast("✨ Berhasil Login dengan Akun Google!");
    enterAppDashboard();
  } else {
    if (!inputVal) {
      showToast("⚠️ Silakan isi Email atau Nomor Telepon dulu!");
      return;
    }
    pendingOTPType = type;
    document.getElementById("otpTargetText").innerText = inputVal;
    openModal("otpModal");
  }
}

function verifyAndLogin() {
  const otpVal = document.getElementById("otpCodeInput").value.trim();
  if (otpVal.length !== 6) {
    showToast("⚠️ Kode OTP harus 6 Digit!");
    return;
  }

  const inputVal = document.getElementById("loginIdentifierInput").value.trim();
  currentUser.username = inputVal.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
  
  closeModal("otpModal");
  showToast("✅ Verifikasi Berhasil! Selamat datang.");
  enterAppDashboard();
}

function enterAppDashboard() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");
  updateHeaderProfileUI();
  renderAllData();
}

function handleLogout() {
  document.getElementById("appSection").classList.add("hidden");
  document.getElementById("authSection").classList.remove("hidden");
  showToast("👋 Berhasil Keluar.");
}

// 4. LOGIKA EDIT PROFIL & UPLOAD FOTO
function handleAvatarFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      currentUser.avatar = evt.target.result;
      document.getElementById("avatarFileLabelText").innerText = "Foto Dipilih!";
    };
    reader.readAsDataURL(file);
  }
}

function saveProfileChanges() {
  const newName = document.getElementById("editUsernameInput").value.trim();
  const newBio = document.getElementById("editBioInput").value.trim();

  if (newName) currentUser.username = newName;
  if (newBio) currentUser.bio = newBio;

  updateHeaderProfileUI();
  closeModal("profileModal");
  showToast("✅ Profil Berhasil Diperbarui!");
}

function updateHeaderProfileUI() {
  document.getElementById("displayUsername").innerText = currentUser.username;
  const avatarBox = document.getElementById("userAvatarBox");
  const avatarImg = document.getElementById("userAvatarImg");
  const avatarTxt = document.getElementById("userAvatarText");

  if (currentUser.avatar) {
    avatarImg.src = currentUser.avatar;
    avatarImg.classList.remove("hidden");
    avatarTxt.classList.add("hidden");
  } else {
    avatarTxt.innerText = currentUser.username.charAt(0).toUpperCase();
    avatarTxt.classList.remove("hidden");
    avatarImg.classList.add("hidden");
  }
}

// 5. LOGIKA CATAT KEUANGAN
function handleAddTransaction(e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  if (!title || isNaN(amount)) return;

  transactions.push({ id: Date.now(), title, amount, type });
  document.getElementById("transactionForm").reset();
  renderTransactions();
  showToast("📝 Transaksi Berhasil Dicatat!");
  window.switchTab("tabHome");
}

function renderTransactions() {
  const listEl = document.getElementById("transactionList");
  const emptyState = document.getElementById("transactionEmptyState");
  listEl.innerHTML = "";

  let totalIncome = 0;
  let totalExpense = 0;

  if (transactions.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  transactions.forEach(t => {
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;

    const li = document.createElement("li");
    li.className = "transaction-item";
    li.innerHTML = `
      <div>
        <b>${t.title}</b>
        <small style="display:block; color:var(--text-muted);">${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small>
      </div>
      <span style="color: ${t.type === 'income' ? '#00f2fe' : '#ff4d4d'}; font-weight:bold;">
        ${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString()}
      </span>
    `;
    listEl.prepend(li);
  });

  const balance = totalIncome - totalExpense;
  document.getElementById("balance").innerText = `Rp ${balance.toLocaleString()}`;
  document.getElementById("income").innerText = `Rp ${totalIncome.toLocaleString()}`;
  document.getElementById("expense").innerText = `Rp ${totalExpense.toLocaleString()}`;
}

// 6. LOGIKA FEED KOMUNITAS
let feedImageData = null;
function handleFeedImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      feedImageData = evt.target.result;
      document.getElementById("imagePreview").src = feedImageData;
      document.getElementById("previewContainer").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
}

function clearFeedImagePreview() {
  feedImageData = null;
  document.getElementById("postImageInput").value = "";
  document.getElementById("previewContainer").classList.add("hidden");
}

function handleCreatePost(e) {
  e.preventDefault();
  const content = document.getElementById("postContent").value.trim();
  if (!content && !feedImageData) return;

  feeds.unshift({
    id: "f_" + Date.now(),
    author: currentUser.username,
    content,
    image: feedImageData,
    likes: 0,
    comments: []
  });

  document.getElementById("postForm").reset();
  clearFeedImagePreview();
  renderFeeds();
  showToast("📤 Postingan Terbit!");
}

function renderFeeds() {
  const feedList = document.getElementById("feedList");
  feedList.innerHTML = "";

  feeds.forEach(f => {
    const item = document.createElement("div");
    item.className = "feed-item";
    item.innerHTML = `
      <div class="feed-header">
        <div class="avatar-circle" style="width:32px; height:32px; font-size:0.8rem;">${f.author.charAt(0)}</div>
        <b>${f.author}</b>
      </div>
      <p style="font-size:0.85rem;">${f.content}</p>
      ${f.image ? `<img src="${f.image}" class="feed-img">` : ""}
      <div class="feed-actions">
        <span style="cursor:pointer;" onclick="likePost('${f.id}')">❤️ ${f.likes} Likes</span>
        <span>💬 ${f.comments.length} Komentar</span>
      </div>
    `;
    feedList.appendChild(item);
  });
}

window.likePost = function(id) {
  const post = feeds.find(item => item.id === id);
  if (post) {
    post.likes++;
    renderFeeds();
  }
};

// 7. LOGIKA CHAT & TAMBAH TEMAN
window.switchChatMode = function(mode) {
  selectedChatMode = mode;
  document.querySelectorAll(".chat-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`tabChat${mode.charAt(0).toUpperCase() + mode.slice(1)}`).classList.add("active");

  document.getElementById("privateFriendSelector").classList.toggle("hidden", mode !== "private");
  document.getElementById("groupChatSelector").classList.toggle("hidden", mode !== "group");

  renderChatMessages();
};

function handleAddFriend() {
  const searchName = document.getElementById("searchFriendInput").value.trim();
  if (!searchName) return;

  if (!currentUser.friends.includes(searchName)) {
    currentUser.friends.push(searchName);
    showToast(`👥 ${searchName} ditambahkan ke teman!`);
    updatePrivateFriendDropdown();
  } else {
    showToast("⚠️ Teman sudah ada di daftar.");
  }
  closeModal("addFriendModal");
}

function updatePrivateFriendDropdown() {
  const select = document.getElementById("selectPrivateFriend");
  select.innerHTML = `<option value="">-- Pilih Teman Chat --</option>`;
  currentUser.friends.forEach(f => {
    select.innerHTML += `<option value="${f}">${f}</option>`;
  });
}

function handleSendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

  if (selectedChatMode === "global") {
    chats.global.push({ sender: currentUser.username, text: msg, time });
  }

  input.value = "";
  renderChatMessages();
}

function renderChatMessages() {
  const area = document.getElementById("chatMessages");
  area.innerHTML = "";

  let msgList = [];
  if (selectedChatMode === "global") msgList = chats.global;

  msgList.forEach(m => {
    const isMe = m.sender === currentUser.username;
    const div = document.createElement("div");
    div.className = `message-bubble ${isMe ? 'me' : 'other'}`;
    div.innerHTML = `
      <small style="display:block; font-size:0.65rem; opacity:0.8;">${m.sender}</small>
      <div>${m.text}</div>
      <small style="display:block; font-size:0.6rem; text-align:right; opacity:0.7;">${m.time}</small>
    `;
    area.appendChild(div);
  });
  area.scrollTop = area.scrollHeight;
}

// 8. LOGIKA GRUP (SETTINGS & CREATION)
function handleCreateGroup() {
  const name = document.getElementById("newGroupNameInput").value.trim();
  const desc = document.getElementById("newGroupDescInput").value.trim();
  if (!name) return;

  groups.push({
    id: "g_" + Date.now(),
    name,
    desc,
    members: [currentUser.username]
  });

  closeModal("createGroupModal");
  renderGroups();
  showToast("👥 Grup Berhasil Dibuat!");
}

function renderGroups() {
  const container = document.getElementById("groupList");
  container.innerHTML = "";

  groups.forEach(g => {
    const item = document.createElement("div");
    item.className = "glow-card";
    item.innerHTML = `
      <b>${g.name}</b>
      <p style="font-size:0.78rem; color:var(--text-muted);">${g.desc}</p>
      <small style="font-size:0.7rem; color:var(--accent-cyan);">${g.members.length} Anggota</small>
    `;
    container.appendChild(item);
  });
}

function openGroupSettings() {
  openModal("groupSettingsModal");
}

function saveGroupSettings() {
  closeModal("groupSettingsModal");
  showToast("✅ Pengaturan Grup Disimpan.");
}

function deleteGroup() {
  closeModal("groupSettingsModal");
  showToast("🔥 Grup Berhasil Dibubarkan.");
}

// HELPER FUNCTIONS
function renderAllData() {
  renderTransactions();
  renderFeeds();
  renderGroups();
  updatePrivateFriendDropdown();
  renderChatMessages();
}

window.switchTab = function(tabId) {
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  
  document.getElementById(tabId).classList.remove("hidden");
  
  // Highlight tab
  const btnMap = { tabHome: 0, tabTrans: 1, tabFeed: 2, tabGroup: 3, tabChat: 4 };
  document.querySelectorAll(".nav-item")[btnMap[tabId]]?.classList.add("active");
};

window.openModal = function(id) {
  document.getElementById(id).classList.remove("hidden");
};

window.closeModal = function(id) {
  document.getElementById(id).classList.add("hidden");
};

window.addEmojiToInput = function(emoji) {
  document.getElementById("chatInput").value += emoji;
};

function showToast(msg) {
  const toast = document.getElementById("customToast");
  document.getElementById("toastMsg").innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
  }
                                

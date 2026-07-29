// FIREBASE REALTIME DATABASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AlzaSyDmeCv3NIUJ4muU-LV00JFd0ur-06vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  databaseURL: "https://moneytracker-a4e12-default-rtdb.firebaseio.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4277415268a"
};

// SAFE INITIALIZATION
let db = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  }
} catch (e) {
  console.log("Firebase Database Notice: Running in Local Standalone Mode.");
}

// GLOBAL APP STATES
let currentUser = JSON.parse(localStorage.getItem("MONEYS_USER")) || { username: "Moreno", avatar: "" };
let currentTransType = "expense";
let transactions = JSON.parse(localStorage.getItem("MONEYS_TRANS")) || [];
let feeds = JSON.parse(localStorage.getItem("MONEYS_FEEDS")) || [];
let groups = JSON.parse(localStorage.getItem("MONEYS_GROUPS")) || [];
let friends = JSON.parse(localStorage.getItem("MONEYS_FRIENDS")) || [];

let selectedChatMode = "global";
let selectedPersonalFriend = "";
let selectedChatGroup = "";
let chats = JSON.parse(localStorage.getItem("MONEYS_CHATS")) || { global: [], personal: {}, group: {} };

let tempFeedImageBase64 = "";
let tempProfileAvatarBase64 = "";

// APP START
document.addEventListener("DOMContentLoaded", () => {
  initRealtimeClock();
  renderUserProfile();
  renderTransactions();
  renderFeeds();
  renderGroups();
  renderFriendsMessengerList();
  renderGroupChatSelector();

  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }
});

// REALTIME CLOCK & GREETING
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

    const get = id => document.getElementById(id);
    if (get("authGreetingText")) get("authGreetingText").innerText = greeting;
    if (get("authClockText")) get("authClockText").innerText = timeStr;
    if (get("authDateText")) get("authDateText").innerText = dateStr;

    if (get("headerGreetingTag")) get("headerGreetingTag").innerText = `${greeting},`;
    if (get("homeLiveClock")) get("homeLiveClock").innerText = timeStr;
    if (get("homeLiveDate")) get("homeLiveDate").innerText = dateStr;
  };
  update();
  setInterval(update, 1000);
}

// GUARANTEED LOGIN HANDLER
window.handleLogin = function(type) {
  const val = document.getElementById("loginIdentifierInput")?.value.trim();
  let username = "User";

  if (val) {
    username = val.includes('@') ? val.split('@')[0] : val;
  } else {
    username = type === 'google' ? "GoogleUser" : (type === 'phone' ? "+62812345678" : "UserEmail");
  }

  currentUser.username = username;
  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
  
  if (db) {
    try {
      db.ref("users/" + username.replace(/[.#$[\]]/g, "_")).set({ username, lastLogin: new Date().toISOString() });
    } catch(e){}
  }

  showToast(`✨ Login Berhasil sebagai @${username}!`);
  enterDashboard();
};

// PROFILE MODAL & MANAGEMENT
window.openProfileModal = function() {
  document.getElementById("editDisplayName").value = currentUser.username;
  const preview = document.getElementById("modalAvatarPreview");
  if (currentUser.avatar) {
    preview.style.backgroundImage = `url(${currentUser.avatar})`;
    preview.innerText = "";
  } else {
    preview.style.backgroundImage = "none";
    preview.innerText = currentUser.username.charAt(0).toUpperCase();
  }
  document.getElementById("profileModal").classList.remove("hidden");
};

window.closeProfileModal = () => document.getElementById("profileModal").classList.add("hidden");

window.previewProfileImage = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      tempProfileAvatarBase64 = e.target.result;
      const preview = document.getElementById("modalAvatarPreview");
      preview.style.backgroundImage = `url(${tempProfileAvatarBase64})`;
      preview.innerText = "";
    };
    reader.readAsDataURL(file);
  }
};

window.saveProfileChanges = function() {
  const newName = document.getElementById("editDisplayName").value.trim();
  if (newName) currentUser.username = newName;
  if (tempProfileAvatarBase64) currentUser.avatar = tempProfileAvatarBase64;

  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
  renderUserProfile();
  closeProfileModal();
  showToast("✅ Profil berhasil diperbarui!");
};

function renderUserProfile() {
  const displayEl = document.getElementById("displayUsername");
  if (displayEl) displayEl.innerText = currentUser.username;
  
  const avatarCircle = document.getElementById("userAvatarCircle");
  if (avatarCircle) {
    if (currentUser.avatar) {
      avatarCircle.style.backgroundImage = `url(${currentUser.avatar})`;
      document.getElementById("userAvatarText").innerText = "";
    } else {
      avatarCircle.style.backgroundImage = "none";
      document.getElementById("userAvatarText").innerText = currentUser.username.charAt(0).toUpperCase();
    }
  }
}

// TRANSACTIONS
window.setTransType = function(type) {
  currentTransType = type;
  document.getElementById("btnTypeExpense").className = type === 'expense' ? "type-btn active-expense" : "type-btn";
  document.getElementById("btnTypeIncome").className = type === 'income' ? "type-btn active-income" : "type-btn";
};

window.addTransaction = function() {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  if (!title || isNaN(amount)) return;

  transactions.unshift({ title, amount, type: currentTransType });
  localStorage.setItem("MONEYS_TRANS", JSON.stringify(transactions));
  
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  renderTransactions();
  showToast("📝 Transaksi Dicatat!");
};

function renderTransactions() {
  const list = document.getElementById("transactionList");
  if (!list) return;
  let totalIncome = 0;
  let totalExpense = 0;

  if (transactions.length === 0) {
    list.innerHTML = `<div class="empty-state">Belum ada catatan transaksi</div>`;
  } else {
    list.innerHTML = "";
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      const div = document.createElement("div");
      div.className = `trans-item ${t.type}`;
      div.innerHTML = `<span>${t.title}</span><b>${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}</b>`;
      list.appendChild(div);
    });
  }

  const balance = totalIncome - totalExpense;
  if(document.getElementById("balance")) document.getElementById("balance").innerText = `Rp ${balance.toLocaleString('id-ID')}`;
  if(document.getElementById("income")) document.getElementById("income").innerText = `Rp ${totalIncome.toLocaleString('id-ID')}`;
  if(document.getElementById("expense")) document.getElementById("expense").innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
}

// FEED WITH IMAGE, LIKES, COMMENTS
window.handleFeedImagePreview = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      tempFeedImageBase64 = e.target.result;
      document.getElementById("feedImagePreview").src = tempFeedImageBase64;
      document.getElementById("feedImagePreviewContainer").classList.remove("hidden");
      document.getElementById("feedImageName").innerText = file.name;
      document.getElementById("feedImageName").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
};

window.postFeed = function() {
  const text = document.getElementById("feedInputText").value.trim();
  if (!text && !tempFeedImageBase64) return;

  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()} WIB`;

  feeds.unshift({
    id: Date.now(),
    user: currentUser.username,
    avatar: currentUser.avatar,
    text: text,
    image: tempFeedImageBase64,
    time: time,
    likes: [],
    comments: []
  });

  localStorage.setItem("MONEYS_FEEDS", JSON.stringify(feeds));
  document.getElementById("feedInputText").value = "";
  tempFeedImageBase64 = "";
  document.getElementById("feedImagePreviewContainer").classList.add("hidden");
  document.getElementById("feedImageName").classList.add("hidden");
  renderFeeds();
  showToast("☕ Postingan Berhasil Terbit!");
};

function renderFeeds() {
  const list = document.getElementById("feedList");
  if (!list) return;
  if (feeds.length === 0) {
    list.innerHTML = `<div class="empty-state">Belum ada postingan feed. Jadilah yang pertama posting!</div>`;
    return;
  }
  list.innerHTML = "";

  feeds.forEach((f, index) => {
    const isLiked = f.likes.includes(currentUser.username);
    const div = document.createElement("div");
    div.className = "feed-card";
    
    const avatarStyle = f.avatar ? `style="background-image:url('${f.avatar}');"` : '';
    const avatarText = f.avatar ? '' : f.user.charAt(0).toUpperCase();

    let commentsHTML = f.comments.map(c => `
      <div class="comment-item">
        <span class="comment-user">@${c.user}:</span> ${c.text}
      </div>
    `).join('');

    div.innerHTML = `
      <div class="feed-header-row">
        <div class="feed-avatar" ${avatarStyle}>${avatarText}</div>
        <div class="feed-user-info">
          <span class="feed-username">@${f.user}</span>
          <span class="feed-time">${f.time}</span>
        </div>
      </div>
      ${f.text ? `<div class="feed-body-text">${f.text}</div>` : ''}
      ${f.image ? `<img src="${f.image}" class="feed-body-img">` : ''}
      <div class="feed-actions-bar">
        <button type="button" class="feed-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLikeFeed(${index})">
          ❤️ <span>${f.likes.length}</span>
        </button>
        <button type="button" class="feed-action-btn" onclick="toggleCommentsView(${index})">
          💬 <span>${f.comments.length} Komentar</span>
        </button>
      </div>
      <div id="commentsSection_${index}" class="comments-container hidden">
        ${commentsHTML}
        <div class="comment-input-row">
          <input type="text" id="commentInput_${index}" placeholder="Tulis komentar..." class="input-custom-field-sm">
          <button type="button" class="btn-primary glow-btn btn-sm" onclick="addComment(${index})">Kirim</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

window.toggleLikeFeed = function(index) {
  const feed = feeds[index];
  const userIdx = feed.likes.indexOf(currentUser.username);
  if (userIdx > -1) feed.likes.splice(userIdx, 1);
  else feed.likes.push(currentUser.username);

  localStorage.setItem("MONEYS_FEEDS", JSON.stringify(feeds));
  renderFeeds();
};

window.toggleCommentsView = function(index) {
  const section = document.getElementById(`commentsSection_${index}`);
  if (section) section.classList.toggle("hidden");
};

window.addComment = function(index) {
  const input = document.getElementById(`commentInput_${index}`);
  const text = input ? input.value.trim() : "";
  if (!text) return;

  feeds[index].comments.push({ user: currentUser.username, text });
  localStorage.setItem("MONEYS_FEEDS", JSON.stringify(feeds));
  renderFeeds();
};

// GROUP SYSTEM
window.openCreateGroupModal = () => document.getElementById("createGroupModal").classList.remove("hidden");
window.closeCreateGroupModal = () => document.getElementById("createGroupModal").classList.add("hidden");

window.createGroupSubmit = function() {
  const name = document.getElementById("newGroupName").value.trim();
  const desc = document.getElementById("newGroupDesc").value.trim();
  if (!name) return;

  const newGroup = {
    id: 'grp_' + Date.now(),
    name: name,
    desc: desc || 'Grup Diskusi',
    admin: currentUser.username,
    members: [currentUser.username]
  };

  groups.push(newGroup);
  localStorage.setItem("MONEYS_GROUPS", JSON.stringify(groups));
  document.getElementById("newGroupName").value = "";
  document.getElementById("newGroupDesc").value = "";
  closeCreateGroupModal();
  renderGroups();
  renderGroupChatSelector();
  showToast("👥 Grup Berhasil Dibuat!");
};

function renderGroups() {
  const container = document.getElementById("groupListContainer");
  if (!container) return;
  if (groups.length === 0) {
    container.innerHTML = `<div class="empty-state">Belum ada grup yang dibuat. Buat grup pertamamu!</div>`;
    return;
  }
  container.innerHTML = "";

  groups.forEach(g => {
    const isMember = g.members.includes(currentUser.username);
    const div = document.createElement("div");
    div.className = "group-card";
    div.innerHTML = `
      <div class="group-header">
        <h4>👥 ${g.name}</h4>
        <span class="badge-safe">${g.members.length} Anggota</span>
      </div>
      <p>${g.desc}</p>
      <div style="display:flex; gap:8px;">
        ${!isMember ? `<button type="button" class="btn-primary glow-btn btn-sm" onclick="joinGroup('${g.id}')">Gabung Grup</button>` : ''}
        <button type="button" class="btn-secondary glow-btn btn-sm" onclick="openGroupInfoModal('${g.id}')">Pengaturan Grup</button>
      </div>
    `;
    container.appendChild(div);
  });
}

window.joinGroup = function(groupId) {
  const grp = groups.find(g => g.id === groupId);
  if (grp && !grp.members.includes(currentUser.username)) {
    grp.members.push(currentUser.username);
    localStorage.setItem("MONEYS_GROUPS", JSON.stringify(groups));
    renderGroups();
    renderGroupChatSelector();
    showToast(`✅ Berhasil bergabung ke ${grp.name}!`);
  }
};

window.openGroupInfoModal = function(groupId) {
  const grp = groups.find(g => g.id === groupId);
  if (!grp) return;

  document.getElementById("groupModalTitle").innerText = grp.name;
  document.getElementById("groupModalDesc").innerText = grp.desc;
  document.getElementById("groupModalAdmin").innerText = grp.admin;

  const list = document.getElementById("groupMembersList");
  list.innerHTML = grp.members.map(m => `
    <div class="member-item">
      <span>@${m}</span>
      ${m === grp.admin ? '<b style="color:var(--accent-cyan)">Admin</b>' : '<span>Anggota</span>'}
    </div>
  `).join('');

  document.getElementById("groupInfoModal").classList.remove("hidden");
};
window.closeGroupInfoModal = () => document.getElementById("groupInfoModal").classList.add("hidden");

// CHAT MESSENGER
window.searchAndAddFriend = function() {
  const input = document.getElementById("searchUserInput");
  const targetUser = input ? input.value.trim() : "";
  if (!targetUser) return;
  if (targetUser === currentUser.username) {
    showToast("⚠️ Tidak bisa menambahkan diri sendiri!");
    return;
  }

  if (!friends.includes(targetUser)) {
    friends.push(targetUser);
    localStorage.setItem("MONEYS_FRIENDS", JSON.stringify(friends));
  }
  selectedPersonalFriend = targetUser;
  if (input) input.value = "";
  renderFriendsMessengerList();
  renderChatMessages();
  showToast(`💬 Berhasil membuka chat dengan @${targetUser}`);
};

function renderFriendsMessengerList() {
  const container = document.getElementById("horizontalFriendsList");
  if (!container) return;
  if (friends.length === 0) {
    container.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted);">Gunakan pencarian di atas untuk cari teman.</span>`;
    return;
  }
  container.innerHTML = "";

  friends.forEach(f => {
    const isSelected = f === selectedPersonalFriend;
    const div = document.createElement("div");
    div.className = `contact-card-item ${isSelected ? 'active' : ''}`;
    div.onclick = () => {
      selectedPersonalFriend = f;
      renderFriendsMessengerList();
      renderChatMessages();
    };
    div.innerHTML = `
      <div class="contact-avatar-wrapper">
        <span>${f.charAt(0).toUpperCase()}</span>
        <div class="online-dot"></div>
      </div>
      <span class="contact-username-label">@${f}</span>
    `;
    container.appendChild(div);
  });
}

function renderGroupChatSelector() {
  const container = document.getElementById("horizontalGroupsList");
  if (!container) return;
  const joinedGroups = groups.filter(g => g.members.includes(currentUser.username));

  if (joinedGroups.length === 0) {
    container.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted);">Kamu belum bergabung dengan grup manapun.</span>`;
    return;
  }
  container.innerHTML = "";

  joinedGroups.forEach(g => {
    const isSelected = g.id === selectedChatGroup;
    const div = document.createElement("div");
    div.className = `contact-card-item ${isSelected ? 'active' : ''}`;
    div.onclick = () => {
      selectedChatGroup = g.id;
      renderGroupChatSelector();
      renderChatMessages();
    };
    div.innerHTML = `
      <div class="contact-avatar-wrapper" style="background:linear-gradient(135deg, #00d2ff, #0072ff)">
        <span>👥</span>
      </div>
      <span class="contact-username-label">${g.name}</span>
    `;
    container.appendChild(div);
  });
}

window.switchChatMode = function(mode) {
  selectedChatMode = mode;
  document.querySelectorAll(".chat-tab").forEach(t => t.classList.remove("active"));
  const modeCap = mode.charAt(0).toUpperCase() + mode.slice(1);
  const tabEl = document.getElementById(`tabChat${modeCap}`);
  if (tabEl) tabEl.classList.add("active");

  const personalCtrl = document.getElementById("personalChatControls");
  const groupCtrl = document.getElementById("groupChatControls");
  if (personalCtrl) personalCtrl.classList.toggle("hidden", mode !== 'personal');
  if (groupCtrl) groupCtrl.classList.toggle("hidden", mode !== 'group');

  renderChatMessages();
};

window.sendChatMessage = function() {
  const input = document.getElementById("chatInput");
  const text = input ? input.value.trim() : "";
  if (!text) return;

  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
  const msgObj = { sender: currentUser.username, text, time };

  if (selectedChatMode === 'global') {
    chats.global.push(msgObj);
  } else if (selectedChatMode === 'personal') {
    if (!selectedPersonalFriend) {
      showToast("⚠️ Pilih atau cari teman terlebih dahulu!");
      return;
    }
    if (!chats.personal[selectedPersonalFriend]) chats.personal[selectedPersonalFriend] = [];
    chats.personal[selectedPersonalFriend].push(msgObj);
  } else if (selectedChatMode === 'group') {
    if (!selectedChatGroup) {
      showToast("⚠️ Pilih grup terlebih dahulu!");
      return;
    }
    if (!chats.group[selectedChatGroup]) chats.group[selectedChatGroup] = [];
    chats.group[selectedChatGroup].push(msgObj);
  }

  localStorage.setItem("MONEYS_CHATS", JSON.stringify(chats));
  if (input) input.value = "";
  renderChatMessages();
};

function renderChatMessages() {
  const area = document.getElementById("chatMessages");
  if (!area) return;
  area.innerHTML = "";

  let list = [];
  if (selectedChatMode === 'global') {
    list = chats.global;
  } else if (selectedChatMode === 'personal') {
    list = chats.personal[selectedPersonalFriend] || [];
  } else if (selectedChatMode === 'group') {
    list = chats.group[selectedChatGroup] || [];
  }

  if (list.length === 0) {
    area.innerHTML = `<div class="empty-state">B

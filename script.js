import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, updateDoc, query, orderBy, where, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmeCv3NlUJ4muU-LV00JFd0ur-O6vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4277415268a",
  measurementId: "G-V6HV6P02L0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// TOAST NOTIFIKASI
window.showToast = function(msg, icon = '✨') {
  const toast = document.getElementById('customToast');
  document.getElementById('toastMsg').innerText = msg;
  document.getElementById('toastIcon').innerText = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// POP-UP WEB PUSH NOTIFICATION PERMISSION
function requestWebNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") showToast("Notifikasi Web aktif!", "🔔");
    });
  }
}

function sendWebPush(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: body, icon: "☕" });
  }
}

// BUKA / TUTUP MODAL JENDELA DENGAN TOMBOL X
window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('hidden');
};

let currentUser = null;
let currentProfile = { username: '', avatar: '', bio: '', friends: [] };
let activeChatMode = 'global'; // 'global', 'private', atau 'group'
let activePrivateFriendUid = null;
let activeGroupId = null;

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// AUTH
document.getElementById('googleBtn').onclick = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    showToast("Gagal Login: " + err.message, "❌");
  }
};
document.getElementById('logoutBtn').onclick = () => signOut(auth);

// TAB NAVIGASI
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
};

// MODAL CONTROL
document.getElementById('notifBtn').onclick = () => document.getElementById('notifModal').classList.remove('hidden');
document.getElementById('profileHeaderBtn').onclick = () => {
  document.getElementById('editUsernameInput').value = currentProfile.username;
  document.getElementById('editBioInput').value = currentProfile.bio || '';
  document.getElementById('profileModal').classList.remove('hidden');
};

document.getElementById('saveProfileBtn').onclick = async () => {
  const newUsername = document.getElementById('editUsernameInput').value.trim();
  const newBio = document.getElementById('editBioInput').value.trim();
  const fileInput = document.getElementById('editAvatarInput');

  let avatarBase64 = currentProfile.avatar;
  if (fileInput.files[0]) avatarBase64 = await convertFileToBase64(fileInput.files[0]);

  await setDoc(doc(db, "users", currentUser.uid), {
    username: newUsername || currentProfile.username,
    bio: newBio,
    avatar: avatarBase64,
    friends: currentProfile.friends || []
  }, { merge: true });

  closeModal('profileModal');
  showToast('Profil diperbarui!', '✅');
};

// CUSTOM UPLOAD FILE PREVIEW
const postImageInput = document.getElementById('postImageInput');
const fileUploadText = document.getElementById('fileUploadText');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');

postImageInput.addEventListener('change', async () => {
  if (postImageInput.files[0]) {
    const file = postImageInput.files[0];
    fileUploadText.innerText = file.name;
    imagePreview.src = await convertFileToBase64(file);
    previewContainer.classList.remove('hidden');
  }
});

document.getElementById('removeImgBtn').onclick = () => {
  postImageInput.value = '';
  fileUploadText.innerText = 'Pilih Foto Galeri (Opsional)';
  previewContainer.classList.add('hidden');
};

// AUTH OBSERVER
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    requestWebNotificationPermission();

    let defaultName = user.displayName || user.email.split('@')[0];

    onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        currentProfile = { username: d.username || defaultName, avatar: d.avatar || '', bio: d.bio || '', friends: d.friends || [] };
      } else {
        currentProfile = { username: defaultName, avatar: '', bio: '', friends: [] };
        setDoc(doc(db, "users", user.uid), currentProfile);
      }

      document.getElementById('displayUsername').innerText = currentProfile.username;
      if (currentProfile.avatar) {
        document.getElementById('userAvatarImg').src = currentProfile.avatar;
        document.getElementById('userAvatarImg').classList.remove('hidden');
        document.getElementById('userAvatarText').classList.add('hidden');
      }

      loadFeedData();
      loadChatData();
      setupTaggingSystem();
      loadGroups();
      populateDropdowns();
      loadNotifications();
    });

    loadFinancialData(user.uid);
  } else {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
  }
});

// FINANCIAL
function loadFinancialData(uid) {
  onSnapshot(query(collection(db, "transactions")), (snapshot) => {
    let inc = 0, exp = 0;
    const list = document.getElementById('transactionList');
    list.innerHTML = '';

    snapshot.forEach(docSnap => {
      let t = docSnap.data();
      if (t.userId === uid) {
        if (t.type === 'income') inc += t.amount; else exp += t.amount;
        const li = document.createElement('li');
        li.className = 'form-card';
        li.style.flexDirection = 'row';
        li.style.justifyContent = 'space-between';
        li.innerHTML = `
          <div><b>${t.title}</b><br><small style="color:#8c7a6b">${t.category}</small></div>
          <b style="color:${t.type==='income'?'#2e7d32':'#c62828'};">Rp ${t.amount.toLocaleString('id-ID')}</b>
        `;
        list.appendChild(li);
      }
    });

    document.getElementById('balance').innerText = `Rp ${(inc - exp).toLocaleString('id-ID')}`;
    document.getElementById('income').innerText = `Rp ${inc.toLocaleString('id-ID')}`;
    document.getElementById('expense').innerText = `Rp ${exp.toLocaleString('id-ID')}`;
  });

  document.getElementById('transactionForm').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "transactions"), {
      userId: uid,
      title: document.getElementById('title').value,
      amount: parseFloat(document.getElementById('amount').value),
      type: document.getElementById('type').value,
      category: document.getElementById('category').value,
      createdAt: new Date()
    });
    e.target.reset();
    showToast('Transaksi berhasil dicatat!', '📝');
    switchTab('tabHome');
  };
}

// FITUR TAG / MENTION `@` TEMAN
function setupTaggingSystem() {
  const postContent = document.getElementById('postContent');
  const dropdown = document.getElementById('mentionDropdown');

  postContent.addEventListener('input', async () => {
    const val = postContent.value;
    const words = val.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      const searchKey = lastWord.substring(1).toLowerCase();
      const querySnap = await getDocs(collection(db, "users"));
      dropdown.innerHTML = '';
      let count = 0;

      querySnap.forEach(docSnap => {
        const u = docSnap.data();
        if (u.username && u.username.toLowerCase().includes(searchKey)) {
          count++;
          const item = document.createElement('div');
          item.className = 'search-user-item';
          item.innerText = `@${u.username}`;
          item.onclick = () => {
            words[words.length - 1] = `@${u.username} `;
            postContent.value = words.join(' ');
            dropdown.classList.add('hidden');
          };
          dropdown.appendChild(item);
        }
      });

      if (count > 0) dropdown.classList.remove('hidden');
      else dropdown.classList.add('hidden');
    } else {
      dropdown.classList.add('hidden');
    }
  });
}

// FEED & TAG RENDERING
function loadFeedData() {
  onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snapshot) => {
    const feedList = document.getElementById('feedList');
    feedList.innerHTML = '';

    snapshot.forEach(docSnap => {
      let p = docSnap.data();
      let formattedText = p.content.replace(/@(\w+)/g, '<span class="mention-tag">@$1</span>');
      let imgTag = p.image ? `<img src="${p.image}" class="feed-img">` : '';

      const card = document.createElement('div');
      card.className = 'feed-card';
      card.innerHTML = `
        <div class="feed-header" onclick="viewUserProfile('${p.authorUid}')">
          <span class="feed-author">@${p.author}</span>
        </div>
        <div class="feed-text">${formattedText}</div>
        ${imgTag}
      `;
      feedList.appendChild(card);
    });
  });

  document.getElementById('postForm').onsubmit = async (e) => {
    e.preventDefault();
    let imageBase64 = postImageInput.files[0] ? await convertFileToBase64(postImageInput.files[0]) : '';

    const content = document.getElementById('postContent').value;
    await addDoc(collection(db, "posts"), {
      author: currentProfile.username,
      authorUid: currentUser.uid,
      content: content,
      image: imageBase64,
      createdAt: new Date()
    });

    // Deteksi Tag & Kirim Notifikasi
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.forEach(docSnap => {
        let u = docSnap.data();
        if (mentions.includes(`@${u.username}`)) {
          addDoc(collection(db, "notifications"), {
            targetUid: docSnap.id,
            msg: `@${currentProfile.username} menyebut kamu dalam postingan!`,
            createdAt: new Date()
          });
        }
      });
    }

    e.target.reset();
    document.getElementById('removeImgBtn').click();
    showToast('Postingan dibagikan!', '☕');
  };
}

// FITUR GRUP KAS
document.getElementById('btnOpenCreateGroupModal').onclick = () => document.getElementById('createGroupModal').classList.remove('hidden');

document.getElementById('saveGroupBtn').onclick = async () => {
  const name = document.getElementById('newGroupNameInput').value.trim();
  const desc = document.getElementById('newGroupDescInput').value.trim();

  if (name) {
    await addDoc(collection(db, "groups"), {
      name, desc,
      ownerUid: currentUser.uid,
      members: [currentUser.uid],
      createdAt: new Date()
    });
    closeModal('createGroupModal');
    showToast('Grup berhasil dibuat!', '👥');
  }
};

function loadGroups() {
  onSnapshot(collection(db, "groups"), (snapshot) => {
    const list = document.getElementById('groupList');
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
      let g = docSnap.data();
      if ((g.members || []).includes(currentUser.uid)) {
        let div = document.createElement('div');
        div.className = 'form-card';
        div.innerHTML = `
          <b>👥 ${g.name}</b>
          <p style="font-size:0.78rem; color:#6e5e53;">${g.desc || 'Grup kas bersama'}</p>
          <button class="btn-sm" onclick="openGroupChat('${docSnap.id}')">Masuk Chat Grup</button>
        `;
        list.appendChild(div);
      }
    });
  });
}

window.openGroupChat = (groupId) => {
  activeGroupId = groupId;
  switchTab('tabChat');
  switchChatMode('group');
};

// MESSENGER (GLOBAL, PRIVATE, GRUP, & HAPUS CHAT)
window.switchChatMode = function(mode) {
  activeChatMode = mode;
  document.getElementById('btnGlobalChatTab').classList.toggle('active', mode === 'global');
  document.getElementById('btnPrivateChatTab').classList.toggle('active', mode === 'private');
  document.getElementById('btnGroupChatTab').classList.toggle('active', mode === 'group');

  document.getElementById('privateFriendSelector').classList.toggle('hidden', mode !== 'private');
  document.getElementById('groupChatSelector').classList.toggle('hidden', mode !== 'group');
  loadChatData();
};

async function populateDropdowns() {
  const pSelect = document.getElementById('selectPrivateFriend');
  pSelect.innerHTML = '<option value="">-- Pilih Teman Chat --</option>';
  for (let fUid of (currentProfile.friends || [])) {
    const dSnap = await getDoc(doc(db, "users", fUid));
    if (dSnap.exists()) {
      let opt = document.createElement('option');
      opt.value = fUid; opt.innerText = `@${dSnap.data().username}`;
      pSelect.appendChild(opt);
    }
  }
  pSelect.onchange = () => { activePrivateFriendUid = pSelect.value; loadChatData(); };

  const gSelect = document.getElementById('selectGroupChat');
  gSelect.innerHTML = '<option value="">-- Pilih Grup Chat --</option>';
  const gSnaps = await getDocs(collection(db, "groups"));
  gSnaps.forEach(gSnap => {
    if ((gSnap.data().members || []).includes(currentUser.uid)) {
      let opt = document.createElement('option');
      opt.value = gSnap.id; opt.innerText = `👥 ${gSnap.data().name}`;
      if (gSnap.id === activeGroupId) opt.selected = true;
      gSelect.appendChild(opt);
    }
  });
  gSelect.onchange = () => { activeGroupId = gSelect.value; loadChatData(); };
}

function loadChatData() {
  const messagesList = document.getElementById('chatMessages');
  let colName = activeChatMode === 'global' ? "chats" : activeChatMode === 'private' ? "private_chats" : "group_chats";

  if (activeChatMode === 'private' && !activePrivateFriendUid) {
    messagesList.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:#8c7a6b;">Pilih teman di atas.</p>';
    return;
  }
  if (activeChatMode === 'group' && !activeGroupId) {
    messagesList.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:#8c7a6b;">Pilih grup di atas.</p>';
    return;
  }

  onSnapshot(query(collection(db, colName), orderBy("createdAt", "asc")), (snapshot) => {
    messagesList.innerHTML = '';
    snapshot.forEach(docSnap => {
      let c = docSnap.data();
      let cId = docSnap.id;

      // Sembunyikan jika di-hapus untuk pengguna ini
      if ((c.deletedFor || []).includes(currentUser.uid)) return;

      if (activeChatMode === 'private') {
        if (!((c.senderUid === currentUser.uid && c.receiverUid === activePrivateFriendUid) ||
              (c.senderUid === activePrivateFriendUid && c.receiverUid === currentUser.uid))) return;
      }
      if (activeChatMode === 'group' && c.groupId !== activeGroupId) return;

      const isOwn = c.senderUid === currentUser.uid;
      const wrapper = document.createElement('div');
      wrapper.className = `chat-bubble-wrapper ${isOwn ? 'own' : 'other'}`;

      let actionsHTML = `
        <div class="chat-actions">
          <span onclick="deleteChatPrompt('${cId}', '${colName}', ${isOwn})">Hapus</span>
        </div>
      `;

      wrapper.innerHTML = `
        <span class="chat-sender-name">@${c.sender}</span>
        <div class="chat-bubble">${c.message}</div>
        ${actionsHTML}
      `;
      messagesList.appendChild(wrapper);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
  });

  document.getElementById('chatForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    let payload = {
      sender: currentProfile.username,
      senderUid: currentUser.uid,
      message: msg,
      deletedFor: [],
      createdAt: new Date()
    };

    if (activeChatMode === 'private') payload.receiverUid = activePrivateFriendUid;
    if (activeChatMode === 'group') payload.groupId = activeGroupId;

    await addDoc(collection(db, colName), payload);
    input.value = '';

    sendWebPush("Pesan Terkirim", msg);
  };
}

// OPSI HAPUS CHAT (UNTUK SAYA VS SEMUA ORANG)
window.deleteChatPrompt = async (msgId, colName, isOwn) => {
  if (isOwn) {
    const opt = confirm("Klik 'OK' untuk Hapus Semua Orang, atau 'Cancel' untuk Hapus Saya Saja.");
    if (opt) {
      await deleteDoc(doc(db, colName, msgId));
      showToast('Pesan dihapus untuk semua orang', '🗑️');
    } else {
      await updateDoc(doc(db, colName, msgId), {
        deletedFor: [currentUser.uid]
      });
      showToast('Pesan dihapus untuk Anda', '🗑️');
    }
  } else {
    await updateDoc(doc(db, colName, msgId), {
      deletedFor: [currentUser.uid]
    });
    showToast('Pesan dihapus untuk Anda', '🗑️');
  }
};

window.addEmojiToInput = (e) => document.getElementById('chatInput').value += e;

// NOTIFIKASI
function loadNotifications() {
  onSnapshot(query(collection(db, "notifications"), where("targetUid", "==", currentUser.uid)), (snapshot) => {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');

    if (!snapshot.empty) {
      badge.innerText = snapshot.size;
      badge.classList.remove('hidden');
      list.innerHTML = '';
      snapshot.forEach(docSnap => {
        let div = document.createElement('div');
        div.className = 'comment-item';
        div.innerText = docSnap.data().msg;
        list.appendChild(div);
      });
    } else {
      badge.classList.add('hidden');
      list.innerHTML = '<p style="font-size:0.8rem; color:#8c7a6b;">Tidak ada notifikasi.</p>';
    }
  });
      }

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

// TOAST NOTIFICATION
window.showToast = function(msg, icon = '✨') {
  const toast = document.getElementById('customToast');
  document.getElementById('toastMsg').innerText = msg;
  document.getElementById('toastIcon').innerText = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// MODAL CONTROLLER
window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('hidden');
};

let currentUser = null;
let currentProfile = { username: '', avatar: '', bio: '', friends: [] };
let activeChatMode = 'global'; 
let activePrivateFriendUid = null;
let activeGroupId = null;
let selectedMessageForDelete = { id: null, colName: null };

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// AUTH
document.getElementById('googleBtn').onclick = () => signInWithPopup(auth, googleProvider);
document.getElementById('logoutBtn').onclick = () => signOut(auth);

// TAB CONTROLLER
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
};

// CUSTOM UPLOAD CONTROLLER
const postImageInput = document.getElementById('postImageInput');
postImageInput.addEventListener('change', async () => {
  if (postImageInput.files[0]) {
    document.getElementById('fileUploadLabelText').innerText = postImageInput.files[0].name;
    document.getElementById('imagePreview').src = await convertFileToBase64(postImageInput.files[0]);
    document.getElementById('previewContainer').classList.remove('hidden');
  }
});
document.getElementById('removeImgBtn').onclick = () => {
  postImageInput.value = '';
  document.getElementById('fileUploadLabelText').innerText = 'Tambahkan Foto / Gambar';
  document.getElementById('previewContainer').classList.add('hidden');
};

// PROFILE MODAL & CUSTOM AVATAR UPLOAD
document.getElementById('profileHeaderBtn').onclick = () => {
  document.getElementById('editUsernameInput').value = currentProfile.username;
  document.getElementById('editBioInput').value = currentProfile.bio || '';
  document.getElementById('profileModal').classList.remove('hidden');
};

document.getElementById('editAvatarInput').addEventListener('change', () => {
  if (document.getElementById('editAvatarInput').files[0]) {
    document.getElementById('avatarFileLabelText').innerText = document.getElementById('editAvatarInput').files[0].name;
  }
});

document.getElementById('saveProfileBtn').onclick = async () => {
  const newUsername = document.getElementById('editUsernameInput').value.trim();
  const newBio = document.getElementById('editBioInput').value.trim();
  const avatarFile = document.getElementById('editAvatarInput').files[0];

  let avatarBase64 = currentProfile.avatar;
  if (avatarFile) avatarBase64 = await convertFileToBase64(avatarFile);

  await setDoc(doc(db, "users", currentUser.uid), {
    username: newUsername || currentProfile.username,
    bio: newBio,
    avatar: avatarBase64
  }, { merge: true });

  closeModal('profileModal');
  showToast('Profil berhasil disimpan!', '✅');
};

// AUTH OBSERVER
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');

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
      loadGroups();
      populateDropdowns();
    });

    loadFinancialData(user.uid);
  } else {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
  }
});

// EWALLET FINANCIALS
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
        li.style.cssText = "background:white; padding:12px; border-radius:16px; border:1px solid var(--border-color); display:flex; justify-content:space-between;";
        li.innerHTML = `
          <div><b>${t.title}</b><br><small style="color:var(--text-muted);">${t.category}</small></div>
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
    showToast('Transaksi tersimpan!', '📝');
    switchTab('tabHome');
  };
}

// FEED & KOMENTAR ALA FACEBOOK
function loadFeedData() {
  onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snapshot) => {
    const feedList = document.getElementById('feedList');
    feedList.innerHTML = '';

    snapshot.forEach(docSnap => {
      let p = docSnap.data();
      let postId = docSnap.id;
      let formattedText = p.content.replace(/@(\w+)/g, '<span class="mention-tag">@$1</span>');
      let imgTag = p.image ? `<img src="${p.image}" style="width:100%; border-radius:14px; margin-top:6px;">` : '';

      const card = document.createElement('div');
      card.className = 'feed-card';
      card.innerHTML = `
        <div class="feed-header">
          <span class="feed-author">@${p.author}</span>
        </div>
        <div class="feed-text">${formattedText}</div>
        ${imgTag}
        
        <!-- FACEBOOK LIKE & COMMENT BUTTONS -->
        <div class="feed-actions">
          <button class="action-btn" onclick="likePost('${postId}', ${(p.likes || []).length})">❤️ ${(p.likes || []).length} Like</button>
          <button class="action-btn" onclick="toggleComments('${postId}')">💬 Komentar</button>
        </div>

        <!-- COMMENTS CONTAINER -->
        <div id="comments-${postId}" class="comments-container hidden">
          <div id="commentList-${postId}"></div>
          <form class="comment-input-row" onsubmit="submitComment(event, '${postId}')">
            <input type="text" placeholder="Tulis komentar..." required>
            <button type="submit" class="btn-sm">Kirim</button>
          </form>
        </div>
      `;
      feedList.appendChild(card);
      loadComments(postId);
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
      likes: [],
      createdAt: new Date()
    });

    e.target.reset();
    document.getElementById('removeImgBtn').click();
    showToast('Berhasil posting!', '☕');
  };
}

window.likePost = async (postId, currentLikes) => {
  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);
  if (snap.exists()) {
    let likes = snap.data().likes || [];
    if (likes.includes(currentUser.uid)) {
      likes = likes.filter(id => id !== currentUser.uid);
    } else {
      likes.push(currentUser.uid);
    }
    await updateDoc(postRef, { likes });
  }
};

window.toggleComments = (postId) => {
  document.getElementById(`comments-${postId}`).classList.toggle('hidden');
};

function loadComments(postId) {
  onSnapshot(query(collection(db, `posts/${postId}/comments`), orderBy("createdAt", "asc")), (snapshot) => {
    const list = document.getElementById(`commentList-${postId}`);
    if (!list) return;
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
      let c = docSnap.data();
      let div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `<span class="comment-author">@${c.author}:</span>${c.text}`;
      list.appendChild(div);
    });
  });
}

window.submitComment = async (e, postId) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, `posts/${postId}/comments`), {
    author: currentProfile.username,
    text: text,
    createdAt: new Date()
  });
  input.value = '';
};

// GROUP SETTINGS & MANAGEMENTS
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
    showToast('Grup baru dibuat!', '👥');
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
        div.style.cssText = "background:white; padding:12px; border-radius:18px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
          <div>
            <b>👥 ${g.name}</b>
            <p style="font-size:0.75rem; color:var(--text-muted);">${g.desc || 'Grup kas bersama'}</p>
          </div>
          <button class="btn-sm" onclick="openGroupChat('${docSnap.id}')">Chat Grup</button>
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

document.getElementById('btnGroupSettings').onclick = async () => {
  if (!activeGroupId) return;
  const gSnap = await getDoc(doc(db, "groups", activeGroupId));
  if (gSnap.exists()) {
    document.getElementById('editGroupNameInput').value = gSnap.data().name;
    document.getElementById('groupSettingsModal').classList.remove('hidden');
  }
};

document.getElementById('saveGroupSettingsBtn').onclick = async () => {
  const newName = document.getElementById('editGroupNameInput').value.trim();
  if (newName && activeGroupId) {
    await updateDoc(doc(db, "groups", activeGroupId), { name: newName });
    closeModal('groupSettingsModal');
    showToast('Nama grup diperbarui!', '⚙️');
  }
};

document.getElementById('btnDeleteGroup').onclick = async () => {
  if (activeGroupId && confirm("Yakin ingin menghapus grup ini secara permanen?")) {
    await deleteDoc(doc(db, "groups", activeGroupId));
    closeModal('groupSettingsModal');
    activeGroupId = null;
    showToast('Grup telah dihapus', '🗑️');
    loadChatData();
  }
};

// WHATSAPP NATIVE MESSENGER SYSTEM
window.switchChatMode = function(mode) {
  activeChatMode = mode;
  document.getElementById('tabChatGlobal').classList.toggle('active', mode === 'global');
  document.getElementById('tabChatPersonal').classList.toggle('active', mode === 'private');
  document.getElementById('tabChatGroup').classList.toggle('active', mode === 'group');

  document.getElementById('privateFriendSelector').classList.toggle('hidden', mode !== 'private');
  document.getElementById('groupChatSelector').classList.toggle('hidden', mode !== 'group');
  loadChatData();
};

async function populateDropdowns() {
  const pSelect = document.getElementById('selectPrivateFriend');
  pSelect.innerHTML = '<option value="">-- Pilih Teman Chat --</option>';
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(uSnap => {
    if (uSnap.id !== currentUser.uid) {
      let opt = document.createElement('option');
      opt.value = uSnap.id;
      opt.innerText = `@${uSnap.data().username}`;
      pSelect.appendChild(opt);
    }
  });
  pSelect.onchange = () => { activePrivateFriendUid = pSelect.value; loadChatData(); };

  const gSelect = document.getElementById('selectGroupChat');
  gSelect.innerHTML = '<option value="">-- Pilih Grup Chat --</option>';
  const gSnaps = await getDocs(collection(db, "groups"));
  gSnaps.forEach(gSnap => {
    if ((gSnap.data().members || []).includes(currentUser.uid)) {
      let opt = document.createElement('option');
      opt.value = gSnap.id;
      opt.innerText = `👥 ${gSnap.data().name}`;
      if (gSnap.id === activeGroupId) opt.selected = true;
      gSelect.appendChild(opt);
    }
  });
  gSelect.onchange = () => { activeGroupId = gSelect.value; loadChatData(); };
}

function loadChatData() {
  const messagesArea = document.getElementById('chatMessages');
  let colName = activeChatMode === 'global' ? "chats" : activeChatMode === 'private' ? "private_chats" : "group_chats";

  if (activeChatMode === 'private' && !activePrivateFriendUid) {
    messagesArea.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted); margin-top:20px;">Pilih teman dari dropdown di atas untuk memulai chat.</p>';
    return;
  }
  if (activeChatMode === 'group' && !activeGroupId) {
    messagesArea.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted); margin-top:20px;">Pilih grup dari dropdown di atas.</p>';
    return;
  }

  onSnapshot(query(collection(db, colName), orderBy("createdAt", "asc")), (snapshot) => {
    messagesArea.innerHTML = '';
    snapshot.forEach(docSnap => {
      let c = docSnap.data();
      let cId = docSnap.id;

      if ((c.deletedFor || []).includes(currentUser.uid)) return;

      if (activeChatMode === 'private') {
        if (!((c.senderUid === currentUser.uid && c.receiverUid === activePrivateFriendUid) ||
              (c.senderUid === activePrivateFriendUid && c.receiverUid === currentUser.uid))) return;
      }
      if (activeChatMode === 'group' && c.groupId !== activeGroupId) return;

      const isOwn = c.senderUid === currentUser.uid;
      const row = document.createElement('div');
      row.className = `chat-bubble-row ${isOwn ? 'own' : 'other'}`;

      let timeString = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

      row.innerHTML = `
        <span class="chat-sender-label">@${c.sender}</span>
        <div class="chat-bubble-content" onclick="openDeleteModal('${cId}', '${colName}', ${isOwn})">
          ${c.message}
          <span class="chat-time-stamp">${timeString}</span>
        </div>
      `;
      messagesArea.appendChild(row);
    });
    messagesArea.scrollTop = messagesArea.scrollHeight;
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
  };
}

// POP-UP PROMPT HAPUS CHAT MODERN (BUKAN TULISAN HAPUS DI BAWAH CHAT)
window.openDeleteModal = (cId, colName, isOwn) => {
  selectedMessageForDelete = { id: cId, colName: colName, isOwn: isOwn };
  document.getElementById('btnDeleteForEveryone').style.display = isOwn ? 'block' : 'none';
  document.getElementById('deleteChatModal').classList.remove('hidden');
};

document.getElementById('btnDeleteForEveryone').onclick = async () => {
  if (selectedMessageForDelete.id) {
    await deleteDoc(doc(db, selectedMessageForDelete.colName, selectedMessageForDelete.id));
    closeModal('deleteChatModal');
    showToast('Pesan dihapus untuk semua orang', '🗑️');
  }
};

document.getElementById('btnDeleteForMe').onclick = async () => {
  if (selectedMessageForDelete.id) {
    await updateDoc(doc(db, selectedMessageForDelete.colName, selectedMessageForDelete.id), {
      deletedFor: [currentUser.uid]
    });
    closeModal('deleteChatModal');
    showToast('Pesan dihapus untuk Anda', '🙈');
  }
};

window.addEmojiToInput = (e) => document.getElementById('chatInput').value += e;

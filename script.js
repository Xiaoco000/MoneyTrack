import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, query, orderBy, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// DOM Elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');
const displayUsername = document.getElementById('displayUsername');
const userAvatarText = document.getElementById('userAvatarText');
const userAvatarImg = document.getElementById('userAvatarImg');

let currentUser = null;
let currentProfile = { username: '', avatar: '' };

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

googleBtn.addEventListener('click', async () => {
  try {
    authMessage.innerText = '⏳ Masuk...';
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    authMessage.innerText = '❌ Gagal: ' + err.message;
  }
});

window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
}

// Custom Kategori Tambahan
const addCategoryBtn = document.getElementById('addCategoryBtn');
const newCategoryInput = document.getElementById('newCategoryInput');
const categorySelect = document.getElementById('category');

addCategoryBtn.addEventListener('click', () => {
  const newCat = newCategoryInput.value.trim();
  if (newCat) {
    const opt = document.createElement('option');
    opt.value = newCat;
    opt.textContent = newCat;
    categorySelect.appendChild(opt);
    newCategoryInput.value = '';
    alert('Kategori "' + newCat + '" berhasil ditambahkan!');
  }
});

const profileHeaderBtn = document.getElementById('profileHeaderBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

profileHeaderBtn.onclick = () => profileModal.classList.remove('hidden');
closeProfileBtn.onclick = () => profileModal.classList.add('hidden');

saveProfileBtn.onclick = async () => {
  if (!currentUser) return;
  const newUsername = document.getElementById('editUsernameInput').value.trim();
  const fileInput = document.getElementById('editAvatarInput');

  let avatarBase64 = currentProfile.avatar;
  if (fileInput.files[0]) {
    avatarBase64 = await convertFileToBase64(fileInput.files[0]);
  }

  const updatedUsername = newUsername || currentProfile.username;

  await setDoc(doc(db, "users", currentUser.uid), {
    username: updatedUsername,
    avatar: avatarBase64
  });

  profileModal.classList.add('hidden');
  alert('Profil berhasil diperbarui!');
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    let defaultUsername = user.displayName || user.email.split('@')[0];

    onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentProfile.username = data.username || defaultUsername;
        currentProfile.avatar = data.avatar || '';
      } else {
        currentProfile.username = defaultUsername;
        currentProfile.avatar = '';
        setDoc(doc(db, "users", user.uid), {
          username: defaultUsername,
          avatar: ''
        });
      }

      displayUsername.innerText = currentProfile.username;
      document.getElementById('editUsernameInput').value = currentProfile.username;

      if (currentProfile.avatar) {
        userAvatarImg.src = currentProfile.avatar;
        userAvatarImg.classList.remove('hidden');
        userAvatarText.classList.add('hidden');
      } else {
        userAvatarText.innerText = currentProfile.username.charAt(0).toUpperCase();
        userAvatarText.classList.remove('hidden');
        userAvatarImg.classList.add('hidden');
      }

      loadFeedData();
      loadChatData();
      setupSearchUser();
    });

    loadFinancialData(user.uid);
  } else {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

function loadFinancialData(userId) {
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const transactionForm = document.getElementById('transactionForm');
  const transactionList = document.getElementById('transactionList');

  const q = query(collection(db, "transactions"));

  onSnapshot(q, (snapshot) => {
    let totalIncome = 0, totalExpense = 0;
    transactionList.innerHTML = '';

    snapshot.forEach(docSnap => {
      let t = docSnap.data();
      if (t.userId === userId) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;

        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
          <div>
            <b>${t.title}</b><br><small style="color:#8c7a6b">${t.category}</small>
          </div>
          <div>
            <span style="color:${t.type === 'income' ? '#2e7d32' : '#c62828'}; font-weight:700;">
              ${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}
            </span>
            <button onclick="deleteTrans('${docSnap.id}')" style="border:none;background:none;color:#c62828;cursor:pointer;margin-left:8px;">✕</button>
          </div>
        `;
        transactionList.appendChild(li);
      }
    });

    balanceEl.innerText = `Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`;
    incomeEl.innerText = `Rp ${totalIncome.toLocaleString('id-ID')}`;
    expenseEl.innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
  });

  transactionForm.onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "transactions"), {
      userId,
      title: document.getElementById('title').value,
      amount: parseFloat(document.getElementById('amount').value),
      type: document.getElementById('type').value,
      category: document.getElementById('category').value,
      createdAt: new Date()
    });
    transactionForm.reset();
    switchTab('tabHome');
  };
}

window.deleteTrans = async (id) => {
  await deleteDoc(doc(db, "transactions", id));
};

// --- LOGIKA PENCARIAN USER ---
function setupSearchUser() {
  const searchInput = document.getElementById('searchUserInput');
  const searchResults = document.getElementById('searchResults');

  searchInput.addEventListener('input', async () => {
    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {
      searchResults.classList.add('hidden');
      searchResults.innerHTML = '';
      return;
    }

    const querySnapshot = await getDocs(collection(db, "users"));
    searchResults.innerHTML = '';
    let found = false;

    querySnapshot.forEach((docSnap) => {
      const uData = docSnap.data();
      const uName = uData.username || '';

      if (uName.toLowerCase().includes(keyword)) {
        found = true;
        const div = document.createElement('div');
        div.className = 'search-user-item';

        const avatarHTML = uData.avatar
          ? `<img src="${uData.avatar}" alt="Avatar">`
          : uName.charAt(0).toUpperCase();

        div.innerHTML = `
          <div class="search-user-info">
            <div class="search-avatar">${avatarHTML}</div>
            <span class="search-username">@${uName}</span>
          </div>
          <button class="btn-sm" onclick="alert('Kamu menyapa @${uName}! 👋')">Sapa 👋</button>
        `;
        searchResults.appendChild(div);
      }
    });

    if (found) {
      searchResults.classList.remove('hidden');
    } else {
      searchResults.innerHTML = '<div style="padding:10px; font-size:0.8rem; color:#8c7a6b; text-align:center;">User tidak ditemukan</div>';
      searchResults.classList.remove('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-user-box')) {
      searchResults.classList.add('hidden');
    }
  });
}

// 2. Feed Sosial & Komentar Real-Time
function loadFeedData() {
  const postForm = document.getElementById('postForm');
  const feedList = document.getElementById('feedList');

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    feedList.innerHTML = '';
    snapshot.forEach(docSnap => {
      let pId = docSnap.id;
      let p = docSnap.data();
      const div = document.createElement('div');
      div.className = 'feed-card';
      
      let imgTag = p.image ? `<img src="${p.image}" class="feed-img">` : '';

      div.innerHTML = `
        <div class="feed-author">@${p.author}</div>
        <div class="feed-text">${p.content}</div>
        ${imgTag}
        <div class="comments-section" id="comments-${pId}"></div>
        <form class="comment-form" onsubmit="submitComment(event, '${pId}')">
          <input type="text" class="comment-input" id="input-${pId}" placeholder="Tulis komentar..." required>
          <button type="submit" class="btn-sm">Kirim</button>
        </form>
      `;
      feedList.appendChild(div);

      loadComments(pId);
    });
  });

  postForm.onsubmit = async (e) => {
    e.preventDefault();
    const content = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postImageInput');

    let imageBase64 = '';
    if (fileInput.files[0]) {
      imageBase64 = await convertFileToBase64(fileInput.files[0]);
    }

    await addDoc(collection(db, "posts"), {
      author: currentProfile.username,
      content: content,
      image: imageBase64,
      createdAt: new Date()
    });

    postForm.reset();
  };
}

// Fungsi Kirim Komentar
window.submitComment = async (e, postId) => {
  e.preventDefault();
  const inputEl = document.getElementById(`input-${postId}`);
  const commentText = inputEl.value.trim();

  if (commentText) {
    await addDoc(collection(db, "comments"), {
      postId: postId,
      author: currentProfile.username,
      text: commentText,
      createdAt: new Date()
    });
    inputEl.value = '';
  }
};

// Fungsi Render Komentar
function loadComments(postId) {
  const container = document.getElementById(`comments-${postId}`);
  if (!container) return;

  const q = query(collection(db, "comments"), where("postId", "==", postId));

  onSnapshot(q, (snapshot) => {
    container.innerHTML = '';
    let comments = [];
    snapshot.forEach(docSnap => {
      comments.push(docSnap.data());
    });

    comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    comments.forEach(c => {
      const cDiv = document.createElement('div');
      cDiv.className = 'comment-item';
      cDiv.innerHTML = `<span class="comment-author">@${c.author}</span> ${c.text}`;
      container.appendChild(cDiv);
    });
  });
}

// 3. Pesan Real-Time
function loadChatData() {
  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');

  const q = query(collection(db, "chats"), orderBy("createdAt", "asc"));

  onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    snapshot.forEach(docSnap => {
      let c = docSnap.data();
      const div = document.createElement('div');
      div.className = 'chat-bubble';
      div.innerHTML = `
        <span style="font-size:0.75rem; color:#c68b59; font-weight:700;">@${c.sender}</span>
        <p style="font-size:0.85rem; margin-top:2px;">${c.message}</p>
      `;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.value;
    await addDoc(collection(db, "chats"), {
      sender: currentProfile.username,
      message: message,
      createdAt: new Date()
    });
    chatInput.value = '';
  };
                   }
        

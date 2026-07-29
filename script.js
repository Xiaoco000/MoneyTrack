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
  bio: "Pengguna aktif moneyS ☕",
  avatar: ""
};

// ==========================================
// 2. SISTEM LOGIN & NAVIGASI TAB AMAN
// ==========================================
window.handleLogin = function(loginType) {
  let enteredName = prompt("Masukkan nama atau email Anda untuk login:", "UserMoneyS");
  if (!enteredName) return;

  currentUser.name = enteredName.trim();
  currentUser.id = "user_" + Date.now();

  saveUserSession();
  showToast("⚡ Login Berhasil, Selamat Datang!");
  enterDashboard();
};

function saveUserSession() {
  localStorage.setItem("MONEYS_USER", JSON.stringify(currentUser));
  localStorage.setItem("MONEYS_LOGGED_IN", "true");
}

function enterDashboard() {
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  
  if (authSection) authSection.classList.add('hidden');
  if (appSection) appSection.classList.remove('hidden');
  
  updateUserUI();
}

function updateUserUI() {
  const displayUsername = document.getElementById('displayUsername');
  if (displayUsername) displayUsername.innerText = currentUser.name;

  const userAvatarBox = document.getElementById('userAvatarBox');
  const userAvatarText = document.getElementById('userAvatarText');
  const userAvatarImg = document.getElementById('userAvatarImg');

  if (currentUser.avatar) {
    if (userAvatarImg) {
      userAvatarImg.src = currentUser.avatar;
      userAvatarImg.classList.remove('hidden');
    }
    if (userAvatarText) userAvatarText.classList.add('hidden');
  } else {
    if (userAvatarImg) userAvatarImg.classList.add('hidden');
    if (userAvatarText) {
      userAvatarText.classList.remove('hidden');
      userAvatarText.innerText = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";
    }
  }
}

// Cek status login saat halaman dimuat (Tanpa kepental)
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("MONEYS_LOGGED_IN") === "true") {
    enterDashboard();
  }

  const gmailBtn = document.getElementById('gmailLoginBtn');
  const otpBtn = document.getElementById('otpLoginBtn');
  const phoneBtn = document.getElementById('phoneLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileHeaderBtn = document.getElementById('myProfileHeaderBtn');

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

  if (profileHeaderBtn) {
    profileHeaderBtn.onclick = () => openMyProfileModal();
  }

  // Inisialisasi Form Feed Postingan dengan Tombol Modern
  const postForm = document.getElementById('postForm');
  if (postForm) {
    if (!document.getElementById('postImageInput')) {
      const fileInputHTML = `
        <div style="margin-bottom: 10px;">
          <label class="custom-file-upload-btn">
            📷 Pilih Foto untuk Postingan
            <input type="file" id="postImageInput" class="hidden-file-input" accept="image/*">
          </label>
          <div id="postImageFileName" style="font-size:0.68rem; color:var(--text-muted); margin-top:4px; text-align:center;"></div>
        </div>
      `;
      postForm.insertAdjacentHTML('afterbegin', fileInputHTML);

      document.getElementById('postImageInput').onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
          document.getElementById('postImageFileName').innerText = "Terpilih: " + file.name;
          const reader = new FileReader();
          reader.onload = function(event) {
            window.tempPostImage = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
    }

    postForm.onsubmit = function(e) {
      e.preventDefault();
      const content = document.getElementById('postContent').value.trim();
      if (!content && !window.tempPostImage) return;

      const newPost = {
        id: 'post_' + Date.now(),
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: content,
        image: window.tempPostImage || null,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      appendFeedItem(newPost);
      document.getElementById('postContent').value = '';
      window.tempPostImage = null;
      document.getElementById('postImageFileName').innerText = '';
      showToast("📤 Postingan berhasil dibagikan!");
    };
  }
});

// ==========================================
// 3. NAVIGASI TAB & MODAL (MENCEGAH KEPENTAL)
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

  const activeNav = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
  if (activeNav) activeNav.classList.add('active');
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
// 4. CUSTOMIZE PROFIL & UPLOAD FOTO PROFIL
// ==========================================
window.openMyProfileModal = function() {
  let modal = document.getElementById('editProfileModal');
  if (!modal) {
    const modalHTML = `
      <div id="editProfileModal" class="modal-overlay">
        <div class="modal-content">
          <button class="close-window-x" onclick="closeModal('editProfileModal')">✕</button>
          <h3 style="font-weight:800; margin-bottom:12px; color:var(--text-main);">Edit Profil & Foto</h3>
          <div style="text-align:center; margin-bottom:14px;">
            <div class="avatar-circle" id="editModalAvatarPrev" style="width:75px; height:75px; margin:0 auto 10px auto; font-size:1.8rem; border:2px solid var(--primary-neon);">
              ${currentUser.avatar ? `<img src="${currentUser.avatar}" style="width:100%; height:100%; object-fit:cover;">` : currentUser.name.charAt(0).toUpperCase()}
            </div>
            
            <label class="custom-file-upload-btn">
              📁 Pilih Foto Profil Baru
              <input type="file" id="profileImageInput" class="hidden-file-input" accept="image/*">
            </label>
            <div id="profileFileName" style="font-size:0.68rem; color:var(--text-muted); margin-top:4px;"></div>
          </div>

          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Nama Pengguna:</label>
          <input type="text" id="editProfileName" class="input-custom-field" value="${currentUser.name}" style="margin-bottom:10px;">
          
          <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Bio:</label>
          <input type="text" id="editProfileBio" class="input-custom-field" value="${currentUser.bio || ''}" style="margin-bottom:14px;">
          
          <button class="btn-primary" onclick="saveProfileChanges()">Simpan Perubahan</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('profileImageInput').onchange = function(e) {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('profileFileName').innerText = file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
          window.tempAvatarBase64 = event.target.result;
          document.getElementById('editModalAvatarPrev').innerHTML = `<img src="${window.tempAvatarBase64}" style="width:100%; height:100%; object-fit:cover;">`;
        };
        reader.readAsDataURL(file);
      }
    };
  } else {
    document.getElementById('editProfileName').value = currentUser.name;
    document.getElementById('editProfileBio').value = currentUser.bio || '';
    document.getElementById('profileFileName').innerText = '';
    modal.classList.remove('hidden');
  }
}

window.saveProfileChanges = function() {
  const newName = document.getElementById('editProfileName').value.trim();
  const newBio = document.getElementById('editProfileBio').value.trim();

  if (newName) currentUser.name = newName;
  currentUser.bio = newBio;
  if (window.tempAvatarBase64) {
    currentUser.avatar = window.tempAvatarBase64;
    window.tempAvatarBase64 = null;
  }

  saveUserSession();
  updateUserUI();
  closeModal('editProfileModal');
  showToast("✅ Profil berhasil diperbarui!");
};

// ==========================================
// 5. RENDER FEED KOMUNITAS
// ==========================================
function appendFeedItem(post) {
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const postEl = document.createElement('div');
  postEl.className = 'contact-card-item';
  postEl.style.cssText = "flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 10px; padding: 14px;";
  postEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
      <div class="contact-avatar">${post.senderAvatar ? `<img src="${post.senderAvatar}" style="width:100%; height:100%; object-fit:cover;">` : post.senderName.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:bold; font-size:0.85rem; color:var(--primary-neon);">@${post.senderName}</div>
        <div style="font-size:0.65rem; color:var(--text-muted);">${post.time}</div>
      </div>
    </div>
    <div style="font-size:0.85rem; color:var(--text-main); line-height:1.4;">${post.text}</div>
    ${post.image ? `<img src="${post.image}" style="width:100%; max-height:220px; object-fit:cover; border-radius:12px; margin-top:4px;">` : ''}
  `;
  feedList.prepend(postEl);
}

// ==========================================
// 6. CHAT MODES & REAL-TIME CLOCK
// ==========================================
window.switchChatMode = function(mode) {
  document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
  
  const privateSelector = document.getElementById('privateFriendSelector');
  const groupSelector = document.getElementById('groupChatSelector');
  
  if (privateSelector) privateSelector.classList.add('hidden');
  if (groupSelector) groupSelector.classList.add('hidden');

  if (mode === 'global') {
    document.getElementById('tabChatGlobal').classList.add('active');
  } else if (mode === 'private') {
    document.getElementById('tabChatPersonal').classList.add('active');
    if (privateSelector) privateSelector.classList.remove('hidden');
  } else if (mode === 'group') {
    document.getElementById('tabChatGroup').classList.add('active');
    if (groupSelector) groupSelector.classList.remove('hidden');
  }
};

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
  

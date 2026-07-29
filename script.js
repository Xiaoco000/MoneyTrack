// 1. DYNAMIC REAL-TIME CLOCK & GREETING
function updateRealTimeClock() {
  const now = new Date();
  const hours = now.getHours();
  
  // Sapaan Real-Time
  let greeting = "Selamat Malam 🌙";
  if (hours >= 4 && hours < 11) greeting = "Selamat Pagi 🌅";
  else if (hours >= 11 && hours < 15) greeting = "Selamat Siang ☀️";
  else if (hours >= 15 && hours < 18) greeting = "Selamat Sore 🌆";

  // Format Jam
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
  
  // Format Tanggal
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('id-ID', options);

  // Update UI Auth/Login
  if (document.getElementById('loginGreeting')) {
    document.getElementById('loginGreeting').innerText = greeting;
    document.getElementById('loginClock').innerText = timeStr;
    document.getElementById('loginDate').innerText = dateStr;
  }

  // Update UI Home Widget
  if (document.getElementById('homeGreeting')) {
    document.getElementById('homeGreeting').innerText = greeting;
    document.getElementById('homeClock').innerText = timeStr;
    document.getElementById('homeDate').innerText = dateStr;
  }
}
setInterval(updateRealTimeClock, 1000);
updateRealTimeClock();

// 2. RENDERING PROFIL DI DALAM CHAT (AKAN DITAMPILKAN SAAT MENIKIRIM PESAN CHAT GLOBAL/PERSONAL)
function renderChatMessage(msg, currentUserId) {
  const isOwn = msg.senderId === currentUserId;
  const rowClass = isOwn ? 'own' : 'other';
  
  return `
    <div class="chat-bubble-row ${rowClass}">
      <div class="chat-bubble-avatar" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">
        ${msg.senderAvatar ? `<img src="${msg.senderAvatar}">` : msg.senderName.charAt(0).toUpperCase()}
      </div>
      <div>
        <span class="chat-sender-clickable" onclick="openUserProfile('${msg.senderId}', '${msg.senderName}')">@${msg.senderName}</span>
        <div class="chat-bubble-content">
          ${msg.text}
          <span class="chat-time-stamp">${msg.time || ''}</span>
        </div>
      </div>
    </div>
  `;
}

// 3. FUNGSI UNTUK MENGUNJUNGI PROFIL PENGGUNA LAIN (ALA FACEBOOK)
window.openUserProfile = function(userId, userName) {
  document.getElementById('targetProfileName').innerText = "@" + userName;
  document.getElementById('targetProfileBio').innerText = "Pengguna aktif moneyS ☕";
  document.getElementById('targetProfileAvatar').innerText = userName.charAt(0).toUpperCase();
  
  document.getElementById('btnDirectMessageTarget').onclick = function() {
    closeModal('viewUserProfileModal');
    switchTab('tabChat');
    switchChatMode('private');
    selectContactForChat(userId, userName);
  };

  document.getElementById('viewUserProfileModal').classList.remove('hidden');
};

// 4. PEMILIH KONTAK PROFIL MODERN (MENGGANTIKAN DROP-DOWN KAKU)
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

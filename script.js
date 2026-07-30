import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDmeCv3NIUJ4muU-LV00JFd0ur-06vBiMw",
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
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;

const loadingScreen = document.getElementById('loadingScreen');
const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const userDisplayName = document.getElementById('userDisplayName');
const userDisplayUsername = document.getElementById('userDisplayUsername');
const socialFeed = document.getElementById('socialFeed');

function showToast(title, message, isError = false) {
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastTitle.innerText = title;
    toastMessage.innerText = message;

    if (isError) {
        toastIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-500"></i>';
    } else {
        toastIcon.innerHTML = '<i class="fa-solid fa-check text-slate-700"></i>';
    }

    toast.classList.remove('-translate-y-36', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-36', 'opacity-0');
    }, 4000);
}

function showCustomModal(title, desc, placeholder, callback) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalInput = document.getElementById('modalInput');
    const submitBtn = document.getElementById('modalSubmitBtn');

    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    modalInput.placeholder = placeholder;
    modalInput.value = '';
    modal.classList.remove('hidden');

    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

    newSubmitBtn.addEventListener('click', () => {
        const val = modalInput.value;
        if (val) {
            modal.classList.add('hidden');
            callback(val);
        } else {
            showToast("Peringatan", "Kolom input tidak boleh kosong!", true);
        }
    });
}

window.closeModal = function () {
    document.getElementById('customModal').classList.add('hidden');
}

window.toggleAuthMode = function (mode) {
    if (mode === 'register') {
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    } else {
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    }
}

window.updateFileLabel = function () {
    const fileInput = document.getElementById('postImageFile');
    const fileLabel = document.getElementById('fileLabel');
    if (fileInput.files.length > 0) {
        fileLabel.innerText = fileInput.files[0].name.substring(0, 12) + '...';
    } else {
        fileLabel.innerText = 'Pilih Foto';
    }
}

window.triggerNotification = function () {
    showToast("Sistem", "Jaringan keuangan aman. Tidak ada aktivitas anomali.");
    document.getElementById('notifBadge').classList.add('hidden');
}

window.handleGoogleLogin = async function () {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        showToast("Sukses", `Selamat datang, ${result.user.displayName || 'Operator'}!`);
    } catch (error) {
        showToast("Gagal Google Login", error.message, true);
    }
}

window.handleEmailOtpLogin = function () {
    showCustomModal("Verifikasi OTP Email", "Masukkan alamat email terdaftar untuk menerima kode OTP:", "nama@email.com", (email) => {
        showToast("OTP Terkirim", `Kode verifikasi telah dikirim ke ${email}`);
    });
}

window.handlePhoneOtpLogin = function () {
    showCustomModal("Verifikasi OTP Telepon", "Masukkan nomor telepon terdaftar (contoh: 08xx):", "08123456789", (phone) => {
        showToast("OTP SMS", `Kode OTP telah dikirim via SMS ke ${phone}`);
    });
}

onAuthStateChanged(auth, async (user) => {
    loadingScreen.classList.add('hidden');
    if (user) {
        currentUser = user;
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        userDisplayName.innerText = `Halo, ${displayName} 👋`;
        userDisplayUsername.innerText = `@${displayName.toLowerCase()} • Finance & Sosial`;
        loadSocialFeed();
    } else {
        currentUser = null;
        appView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
});

window.handleLogin = async function () {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) {
        showToast("Peringatan", "Email/No. Telepon dan Password wajib diisi!", true);
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("Sukses", "Berhasil masuk ke dalam sistem.");
    } catch (error) {
        showToast("Gagal Masuk", "Pastikan akun sudah terdaftar atau periksa kredensial.", true);
    }
}

window.handleRegister = async function () {
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;

    if (!name || !username || !email || !pass) {
        showToast("Peringatan", "Semua kolom pendaftaran wajib diisi!", true);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

        // Set nama tampilan ke profil Firebase Auth
        await updateProfile(userCredential.user, { displayName: name });

        await addDoc(collection(db, "users"), {
            uid: userCredential.user.uid,
            name,
            username,
            createdAt: serverTimestamp()
        });
        showToast("Sukses", "Registrasi akun berhasil!");
    } catch (error) {
        showToast("Gagal Daftar", error.message, true);
    }
}

window.handleLogout = async function () {
    await signOut(auth);
    showToast("Keluar", "Sesi anda telah berakhir.");
}

window.createPost = async function () {
    if (!currentUser) return;
    const content = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postImageFile');
    const file = fileInput.files[0];

    if (!content && !file) {
        showToast("Peringatan", "Tulis sesuatu atau pilih foto untuk diposting!", true);
        return;
    }

    try {
        let imageUrl = "";
        if (file) {
            const storageRef = ref(storage, `posts/${currentUser.uid}_${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const authorName = currentUser.displayName || currentUser.email.split('@')[0];
        await addDoc(collection(db, "posts"), {
            uid: currentUser.uid,
            author: authorName,
            content: content,
            imageUrl: imageUrl,
            createdAt: serverTimestamp()
        });

        document.getElementById('postContent').value = '';
        fileInput.value = '';
        document.getElementById('fileLabel').innerText = 'Pilih Foto';
        showToast("Sukses", "Postingan berhasil dibagikan ke feed.");
    } catch (error) {
        showToast("Gagal", error.message, true);
    }
}

function loadSocialFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        socialFeed.innerHTML = "";
        if (snapshot.empty) {
            socialFeed.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 font-mono">Belum ada postingan di feed.</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const data = doc.data();
            let imageHtml = data.imageUrl ? `<div class="mt-3 rounded-xl overflow-hidden border border-slate-200"><img src="${data.imageUrl}" class="w-full h-auto object-cover max-h-60"></div>` : '';

            socialFeed.innerHTML += `
                <div class="steel-card p-4 rounded-2xl space-y-2 bg-white/80 shadow-sm border border-slate-200">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold font-mono text-xs border border-slate-300">
                            ${data.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-slate-800 font-mono">@${data.author}</h4>
                            <span class="text-[10px] text-slate-400 font-mono">Baru saja</span>
                        </div>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">${data.content || ''}</p>
                    ${imageHtml}
                </div>
            `;
        });
    });
}

function updateDateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').innerHTML = `<i class="fa-regular fa-clock mr-1"></i> ${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('currentDate').innerHTML = `<i class="fa-regular fa-calendar-days mr-1"></i> ${now.toLocaleDateString('id-ID', options)}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

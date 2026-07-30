import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

let currentUser = null;

const loadingScreen = document.getElementById('loadingScreen');
const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const userDisplayName = document.getElementById('userDisplayName');
const userDisplayUsername = document.getElementById('userDisplayUsername');
const socialFeed = document.getElementById('socialFeed');

window.toggleAuthMode = function(mode) {
    if(mode === 'register') {
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    } else {
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    }
}

window.updateFileLabel = function() {
    const fileInput = document.getElementById('postImageFile');
    const fileLabel = document.getElementById('fileLabel');
    if(fileInput.files.length > 0) {
        fileLabel.innerText = fileInput.files[0].name.substring(0, 12) + '...';
    } else {
        fileLabel.innerText = 'Pilih Media';
    }
}

window.triggerNotification = function() {
    alert("SYSTEM: Jaringan aman, tidak ada anomali keuangan terdeteksi.");
    document.getElementById('notifBadge').classList.add('hidden');
}

onAuthStateChanged(auth, async (user) => {
    loadingScreen.classList.add('hidden');
    if (user) {
        currentUser = user;
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        userDisplayName.innerText = `Halo, ${user.email.split('@')[0]} 👋`;
        userDisplayUsername.innerText = `@${user.email.split('@')[0]} • Lv.1 Operator`;
        loadSocialFeed();
    } else {
        currentUser = null;
        appView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
});

window.handleLogin = async function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Autentikasi Gagal: " + error.message);
    }
}

window.handleRegister = async function() {
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await addDoc(collection(db, "users"), {
            uid: userCredential.user.uid,
            name,
            username,
            createdAt: serverTimestamp()
        });
        alert("Registrasi Operator Berhasil!");
    } catch (error) {
        alert("Gagal Daftar: " + error.message);
    }
}

window.handleLogout = async function() {
    await signOut(auth);
}

window.createPost = async function() {
    if (!currentUser) return;
    const content = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postImageFile');
    const file = fileInput.files[0];

    if (!content && !file) {
        alert("Masukkan data atau media untuk dibroadcast!");
        return;
    }

    try {
        let imageUrl = "";
        if (file) {
            const storageRef = ref(storage, `posts/${currentUser.uid}_${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "posts"), {
            uid: currentUser.uid,
            author: currentUser.email.split('@')[0],
            content: content,
            imageUrl: imageUrl,
            createdAt: serverTimestamp()
        });

        document.getElementById('postContent').value = '';
        fileInput.value = '';
        document.getElementById('fileLabel').innerText = 'Pilih Media';
        alert("Broadcast berhasil dikirim ke jaringan!");
    } catch (error) {
        alert("Gagal mengirim broadcast: " + error.message);
    }
}

function loadSocialFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        socialFeed.innerHTML = "";
        if(snapshot.empty) {
            socialFeed.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 font-mono">Belum ada transmisi di feed.</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const data = doc.data();
            let imageHtml = data.imageUrl ? `<div class="mt-3 rounded-xl overflow-hidden border border-slate-700/60"><img src="${data.imageUrl}" class="w-full h-auto object-cover max-h-60"></div>` : '';
            
            socialFeed.innerHTML += `
                <div class="metallic-card p-4 rounded-2xl space-y-2">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-xs border border-cyan-500/30">
                            ${data.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-slate-200 font-mono">@${data.author}</h4>
                            <span class="text-[10px] text-slate-500 font-mono">Transmisi Baru</span>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">${data.content || ''}</p>
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
      

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  deleteDoc, doc, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const userEmailInput = document.getElementById('userEmail');
const userPasswordInput = document.getElementById('userPassword');
const googleBtn = document.getElementById('googleBtn');
const loginPassBtn = document.getElementById('loginPassBtn');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const authMessage = document.getElementById('authMessage');
const userDisplay = document.getElementById('userDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// A. Login dengan Google (Rekomendasi Utama)
googleBtn.addEventListener('click', async () => {
  try {
    authMessage.innerText = '⏳ Membuka Google Login...';
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    authMessage.innerText = '❌ Gagal Google Login: ' + err.message;
  }
});

// B. Login / Daftar dengan Email & Password
loginPassBtn.addEventListener('click', async () => {
  const email = userEmailInput.value.trim();
  const password = userPasswordInput.value.trim();

  if (!email || !password) return alert('Isi Email dan Password terlebih dahulu!');

  authMessage.innerText = '⏳ Memproses...';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        authMessage.innerText = '✨ Akun baru berhasil dibuat!';
      } catch (createErr) {
        authMessage.innerText = '❌ Gagal: ' + createErr.message;
      }
    } else {
      authMessage.innerText = '❌ Gagal: ' + err.message;
    }
  }
});

// C. Kirim Link Email
sendOtpBtn.addEventListener('click', async () => {
  const email = userEmailInput.value.trim();
  if (!email) return alert('Ketik alamat email terlebih dahulu!');

  try {
    await sendSignInLinkToEmail(auth, email, {
      url: window.location.href,
      handleCodeInApp: true,
    });
    window.localStorage.setItem('emailForSignIn', email);
    authMessage.innerText = '✨ Link dikirim ke email! Cek Inbox/Spam.';
  } catch (err) {
    authMessage.innerText = '❌ Gagal Kirim Email: ' + err.message;
  }
});

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn') || window.prompt('Masukkan email konfirmasi:');
  signInWithEmailLink(auth, email, window.location.href)
    .then(() => window.localStorage.removeItem('emailForSignIn'));
}

// Monitor User Login
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userDisplay.innerText = user.email || user.displayName;
    loadCloudData(user.uid);
  } else {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// Sinkronisasi Data Firestore Cloud Per User
function loadCloudData(userId) {
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const transactionForm = document.getElementById('transactionForm');
  const transactionList = document.getElementById('transactionList');

  const q = query(collection(db, "transactions"), where("userId", "==", userId));

  onSnapshot(q, (snapshot) => {
    let transactions = [];
    snapshot.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));

    let totalIncome = 0, totalExpense = 0;
    transactionList.innerHTML = '';

    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div class="item-info">
          <span class="item-title">${t.title}</span>
          <span class="item-category">${t.category}</span>
        </div>
        <div>
          <span class="amount ${t.type}">${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}</span>
          <button class="btn-del" onclick="deleteTrans('${t.id}')">✕</button>
        </div>
      `;
      transactionList.appendChild(li);
    });

    balanceEl.innerText = `Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`;
    incomeEl.innerText = `Rp ${totalIncome.toLocaleString('id-ID')}`;
    expenseEl.innerText = `Rp ${totalExpense.toLocaleString('id-ID')}`;
  });

  transactionForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    await addDoc(collection(db, "transactions"), {
      userId, title, amount, type, category, createdAt: new Date()
    });

    transactionForm.reset();
  };
}

window.deleteTrans = async (id) => {
  await deleteDoc(doc(db, "transactions", id));
};

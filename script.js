// ==========================================
// 1. IMPORT FIREBASE SDK (Modular v9+)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Konfigurasi Firebase Kamu
const firebaseConfig = {
  apiKey: "AIzaSyDmeCv3NlUJ4muU-LV00JFd0ur-O6vBiMw",
  authDomain: "moneytracker-a4e12.firebaseapp.com",
  projectId: "moneytracker-a4e12",
  storageBucket: "moneytracker-a4e12.firebasestorage.app",
  messagingSenderId: "671098268223",
  appId: "1:671098268223:web:e155a31c77e4277415268a",
  measurementId: "G-V6HV6P02L0"
};

// Inisialisasi Firebase Services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let allTransactionsData = [];

// ==========================================
// 2. AUTHENTICATION MONITOR
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('user-display').innerText = user.email.split('@')[0];
    document.getElementById('profile-email').innerText = user.email;
    
    // Fetch data dari Firestore
    loadTransactions();
  } else {
    currentUser = null;
    document.getElementById('user-display').innerText = "Tamu";
    document.getElementById('profile-email').innerText = "Belum Login";
  }
});

// Logout Handlers
const handleLogout = () => {
  signOut(auth).then(() => {
    alert("Berhasil keluar akun.");
    window.location.reload();
  }).catch((error) => {
    console.error("Error logout:", error);
  });
};

document.getElementById('btn-logout').addEventListener('click', handleLogout);
document.getElementById('btn-logout-profile').addEventListener('click', handleLogout);


// ==========================================
// 3. NAVIGASI TAB & MODAL UI
// ==========================================
window.switchPage = function(pageId, element) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  document.getElementById(`page-${pageId}`).classList.add('active');
  if (element) element.classList.add('active');
};

const fabBtn = document.getElementById('fabBtn');
const fabWrapper = document.querySelector('.fab-wrapper');

fabBtn.addEventListener('click', () => {
  fabWrapper.classList.toggle('active');
});

window.toggleModal = function(type, show = true) {
  fabWrapper.classList.remove('active');
  if (type === 'tx') {
    const modal = document.getElementById('txModal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
  } else if (type === 'post') {
    alert('Fitur Buat Postingan Sosial akan segera hadir!');
  }
};


// ==========================================
// 4. FIREBASE FIRESTORE OPERATIONS
// ==========================================

// Simpan Transaksi Baru
document.getElementById('form-transaction').addEventListener('submit', async function(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Kamu harus login terlebih dahulu!");
    return;
  }

  const btnSubmit = document.getElementById('btn-submit-tx');
  btnSubmit.innerText = "Menyimpan...";
  btnSubmit.disabled = true;

  const type = document.querySelector('input[name="txType"]:checked').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const category = document.getElementById('tx-category').value;
  const description = document.getElementById('tx-desc').value;

  try {
    await addDoc(collection(db, 'transactions'), {
      userId: currentUser.uid,
      type: type,
      amount: amount,
      category: category,
      description: description,
      createdAt: serverTimestamp()
    });

    alert('Catatan transaksi berhasil disimpan!');
    document.getElementById('form-transaction').reset();
    window.toggleModal('tx', false);
    loadTransactions();
  } catch (error) {
    console.error("Error Firestore: ", error);
    alert("Gagal menyimpan: " + error.message);
  } finally {
    btnSubmit.innerText = "Simpan Transaksi";
    btnSubmit.disabled = false;
  }
});

// Ambil Transaksi Pengguna dari Firestore
async function loadTransactions() {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    allTransactionsData = [];
    querySnapshot.forEach((doc) => {
      allTransactionsData.push({ id: doc.id, ...doc.data() });
    });
    
    renderDashboard();
    renderTransactionList('all');
  } catch (error) {
    console.error("Gagal mengambil data: ", error);
  }
}

// Render Angka Dashboard
function renderDashboard() {
  let income = 0;
  let expense = 0;

  allTransactionsData.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
  });

  const net = income - expense;

  document.getElementById('net-balance').innerText = `Rp ${net.toLocaleString('id-ID')}`;
  document.getElementById('total-income').innerText = `Rp ${income.toLocaleString('id-ID')}`;
  document.getElementById('total-expense').innerText = `Rp ${expense.toLocaleString('id-ID')}`;
}

// Render Transaksi List ke UI
function renderTransactionList(filterType = 'all') {
  const recentList = document.getElementById('recent-transactions');
  const allList = document.getElementById('all-transactions');

  recentList.innerHTML = '';
  allList.innerHTML = '';

  const filteredData = allTransactionsData.filter(tx => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  if (filteredData.length === 0) {
    const emptyMsg = `<li class="empty-state">Belum ada data transaksi</li>`;
    recentList.innerHTML = emptyMsg;
    allList.innerHTML = emptyMsg;
    return;
  }

  filteredData.forEach((tx, index) => {
    const isIncome = tx.type === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';

    const itemHTML = `
      <li class="tx-item">
        <div class="tx-info">
          <h5>${tx.description}</h5>
          <span>${tx.category}</span>
        </div>
        <div class="tx-amount ${amountClass}">
          ${amountSign} Rp ${tx.amount.toLocaleString('id-ID')}
        </div>
      </li>
    `;

    if (index < 5) recentList.innerHTML += itemHTML;
    allList.innerHTML += itemHTML;
  });
}

// Filter Tab
window.filterTransactions = function(type, btnElement) {
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
  btnElement.classList.add('active');
  renderTransactionList(type);
};

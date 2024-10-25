// public/js/admin.js
import { db, auth } from '../firebase-config.js';
import { doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    const sellersContainer = document.getElementById('sellers-container');
    const buyersContainer = document.getElementById('buyers-container');
    const billingContainer = document.getElementById('billing-container');
    const pageSelect = document.getElementById('page-select');
    const editForm = document.getElementById('edit-form');
    const editPageForm = document.getElementById('edit-page-form');

    // Autentikasi Admin
    const authInstance = getAuth();
    const adminEmail = prompt("Masukkan Email Admin:");
    const adminPassword = prompt("Masukkan Password Admin:");

    try {
        const userCredential = await signInWithEmailAndPassword(authInstance, adminEmail, adminPassword);
        const user = userCredential.user;

        // Periksa role pengguna
        const userDoc = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            if (userData.role !== 'admin') {
                alert("Akses ditolak. Anda bukan admin.");
                window.location.href = "index.html";
                return;
            }
        } else {
            alert("User tidak ditemukan.");
            window.location.href = "index.html";
            return;
        }

        console.log("Admin berhasil login dan diverifikasi.");
    } catch (error) {
        console.error("Error saat login admin:", error);
        alert("Autentikasi gagal. Akses ditolak.");
        window.location.href = "index.html";
        return;
    }

    // Memuat data penjual
    loadSellers();

    // Memuat data pembeli
    loadBuyers();

    // Memuat data tagihan
    loadBilling();

    // Event Listener untuk memilih halaman
    pageSelect.addEventListener('change', async (e) => {
        const selectedPage = e.target.value;
        if (selectedPage) {
            editForm.style.display = 'block';

            // Ambil data halaman dari Firestore
            const pageDoc = doc(db, "pages", selectedPage);
            const pageSnapshot = await getDoc(pageDoc);

            if (pageSnapshot.exists()) {
                const pageData = pageSnapshot.data();
                document.getElementById('page-title').value = pageData.title;
                document.getElementById('page-description').value = pageData.description;
                document.getElementById('page-hero-image').value = pageData.heroImage;
            } else {
                alert("Halaman tidak ditemukan.");
                editForm.style.display = 'none';
            }
        } else {
            editForm.style.display = 'none';
        }
    });

    // Event Listener untuk submit edit form
    editPageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedPage = pageSelect.value;
        const title = document.getElementById('page-title').value;
        const description = document.getElementById('page-description').value;
        const heroImage = document.getElementById('page-hero-image').value;

        if (!selectedPage) {
            alert("Pilih halaman terlebih dahulu.");
            return;
        }

        try {
            const pageDoc = doc(db, "pages", selectedPage);
            await updateDoc(pageDoc, {
                title,
                description,
                heroImage
            });
            alert("Halaman berhasil diperbarui.");
        } catch (error) {
            console.error("Error saat memperbarui halaman:", error);
            alert("Gagal memperbarui halaman. Silakan coba lagi.");
        }
    });

    // Event Listener untuk Update Status Tagihan
    billingContainer.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('update-status')) {
            const billingId = e.target.getAttribute('data-id');
            const currentStatus = e.target.getAttribute('data-status');

            const newStatus = currentStatus === 'Belum Dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar';

            try {
                const response = await fetch(`/api/billing/${billingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    alert("Status tagihan berhasil diperbarui.");
                    loadBilling(); // Refresh data tagihan
                } else {
                    alert("Gagal memperbarui status tagihan.");
                }
            } catch (error) {
                console.error("Error saat memperbarui tagihan:", error);
                alert("Gagal memperbarui status tagihan.");
            }
        }
    });
});

// Fungsi untuk memuat data penjual
async function loadSellers() {
    const container = document.getElementById('sellers-container');
    container.innerHTML = ''; // Bersihkan konten sebelumnya

    try {
        const sellersCollection = collection(db, "sellers");
        const querySnapshot = await getDocs(sellersCollection);

        if (querySnapshot.empty) {
            container.innerHTML = '<p>Tidak ada penjual yang terdaftar.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const seller = doc.data();
            const sellerHTML = generateSellerCard(seller);
            container.insertAdjacentHTML('beforeend', sellerHTML);
        });

    } catch (error) {
        console.error('Error saat memuat penjual:', error.message);
        container.innerHTML = '<p>Gagal memuat data penjual. Silakan coba lagi nanti.</p>';
    }
}

// Fungsi untuk memuat data pembeli
async function loadBuyers() {
    const container = document.getElementById('buyers-container');
    container.innerHTML = ''; // Bersihkan konten sebelumnya

    try {
        const buyersCollection = collection(db, "buyers");
        const querySnapshot = await getDocs(buyersCollection);

        if (querySnapshot.empty) {
            container.innerHTML = '<p>Tidak ada pembeli yang terdaftar.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const buyer = doc.data();
            const buyerHTML = generateBuyerCard(buyer);
            container.insertAdjacentHTML('beforeend', buyerHTML);
        });

    } catch (error) {
        console.error('Error saat memuat pembeli:', error.message);
        container.innerHTML = '<p>Gagal memuat data pembeli. Silakan coba lagi nanti.</p>';
    }
}

// Fungsi untuk memuat data tagihan
async function loadBilling() {
    const container = document.getElementById('billing-container');
    container.innerHTML = ''; // Bersihkan konten sebelumnya

    try {
        const response = await fetch('/api/billing');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const billingList = await response.json();

        if (billingList.length === 0) {
            container.innerHTML = '<p>Tidak ada tagihan yang terdaftar.</p>';
            return;
        }

        billingList.forEach((billing) => {
            const billingHTML = generateBillingCard(billing);
            container.insertAdjacentHTML('beforeend', billingHTML);
        });

    } catch (error) {
        console.error('Error saat memuat tagihan:', error.message);
        container.innerHTML = '<p>Gagal memuat data tagihan. Silakan coba lagi nanti.</p>';
    }
}

// Fungsi untuk membuat HTML card penjual
function generateSellerCard(seller) {
    return `
        <div class="card">
            <h3>${seller.name}</h3>
            <p>Email: ${seller.email}</p>
            <p>Alamat: ${seller.address}</p>
            <p>Total Produk: ${seller.totalProducts}</p>
            <p>Total Pendapatan: Rp ${seller.totalEarnings.toLocaleString()}</p>
        </div>`;
}

// Fungsi untuk membuat HTML card pembeli
function generateBuyerCard(buyer) {
    return `
        <div class="card">
            <h3>${buyer.name}</h3>
            <p>Email: ${buyer.email}</p>
            <p>Alamat: ${buyer.address}</p>
            <p>Total Pembelian: Rp ${buyer.totalPurchases.toLocaleString()}</p>
        </div>`;
}

// Fungsi untuk membuat HTML card tagihan dengan opsi update status
function generateBillingCard(billing) {
    const billingDate = new Date(billing.tanggalTagihan).toLocaleDateString('id-ID');
    const statusColor = billing.status === "Sudah Dibayar" ? "green" : "red";

    return `
        <div class="card">
            <h3>Tagihan Bulan: ${billing.month}</h3>
            <p><strong>Seller ID:</strong> ${billing.sellerId}</p>
            <p><strong>Total Tagihan:</strong> Rp ${billing.totalBilling.toLocaleString()}</p>
            <p><strong>Status:</strong> <span style="color: ${statusColor};">${billing.status}</span></p>
            <p><strong>Tanggal Tagihan:</strong> ${billingDate}</p>
            <button class="button update-status" data-id="${billing.id}" data-status="${billing.status}">${billing.status === "Sudah Dibayar" ? "Mark as Belum Dibayar" : "Mark as Sudah Dibayar"}</button>
        </div>`;
}

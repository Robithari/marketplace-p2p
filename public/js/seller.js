// public/js/seller.js
import { db, auth } from '../firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    const addProductForm = document.getElementById('add-product-form');
    const sellersProductsContainer = document.getElementById('seller-products-container');

    // Cek autentikasi pengguna
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const sellerId = user.uid;
            // Memuat produk penjual
            loadSellerProducts(sellerId);
        } else {
            alert('Anda harus login sebagai penjual untuk mengakses halaman ini.');
            window.location.href = 'index.html';
        }
    });

    // Event Listener untuk form tambah produk
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const price = parseInt(document.getElementById('price').value);
        const photoUrl = document.getElementById('photoUrl').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);
        const slug = document.getElementById('slug').value;

        const sellerId = auth.currentUser.uid;

        const productData = {
            title,
            description,
            price,
            photoUrl,
            tanggalPembuatan: new Date().toISOString(),
            slug,
            location: new GeoPoint(latitude, longitude),
            sellerId
        };

        try {
            const productsCollection = collection(db, "products");
            await addDoc(productsCollection, productData);
            alert('Produk berhasil ditambahkan.');
            addProductForm.reset();
            loadSellerProducts(sellerId); // Refresh produk penjual
        } catch (error) {
            console.error('Error saat menambahkan produk:', error);
            alert('Gagal menambahkan produk. Silakan coba lagi.');
        }
    });
});

// Fungsi untuk memuat produk penjual
async function loadSellerProducts(sellerId) {
    const container = document.getElementById('seller-products-container');
    container.innerHTML = ''; // Bersihkan konten sebelumnya

    try {
        const productsCollection = collection(db, "products");
        const q = query(productsCollection, where("sellerId", "==", sellerId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<p>Anda belum menambahkan produk apapun.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productHTML = generateSellerProductCard(product, doc.id);
            container.insertAdjacentHTML('beforeend', productHTML);
        });
    } catch (error) {
        console.error('Error saat memuat produk penjual:', error);
        container.innerHTML = '<p>Gagal memuat produk. Silakan coba lagi nanti.</p>';
    }
}

// Fungsi untuk membuat HTML card produk penjual
function generateSellerProductCard(product, productId) {
    const productDate = new Date(product.tanggalPembuatan).toLocaleDateString('id-ID');

    return `
        <div class="card">
            <img src="${product.photoUrl}" alt="${product.title}" loading="lazy">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <p><strong>Harga:</strong> Rp ${product.price.toLocaleString()}</p>
            <p><strong>Tanggal:</strong> ${productDate}</p>
            <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="button">Lihat Produk</a>
            <!-- Tambahkan tombol edit/hapus jika diperlukan -->
        </div>`;
}

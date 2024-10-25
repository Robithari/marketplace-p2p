// public/js/buyer.js
import { db } from '../firebase-config.js';
import { collection, getDocs, GeoPoint } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Import Geofirestore
import { GeoFirestore } from 'https://cdn.jsdelivr.net/npm/geofirestore@5.4.0/dist/geofirestore.min.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('products-container');
    container.innerHTML = ''; // Bersihkan konten sebelumnya

    // Meminta akses lokasi pengguna
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            // Inisialisasi Geofirestore
            const geoFirestore = new GeoFirestore(db);
            const geoCollection = geoFirestore.collection('products');

            // Membuat query untuk mencari produk dalam radius 10 km
            const geoQuery = geoCollection.near({
                center: new GeoPoint(latitude, longitude),
                radius: 10 // Radius dalam kilometer
            });

            try {
                const querySnapshot = await geoQuery.get();

                if (querySnapshot.empty) {
                    container.innerHTML = '<p>Tidak ada produk yang tersedia di dekat Anda.</p>';
                    return;
                }

                querySnapshot.forEach((docSnapshot) => {
                    const product = docSnapshot.data();
                    const productHTML = generateProductCard(product);
                    container.insertAdjacentHTML('beforeend', productHTML);
                });
            } catch (error) {
                console.error('Error saat memuat produk:', error.message);
                container.innerHTML = '<p>Gagal memuat produk. Silakan coba lagi nanti.</p>';
            }
        }, (error) => {
            console.error('Error saat meminta lokasi:', error);
            alert('Lokasi tidak dapat diakses. Pastikan Anda mengizinkan akses lokasi.');
        });
    } else {
        alert('Geolocation tidak didukung oleh browser Anda.');
    }
});

// Fungsi untuk membuat HTML card produk
function generateProductCard(product) {
    const productDate = new Date(product.tanggalPembuatan).toLocaleDateString('id-ID');

    return `
        <div class="card">
            <img src="${product.photoUrl}" alt="${product.title}" loading="lazy">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <p><strong>Harga:</strong> Rp ${product.price.toLocaleString()}</p>
            <p><strong>Tanggal:</strong> ${productDate}</p>
            <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="button">Lihat Produk</a>
        </div>`;
}

// public/js/product.js
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        alert('Produk tidak ditemukan.');
        window.location.href = 'buyer.html';
        return;
    }

    // Query produk berdasarkan slug
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert('Produk tidak ditemukan.');
        window.location.href = 'buyer.html';
        return;
    }

    const productDoc = querySnapshot.docs[0];
    const product = productDoc.data();

    document.getElementById('product-title').textContent = product.title;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = product.price.toLocaleString();
    document.getElementById('product-date').textContent = new Date(product.tanggalPembuatan).toLocaleDateString('id-ID');
    document.getElementById('product-image').src = product.photoUrl;

    // Implementasi tombol beli
    document.getElementById('buy-button').addEventListener('click', async () => {
        // Implementasi proses beli, seperti menambah ke cart atau langsung checkout
        // Misalnya, menggunakan API /api/sell
        const user = auth.currentUser;

        if (!user) {
            alert('Anda harus login untuk membeli produk.');
            window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch('/api/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productDoc.id,
                    buyerId: user.uid,
                    sellerId: product.sellerId,
                    quantity: 1, // contoh, bisa ditambah fitur quantity
                    totalPrice: product.price * 1
                })
            });

            if (response.ok) {
                alert('Pembelian berhasil!');
            } else {
                const errorText = await response.text();
                alert(`Gagal melakukan pembelian: ${errorText}`);
            }
        } catch (error) {
            console.error('Error saat membeli produk:', error);
            alert('Gagal melakukan pembelian. Silakan coba lagi.');
        }
    });
});

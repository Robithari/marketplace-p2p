// api/sell.js
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin SDK
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
}

const db = getFirestore();

module.exports = async (req, res) => {
    // Apply CORS
    await cors(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { productId, buyerId, sellerId, quantity, totalPrice } = req.body;

    if (!productId || !buyerId || !sellerId || !quantity || !totalPrice) {
        return res.status(400).json({ message: "Bad Request: Missing required fields." });
    }

    const fee = totalPrice * 0.07; // 7% fee

    try {
        // Tambahkan order ke Firestore
        await db.collection('orders').add({
            productId,
            buyerId,
            sellerId,
            quantity,
            totalPrice,
            fee,
            status: "paid",
            tanggalPembelian: new Date()
        });

        // Update data penjual
        const sellerDoc = db.collection('sellers').doc(sellerId);
        const sellerSnapshot = await sellerDoc.get();

        if (sellerSnapshot.exists) {
            await sellerDoc.update({
                totalProducts: FieldValue.increment(1),
                totalEarnings: FieldValue.increment(totalPrice),
                totalFees: FieldValue.increment(fee)
            });
        } else {
            return res.status(404).json({ message: "Seller not found." });
        }

        res.status(200).json({ message: "Penjualan berhasil dicatat." });
    } catch (error) {
        console.error("Error saat mencatat penjualan:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

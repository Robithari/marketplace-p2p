// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Fungsi untuk mengakumulasi tagihan bulanan
exports.generateMonthlyBilling = functions.pubsub.schedule('0 0 1 * *') // Setiap tanggal 1 bulan pukul 00:00 UTC
    .timeZone('Asia/Jakarta') // Sesuaikan zona waktu
    .onRun(async (context) => {
        try {
            // Ambil semua penjual
            const sellersSnapshot = await db.collection('sellers').get();

            const billingPromises = sellersSnapshot.docs.map(async (doc) => {
                const seller = doc.data();
                const totalFees = seller.totalFees || 0;

                if (totalFees > 0) {
                    // Tambahkan tagihan ke koleksi billing
                    await db.collection('billing').add({
                        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                        sellerId: doc.id,
                        totalBilling: totalFees,
                        status: "Belum Dibayar",
                        tanggalTagihan: new Date()
                    });

                    // Reset totalFees di koleksi sellers
                    await db.collection('sellers').doc(doc.id).update({
                        totalFees: 0
                    });
                }
            });

            await Promise.all(billingPromises);
            console.log("Tagihan bulanan berhasil dibuat.");
        } catch (error) {
            console.error("Error saat membuat tagihan bulanan:", error);
        }
    });

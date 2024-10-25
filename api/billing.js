// api/billing.js
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

    const { method } = req;

    if (method === 'GET') {
        try {
            const billingSnapshot = await db.collection('billing').get();
            const billingList = [];

            billingSnapshot.forEach(doc => {
                billingList.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).json(billingList);
        } catch (error) {
            console.error('Error saat mengambil tagihan:', error);
            res.status(500).json({ message: "Internal Server Error." });
        }
    } else if (method === 'PUT') {
        const billingId = req.query.id;
        const { status } = req.body;

        if (!billingId || !status) {
            return res.status(400).json({ message: "Bad Request: Missing 'id' atau 'status' field." });
        }

        try {
            const billingDoc = db.collection('billing').doc(billingId);
            const billingSnapshot = await billingDoc.get();

            if (!billingSnapshot.exists) {
                return res.status(404).json({ message: "Tagihan tidak ditemukan." });
            }

            await billingDoc.update({ status });
            res.status(200).json({ message: "Status tagihan berhasil diperbarui." });
        } catch (error) {
            console.error('Error saat memperbarui tagihan:', error);
            res.status(500).json({ message: "Internal Server Error." });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};

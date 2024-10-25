// api/users.js
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

    if (method === 'POST') {
        // Create a new user dengan role
        const { uid, name, email, role, address } = req.body;

        if (!uid || !name || !email || !role) {
            return res.status(400).json({ message: "Bad Request: Missing required fields." });
        }

        try {
            await db.collection('users').doc(uid).set({
                name,
                email,
                role,
                address: address || '',
            });

            res.status(200).json({ message: "User berhasil dibuat." });
        } catch (error) {
            console.error('Error saat membuat user:', error);
            res.status(500).json({ message: "Internal Server Error." });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};

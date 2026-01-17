import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Sesuaikan path

export const logActivity = async (userId, userName, action, description) => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userId: userId,
      userName: userName,
      action: action, // Contoh: "LOGIN", "CHECKOUT", "UPDATE_MENU"
      description: description, // Contoh: "Pesanan total Rp 50.000", "Mengubah harga Ayam"
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Gagal mencatat log:", err);
  }
};
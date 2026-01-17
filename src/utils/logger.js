import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Pastikan path ini mengarah ke file firebase.js Anda

export const logActivity = async (userId, userName, action, description) => {
  if (!userId) return; // Jangan catat jika tidak ada user ID

  try {
    await addDoc(collection(db, "activity_logs"), {
      userId: userId,
      userName: userName || 'Tanpa Nama',
      action: action, 
      description: description,
      createdAt: serverTimestamp()
    });
    // Optional: Uncomment untuk debug di console
    // console.log(`[LOG] ${action}: ${description}`);
  } catch (err) {
    console.error("Gagal mencatat log:", err);
  }
};
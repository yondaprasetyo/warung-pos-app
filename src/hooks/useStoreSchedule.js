import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export const useStoreSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Jadwal Libur Realtime
  useEffect(() => {
    const q = query(collection(db, "store_schedules"), orderBy("startDate", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Fungsi Tambah Jadwal Libur
  const addSchedule = async (startDate, endDate, reason) => {
    await addDoc(collection(db, "store_schedules"), {
      startDate, // Format YYYY-MM-DD
      endDate,   // Format YYYY-MM-DD
      reason
    });
  };

  // 3. Fungsi Hapus Jadwal
  const deleteSchedule = async (id) => {
    await deleteDoc(doc(db, "store_schedules", id));
  };

  // 4. Fungsi Pengecekan: Apakah Tanggal Ini Toko Tutup?
  const checkIsClosed = (targetDateString) => {
    if (!targetDateString || schedules.length === 0) return null;

    // Cari jadwal yang mencakup tanggal target
    // String comparison (YYYY-MM-DD) works perfectly for dates
    const foundSchedule = schedules.find(sched => {
      return targetDateString >= sched.startDate && targetDateString <= sched.endDate;
    });

    return foundSchedule || null; // Return object jadwal jika tutup, atau null jika buka
  };

  return {
    schedules,
    loading,
    addSchedule,
    deleteSchedule,
    checkIsClosed
  };
};
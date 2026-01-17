import React, { useState } from 'react';
import { db } from '../../firebase'; // Sesuaikan path ini dengan struktur folder Anda
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Trash2, Plus, History, X, Clock, Activity } from 'lucide-react';

const UserManagement = ({ users, currentUser, onDelete, onAddClick }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fungsi untuk mengambil log spesifik user dari Firebase
  const handleViewLogs = async (user) => {
    setSelectedUser(user);
    setShowLogModal(true);
    setLoadingLogs(true);
    setLogs([]);

    try {
      // Asumsi: Anda menyimpan data di koleksi bernama "activity_logs"
      // Jika koleksi belum ada, tidak akan error, hanya kosong.
      const logsRef = collection(db, "activity_logs");
      const q = query(
        logsRef,
        where("userId", "==", user.id),
        orderBy("createdAt", "desc"),
        limit(20) // Ambil 20 aktivitas terakhir saja agar ringan
      );

      const querySnapshot = await getDocs(q);
      const userLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setLogs(userLogs);
    } catch (error) {
      console.error("Gagal mengambil log:", error);
      // Fallback jika index belum dibuat di Firestore
      if (error.message.includes("requires an index")) {
        alert("Index Firestore diperlukan untuk sorting log. Cek console log browser.");
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    // Handle timestamp Firestore atau Date object biasa
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // --- KOMPONEN MODAL LOG ---
  const renderLogModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Modal Header */}
        <div className="bg-orange-500 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History size={20} /> Aktivitas User
            </h3>
            <p className="text-orange-100 text-sm">{selectedUser?.name} ({selectedUser?.role})</p>
          </div>
          <button onClick={() => setShowLogModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
          {loadingLogs ? (
            <div className="p-10 text-center text-gray-400 animate-pulse">Memuat riwayat...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center text-gray-400">
              <Activity size={48} className="mb-2 opacity-20" />
              <p>Belum ada aktivitas tercatat.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-white transition-colors flex gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                       {/* Ikon simpel berdasarkan tipe aksi */}
                       <Clock size={14} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-800 text-sm">{log.action}</p>
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{log.description || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-white shrink-0 text-center text-xs text-gray-400">
          Menampilkan 20 aktivitas terakhir
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-[2rem] shadow-xl border-4 border-orange-50 p-6 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 italic tracking-tighter">Manajemen User</h2>
            <p className="text-gray-400 text-sm font-medium">Kelola akses staff warung</p>
          </div>
          <button 
            onClick={onAddClick} 
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center gap-2"
          >
            <Plus size={20} /> Tambah User
          </button>
        </div>
        
        {/* Table Section */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full">
            <thead className="bg-orange-50">
              <tr>
                <th className="text-left p-4 font-black text-gray-500 uppercase text-xs tracking-widest">Nama Staff</th>
                <th className="text-left p-4 font-black text-gray-500 uppercase text-xs tracking-widest">Email</th>
                <th className="text-left p-4 font-black text-gray-500 uppercase text-xs tracking-widest">Role</th>
                <th className="text-center p-4 font-black text-gray-500 uppercase text-xs tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="p-4 font-bold text-gray-700">{user.name}</td>
                  <td className="p-4 text-sm text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {/* Tombol Lihat Log */}
                      <button 
                        onClick={() => handleViewLogs(user)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-100 rounded-xl transition-all"
                        title="Lihat Log Aktivitas"
                      >
                        <History size={18} />
                      </button>

                      {/* Tombol Hapus */}
                      {user.id !== currentUser.id && (
                        <button 
                          onClick={() => onDelete(user.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Modal jika state true */}
      {showLogModal && renderLogModal()}
    </div>
  );
};

export default UserManagement;
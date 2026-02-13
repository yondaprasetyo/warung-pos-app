import React, { useState } from 'react';
import { db } from '../../firebase'; 
import { useAuth } from '../../hooks/useAuth'; 
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { 
  Trash2, Plus, History, X, Clock, Activity, 
  UserPlus, Shield, Mail, Lock, User, StickyNote 
} from 'lucide-react';

const UserManagement = ({ users, currentUser, onDelete }) => {
  // 1. Menggunakan fungsi register yang sudah ada di useAuth.js
  const { register } = useAuth(); 
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // State untuk menampung input data user baru
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir'
  });

  const handleViewLogs = async (user) => {
    setSelectedUser(user);
    setShowLogModal(true);
    setLoadingLogs(true);
    try {
      const logsRef = collection(db, "activity_logs");
      const q = query(logsRef, where("userId", "==", user.id), orderBy("createdAt", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil log:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fungsi untuk menjalankan pendaftaran user baru
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData); 
    if (success) {
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'kasir' });
      alert("User baru berhasil ditambahkan!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-[2rem] shadow-xl border-4 border-orange-50 p-6 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 italic tracking-tighter uppercase">Manajemen User</h2>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Kelola akses staff warung</p>
          </div>
          {/* PERBAIKAN: Tombol sekarang membuka modal pendaftaran secara instan */}
          <button 
            type="button"
            onClick={() => setShowAddModal(true)} 
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
                  <td className="p-4 font-bold text-gray-700 uppercase italic text-sm">{user.name}</td>
                  <td className="p-4 text-sm text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleViewLogs(user)} className="p-2 text-gray-400 hover:text-orange-500 transition-all shadow-sm rounded-lg hover:bg-white">
                        <History size={18} />
                      </button>

                      {/* Proteksi: Tombol hapus tidak muncul untuk akun sendiri */}
                      {user.id !== currentUser?.uid && ( 
                        <button onClick={() => onDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all shadow-sm rounded-lg hover:bg-white">
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

      {/* FORM MODAL REGISTRASI USER BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in duration-200">
            <div className="bg-orange-500 p-6 text-white flex justify-between items-center shadow-lg">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <UserPlus size={24} /> Registrasi
              </h3>
              <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-8 space-y-4 bg-white">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-3 text-gray-300" size={20} />
                  <input required type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 font-bold text-sm" placeholder="Masukkan nama..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email Staff</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 text-gray-300" size={20} />
                  <input required type="email" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 font-bold text-sm" placeholder="email@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 text-gray-300" size={20} />
                  <input required type="password" minLength={6} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 font-bold text-sm" placeholder="Minimal 6 karakter..." value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Hak Akses (Role)</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-3 text-gray-300" size={20} />
                  <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 font-bold text-sm appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="kasir">KASIR</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-200 mt-4 hover:bg-orange-600 active:scale-95 transition-all">Simpan</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG AKTIVITAS */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-orange-500 p-5 flex justify-between items-center text-white shrink-0 shadow-lg">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><History size={20} /> Aktivitas User</h3>
                <p className="text-orange-100 text-xs font-bold uppercase">{selectedUser?.name}</p>
              </div>
              <button onClick={() => setShowLogModal(false)}><X size={24} /></button>
            </div>
            <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
              {loadingLogs ? (
                <div className="p-10 text-center text-gray-400 animate-pulse uppercase font-black text-xs">Memuat riwayat...</div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center text-gray-400">
                  <Activity size={48} className="mb-2 opacity-20" />
                  <p className="uppercase font-black text-xs">Belum ada aktivitas.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white transition-colors flex gap-3">
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm"><Clock size={14} /></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-800 text-sm uppercase italic tracking-tighter">{log.action}</p>
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{formatDate(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{log.description || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
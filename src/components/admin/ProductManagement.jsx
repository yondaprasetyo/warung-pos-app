import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth'; // <--- Import User Auth
import { logActivity } from '../../utils/logger'; // <--- Import Logger
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { Calendar, Tag, Layers, Trash2, Edit3, Image, Box, Search, ToggleLeft, ToggleRight } from 'lucide-react';

const DAYS = [
  { id: 1, label: 'Sen' }, { id: 2, label: 'Sel' }, { id: 3, label: 'Rab' },
  { id: 4, label: 'Kam' }, { id: 5, label: 'Jum' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Min' }
];

const ProductManagement = () => {
  const { currentUser } = useAuth(); // <--- Ambil user yang sedang login
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', category: '', imageUrl: '', availableDays: [] 
  });

  const [variants, setVariants] = useState([{ name: '', useSpecialPrice: false, price: '', stock: '' }]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      setProducts(querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          isAvailable: data.isAvailable !== false 
        };
      }));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const uniqueCategories = useMemo(() => {
    const defaultCats = [
        "Ayam", "Ikan", "Sayur", "Nasi", "Minuman", 
        "Tumisan/Osengan", "Telur", "Gorengan", "Menu Tambahan"
    ];
    const dbCats = products.map(p => p.category).filter(Boolean);
    return [...new Set([...defaultCats, ...dbCats])].sort();
  }, [products]);

  const getDailyStats = () => {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    products.forEach(p => {
      if (p.isAvailable) {
        if (p.availableDays && p.availableDays.length > 0) {
          p.availableDays.forEach(dayId => {
            if (Object.prototype.hasOwnProperty.call(stats, dayId)) stats[dayId]++;
          });
        } else {
          Object.keys(stats).forEach(key => stats[key]++);
        }
      }
    });
    return stats;
  };

  const dailyStats = getDailyStats();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDay = (dayId) => {
    const currentDays = formData.availableDays || [];
    const newDays = currentDays.includes(dayId) ? currentDays.filter(d => d !== dayId) : [...currentDays, dayId];
    setFormData({ ...formData, availableDays: newDays });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  // --- LOGIKA TOGGLE STATUS AKTIF/TIDAK + LOGGING ---
  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.isAvailable;
      const productRef = doc(db, "products", product.id);
      
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, isAvailable: newStatus } : p
      ));

      await updateDoc(productRef, { isAvailable: newStatus });

      // LOGGING
      if (currentUser) {
        logActivity(
            currentUser.uid, 
            currentUser.name, 
            "UPDATE STATUS", 
            `Mengubah ${product.name} menjadi ${newStatus ? 'AKTIF' : 'NON-AKTIF'}`
        );
      }
    } catch (error) {
      alert("Gagal mengubah status: " + error.message);
      fetchProducts(); 
    }
  };

  // --- LOGIKA ADD/EDIT + LOGGING ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const activeVariants = variants.filter(v => v.name.trim() !== "");

      // 1. Logika Hybrid Stock
      let finalGlobalStock = formData.stock === -1 ? -1 : Number(formData.stock);
      
      if (activeVariants.length > 0) {
        const allVariantUnlimited = activeVariants.every(v => v.stock === -1);
        if (allVariantUnlimited) {
          finalGlobalStock = -1;
        } else {
          // Total stok global adalah jumlah dari stok semua varian
          finalGlobalStock = activeVariants.reduce((sum, v) => sum + (v.stock === -1 ? 0 : Number(v.stock)), 0);
        }
      }
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: finalGlobalStock, // <--- Perbaikan: Menggunakan variabel hasil perhitungan hybrid
        variants: activeVariants.map(v => ({
          name: v.name,
          price: v.useSpecialPrice ? Number(v.price) : Number(formData.price),
          useSpecialPrice: v.useSpecialPrice,
          stock: v.stock === -1 ? -1 : Number(v.stock) // <--- Tambahkan stok varian di sini
        })),
        isAvailable: true, 
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        const editPayload = { ...payload };
        delete editPayload.isAvailable;
        await updateDoc(doc(db, "products", editingId), editPayload);
        
        if (currentUser) {
            logActivity(currentUser.uid, currentUser.name, "EDIT MENU", `Mengupdate data menu: ${formData.name}`);
        }
        alert("✅ Berhasil Update!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
        
        if (currentUser) {
            logActivity(currentUser.uid, currentUser.name, "TAMBAH MENU", `Menambah menu baru: ${formData.name}`);
        }
        alert("🚀 Berhasil Tambah!");
      }
      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: '', imageUrl: '', availableDays: [] });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { alert(error.message); }
  };

  // --- LOGIKA DELETE + LOGGING ---
  const handleDelete = async (p) => {
      if(window.confirm(`Yakin ingin menghapus ${p.name}?`)) {
          try {
            await deleteDoc(doc(db, "products", p.id));
            // LOGGING DELETE
            if (currentUser) {
                logActivity(currentUser.uid, currentUser.name, "HAPUS MENU", `Menghapus menu: ${p.name}`);
            }
            fetchProducts();
          } catch (err) {
              alert("Gagal hapus: " + err.message);
          }
      }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name || '', 
      price: p.price || '', 
      stock: p.stock ?? '',
      category: p.category || 'Ayam', 
      imageUrl: p.imageUrl || '', 
      availableDays: p.availableDays || [] 
    });
    
    // Pastikan field 'stock' di setiap varian ikut terisi saat mulai edit
    setVariants(
      p.variants?.length > 0 
        ? p.variants.map(v => ({
            name: v.name || '',
            useSpecialPrice: v.useSpecialPrice || false,
            price: v.price || '',
            stock: v.stock ?? '' // Ambil stok varian dari DB
          })) 
        : [{ name: '', useSpecialPrice: false, price: '', stock: '' }]
    );
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse text-2xl italic">MEMUAT DATA...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 font-sans text-gray-800">
      
      <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter flex items-center gap-3">
        {editingId ? '📝 Edit Menu' : '🍽️ Kelola & Tambah Menu'}
      </h2>

      {/* 1. SECTION RINGKASAN (STATS) */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-8">
        {DAYS.map((day) => (
          <div key={day.id} className="bg-white p-3 rounded-2xl border-2 border-orange-50 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase italic">{day.label}</p>
            <p className="text-xl font-black text-orange-600 leading-none mt-1">
              {dailyStats[day.id]}
            </p>
            <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Menu Aktif</p>
          </div>
        ))}
      </div>

      {/* 2. FORM INPUT SECTION */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-4 border-orange-50 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
             <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="prev" /> : <Image className="text-gray-300" size={40} />}
             </div>
             <input type="text" placeholder="URL Foto" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-6">
            <input type="text" required placeholder="Nama Masakan" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-lg outline-none uppercase" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
               <input type="number" required placeholder="Harga Dasar" className="w-full p-4 bg-orange-50 rounded-2xl font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               
               <div className="relative">
                   <input 
                     required
                     list="category-options" 
                     type="text" 
                     placeholder="Pilih / Ketik Kategori" 
                     className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all placeholder:text-gray-400" 
                     value={formData.category} 
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                   />
                   <datalist id="category-options">
                     {uniqueCategories.map((cat, idx) => (
                       <option key={idx} value={cat} />
                     ))}
                   </datalist>
               </div>
            </div>
          </div>
        </div>

        {/* JADWAL HARI */}
        <div className="mb-10 p-6 bg-yellow-50 rounded-[2rem] border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-orange-600">
                  <Calendar size={20} />
                  <label className="text-xs font-black uppercase italic">Jadwal Tampil Menu</label>
              </div>
              <div className="flex gap-2">
                  <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, availableDays: [1, 2, 3, 4, 5, 6, 0] })}
                      className="text-[9px] font-black bg-orange-200 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-600 hover:text-white transition-all"
                  >
                      PILIH SEMUA
                  </button>
                  <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, availableDays: [] })}
                      className="text-[9px] font-black bg-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-400 hover:text-white transition-all"
                  >
                      HAPUS SEMUA
                  </button>
              </div>
          </div>
          <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                  <button key={day.id} type="button" onClick={() => toggleDay(day.id)}
                      className={`flex-1 min-w-[60px] py-4 rounded-xl text-[10px] font-black transition-all border-2 ${formData.availableDays?.includes(day.id) ? 'bg-orange-600 border-orange-700 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {day.label.toUpperCase()}
                  </button>
              ))}
          </div>
        </div>

        {/* VARIAN MENU */}
        <div className="mb-10 space-y-4">
          <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Varian Menu</label>
              <button type="button" onClick={() => setVariants([...variants, { name: '', useSpecialPrice: false, price: '', stock: '' }])} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all">+ TAMBAH VARIAN</button>
          </div>
          <div className="space-y-3">
              {variants.map((v, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex gap-2 items-center">
                          <input type="text" placeholder="Nama Varian" className="flex-1 bg-white p-2 rounded-xl text-xs font-bold outline-none border border-gray-200" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                          
                          {/* Toggle Harga Khusus */}
                          <button type="button" onClick={() => {
                              const newV = [...variants];
                              newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                              setVariants(newV);
                          }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${v.useSpecialPrice ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`} title="Gunakan Harga Khusus Varian">
                              <Tag size={14} />
                          </button>

                          <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>

                      <div className="flex gap-4 items-center pl-2">
                          {/* Input Harga Varian */}
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-gray-400">HARGA:</span>
                              <input type="number" disabled={!v.useSpecialPrice} placeholder="Harga" className={`w-24 p-2 rounded-xl text-xs font-black text-right border ${v.useSpecialPrice ? 'bg-white text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-300 border-transparent'}`} value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                          </div>

                          {/* Input Stok Varian */}
                          <div className="flex items-center gap-2 flex-1">
                              <span className="text-[9px] font-bold text-gray-400">STOK:</span>
                              <input type="number" disabled={v.stock === -1} placeholder="Qty" className={`w-20 p-2 rounded-xl text-xs font-black text-right border ${v.stock === -1 ? 'bg-gray-100 text-gray-300 border-transparent' : 'bg-white text-gray-700 border-gray-200'}`} value={v.stock === -1 ? '' : v.stock} onChange={(e) => handleVariantChange(i, 'stock', e.target.value)} />
                              
                              <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 cursor-pointer">
                                  <input type="checkbox" className="w-3 h-3 accent-orange-500" checked={v.stock === -1} onChange={(e) => handleVariantChange(i, 'stock', e.target.checked ? -1 : '')} /> ♾️ UNLIMITED
                              </label>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

        {/* STOK UTAMA */}
        <div className={`mb-10 p-6 rounded-[2rem] flex items-center gap-6 transition-all ${variants.some(v => v.name.trim() !== "") ? 'bg-orange-50 opacity-80 border-2 border-orange-100' : 'bg-gray-50'}`}>
            <div className="flex-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    {variants.some(v => v.name.trim() !== "") ? 'Total Stok (Otomatis dari Varian)' : 'Jumlah Stok'}
                </label>
                <input 
                  type="number" 
                  disabled={formData.stock === -1 || variants.some(v => v.name.trim() !== "")} 
                  className="w-full p-4 bg-white rounded-xl outline-none font-black text-2xl border border-gray-100" 
                  value={formData.stock === -1 ? '' : formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                />
            </div>
            
            {/* Sembunyikan checkbox unlimited jika ada varian, karena unlimited diatur per varian */}
            {!variants.some(v => v.name.trim() !== "") && (
                <label className="flex items-center gap-3 text-xs font-black text-gray-500 cursor-pointer bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
                    <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> ♾️ UNLIMITED
                </label>
            )}
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-3xl font-black text-xl uppercase italic shadow-xl hover:bg-orange-700 transition-all">
          {editingId ? 'Update Data Menu' : 'Simpan Menu Baru'}
        </button>
      </form>

      {/* --- SECTION DAFTAR MENU + SEARCH --- */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-black uppercase italic tracking-tighter">Daftar Menu Saat Ini</h3>
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" placeholder="Cari menu atau kategori..." 
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-all shadow-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
            <tr>
              <th className="p-6">Produk & Jadwal</th>
              <th className="p-6">Varian & Harga</th>
              <th className="p-6">Stok</th>
              <th className="p-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((p) => (
              <tr key={p.id} className={`transition-all group ${p.isAvailable ? 'hover:bg-orange-50/20' : 'bg-gray-50 opacity-60 grayscale-[0.8]'}`}>
                <td className="p-6 align-top">
                  {/* Kolom Produk & Jadwal (Tetap sama) */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Image className="m-auto mt-3 text-gray-300" size={20} />}
                    </div>
                    <div>
                      <p className={`font-black uppercase italic text-base leading-tight ${p.isAvailable ? 'text-gray-800' : 'text-gray-500 line-through decoration-2'}`}>{p.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={10} className={p.isAvailable ? "text-orange-500" : "text-gray-400"} />
                        <p className={`text-[9px] font-bold uppercase tracking-tighter ${p.isAvailable ? 'text-orange-500' : 'text-gray-400'}`}>
                          {p.availableDays?.length > 0 ? p.availableDays.sort((a,b) => a-b).map(id => DAYS.find(d => d.id === id)?.label).join(', ') : 'SETIAP HARI'}
                        </p>
                      </div>
                      {!p.isAvailable && <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-md mt-1 inline-block">NON-AKTIF</span>}
                    </div>
                  </div>
                </td>

                <td className="p-6 align-top">
                  {/* Kolom Varian & Harga (DIPERBARUI DENGAN STOK VARIAN) */}
                  <div className="space-y-2">
                    <div className={`text-[10px] font-black ${p.isAvailable ? 'text-orange-600' : 'text-gray-400'}`}>
                      Rp {Number(p.price).toLocaleString('id-ID')} <span className="text-gray-400 font-bold">(Dasar)</span>
                    </div>
                    {p.variants && p.variants.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {p.variants.map((v, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 italic shadow-sm">
                              {v.name}: Rp {Number(v.price).toLocaleString('id-ID')}
                            </span>
                            {/* Badge Stok per Varian */}
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${v.stock === -1 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {v.stock === -1 ? '∞' : `${v.stock} pcs`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                <td className="p-6 align-top">
                  {/* Kolom Stok Total */}
                  <div className={`inline-flex flex-col gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase ${p.stock === -1 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Box size={12} />
                      {p.stock === -1 ? 'Unlimited' : `${p.stock} Total`}
                    </div>
                    {p.variants?.length > 0 && <span className="text-[7px] text-gray-400">(Gabungan Varian)</span>}
                  </div>
                </td>

                <td className="p-6 text-center">
                  {/* Kolom Aksi (Tetap sama) */}
                  <div className="flex justify-center gap-2 items-center">
                    <button 
                      onClick={() => handleToggleStatus(p)} 
                      className={`p-3 rounded-xl transition-all shadow-sm ${p.isAvailable ? 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-500 hover:text-white'}`}
                      title={p.isAvailable ? "Non-aktifkan Menu" : "Aktifkan Menu"}
                    >
                      {p.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(p)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
            <div className="p-20 text-center font-bold text-gray-400 uppercase text-xs italic">
                Menu tidak ditemukan...
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
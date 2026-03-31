import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth'; 
import { logActivity } from '../../utils/logger'; 
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { Calendar, Tag, Layers, Trash2, Edit3, Image, Box, Search, ToggleLeft, ToggleRight, X } from 'lucide-react';

const DAYS = [
  { id: 1, label: 'Sen' }, { id: 2, label: 'Sel' }, { id: 3, label: 'Rab' },
  { id: 4, label: 'Kam' }, { id: 5, label: 'Jum' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Min' }
];

const ProductManagement = () => {
  const { currentUser } = useAuth();
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
      setProducts(querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isAvailable: doc.data().isAvailable !== false 
      })));
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const uniqueCategories = useMemo(() => {
    const defaultCats = ["Ayam", "Ikan", "Sayur", "Nasi", "Minuman", "Tumisan/Osengan", "Telur", "Gorengan", "Menu Tambahan"];
    const dbCats = products.map(p => p.category).filter(Boolean);
    return [...new Set([...defaultCats, ...dbCats])].sort();
  }, [products]);

  const dailyStats = useMemo(() => {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    products.forEach(p => {
      if (p.isAvailable) {
        if (p.availableDays?.length > 0) {
          p.availableDays.forEach(dayId => { if (stats[dayId] !== undefined) stats[dayId]++; });
        } else {
          Object.keys(stats).forEach(key => stats[key]++);
        }
      }
    });
    return stats;
  }, [products]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.isAvailable;
      setProducts(products.map(p => p.id === product.id ? { ...p, isAvailable: newStatus } : p));
      await updateDoc(doc(db, "products", product.id), { isAvailable: newStatus });
      if (currentUser) logActivity(currentUser.uid, currentUser.name, "UPDATE STATUS", `${product.name} -> ${newStatus ? 'AKTIF' : 'NON-AKTIF'}`);
    } catch (error) {
      alert("Gagal: " + error.message);
      fetchProducts(); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const activeVariants = variants.filter(v => v.name.trim() !== "");
      let finalGlobalStock = formData.stock === -1 ? -1 : Number(formData.stock);
      
      if (activeVariants.length > 0) {
        finalGlobalStock = activeVariants.some(v => v.stock === -1) 
          ? -1 
          : activeVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: finalGlobalStock,
        variants: activeVariants.map(v => ({
          name: v.name,
          price: v.useSpecialPrice ? Number(v.price) : Number(formData.price),
          useSpecialPrice: v.useSpecialPrice,
          stock: v.stock === -1 ? -1 : Number(v.stock || 0)
        })),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
        alert("✅ Berhasil Diperbarui!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, isAvailable: true, createdAt: serverTimestamp() });
        alert("🚀 Berhasil Ditambahkan!");
      }

      resetForm();
      fetchProducts();
    } catch (error) { alert(error.message); }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', stock: '', category: '', imageUrl: '', availableDays: [] });
    setVariants([{ name: '', useSpecialPrice: false, price: '', stock: '' }]);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name || '', price: p.price || '', stock: p.stock ?? '',
      category: p.category || '', imageUrl: p.imageUrl || '', availableDays: p.availableDays || [] 
    });
    setVariants(p.variants?.length > 0 ? p.variants.map(v => ({ ...v })) : [{ name: '', useSpecialPrice: false, price: '', stock: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (p) => {
    if (window.confirm(`Hapus ${p.name}?`)) {
      await deleteDoc(doc(db, "products", p.id));
      fetchProducts();
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse text-2xl italic">MEMUAT DATA...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 font-sans text-gray-800">
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          {editingId ? '📝 Edit Menu' : '🍽️ Kelola Menu'}
        </h2>
        {editingId && (
          <button onClick={resetForm} className="flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-600 px-3 py-2 rounded-xl">
            <X size={14} /> BATAL EDIT
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-7 gap-2 mb-8 pb-2 no-scrollbar">
        {DAYS.map((day) => (
          <div key={day.id} className="min-w-[85px] bg-white p-3 rounded-2xl border-2 border-orange-50 shadow-sm text-center flex-shrink-0">
            <p className="text-[10px] font-black text-gray-400 uppercase italic">{day.label}</p>
            <p className="text-xl font-black text-orange-600 mt-1">{dailyStats[day.id]}</p>
          </div>
        ))}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-5 md:p-8 shadow-2xl border-4 border-orange-50 mb-12">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 mb-10">
          <div className="space-y-4">
            <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
              {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="prev" /> : <Image className="text-gray-300" size={40} />}
            </div>
            <input type="text" placeholder="URL Foto" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <input type="text" required placeholder="Nama Masakan" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-lg outline-none uppercase" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input type="number" required placeholder="Harga" className="w-full p-4 bg-orange-50 rounded-2xl font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               <input list="category-options" type="text" placeholder="Kategori" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
               <datalist id="category-options">
                 {uniqueCategories.map((cat, idx) => <option key={idx} value={cat} />)}
               </datalist>
            </div>
          </div>
        </div>

        {/* JADWAL */}
        <div className="mb-8 p-5 bg-yellow-50 rounded-2xl border-2 border-yellow-100">
          <label className="text-[10px] font-black uppercase italic text-orange-600 mb-3 block">Jadwal Tampil</label>
          <div className="grid grid-cols-4 sm:flex gap-2">
            {DAYS.map((day) => (
              <button key={day.id} type="button" onClick={() => {
                const current = formData.availableDays || [];
                setFormData({...formData, availableDays: current.includes(day.id) ? current.filter(d => d !== day.id) : [...current, day.id]});
              }} className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 sm:flex-1 ${formData.availableDays?.includes(day.id) ? 'bg-orange-600 border-orange-700 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* VARIAN */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Layers size={14} /> Varian</label>
            <button type="button" onClick={() => setVariants([...variants, { name: '', useSpecialPrice: false, price: '', stock: '' }])} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-2 rounded-lg">+ TAMBAH</button>
          </div>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input type="text" placeholder="Nama Varian" className="flex-1 bg-white p-3 rounded-xl text-xs font-bold border border-gray-200" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                    setVariants(newV);
                  }} className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${v.useSpecialPrice ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}><Tag size={16} /></button>
                  <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="w-10 h-10 bg-red-50 text-red-400 flex items-center justify-center rounded-xl"><Trash2 size={16} /></button>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400">HARGA:</span>
                    <input type="number" disabled={!v.useSpecialPrice} className="w-full p-2 rounded-lg text-xs font-black bg-white border border-gray-200" value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400">STOK:</span>
                    <input type="number" disabled={v.stock === -1} className="w-full p-2 rounded-lg text-xs font-black bg-white border border-gray-200" value={v.stock === -1 ? '' : v.stock} onChange={(e) => handleVariantChange(i, 'stock', e.target.value)} />
                    <label className="flex items-center gap-1 text-[10px] font-black cursor-pointer"><input type="checkbox" checked={v.stock === -1} onChange={(e) => handleVariantChange(i, 'stock', e.target.checked ? -1 : '')} /> ♾️</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STOK UTAMA */}
        <div className={`mb-10 p-5 rounded-2xl flex items-center gap-4 ${variants.some(v => v.name.trim() !== "") ? 'bg-orange-50 opacity-80' : 'bg-gray-50'}`}>
          <div className="flex-1">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Stok Utama {variants.some(v => v.name.trim() !== "") && '(Otomatis)'}</label>
            <input type="number" disabled={formData.stock === -1 || variants.some(v => v.name.trim() !== "")} className="w-full p-4 bg-white rounded-xl font-black text-2xl border border-gray-100" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
          </div>
          {!variants.some(v => v.name.trim() !== "") && (
            <label className="flex items-center gap-2 text-xs font-black text-gray-500 bg-white px-6 py-4 rounded-xl border border-gray-200 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> ♾️ UNLIMITED
            </label>
          )}
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black text-xl uppercase shadow-xl hover:bg-orange-700 active:scale-95 transition-all">
          {editingId ? 'Simpan Perubahan' : 'Tambah Menu Sekarang'}
        </button>
      </form>

      {/* TABLE */}
      <div className="mb-6 flex justify-between items-center px-2">
        <h3 className="font-black uppercase italic text-sm">Menu Terdaftar</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Cari..." className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold w-40 md:w-60 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase italic">
              <tr>
                <th className="p-6">Menu</th>
                <th className="p-6">Varian & Harga</th>
                <th className="p-6">Stok</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className={p.isAvailable ? 'hover:bg-orange-50/10' : 'bg-gray-50/50 opacity-60'}>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Image className="text-gray-300" size={18} />}
                      </div>
                      <div>
                        <p className="font-black uppercase italic text-sm text-gray-800 leading-tight">{p.name}</p>
                        <p className="text-[8px] font-bold text-orange-500 uppercase mt-1">
                          {p.availableDays?.length > 0 ? p.availableDays.sort((a,b)=>a-b).map(id=>DAYS.find(d=>d.id===id)?.label).join(', ') : 'Setiap Hari'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-black text-gray-800 italic">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                    {p.variants?.length > 0 && <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">+{p.variants.length} Varian</span>}
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black ${p.stock === -1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      <Box size={10} /> {p.stock === -1 ? '∞' : p.stock}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleToggleStatus(p)} className={`p-2.5 rounded-xl transition-all ${p.isAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                        {p.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => startEdit(p)} className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(p)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { Calendar, Package, Tag, Layers, Trash2, Edit3, Plus, Image as ImageIcon } from 'lucide-react';

const DAYS = [
  { id: 1, label: 'Sen' }, { id: 2, label: 'Sel' }, { id: 3, label: 'Rab' },
  { id: 4, label: 'Kam' }, { id: 5, label: 'Jum' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Min' }
];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Ayam',
    imageUrl: '',
    isAvailable: true,
    availableDays: [] 
  });

  const [variants, setVariants] = useState([{ name: '', useSpecialPrice: false, price: '' }]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (error) { 
      console.error("Error fetching products:", error); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleDay = (dayId) => {
    const currentDays = formData.availableDays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId];
    setFormData(prev => ({ ...prev, availableDays: newDays }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: formData.stock === -1 ? -1 : Number(formData.stock),
        variants: variants.filter(v => v.name.trim() !== "").map(v => ({
          name: v.name,
          price: v.useSpecialPrice ? Number(v.price) : Number(formData.price),
          useSpecialPrice: v.useSpecialPrice
        })),
        availableDays: formData.availableDays || [],
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
        alert("✅ BERHASIL: Menu telah diperbarui!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
        alert("🚀 BERHASIL: Menu baru ditambahkan!");
      }

      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true, availableDays: [] });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { 
      alert("Gagal menyimpan: " + error.message); 
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
      isAvailable: p.isAvailable ?? true,
      availableDays: p.availableDays || [] 
    });
    setVariants(Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 italic uppercase">Sedang Memuat Data...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter">
          {editingId ? '📝 Edit Menu Pelanggan' : '🍽️ Tambah Menu Baru'}
        </h2>
        {editingId && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true, availableDays: [] });
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-lg shadow-red-200"
          >
            Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-4 border-orange-50 mb-12">
        
        {/* FOTO & IDENTITAS DASAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> Foto Menu</label>
            <div className="aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative group">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-[10px] font-bold uppercase">No Image</span>
              )}
            </div>
            <input type="text" placeholder="Masukkan Link Foto" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-orange-500" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Masakan</label>
              <input type="text" required placeholder="Contoh: Ayam Bakar Spesial" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-orange-500 transition-all uppercase" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Dasar (Rp)</label>
                 <input type="number" required placeholder="15000" className="w-full p-4 bg-orange-50/50 rounded-2xl outline-none font-black text-orange-600 text-2xl italic" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                 <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="Ayam">Ayam</option>
                    <option value="Ikan">Ikan</option>
                    <option value="Sayur">Sayur</option>
                    <option value="Nasi">Nasi</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Gorengan">Gorengan</option>
                 </select>
               </div>
            </div>
          </div>
        </div>

        {/* --- FITUR JADWAL HARI --- */}
        <div className="mb-10 p-6 bg-yellow-50/50 rounded-[2.5rem] border-2 border-yellow-200">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-600" size={18} />
                <label className="text-[11px] font-black text-orange-800 uppercase tracking-widest italic">Setting Jadwal Muncul Menu</label>
            </div>
            <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                    const active = formData.availableDays?.includes(day.id);
                    return (
                        <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            className={`flex-1 min-w-[60px] py-4 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                active 
                                ? 'bg-orange-600 border-orange-700 text-white shadow-lg' 
                                : 'bg-white border-gray-200 text-gray-400 hover:border-orange-300'
                            }`}
                        >
                            {day.label.toUpperCase()}
                        </button>
                    )
                })}
            </div>
            <p className="text-[9px] text-orange-500/70 mt-4 italic font-bold uppercase tracking-wider text-center">
                * Klik hari untuk mengaktifkan jadwal. Kosongkan jika ingin muncul setiap hari.
            </p>
        </div>

        {/* VARIAN & STOK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Varian Harga</label>
                    <button type="button" onClick={() => setVariants([...variants, { name: '', useSpecialPrice: false, price: '' }])} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all">+ TAMBAH VARIAN</button>
                </div>
                <div className="space-y-3">
                    {variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <input type="text" placeholder="Nama Varian" className="flex-1 bg-white p-2 rounded-xl text-xs font-bold outline-none" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => {
                                    const newV = [...variants];
                                    newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                                    setVariants(newV);
                                }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${v.useSpecialPrice ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Tag size={14} />
                                </button>
                                <input type="number" disabled={!v.useSpecialPrice} placeholder="Harga" className={`w-24 p-2 rounded-xl text-xs font-black text-right ${v.useSpecialPrice ? 'bg-white text-orange-600' : 'bg-gray-100 text-gray-300'}`} value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Package size={14} /> Pengaturan Stok</label>
                <div className="bg-gray-50 p-8 rounded-[3rem] border-2 border-gray-100 flex items-center gap-6 shadow-inner">
                    <input type="number" disabled={formData.stock === -1} placeholder="Jml" className="flex-1 p-5 bg-white rounded-2xl outline-none font-black text-3xl text-center shadow-sm" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                    <label className="flex items-center gap-3 text-xs font-black text-gray-500 cursor-pointer bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm active:scale-95 transition-all">
                        <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> ♾️ UNLIMITED
                    </label>
                </div>
            </div>
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-8 rounded-[2.5rem] font-black text-xl uppercase italic tracking-[0.2em] shadow-2xl shadow-orange-200 hover:bg-orange-700 active:scale-[0.98] transition-all">
          {editingId ? 'Update Data Menu' : 'Simpan Menu Baru'}
        </button>
      </form>

      {/* LIST TABLE */}
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
            <tr>
              <th className="p-8">Produk & Jadwal</th>
              <th className="p-8">Harga Dasar</th>
              <th className="p-8 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="group hover:bg-orange-50/30 transition-all">
                <td className="p-8">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 uppercase italic text-lg tracking-tighter">{p.name}</span>
                    <div className="flex flex-wrap gap-1 mt-3">
                        {(!p.availableDays || p.availableDays.length === 0) ? (
                            <span className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100 uppercase tracking-widest">Tersedia Setiap Hari</span>
                        ) : (
                            p.availableDays.sort().map(dId => (
                                <span key={dId} className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                    {DAYS.find(d => d.id === dId)?.label.toUpperCase()}
                                </span>
                            ))
                        )}
                    </div>
                  </div>
                </td>
                <td className="p-8 font-black text-orange-600 italic text-xl">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                <td className="p-8 text-center">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => startEdit(p)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={20} /></button>
                    <button onClick={async () => { if(window.confirm(`Hapus menu ${p.name}?`)) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;
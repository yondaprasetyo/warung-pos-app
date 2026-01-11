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
    availableDays: [] // Simpan ID hari (0-6)
  });

  const [variants, setVariants] = useState([{ name: '', useSpecialPrice: false, price: '' }]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (error) { 
      console.error(error); 
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
    setFormData({ ...formData, availableDays: newDays });
  };

  const addVariantField = () => setVariants([...variants, { name: '', useSpecialPrice: false, price: '' }]);
  
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
        alert("✅ Menu diperbarui!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
        alert("🚀 Menu ditambahkan!");
      }

      // Reset Form
      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true, availableDays: [] });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { 
      alert(error.message); 
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, 
      price: p.price, 
      stock: p.stock,
      category: p.category, 
      imageUrl: p.imageUrl || '', 
      isAvailable: p.isAvailable ?? true,
      availableDays: p.availableDays || []
    });
    setVariants(Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse italic">MEMUAT DATA...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter">
          {editingId ? '📝 Edit Menu' : '🍽️ Manajemen Menu'}
        </h2>
        {editingId && (
            <button onClick={() => {
                setEditingId(null);
                setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true, availableDays: [] });
            }} className="text-xs font-black text-red-500 underline uppercase tracking-widest">Batal Edit</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-4 border-orange-50 rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-orange-100/50 mb-12 transition-all">
        
        {/* SECTION 1: FOTO & NAMA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Foto Menu (URL)
            </label>
            <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative group">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-[10px] font-bold">No Preview</span>
              )}
            </div>
            <input type="text" placeholder="https://..." className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-orange-500/20 transition-all" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> Informasi Dasar
              </label>
              <input type="text" required placeholder="Nama Masakan" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-black text-lg uppercase italic tracking-tighter transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Dasar</label>
                 <input type="number" required placeholder="15000" className="w-full p-4 bg-orange-50/50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-black text-orange-600 text-xl italic" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                 <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option>
                    <option value="Tumisan/Osengan">Tumisan/Osengan</option><option value="Gorengan">Gorengan</option><option value="Menu Tambahan">Menu Tambahan</option>
                 </select>
               </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: JADWAL HARI (BARU) */}
        <div className="mb-8 p-6 bg-gray-900 rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                    <Calendar className="text-orange-500" size={18} />
                    <label className="text-[11px] font-black uppercase tracking-widest italic">Atur Jadwal Muncul Menu</label>
                </div>
                {formData.availableDays?.length > 0 && (
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest animate-pulse">
                        Sistem Penjadwalan Aktif
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                    const active = formData.availableDays?.includes(day.id);
                    return (
                        <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            className={`flex-1 min-w-[55px] py-4 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                active 
                                ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' 
                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                            }`}
                        >
                            {day.label.toUpperCase()}
                        </button>
                    )
                })}
            </div>
            <p className="text-[9px] text-gray-500 mt-4 italic text-center font-bold tracking-widest uppercase">
                * Kosongkan jika menu tersedia <span className="text-orange-500">SETIAP HARI</span> tanpa kecuali
            </p>
        </div>

        {/* SECTION 3: VARIAN & STOK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* VARIAN */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={14} /> Varian Pilihan
                    </label>
                    <button type="button" onClick={addVariantField} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all">+ VARIAN</button>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                            <input type="text" placeholder="Varian" className="flex-1 bg-white p-2 rounded-xl text-xs font-bold outline-none" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black text-gray-400">Rp</span>
                                <input type="number" disabled={!v.useSpecialPrice} className={`w-20 p-2 rounded-xl text-xs font-black text-right ${v.useSpecialPrice ? 'bg-white text-orange-600' : 'bg-gray-200 text-gray-400'}`} value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => {
                                const newV = [...variants];
                                newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                                setVariants(newV);
                            }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${v.useSpecialPrice ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Tag size={12} />
                            </button>
                            <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* STOK */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} /> Kontrol Persediaan
                </label>
                <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <input type="number" disabled={formData.stock === -1} placeholder="Jml" className="flex-1 p-5 bg-white rounded-2xl outline-none font-black text-2xl text-center shadow-inner" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-all">
                                <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> 
                                ♾️ UNLIMITED
                            </label>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-bold italic leading-tight uppercase tracking-tighter">
                        {formData.stock === -1 ? 'Stok tidak akan berkurang otomatis' : 'Stok akan berkurang setiap ada pesanan'}
                    </p>
                </div>
            </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase italic tracking-tighter shadow-2xl shadow-orange-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
          <Plus size={24} strokeWidth={3} /> {editingId ? 'Perbarui Menu Sekarang' : 'Tambahkan Menu Baru'}
        </button>
      </form>

      {/* LIST TABLE SECTION */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-8">Nama Menu & Jadwal</th>
                <th className="p-8">Harga</th>
                <th className="p-8">Stok</th>
                <th className="p-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="group hover:bg-orange-50/30 transition-all">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">NO IMG</div>}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-gray-800 uppercase italic tracking-tighter text-lg">{p.name}</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {(!p.availableDays || p.availableDays.length === 0) ? (
                                    <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">TIAP HARI</span>
                                ) : (
                                    p.availableDays.map(dId => (
                                        <span key={dId} className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-tighter">
                                            {DAYS.find(d => d.id === dId)?.label}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="font-black text-orange-600 italic text-lg">{formatRupiah(p.price)}</span>
                  </td>
                  <td className="p-8">
                    {p.stock === -1 ? (
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">♾️ Unlimited</span>
                    ) : (
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                            {p.stock} PORSI
                        </span>
                    )}
                  </td>
                  <td className="p-8">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => startEdit(p)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={async () => { if(window.confirm(`Hapus ${p.name}?`)) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
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

// Helper sederhana jika belum ada (atau import dari utils Anda)
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default ProductManagement;
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
      availableDays: p.availableDays || [] // Memastikan data hari terisi saat klik edit
    });
    setVariants(Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse italic">MEMUAT DATA...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
      <h2 className="text-3xl font-black text-gray-800 mb-8 italic uppercase tracking-tighter flex items-center gap-3">
        {editingId ? '📝 Edit Menu' : '🍽️ Manajemen Menu'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white border-4 border-orange-50 rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-orange-100/50 mb-12">
        
        {/* FOTO & NAMA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> Foto Menu</label>
            <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
              {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="prev" /> : <span className="text-gray-300 text-[10px] font-bold">No Image</span>}
            </div>
            <input type="text" placeholder="URL Foto" className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Masakan</label>
              <input type="text" required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Dasar</label>
                 <input type="number" required className="w-full p-4 bg-orange-50/50 rounded-2xl outline-none font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                 <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option><option value="Tumisan/Osengan">Tumisan/Osengan</option><option value="Gorengan">Gorengan</option><option value="Menu Tambahan">Menu Tambahan</option>
                 </select>
               </div>
            </div>
          </div>
        </div>

        {/* FITUR BARU: PANEL JADWAL HARI */}
        <div className="mb-8 p-6 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-500" size={18} />
                <label className="text-[11px] font-black uppercase tracking-widest">Jadwal Muncul Menu (Klik untuk aktifkan)</label>
            </div>
            <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                    <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`flex-1 min-w-[55px] py-4 rounded-2xl text-[10px] font-black transition-all border-2 ${
                            formData.availableDays?.includes(day.id) 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-lg' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200'
                        }`}
                    >
                        {day.label.toUpperCase()}
                    </button>
                ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-4 italic font-bold uppercase tracking-tight">
                * Kosongkan jika menu tersedia SETIAP HARI.
            </p>
        </div>

        {/* STOK & VARIAN (Seperti di Screenshot Anda) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilihan Varian</label>
                    <button type="button" onClick={addVariantField} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg">+ TAMBAH</button>
                </div>
                {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-gray-50 p-3 rounded-2xl">
                        <input type="text" placeholder="Varian" className="flex-1 bg-white p-2 rounded-xl text-xs font-bold" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                        <input type="number" disabled={!v.useSpecialPrice} className="w-20 p-2 rounded-xl text-xs font-black text-right" value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                        <button type="button" onClick={() => {
                            const newV = [...variants];
                            newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                            setVariants(newV);
                        }} className={`w-8 h-8 rounded-xl flex items-center justify-center ${v.useSpecialPrice ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}><Tag size={12} /></button>
                        <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pengaturan Stok</label>
                <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 flex items-center gap-4">
                    <input type="number" disabled={formData.stock === -1} className="flex-1 p-5 bg-white rounded-2xl font-black text-2xl text-center shadow-inner" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                    <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                        <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> ♾️ UNLIMITED
                    </label>
                </div>
            </div>
        </div>

        <button type="submit" className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black text-lg uppercase italic tracking-tighter shadow-xl hover:bg-orange-600 transition-all">
          {editingId ? 'Update Menu' : 'Simpan Menu'}
        </button>
      </form>

      {/* LIST TABLE (Menampilkan badge hari) */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-8">Nama Menu & Jadwal</th>
                <th className="p-8">Harga</th>
                <th className="p-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-orange-50/20">
                  <td className="p-8">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-800 uppercase italic text-lg">{p.name}</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(!p.availableDays || p.availableDays.length === 0) ? (
                                <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">TIAP HARI</span>
                            ) : (
                                p.availableDays.map(dId => (
                                    <span key={dId} className="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                        {DAYS.find(d => d.id === dId)?.label.toUpperCase()}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                  </td>
                  <td className="p-8 font-black text-orange-600 italic text-lg">Rp {p.price?.toLocaleString()}</td>
                  <td className="p-8">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => startEdit(p)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Edit3 size={18} /></button>
                      <button onClick={async () => { if(window.confirm(`Hapus ${p.name}?`)) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="p-3 bg-red-50 text-red-400 rounded-2xl"><Trash2 size={18} /></button>
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
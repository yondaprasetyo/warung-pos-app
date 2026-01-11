import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { Calendar, Package, Tag, Layers, Trash2, Edit3, Plus, Image } from 'lucide-react';

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
      console.error("Fetch error:", error); 
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
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', availableDays: [] });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { 
      alert("Error: " + error.message); 
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
    setVariants(p.variants?.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse">MEMUAT...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 font-sans text-gray-800">
      <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter flex items-center gap-3">
        {editingId ? '📝 Edit Menu' : '🍽️ Tambah Menu'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-gray-50 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
             <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="prev" /> : <Image className="text-gray-300" size={40} />}
             </div>
             <input type="text" placeholder="URL Foto" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <input type="text" required placeholder="Nama Masakan" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-orange-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <input type="number" required placeholder="Harga Dasar" className="w-full p-4 bg-orange-50 rounded-2xl font-black text-orange-600 text-xl outline-none" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option><option value="Minuman">Minuman</option>
               </select>
            </div>
          </div>
        </div>

        {/* BOX JADWAL HARI */}
        <div className="mb-10 p-6 bg-yellow-50 rounded-[2rem] border-2 border-yellow-100">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-600" size={20} />
                <label className="text-xs font-black uppercase">Jadwal Tampil Menu</label>
            </div>
            <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                    const active = formData.availableDays?.includes(day.id);
                    return (
                        <button key={day.id} type="button" onClick={() => toggleDay(day.id)}
                            className={`flex-1 min-w-[60px] py-4 rounded-xl text-[10px] font-black transition-all border-2 ${active ? 'bg-orange-600 border-orange-700 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                            {day.label.toUpperCase()}
                        </button>
                    )
                })}
            </div>
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-3xl font-black text-xl uppercase italic shadow-xl hover:bg-orange-700 transition-all">
          {editingId ? 'Simpan Perubahan' : 'Tambahkan Menu'}
        </button>
      </form>

      {/* TABEL LIST */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="p-6">Produk & Jadwal</th>
              <th className="p-6">Harga</th>
              <th className="p-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-orange-50/20 transition-all">
                <td className="p-6">
                  <p className="font-black text-gray-800 uppercase italic">{p.name}</p>
                  <p className="text-[9px] font-bold text-orange-500 mt-1 uppercase">
                    {p.availableDays?.length > 0 ? p.availableDays.map(id => DAYS.find(d => d.id === id)?.label).join(', ') : 'SETIAP HARI'}
                  </p>
                </td>
                <td className="p-6 font-black text-orange-600">Rp {Number(p.price).toLocaleString()}</td>
                <td className="p-6 flex justify-center gap-2">
                  <button onClick={() => startEdit(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Edit3 size={16} /></button>
                  <button onClick={async () => { if(window.confirm('Hapus?')) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="p-3 bg-red-50 text-red-400 rounded-xl"><Trash2 size={16} /></button>
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
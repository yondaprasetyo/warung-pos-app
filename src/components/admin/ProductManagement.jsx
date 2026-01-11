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
    name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', availableDays: [] 
  });

  const [variants, setVariants] = useState([{ name: '', useSpecialPrice: false, price: '' }]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
        alert("✅ Berhasil Update!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
        alert("🚀 Berhasil Tambah!");
      }
      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', availableDays: [] });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { alert(error.message); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name || '', price: p.price || '', stock: p.stock ?? '',
      category: p.category || 'Ayam', imageUrl: p.imageUrl || '', availableDays: p.availableDays || [] 
    });
    setVariants(p.variants?.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse">MEMUAT...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 font-sans text-gray-800">
      <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">
        {editingId ? '📝 Edit Menu' : '🍽️ Tambah Menu'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-4 border-orange-50 mb-12">
        {/* IDENTITAS PRODUK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
             <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="prev" /> : <Image className="text-gray-300" size={40} />}
             </div>
             <input type="text" placeholder="URL Foto" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-6">
            <input type="text" required placeholder="Nama Masakan" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-lg outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <input type="number" required placeholder="Harga Dasar" className="w-full p-4 bg-orange-50 rounded-2xl font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
               <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option><option value="Minuman">Minuman</option>
               </select>
            </div>
          </div>
        </div>

        {/* JADWAL HARI */}
        <div className="mb-10 p-6 bg-yellow-50 rounded-[2rem] border-2 border-yellow-100">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-600" size={20} />
                <label className="text-xs font-black uppercase italic">Jadwal Tampil Menu</label>
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

        {/* BAGIAN VARIAN MENU (YANG TADI HILANG) */}
        <div className="mb-10 space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Varian Menu</label>
                <button type="button" onClick={() => setVariants([...variants, { name: '', useSpecialPrice: false, price: '' }])} className="text-[9px] font-black bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all">+ TAMBAH VARIAN</button>
            </div>
            <div className="space-y-3">
                {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
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
                        <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>
        </div>

        {/* PENGATURAN STOK */}
        <div className="mb-10 p-6 bg-gray-50 rounded-[2rem] flex items-center gap-6">
            <div className="flex-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Jumlah Stok</label>
                <input type="number" disabled={formData.stock === -1} placeholder="Jml" className="w-full p-4 bg-white rounded-xl outline-none font-black text-2xl" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
            </div>
            <label className="flex items-center gap-3 text-xs font-black text-gray-500 cursor-pointer bg-white px-6 py-4 rounded-2xl border border-gray-200">
                <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> ♾️ UNLIMITED
            </label>
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-6 rounded-3xl font-black text-xl uppercase italic shadow-xl hover:bg-orange-700 transition-all">
          {editingId ? 'Update Data Menu' : 'Simpan Menu Baru'}
        </button>
      </form>

      {/* TABEL LIST (SUDAH ADA JADWALNYA) */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
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
                  <p className="font-black text-gray-800 uppercase italic text-lg">{p.name}</p>
                  <p className="text-[9px] font-bold text-orange-500 mt-1 uppercase tracking-tighter">
                    {p.availableDays?.length > 0 ? p.availableDays.sort().map(id => DAYS.find(d => d.id === id)?.label).join(', ') : 'SETIAP HARI'}
                  </p>
                </td>
                <td className="p-6 font-black text-orange-600 text-xl italic">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => startEdit(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(window.confirm('Hapus menu?')) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
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
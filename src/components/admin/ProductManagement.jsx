import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';

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
    isAvailable: true
  });

  const [variants, setVariants] = useState([{ name: '', useSpecialPrice: false, price: '' }]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
        // Filter varian kosong & petakan harga
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

      // Reset
      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true });
      setVariants([{ name: '', useSpecialPrice: false, price: '' }]);
      fetchProducts();
    } catch (error) { alert(error.message); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, price: p.price, stock: p.stock,
      category: p.category, imageUrl: p.imageUrl, isAvailable: p.isAvailable ?? true
    });
    setVariants(p.variants?.length > 0 ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-bold text-orange-500 animate-pulse">Memuat Menu...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <h2 className="text-3xl font-black text-gray-800 mb-8">
        {editingId ? '📝 Edit Menu' : '🍽️ Manajemen Menu'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-orange-100 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-orange-50 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Masakan</label>
            <input type="text" required placeholder="Ayam Goreng Serundeng" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Dasar (Rp)</label>
            <input type="number" required placeholder="15000" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>
        </div>

        {/* VARIAN SECTION */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">Pilihan Varian</h4>
            <button type="button" onClick={addVariantField} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-orange-500 hover:text-white transition-all">
              + TAMBAH VARIAN
            </button>
          </div>
          
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-center group">
                <input type="text" placeholder="Nama Varian (contoh: Dada)" className="flex-1 p-3 bg-white rounded-xl outline-none font-bold text-sm border border-transparent focus:border-orange-300" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
                
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-gray-400">HARGA BEDA?</span>
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].useSpecialPrice = !newV[i].useSpecialPrice;
                    setVariants(newV);
                  }} className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${v.useSpecialPrice ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                <div className="relative w-full md:w-40">
                  <input type="number" disabled={!v.useSpecialPrice} placeholder={v.useSpecialPrice ? "Harga" : "Sama"} className={`w-full p-3 rounded-xl outline-none font-black text-sm text-right ${v.useSpecialPrice ? 'bg-white border border-orange-200 text-orange-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                </div>

                <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 transition-colors px-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10 pt-6 border-t border-gray-100">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok</label>
            <div className="flex items-center gap-4">
              <input type="number" disabled={formData.stock === -1} className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none font-bold disabled:opacity-30" value={formData.stock === -1 ? '' : formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
              <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-orange-500" checked={formData.stock === -1} onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} /> UNLIMITED
              </label>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="flex-1 bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-200 hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-95">
            {editingId ? 'Update Menu' : 'Simpan Menu'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({name:'', price:'', stock:'', category:'Ayam', imageUrl:'', isAvailable: true}); setVariants([{name:'', useSpecialPrice:false, price:''}]); }} className="bg-gray-100 text-gray-500 px-8 py-5 rounded-[2rem] font-black uppercase hover:bg-gray-200 transition-all">Batal</button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Daftar Menu Aktif</h3>
          <span className="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-full font-black">{products.length} ITEM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="p-6">Menu</th>
                <th className="p-6">Harga Dasar</th>
                <th className="p-6">Varian</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-orange-50/20 transition-all">
                  <td className="p-6">
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-[10px] text-orange-500 font-black uppercase">{p.category}</div>
                  </td>
                  <td className="p-6 font-black text-gray-900">Rp {p.price?.toLocaleString()}</td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1">
                      {p.variants?.length > 0 ? p.variants.map((v, idx) => (
                        <span key={idx} className="text-[9px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-500 border border-gray-200">
                          {v.name} (Rp {v.price?.toLocaleString()})
                        </span>
                      )) : <span className="text-[9px] text-gray-300 italic">Tanpa Varian</span>}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => startEdit(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={async () => { if(window.confirm("Hapus " + p.name + "?")) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
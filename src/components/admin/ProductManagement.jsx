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
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
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
        // Sinkronisasi logika stok: -1 tetap -1, sisanya dikonversi ke Number
        stock: formData.stock === -1 ? -1 : Number(formData.stock),
        variants: variants.filter(v => v.name.trim() !== "").map(v => ({
          name: v.name,
          price: v.useSpecialPrice ? Number(v.price) : Number(formData.price),
          useSpecialPrice: v.useSpecialPrice
        })),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        const productRef = doc(db, "products", editingId); 
        await updateDoc(productRef, payload);
        alert("✅ Menu diperbarui!");
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
        alert("🚀 Menu ditambahkan!");
      }

      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', isAvailable: true });
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
      isAvailable: p.isAvailable ?? true
    });
    
    const safeVariants = Array.isArray(p.variants) ? p.variants : [{ name: '', useSpecialPrice: false, price: '' }];
    setVariants(safeVariants);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center font-bold text-orange-500 animate-pulse">Memuat Menu...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <h2 className="text-3xl font-black text-gray-800 mb-8">
        {editingId ? '📝 Edit Menu' : '🍽️ Manajemen Menu'}
      </h2>

      {/* FORM INPUT SECTION */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-orange-100 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-orange-50 mb-12">
        <div className="mb-8 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link Foto Menu (URL)</label>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-[10px] font-bold text-center p-1">No Image</span>
              )}
            </div>
            <input 
              type="text" 
              placeholder="https://link-foto-makanan.com/nasi-putih.jpg" 
              className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold text-sm" 
              value={formData.imageUrl} 
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Masakan</label>
            <input type="text" required placeholder="Ayam Goreng" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Dasar (Rp)</label>
            <input type="number" required placeholder="15000" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-black text-orange-600 text-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
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
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                <input type="text" placeholder="Nama Varian" className="flex-1 p-3 bg-white rounded-xl outline-none font-bold text-sm" value={v.name} onChange={(e) => handleVariantChange(i, 'name', e.target.value)} />
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
                <input type="number" disabled={!v.useSpecialPrice} className={`w-full md:w-40 p-3 rounded-xl font-black text-sm text-right ${v.useSpecialPrice ? 'bg-white text-orange-600' : 'bg-gray-100 text-gray-400'}`} value={v.useSpecialPrice ? v.price : formData.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} />
                <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* STOK & KATEGORI */}
        <div className="flex flex-col md:flex-row gap-6 mb-10 pt-6 border-t border-gray-100">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pengaturan Stok</label>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                disabled={formData.stock === -1} 
                placeholder="Jumlah Stok"
                className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none font-bold disabled:bg-gray-100 disabled:text-gray-400" 
                value={formData.stock === -1 ? '' : formData.stock} 
                onChange={(e) => setFormData({...formData, stock: e.target.value})} 
              />
              <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-orange-500" 
                  checked={formData.stock === -1} 
                  onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})} 
                /> ♾️ UNLIMITED
              </label>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
            <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="Ayam">Ayam</option><option value="Ikan">Ikan</option><option value="Sayur">Sayur</option><option value="Nasi">Nasi</option>
              <option value="Tumisan/Osengan">Tumisan/Osengan</option><option value="Gorengan">Gorengan</option><option value="Menu Tambahan">Menu Tambahan</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-orange-600 transition-all">
          {editingId ? 'Update Menu' : 'Simpan Menu'}
        </button>
      </form>

      {/* TABLE SECTION DENGAN MONITOR STOK */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-6">Menu & Status</th>
                <th className="p-6">Harga Dasar</th>
                <th className="p-6">Varian</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-orange-50/20 transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No Img</div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{p.name}</span>
                        {/* INDIKATOR STOK ADMIN SINKRON */}
                        <div className="mt-1 flex items-center">
                          {p.stock === -1 ? (
                            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">STOK TERSEDIA</span>
                          ) : p.stock === 0 ? (
                            <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">HABIS TERJUAL</span>
                          ) : (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                              p.stock <= 3 
                                ? 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse' 
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              SISA {p.stock} PORSI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-black text-orange-600">Rp {p.price?.toLocaleString()}</td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(p.variants) && p.variants.length > 0 ? (
                        p.variants.map((v, idx) => (
                          <span key={idx} className="text-[9px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-500 border border-gray-200">
                            {v.name} (Rp {v.price?.toLocaleString()})
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">Tanpa Varian</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => startEdit(p)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={async () => { if(window.confirm(`Hapus ${p.name}?`)) { await deleteDoc(doc(db, "products", p.id)); fetchProducts(); } }} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

export default ProductManagement;
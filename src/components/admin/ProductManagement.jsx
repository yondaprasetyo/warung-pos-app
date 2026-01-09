import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
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
    variants: '' // Field varian sudah ada di state
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // PERBAIKAN 1: Masukkan variants ke dalam payload
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stock: formData.stock === -1 ? -1 : Number(formData.stock),
        category: formData.category,
        variants: formData.variants, // WAJIB ADA AGAR TERSIMPAN KE DATABASE
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/150',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
        alert("Menu berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        alert("Menu berhasil ditambahkan!");
      }

      // PERBAIKAN 2: Reset Form (Sertakan variants: '')
      setFormData({ name: '', price: '', stock: '', category: 'Ayam', imageUrl: '', variants: '' });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      alert("Gagal menyimpan menu: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus menu ini?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    // PERBAIKAN 3: Tarik data variants lama agar bisa diedit
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl,
      variants: product.variants || '' // Pastikan varian muncul di input saat edit
    });
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="p-10 text-center">Memuat data menu...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md my-6">
      <h2 className="text-2xl font-bold mb-6 text-orange-600 flex items-center gap-2">
        {editingId ? '📝 Edit Menu' : '➕ Tambah Menu Baru'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-6 border rounded-xl bg-orange-50/50">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Nama Menu</label>
          <input 
            type="text" placeholder="Contoh: Ayam Bakar Madu" required
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Harga (Rp)</label>
          <input 
            type="number" placeholder="Contoh: 15000" required
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Kategori</label>
          <select 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="Ayam">Ayam</option>
            <option value="Ikan">Ikan</option>
            <option value="Daging">Daging</option>
            <option value="Telur">Telur</option>
            <option value="Sayur">Sayur</option>
            <option value="Tumisan/Osengan">Tumisan/Osengan</option>
            <option value="Gorengan">Gorengan</option>
            <option value="Nasi">Nasi</option>
            <option value="Menu Tambahan">Menu Tambahan</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Jumlah Stok</label>
          <div className="flex flex-col gap-2">
            <input 
              type="number" 
              placeholder={formData.stock === -1 ? "Tak Terbatas" : "Contoh: 50"} 
              required={formData.stock !== -1}
              disabled={formData.stock === -1}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100"
              value={formData.stock === -1 ? '' : formData.stock} 
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
            />
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.stock === -1}
                onChange={(e) => setFormData({...formData, stock: e.target.checked ? -1 : ''})}
              />
              Stok Selalu Tersedia (Tak Terbatas)
            </label>
          </div>
        </div>

        {/* INPUT VARIAN */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Varian (Pisahkan dengan koma)</label>
          <input 
            type="text" 
            placeholder="Contoh: Dada, Sayap, Paha Atas, Paha Bawah"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.variants || ''} 
            onChange={(e) => setFormData({...formData, variants: e.target.value})}
          />
          <p className="text-[10px] text-gray-500 italic">*Penting: Pastikan gunakan koma sebagai pemisah.</p>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">URL Foto (Opsional)</label>
          <input 
            type="text" placeholder="https://link-foto.com/gambar.jpg"
            className="p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          />
        </div>

        <div className="md:col-span-2 flex gap-3 mt-2">
          <button type="submit" className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-bold hover:bg-orange-600 transition shadow-md">
            {editingId ? '💾 Update Menu' : '🚀 Simpan Menu'}
          </button>
          {editingId && (
            <button type="button" onClick={() => {setEditingId(null); setFormData({name:'', price:'', stock:'', category:'Ayam', imageUrl:'', variants:''})}} 
              className="bg-gray-400 text-white px-6 py-2.5 rounded-lg hover:bg-gray-500 transition">Batal</button>
          )}
        </div>
      </form>

      {/* Tabel Menu */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">Daftar Menu Saat Ini</h3>
      {/* Ganti bagian tabel Anda dengan ini untuk memastikan tidak ada error hydration */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
              <th className="p-4 border-b">Nama & Kategori</th>
              <th className="p-4 border-b">Harga</th>
              <th className="p-4 border-b">Stok</th>
              <th className="p-4 border-b text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-400 font-medium">
                  Belum ada menu. Silakan tambah di atas.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition border-b text-sm">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-xs text-orange-500 font-medium">{p.category}</div>
                    {p.variants && (
                      <div className="text-[10px] text-blue-600 mt-1 italic font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                        Varian: {p.variants}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-700 font-medium">
                    Rp {p.price?.toLocaleString()}
                  </td>
                  <td className="p-4 text-xs italic">
                    {p.stock === -1 ? '∞' : p.stock}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => startEdit(p)} 
                        className="text-blue-600 hover:text-blue-800 font-bold transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-red-500 hover:text-red-700 font-bold transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;
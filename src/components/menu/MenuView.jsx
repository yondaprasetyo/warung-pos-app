import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Check, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import ProductCard from './ProductCard';

const MenuView = ({ onAddToCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVar, setSelectedVar] = useState('');
  const [note, setNote] = useState('');

  const categories = [
    'Semua', 'Ayam', 'Ikan', 'Daging', 'Telur', 
    'Sayur', 'Tumisan/Osengan', 'Gorengan', 'Nasi', 'Menu Tambahan'
  ];

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (product) => {
    if (product.stock === 0) {
      alert("Maaf, menu ini sudah habis!");
      return;
    }

    // Selalu buka modal untuk semua produk agar user bisa mengisi "Catatan Tambahan"
    // Ini memperbaiki masalah dimana produk tanpa varian langsung masuk keranjang tanpa catatan
    setActiveProduct(product);
    
    // Set varian default jika ada
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    setSelectedVar(hasVariants ? (product.variants[0].name || product.variants[0]) : '');
    
    setNote(''); // Reset catatan setiap buka modal
    setShowModal(true);
  };

  const confirmAdd = () => {
    if (activeProduct) {
      // Cari objek varian untuk mendapatkan harga khusus varian jika ada
      const variantObj = Array.isArray(activeProduct.variants) 
        ? activeProduct.variants.find(v => (v.name || v) === selectedVar)
        : null;
      
      const priceToUse = variantObj?.price ? Number(variantObj.price) : Number(activeProduct.price);

      // KIRIM: Produk, Nama Varian, Isi Catatan (note), dan Harga
      onAddToCart(activeProduct, selectedVar, note, priceToUse);
      
      setShowModal(false);
      setActiveProduct(null);
      setNote(''); // Bersihkan state setelah dikirim
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) return <div className="text-center p-20 text-orange-500 font-bold italic">Menyiapkan Menu Lezat...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      {/* SEARCH BAR & CATEGORIES tetap sama */}
      <div className="mb-8 relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Lagi pengen makan apa hari ini?..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-md focus:ring-2 focus:ring-orange-500 transition outline-none"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-6 mb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 font-semibold text-sm
              ${selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 -translate-y-1'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MENU GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredMenu.map(item => (
          <div key={item.id} className="relative group">
            {item.stock !== -1 && item.stock > 0 && item.stock <= 3 && (
              <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-bounce">
                SISA {item.stock}!
              </div>
            )}
            <ProductCard 
              item={item} 
              onAddToCart={handleOpenModal} 
            />
          </div>
        ))}
      </div>

      {/* MODAL PILIH VARIAN & CATATAN */}
      {showModal && activeProduct && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative h-32 bg-orange-500 p-6 flex items-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 transition"
              >
                <X size={20} />
              </button>
              <div>
                <h3 className="text-white text-2xl font-bold truncate uppercase tracking-tighter italic">{activeProduct.name}</h3>
                {activeProduct.stock !== -1 && (
                  <p className={`text-xs font-bold ${activeProduct.stock <= 3 ? 'text-red-200' : 'text-orange-100'}`}>
                    Tersedia: {activeProduct.stock} porsi
                  </p>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Render Varian hanya jika ada */}
              {Array.isArray(activeProduct.variants) && activeProduct.variants.length > 0 && (
                <>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pilih Bagian/Varian</label>
                  <div className="flex flex-wrap gap-2 mt-3 mb-6">
                    {activeProduct.variants.map((v, idx) => {
                      const name = typeof v === 'string' ? v : v.name;
                      const price = typeof v === 'object' ? v.price : null;
                      return (
                        <button 
                          key={idx}
                          onClick={() => setSelectedVar(name)}
                          className={`px-4 py-2 rounded-xl border-2 font-bold transition-all flex flex-col items-start
                            ${selectedVar === name 
                              ? 'border-orange-500 bg-orange-50 text-orange-600' 
                              : 'border-gray-100 text-gray-500 hover:border-orange-200'}`}
                        >
                          <div className="flex items-center gap-2">
                            {selectedVar === name && <Check size={16} />}
                            {name}
                          </div>
                          {price && <span className="text-[10px] opacity-70">Rp {Number(price).toLocaleString()}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* INPUT CATATAN - Memastikan Tersambung ke State 'note' */}
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} /> Catatan Tambahan
              </label>
              <textarea 
                placeholder="Contoh: Gak pake sambal, kuah banyak..."
                className="w-full p-4 mt-2 border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-orange-500 h-24 resize-none transition-all font-medium"
                value={note} // Menghubungkan ke state note
                onChange={(e) => setNote(e.target.value)} // Mengubah state saat user mengetik
              />

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmAdd} 
                  className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all uppercase italic"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;
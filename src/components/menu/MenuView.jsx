import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal';
import { Utensils, Info } from 'lucide-react';

const MenuView = ({ onAddToCart, currentDay }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ambil data Real-time dari Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. LOGIKA FILTER UTAMA
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filter 1: Jika stok benar-benar 0 (Habis), sembunyikan
      if (p.stock === 0) return false;

      // Filter 2: Cek Jadwal Hari
      // Jika availableDays kosong atau tidak ada, menu dianggap tersedia SETIAP HARI
      if (!p.availableDays || p.availableDays.length === 0) return true;

      // Hanya tampilkan jika hari ini (currentDay) ada di dalam daftar hari tersedia
      return p.availableDays.includes(currentDay);
    });
  }, [products, currentDay]);

  // Kelompokkan menu berdasarkan kategori untuk tampilan lebih rapi
  const categories = [...new Set(filteredProducts.map(p => p.category))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black text-orange-500 uppercase italic tracking-widest text-xs">Menyiapkan Menu...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="text-orange-600" size={32} />
        </div>
        <h3 className="font-black text-gray-800 uppercase italic">Yah, Menu Belum Tersedia</h3>
        <p className="text-gray-400 text-sm mt-2 font-medium">Sepertinya untuk hari ini belum ada menu yang aktif. Silakan hubungi kasir.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-10">
      {categories.map(category => (
        <section key={category}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter border-l-4 border-orange-500 pl-3">
              {category}
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredProducts
              .filter(p => p.category === category)
              .map(product => (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-[2rem] p-3 flex gap-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all overflow-hidden relative group"
                >
                  {/* Foto Produk */}
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">No Image</div>
                    )}
                  </div>

                  {/* Detail Produk */}
                  <div className="flex flex-col justify-center flex-1">
                    <h3 className="font-black text-gray-800 uppercase italic leading-tight mb-1">{product.name}</h3>
                    <p className="text-orange-600 font-black text-lg italic tracking-tighter">
                      {formatRupiah(product.price)}
                    </p>
                    
                    {/* Indikator Stok Terbatas */}
                    {product.stock > 0 && product.stock <= 5 && (
                      <span className="text-[9px] font-black text-red-500 uppercase mt-2 animate-pulse flex items-center gap-1">
                        <Info size={10} /> Stok Hampir Habis (Sisa {product.stock})
                      </span>
                    )}
                  </div>

                  {/* Tombol Plus */}
                  <div className="absolute bottom-4 right-4 bg-orange-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <span className="text-2xl font-black leading-none">+</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

      {/* MODAL PEMILIHAN VARIAN & CATATAN */}
      {selectedProduct && (
        <ItemSelectionModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(item) => {
            onAddToCart(item);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default MenuView;
import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal'; // PASTIKAN FILE INI ADA
import { Utensils, Info } from 'lucide-react';

const MenuView = ({ onAddToCart, currentDay }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Cek Ketersediaan Manual
      if (p.isAvailable === false) return false;
      
      // 2. Cek Stok
      if (p.stock === 0) return false;

      // 3. Cek Jadwal Hari
      // Jika tidak ada jadwal (null/kosong), tampilkan setiap hari
      if (!p.availableDays || p.availableDays.length === 0) return true;

      // Ambil hari ini (0-6)
      const today = currentDay !== undefined ? currentDay : new Date().getDay();
      
      // Tampilkan jika hari ini ada di daftar jadwal
      return p.availableDays.includes(today);
    });
  }, [products, currentDay]);

  const categories = [...new Set(filteredProducts.map(p => p.category))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black text-orange-500 uppercase italic tracking-widest text-[10px]">Menyiapkan Menu...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Utensils className="text-orange-600" size={40} />
        </div>
        <h3 className="font-black text-gray-800 uppercase italic text-xl">Menu Belum Tersedia</h3>
        <p className="text-gray-400 text-sm mt-2 font-medium max-w-xs mx-auto">
          Maaf, untuk hari ini belum ada menu yang dapat dipesan. Silakan cek jadwal menu lainnya.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-10 pb-20">
      {categories.map(category => (
        <section key={category}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter border-l-8 border-orange-500 pl-3">
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
                  className="bg-white rounded-[2.5rem] p-4 flex gap-5 shadow-sm border border-gray-100 active:scale-[0.97] transition-all relative group"
                >
                  <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden bg-gray-100 shrink-0 border border-gray-50 shadow-inner">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-300 uppercase">No Photo</div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center flex-1">
                    <h3 className="font-black text-gray-800 uppercase italic leading-tight text-base mb-1">{product.name}</h3>
                    <p className="text-orange-600 font-black text-xl italic tracking-tighter">
                      {formatRupiah(product.price)}
                    </p>
                    
                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 animate-pulse">
                        <Info size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Sisa {product.stock} Porsi</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-orange-200 border-4 border-white">
                    <span className="text-2xl font-black">+</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

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
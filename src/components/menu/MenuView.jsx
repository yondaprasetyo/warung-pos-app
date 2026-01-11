import React, { useMemo, useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal';
import { Search, Calendar, AlertCircle } from 'lucide-react';

const MenuView = ({ onAddToCart, orderDateInfo, onChangeDate }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const sectionRefs = useRef({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Logika Filter: Menandai ketersediaan berdasarkan hari
  const processedProducts = useMemo(() => {
    return products.map(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Cek ketersediaan hari (orderDateInfo.dayId berasal dari OrderDateSelector)
      const isAvailableToday = !p.availableDays || 
                               p.availableDays.length === 0 || 
                               p.availableDays.includes(orderDateInfo?.dayId);
      
      const isOutOfStock = p.stock === 0;

      return { 
        ...p, 
        isAvailableToday: isAvailableToday && p.isAvailable !== false,
        isOutOfStock,
        matchesSearch 
      };
    }).filter(p => p.matchesSearch);
  }, [products, searchTerm, orderDateInfo]);

  const categories = useMemo(() => {
    const activeCats = processedProducts.map(p => p.category);
    return [...new Set(activeCats)];
  }, [processedProducts]);

  const scrollToSection = (category) => {
    const offset = 180; 
    const element = sectionRefs.current[category];
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-orange-500 animate-pulse uppercase italic">Memuat Menu...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER FIX */}
      <div className="sticky top-0 z-[100] bg-white shadow-md border-b border-gray-100">
        {/* Info Tanggal & Ganti Tanggal */}
        <div className="bg-orange-600 px-4 py-2 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase italic">Menu Untuk: {orderDateInfo?.fullDate}</span>
          </div>
          <button 
            onClick={onChangeDate}
            className="text-[9px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase italic active:scale-95"
          >
            Ganti Tanggal
          </button>
        </div>

        <div className="p-4 space-y-3 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari menu favoritmu..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => scrollToSection(cat)}
                className="px-5 py-2 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-500 whitespace-nowrap shadow-sm active:scale-95 transition-all"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU LIST */}
      <div className="p-4 space-y-10 max-w-2xl mx-auto pb-32">
        {categories.length > 0 ? (
          categories.map(category => (
            <section key={category} ref={el => sectionRefs.current[category] = el}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter border-l-4 border-orange-500 pl-3">
                  {category}
                </h2>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {processedProducts
                  .filter(p => p.category === category)
                  .map(product => {
                    const canOrder = product.isAvailableToday && !product.isOutOfStock;

                    return (
                      <div 
                        key={product.id}
                        onClick={() => canOrder && setSelectedProduct(product)}
                        className={`bg-white rounded-3xl p-3 flex gap-4 border transition-all relative overflow-hidden ${
                          !canOrder ? 'opacity-60 grayscale' : 'shadow-sm active:border-orange-200 active:scale-[0.98]'
                        }`}
                      >
                        {/* Overlay Label Status */}
                        {!canOrder && (
                          <div className="absolute inset-0 z-10 bg-white/20 flex items-center justify-center">
                            <span className="bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest -rotate-6 shadow-2xl border border-white/20">
                              {product.isOutOfStock ? 'Habis Terjual' : 'Tidak Tersedia Hari Ini'}
                            </span>
                          </div>
                        )}

                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex flex-col justify-center flex-1">
                          <h3 className="font-black text-gray-800 uppercase italic text-sm mb-0.5 line-clamp-1">{product.name}</h3>
                          <p className="text-orange-600 font-black text-base italic">{formatRupiah(product.price)}</p>
                        </div>

                        {canOrder && (
                          <div className="flex items-center pr-1">
                            <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                              <span className="text-xl font-black">+</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-20 text-gray-300 font-black italic uppercase text-xs">Menu tidak ditemukan</div>
        )}
      </div>

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
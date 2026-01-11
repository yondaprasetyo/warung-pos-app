import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from '../menu/ItemSelectionModal';
import { Search, Calendar, Plus } from 'lucide-react';

const PublicOrderView = ({ onAddToCart, orderDateInfo, onChangeDate }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const triggerHaptic = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['Semua', ...new Set(cats)];
  }, [products]);

  const filteredItems = useMemo(() => {
    return products.map(p => {
      const isAvailableToday = !p.availableDays || 
                               p.availableDays.length === 0 || 
                               p.availableDays.includes(orderDateInfo?.dayId);
      return { 
        ...p, 
        isAvailableToday: isAvailableToday && p.isAvailable !== false,
        isOutOfStock: p.stock === 0 
      };
    }).filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory, orderDateInfo]);

  if (loading) return (
    <div className="p-20 text-center font-black text-orange-500 animate-pulse uppercase tracking-[0.2em]">
      Menyiapkan Kasir...
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* HEADER FIXED */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-lg border-b">
        <div className="bg-gray-900 px-4 py-2.5 flex justify-between items-center text-white font-black italic">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-widest truncate">POS: {orderDateInfo?.fullDate}</span>
          </div>
          <button 
            onClick={() => { triggerHaptic(); onChangeDate(); }} 
            className="text-[9px] border border-white/20 px-3 py-1.5 rounded-lg uppercase active:bg-orange-600 transition-all"
          >
            Ganti Tanggal
          </button>
        </div>

        <div className="p-4 max-w-7xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Cari menu kasir..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => {
                  triggerHaptic();
                  setActiveCategory(cat);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeCategory === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-orange-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SPACER (pt) UNTUK AREA KASIR */}
      <div className="pt-[165px] p-4 md:p-6 pb-40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredItems.map(product => {
            const canOrder = product.isAvailableToday && !product.isOutOfStock;
            return (
              <button
                key={product.id}
                onClick={() => {
                  if (canOrder) {
                    triggerHaptic();
                    setSelectedProduct(product);
                  }
                }}
                className={`bg-white p-2 rounded-[2rem] shadow-sm border-2 transition-all flex flex-col text-left relative active:scale-95 ${
                  !canOrder ? 'opacity-40 grayscale border-transparent cursor-not-allowed' : 'hover:border-orange-500 border-transparent shadow-orange-100/10'
                }`}
              >
                <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-gray-50 mb-3 relative shadow-inner">
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                  {!canOrder && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-2 text-center">
                      <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase italic">Habis / Libur</span>
                    </div>
                  )}
                </div>

                <div className="px-1 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-800 uppercase text-[9px] leading-tight mb-2 line-clamp-2 h-7 px-1">
                    {product.name}
                  </h4>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="text-orange-600 font-black text-xs italic">
                      {formatRupiah(product.price)}
                    </p>
                    {canOrder && (
                      <div className="text-orange-500">
                        <Plus size={16} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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

export default PublicOrderView;
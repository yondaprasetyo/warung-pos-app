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
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['Semua', ...new Set(cats)];
  }, [products]);

  const processedProducts = useMemo(() => {
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
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory, orderDateInfo]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="h-32 bg-white rounded-3xl animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-square bg-white rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-[100] bg-white shadow-lg shrink-0">
        <div className="bg-gray-900 px-4 py-2 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">KASIR: {orderDateInfo?.fullDate}</span>
          </div>
          <button onClick={() => { triggerHaptic(); onChangeDate(); }} className="text-[8px] font-black border border-white/30 px-3 py-1 rounded-full uppercase">Ganti</button>
        </div>

        <div className="p-4 space-y-3 max-w-7xl mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Cari menu cepat..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-2xl outline-none font-bold focus:ring-2 focus:ring-orange-500/20 transition-all"
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
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeCategory === cat ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 pb-40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {processedProducts.map(product => {
            const canOrder = product.isAvailableToday && !product.isOutOfStock;
            return (
              <button
                key={product.id}
                onClick={() => { if (canOrder) { triggerHaptic(); setSelectedProduct(product); }}}
                className={`bg-white p-2 rounded-[2rem] shadow-sm border-2 transition-all flex flex-col text-left relative active:scale-95 ${
                  !canOrder ? 'opacity-40 grayscale border-transparent' : 'hover:border-orange-500 border-transparent shadow-orange-100/20'
                }`}
              >
                <div className="w-full aspect-square rounded-[1.6rem] overflow-hidden bg-gray-50 mb-3 relative">
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                  {!canOrder && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center p-2">
                      <span className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase">Libur</span>
                    </div>
                  )}
                  {canOrder && product.stock !== -1 && (
                    <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black shadow-md">{product.stock}</div>
                  )}
                </div>
                <div className="px-2 pb-2">
                  <h4 className="font-bold text-gray-800 uppercase text-[10px] leading-tight mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</h4>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="text-orange-600 font-black text-xs">{formatRupiah(product.price)}</p>
                    {canOrder && <div className="bg-orange-100 p-1 rounded-lg text-orange-600"><Plus size={14} strokeWidth={4} /></div>}
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
          onClose={() => { triggerHaptic(); setSelectedProduct(null); }}
          onConfirm={(item) => { triggerHaptic(); onAddToCart(item); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
};

export default PublicOrderView;
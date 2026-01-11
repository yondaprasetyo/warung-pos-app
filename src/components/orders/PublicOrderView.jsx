import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from '../menu/ItemSelectionModal';
import { Search, Grid, Hash, Calendar } from 'lucide-react';

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

  if (loading) return <div className="p-20 text-center font-black text-orange-500 animate-pulse uppercase italic">Menyiapkan POS...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="sticky top-0 z-[100] bg-white shadow-md border-b border-gray-100 shrink-0">
        {/* Kasir Info Bar */}
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-orange-400" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">Order Tanggal: {orderDateInfo?.fullDate}</span>
          </div>
          <button onClick={onChangeDate} className="text-[8px] font-black border border-white/30 px-2 py-0.5 rounded uppercase hover:bg-white hover:text-black transition-all">Ubah</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Cari menu (Kasir Mode)..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-2xl mx-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                  activeCategory === cat 
                  ? 'bg-orange-600 border-orange-700 text-white shadow-orange-100' 
                  : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {processedProducts.map(product => {
            const canOrder = product.isAvailableToday && !product.isOutOfStock;
            
            return (
              <button
                key={product.id}
                onClick={() => canOrder && setSelectedProduct(product)}
                className={`bg-white p-2 rounded-[2rem] shadow-sm border-2 transition-all flex flex-col text-left relative active:scale-95 ${
                  !canOrder ? 'opacity-40 border-transparent cursor-not-allowed' : 'hover:border-orange-500 border-transparent'
                }`}
              >
                <div className="w-full aspect-square rounded-[1.6rem] overflow-hidden bg-gray-50 mb-3 relative">
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                  
                  {/* Status Label untuk Kasir */}
                  {!canOrder && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center p-2">
                      <span className="bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded uppercase text-center">
                        {product.isOutOfStock ? 'Habis' : 'Libur'}
                      </span>
                    </div>
                  )}

                  {canOrder && product.stock !== -1 && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[8px] font-black text-orange-600 border border-orange-100 shadow-sm">
                      {product.stock}
                    </div>
                  )}
                </div>

                <div className="px-2 pb-2">
                  <h4 className="font-black text-gray-800 uppercase italic text-[10px] leading-tight mb-1 line-clamp-2 min-h-[2.5em]">
                    {product.name}
                  </h4>
                  <p className="text-orange-600 font-black text-sm italic">
                    {formatRupiah(product.price)}
                  </p>
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
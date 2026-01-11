import React, { useMemo, useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal';
import { Search, Calendar, Plus } from 'lucide-react';

const MenuView = ({ onAddToCart, orderDateInfo, onChangeDate }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSelectedTab, setUserSelectedTab] = useState(null); 
  
  const sectionRefs = useRef({});
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const processedProducts = useMemo(() => {
    return products.map(p => {
      const isAvailableToday = !p.availableDays || 
                               p.availableDays.length === 0 || 
                               p.availableDays.includes(orderDateInfo?.dayId);
      return { 
        ...p, 
        isAvailableToday: isAvailableToday && p.isAvailable !== false,
        isOutOfStock: p.stock === 0,
      };
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm, orderDateInfo]);

  const categories = useMemo(() => {
    const activeCats = processedProducts.map(p => p.category);
    return [...new Set(activeCats)];
  }, [processedProducts]);

  const activeTab = userSelectedTab || (categories.length > 0 ? categories[0] : '');

  const triggerHaptic = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  };

  const handleCategoryClick = (category, e) => {
    triggerHaptic();
    setUserSelectedTab(category);

    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }

    const element = sectionRefs.current[category];
    if (element) {
      // Langsung menggunakan scrollIntoView karena terbantu scroll-padding-top di CSS
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen font-black text-orange-500 animate-pulse italic uppercase">
      Memuat Menu...
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER: POSISI FIXED DENGAN Z-INDEX TINGGI */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-xl border-b border-gray-100">
        <div className="bg-orange-600 px-4 py-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar size={14} className="shrink-0" />
            <span className="text-[10px] font-black uppercase italic truncate tracking-tighter">
              Menu: {orderDateInfo?.fullDate}
            </span>
          </div>
          <button 
            onClick={() => { triggerHaptic(); onChangeDate(); }}
            className="text-[9px] font-black bg-white text-orange-600 px-4 py-1.5 rounded-full uppercase active:scale-90 shadow-sm"
          >
            Ubah
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari menu favorit..." 
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeTab === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg' 
                  : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT: pt-[210px] WAJIB SAMA DENGAN TINGGI HEADER FIXED */}
      <div className="pt-[210px] p-4 space-y-12 max-w-2xl mx-auto pb-40">
        {categories.length > 0 ? (
          categories.map(category => (
            <section key={category} ref={el => sectionRefs.current[category] = el}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-7 bg-orange-500 rounded-full shadow-sm shadow-orange-200"></div>
                <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tight">{category}</h2>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {processedProducts
                  .filter(p => p.category === category)
                  .map(product => {
                    const canOrder = product.isAvailableToday && !product.isOutOfStock;
                    return (
                      <div 
                        key={product.id}
                        onClick={() => canOrder && setSelectedProduct(product)}
                        className={`bg-white rounded-[2.8rem] p-3 flex gap-4 border border-gray-50 transition-all shadow-sm ${
                          !canOrder ? 'opacity-50 grayscale' : 'active:scale-[0.97] cursor-pointer hover:border-orange-100 shadow-orange-900/5'
                        }`}
                      >
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-gray-100 shrink-0 border border-gray-50 shadow-inner">
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex flex-col justify-center flex-1">
                          <h3 className="font-black text-gray-800 uppercase italic text-[11px] mb-1.5 leading-tight line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-orange-600 font-black text-lg italic">
                            {formatRupiah(product.price)}
                          </p>
                        </div>

                        {canOrder && (
                          <div className="flex items-center pr-3">
                            <div className="w-12 h-12 bg-orange-500 text-white rounded-[1.3rem] flex items-center justify-center shadow-lg shadow-orange-200">
                              <Plus size={24} strokeWidth={4} />
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
          <div className="text-center py-20 text-gray-300 font-black uppercase italic tracking-widest">
            Menu tidak ditemukan
          </div>
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
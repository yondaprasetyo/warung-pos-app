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
  const categoryScrollRef = useRef(null); // Ref untuk auto-center scroll

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
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  const activeTab = userSelectedTab || (categories.length > 0 ? categories[0] : '');

  // FUNGSI 1: Haptic Feedback (Getar)
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); // Getar halus 10ms
    }
  };

  // FUNGSI 2: Auto Center Scroll & Scroll to Section
  const handleCategoryClick = (category, e) => {
    triggerHaptic();
    setUserSelectedTab(category);

    // Auto-center logic
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    const offset = 220; 
    const element = sectionRefs.current[category];
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-orange-500 animate-pulse uppercase italic text-xl">Memuat Menu...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* HEADER & NAV FIXED */}
      <div className="sticky top-0 z-[100] bg-white shadow-md">
        <div className="bg-orange-600 px-4 py-2.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase italic tracking-wider">
              Menu Untuk: {orderDateInfo?.fullDate}
            </span>
          </div>
          <button 
            onClick={() => { triggerHaptic(); onChangeDate(); }}
            className="text-[9px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase italic active:scale-95"
          >
            Ganti Tanggal
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari menu favoritmu..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Scroll Container Kategori */}
          <div 
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth px-1"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeTab === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-105' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 active:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU LIST */}
      <div className="p-4 space-y-10 max-w-2xl mx-auto pb-32 pt-6">
        {categories.length > 0 ? (
          categories.map(category => (
            <section key={category} ref={el => sectionRefs.current[category] = el}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                <h2 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">
                  {category}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {processedProducts
                  .filter(p => p.category === category)
                  .map(product => {
                    const canOrder = product.isAvailableToday && !product.isOutOfStock;
                    return (
                      <div 
                        key={product.id}
                        onClick={() => {
                          if (canOrder) {
                            triggerHaptic();
                            setSelectedProduct(product);
                          }
                        }}
                        className={`bg-white rounded-[2rem] p-3 flex gap-4 border transition-all relative overflow-hidden ${
                          !canOrder ? 'opacity-60 grayscale' : 'shadow-sm active:scale-[0.98] cursor-pointer active:bg-orange-50/30'
                        }`}
                      >
                        {!canOrder && (
                          <div className="absolute inset-0 z-10 bg-white/20 flex items-center justify-center">
                            <span className="bg-gray-900/90 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase -rotate-3 border border-white/20">
                              {product.isOutOfStock ? 'Habis Terjual' : 'Tidak Tersedia'}
                            </span>
                          </div>
                        )}

                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border">
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex flex-col justify-center flex-1">
                          <h3 className="font-black text-gray-800 uppercase italic text-sm mb-0.5">{product.name}</h3>
                          <p className="text-orange-600 font-black text-base italic">{formatRupiah(product.price)}</p>
                        </div>

                        {canOrder && (
                          <div className="flex items-center pr-1">
                            <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 group-active:scale-90 transition-transform">
                              <Plus size={20} strokeWidth={4} />
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
          onClose={() => { triggerHaptic(); setSelectedProduct(null); }}
          onConfirm={(item) => {
            triggerHaptic();
            onAddToCart(item);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default MenuView;
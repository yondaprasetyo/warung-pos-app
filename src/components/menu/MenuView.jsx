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
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isAvailableToday = !p.availableDays || 
                               p.availableDays.length === 0 || 
                               p.availableDays.includes(orderDateInfo?.dayId);
      return { 
        ...p, 
        isAvailableToday: isAvailableToday && p.isAvailable !== false,
        isOutOfStock: p.stock === 0,
        matchesSearch 
      };
    }).filter(p => p.matchesSearch);
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

    // Auto-center scroll tab kategori
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    // FIX SCROLL: Hitung tinggi header secara dinamis
    // Header (Orange) + Search/Tabs biasanya memakan ~180px sampai 210px
    const offset = 210; 
    const element = sectionRefs.current[category];
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) return (
    <div className="bg-gray-50 min-h-screen p-4 space-y-4">
      <div className="h-40 bg-white rounded-3xl animate-pulse w-full" />
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse w-full" />)}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen relative border-t-0">
      {/* STICKY HEADER - Pastikan tidak ada overflow di elemen pembungkus ini */}
      <div className="sticky top-0 z-[50] bg-white shadow-lg border-b border-gray-100">
        {/* Banner Tanggal */}
        <div className="bg-orange-600 px-4 py-2.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar size={14} className="shrink-0" />
            <span className="text-[10px] font-black uppercase italic truncate">
              Menu: {orderDateInfo?.fullDate}
            </span>
          </div>
          <button 
            onClick={() => { triggerHaptic(); onChangeDate(); }}
            className="text-[9px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase shrink-0"
          >
            Ubah
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari menu favorit..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div 
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeTab === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                  : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU LIST - Gunakan scroll-margin-top agar sticky header tidak menabrak judul */}
      <div className="p-4 space-y-12 max-w-2xl mx-auto pb-40 pt-6">
        {categories.map(category => (
          <section 
            key={category} 
            ref={el => sectionRefs.current[category] = el}
            style={{ scrollMarginTop: '210px' }} // Sinkron dengan offset JS
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full shadow-sm shadow-orange-200"></div>
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
                      onClick={() => canOrder && setSelectedProduct(product)}
                      className={`bg-white rounded-[2.5rem] p-3 flex gap-4 border border-gray-50 transition-all shadow-sm ${
                        !canOrder ? 'opacity-50 grayscale' : 'active:scale-95 cursor-pointer hover:border-orange-100'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex flex-col justify-center flex-1">
                        <h3 className="font-black text-gray-800 uppercase italic text-xs mb-1 leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-orange-600 font-black text-base italic">
                          {formatRupiah(product.price)}
                        </p>
                      </div>

                      {canOrder && (
                        <div className="flex items-center pr-2">
                          <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                            <Plus size={22} strokeWidth={4} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
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
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

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleCategoryClick = (category, e) => {
    triggerHaptic();
    setUserSelectedTab(category);

    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    const offset = 200; 
    const element = sectionRefs.current[category];
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white p-4 space-y-4 shadow-sm">
          <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-full"></div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-full animate-pulse w-24 shrink-0"></div>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4 max-w-2xl mx-auto mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] p-3 flex gap-4 border border-gray-100 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 shrink-0"></div>
              <div className="flex flex-col justify-center flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <div className="sticky top-0 z-[50] w-full flex flex-col shadow-lg border-b border-gray-100">
        <div className="bg-orange-600 px-4 py-2 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-tight">
              Menu: {orderDateInfo?.fullDate}
            </span>
          </div>
          <button onClick={() => { triggerHaptic(); onChangeDate(); }} className="text-[9px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase">Ubah</button>
        </div>

        <div className="bg-white p-3 space-y-3">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari menu favorit..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth max-w-2xl mx-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeTab === cat ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8 max-w-2xl mx-auto pb-32 pt-6">
        {categories.map(category => (
          <section key={category} ref={el => sectionRefs.current[category] = el}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <h2 className="text-sm font-black text-gray-800 uppercase italic">{category}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {processedProducts.filter(p => p.category === category).map(product => {
                const canOrder = product.isAvailableToday && !product.isOutOfStock;
                return (
                  <div key={product.id} onClick={() => canOrder && setSelectedProduct(product)} className={`bg-white rounded-[2rem] p-3 flex gap-4 border border-gray-100 transition-all ${!canOrder ? 'opacity-50 grayscale' : 'active:scale-[0.97] shadow-sm cursor-pointer'}`}>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h3 className="font-bold text-gray-800 text-xs uppercase">{product.name}</h3>
                      <p className="text-orange-600 font-black text-sm">{formatRupiah(product.price)}</p>
                    </div>
                    {canOrder && (
                      <div className="flex items-center pr-1">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={18} strokeWidth={3} /></div>
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
          onClose={() => { triggerHaptic(); setSelectedProduct(null); }}
          onConfirm={(item) => { triggerHaptic(); onAddToCart(item); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
};

export default MenuView;
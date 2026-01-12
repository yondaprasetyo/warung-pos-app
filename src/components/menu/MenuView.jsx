import React, { useMemo, useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal';
import { Search, Calendar, Plus, ChevronDown } from 'lucide-react'; // Tambah ChevronDown

const MenuView = ({ onAddToCart, orderDateInfo, onChangeDate, onUpdateDate, isAdmin }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('');
  
  const sectionRefs = useRef({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      if (items.length > 0 && !activeTab) {
        setActiveTab(items[0].category);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [activeTab]);

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
    const cats = processedProducts.map(p => p.category);
    return [...new Set(cats)];
  }, [processedProducts]);

  const handleCategoryClick = (category, e) => {
    setActiveTab(category);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    const element = sectionRefs.current[category];
    if (element) {
      // 72px (Header Utama) + 248px (Header Menu) = 320px
      const headerHeight = 320; 
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-[72px]">
      <div className="text-orange-500 font-black animate-pulse italic uppercase tracking-widest">
        Memuat Menu...
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-50">
      
      {/* HEADER MENU - Sticky di Top 72px (di bawah Header Utama) */}
      <header className="fixed top-[72px] left-0 right-0 z-[999] bg-white shadow-xl border-b border-gray-100">
        <div className="bg-orange-600 px-4 py-3 flex justify-between items-center text-white transition-all">
          
          {/* BAGIAN KIRI: TANGGAL & PICKER */}
          <div className="flex items-center gap-2 overflow-hidden flex-1 relative">
            <Calendar size={16} className="shrink-0 text-orange-200" />
            
            {isAdmin ? (
              // JIKA ADMIN: Tampilkan Input Date Native (Tersembunyi tapi bisa diklik)
              <div className="relative flex items-center cursor-pointer group">
                {/* Teks Tampilan yang Bagus */}
                <div className="flex flex-col leading-none z-10 pointer-events-none">
                   <span className="text-[8px] text-orange-200 font-bold uppercase tracking-widest mb-0.5">
                      Menu Tanggal:
                   </span>
                   <span className="text-xs font-black uppercase italic tracking-tight truncate flex items-center gap-1 group-hover:text-orange-100 transition-colors">
                      {orderDateInfo?.fullDate || "Pilih Tanggal"} 
                      <ChevronDown size={12} className="opacity-70"/>
                   </span>
                </div>

                {/* Input Date Transparan (Overlay) */}
                <input 
                  type="date" 
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
                  // Gunakan ISO date (YYYY-MM-DD) untuk value input
                  value={orderDateInfo?.isoDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => onUpdateDate && onUpdateDate(e.target.value)}
                />
              </div>
            ) : (
              // JIKA CUSTOMER: Tampilan Biasa (Teks Saja)
              <div className="flex flex-col leading-none">
                 <span className="text-[8px] text-orange-200 font-bold uppercase tracking-widest mb-0.5">
                    Menu Tanggal:
                 </span>
                 <span className="text-xs font-black uppercase italic tracking-tight truncate">
                    {orderDateInfo?.fullDate}
                 </span>
              </div>
            )}
          </div>

          {/* BAGIAN KANAN: TOMBOL UBAH (HANYA UNTUK CUSTOMER) */}
          {/* Admin tidak butuh tombol ini karena bisa klik tanggal langsung */}
          {!isAdmin && (
            <button 
              onClick={onChangeDate}
              className="text-[9px] font-black bg-white text-orange-600 px-4 py-1.5 rounded-full uppercase active:scale-90 shadow-sm transition-transform"
            >
              Ubah
            </button>
          )}
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-4">
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
          
          <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  activeTab === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-orange-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* KONTEN UTAMA - Padding Top 320px (72 + Tinggi Header Menu) */}
      <main className="pt-[320px] p-4 space-y-12 max-w-2xl mx-auto pb-40">
        {categories.length > 0 ? (
          categories.map(category => (
            <section 
              key={category} 
              ref={el => sectionRefs.current[category] = el}
              className="scroll-mt-[320px]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-7 bg-orange-500 rounded-full shadow-sm shadow-orange-200"></div>
                <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tight">
                  {category}
                </h2>
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
                          !canOrder 
                          ? 'opacity-50 grayscale cursor-not-allowed' 
                          : 'active:scale-[0.97] cursor-pointer hover:border-orange-100 shadow-orange-900/5'
                        }`}
                      >
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-gray-100 shrink-0 border border-gray-50 shadow-inner">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <h3 className="font-black text-gray-800 uppercase italic text-[11px] mb-1.5 leading-tight line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-orange-600 font-black text-lg italic tracking-tighter">
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
      </main>

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
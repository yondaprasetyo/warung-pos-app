import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from '../menu/ItemSelectionModal';
import { Search, Calendar, Plus, Lock, ArrowLeft } from 'lucide-react';

const PublicOrderView = ({ 
  onAddToCart, 
  orderDateInfo, 
  onChangeDate, 
  shopClosedInfo,
  onBack
}) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // --- AMBIL DATA PRODUK ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- HELPER: HAPTIC FEEDBACK ---
  const triggerHaptic = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  };

  // --- FILTER KATEGORI ---
  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['Semua', ...new Set(cats)];
  }, [products]);

  // --- FILTER DATA PRODUK (SEARCH + DATE + CATEGORY) ---
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

  // ============================================================
  // TAMPILAN 1: JIKA TOKO TUTUP (LOCK SCREEN)
  // ============================================================
  if (shopClosedInfo) {
    return (
      <div className="relative min-h-screen bg-gray-100 flex flex-col">
        {/* HEADER DARURAT (MERAH) - Agar kasir tetap bisa ganti tanggal */}
        <header className="fixed top-[72px] left-0 right-0 z-[999] bg-red-600 shadow-lg border-b border-red-700">
            <div className="px-4 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Calendar size={14} className="text-white/80 shrink-0" />
                    <span className="text-[10px] font-black uppercase italic tracking-tighter truncate">
                        KASIR MODE: {orderDateInfo?.fullDate}
                    </span>
                </div>
                <button 
                    onClick={() => { triggerHaptic(); onChangeDate(); }} 
                    className="text-[9px] font-black bg-white text-red-600 px-4 py-1.5 rounded-full uppercase shadow-sm active:scale-90 shrink-0 transition-transform"
                >
                    Ganti
                </button>
            </div>
        </header>

        {/* PESAN TENGAH LAYAR */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-32">
            <div className="bg-red-100 p-8 rounded-full mb-6 text-red-600 animate-bounce shadow-xl">
                <Lock size={64} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 leading-none">
                Warung Tutup
            </h2>
            <div className="bg-white border-l-4 border-red-500 p-6 rounded-2xl max-w-sm w-full shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Operasional:</p>
                <p className="text-2xl font-black text-red-600 uppercase italic mb-4">
                    "{shopClosedInfo.reason}"
                </p>
                <p className="text-xs text-gray-500 font-bold">
                    Sistem POS dikunci untuk tanggal: <br/>
                    <span className="text-gray-800 underline">{orderDateInfo?.fullDate}</span>
                </p>
            </div>
            <p className="mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-200/50 px-4 py-2 rounded-lg">
                Silakan ganti tanggal untuk memproses order lain.
            </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // TAMPILAN 2: LOADING SCREEN
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-[72px]">
        <div className="text-orange-500 font-black animate-pulse italic uppercase tracking-widest">
          MEMBUKA POS...
        </div>
      </div>
    );
  }

  // ============================================================
  // TAMPILAN 3: NORMAL POS (TOKO BUKA)
  // ============================================================
  return (
    <div className="relative min-h-screen bg-gray-100">
      
      {/* FIXED HEADER POS */}
      <header className="fixed top-[72px] left-0 right-0 z-[999] bg-white shadow-lg border-b border-gray-200">
        <div className="bg-gray-900 px-4 py-2.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3 overflow-hidden">
             
            {/* TAMBAHAN: Tombol Kembali ke Landing Page */}
            {onBack && (
                <button onClick={onBack} className="p-1 -ml-1 hover:bg-white/20 rounded-full transition">
                    <ArrowLeft size={16} className="text-white" />
                </button>
            )}
            
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-orange-500 shrink-0" />
                <span className="text-[10px] font-black uppercase italic tracking-tighter truncate">
                  {orderDateInfo?.fullDate}
                </span>
            </div>
          </div>
          
          <button 
            onClick={() => { triggerHaptic(); onChangeDate(); }} 
            className="text-[9px] font-black border border-white/30 px-3 py-1.5 rounded-full uppercase hover:bg-orange-600 transition-all active:scale-90 shrink-0"
          >
            Ganti Tanggal
          </button>
        </div>

        <div className="p-4 space-y-3 max-w-7xl mx-auto w-full">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Cari menu cepat..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* KATEGORI TABS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={(e) => {
                  triggerHaptic();
                  setActiveCategory(cat);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${
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
      </header>

      {/* GRID KONTEN MENU - Pt 280px (72 + Header POS) */}
      <main className="pt-[280px] p-4 md:p-6 pb-40">
        {processedProducts.length > 0 ? (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {processedProducts.map(product => {
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
                  className={`bg-white p-2 rounded-[2.2rem] shadow-sm border-2 transition-all flex flex-col text-left relative active:scale-95 ${
                    !canOrder 
                    ? 'opacity-40 grayscale border-transparent cursor-not-allowed' 
                    : 'hover:border-orange-500 border-transparent shadow-orange-100/10'
                  }`}
                >
                  <div className="w-full aspect-square rounded-[1.6rem] overflow-hidden bg-gray-50 mb-3 relative shadow-inner">
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                    
                    {/* Badge Status (Habis/Libur) */}
                    {!canOrder && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-2">
                        <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase shadow-lg italic">
                          {product.isOutOfStock ? 'Habis' : 'Libur'}
                        </span>
                      </div>
                    )}

                    {/* Badge Stok */}
                    {canOrder && product.stock !== -1 && (
                      <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black shadow-md border border-orange-400">
                        {product.stock}
                      </div>
                    )}
                  </div>

                  <div className="px-2 pb-2 flex flex-col flex-1">
                    <h4 className="font-bold text-gray-800 uppercase text-[10px] leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
                      {product.name}
                    </h4>
                    <div className="flex justify-between items-center mt-auto">
                      <p className="text-orange-600 font-black text-xs italic">
                        {formatRupiah(product.price)}
                      </p>
                      {canOrder && (
                          <div className="bg-orange-100 p-1.5 rounded-xl text-orange-600">
                            <Plus size={14} strokeWidth={4} />
                          </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-300 font-black italic uppercase text-xs tracking-widest">
            Menu tidak ditemukan
          </div>
        )}
      </main>

      {/* MODAL SELEKSI ITEM */}
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
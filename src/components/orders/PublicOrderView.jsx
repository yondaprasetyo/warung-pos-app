import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from '../menu/ItemSelectionModal';
import { Search, Plus, Lock, ArrowLeft, ShoppingBag, ClipboardList } from 'lucide-react';

const PublicOrderView = ({ 
  onAddToCart, 
  orderDateInfo, 
  shopClosedInfo, 
  onBack, 
  cartCount, 
  onViewCart,
  isSelfService = false // Props baru untuk membedakan mode
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const triggerHaptic = () => { if (window.navigator?.vibrate) window.navigator.vibrate(10); };

  const categories = useMemo(() => ['Semua', ...new Set(products.map(p => p.category))], [products]);
  
  const processedProducts = useMemo(() => {
    return products.filter(p => {
      const isAvailableToday = !p.availableDays || p.availableDays.length === 0 || p.availableDays.includes(orderDateInfo?.dayId);
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
      return isAvailableToday && matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory, orderDateInfo]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-orange-500 animate-pulse italic">
      MEMBUKA KATALOG...
    </div>
  );

  if (shopClosedInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-8 rounded-full mb-6 text-red-600 animate-bounce shadow-xl"><Lock size={64} /></div>
        <h2 className="text-4xl font-black text-gray-800 uppercase italic mb-4">Maaf, Warung Tutup</h2>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border-t-8 border-red-500">
           <p className="text-2xl font-black text-red-600 italic mb-4">"{shopClosedInfo.reason}"</p>
           <button onClick={onBack} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold uppercase">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* HEADER DINAMIS - Memperbaiki Klik & Header Ganda */}
      <header className="bg-white shadow-md sticky top-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-orange-600 italic leading-none">
                {isSelfService ? "WARUNG MAMAH YONDA" : "PILIH MENU"}
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {isSelfService ? "Pesan Langsung di Toko" : orderDateInfo?.fullDate}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => navigate('/track-orders')} className="p-3 bg-orange-100 text-orange-600 rounded-2xl font-bold flex items-center gap-2">
              <ClipboardList size={20} /> <span className="hidden sm:inline">ANTREAN</span>
            </button>
            {/* Menggunakan onViewCart agar navigasi ke keranjang berfungsi */}
            <button onClick={onViewCart} className="p-3 bg-orange-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200">
              <ShoppingBag size={20} /> <span>{cartCount}</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 space-y-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none shadow-inner font-bold" placeholder="Mau makan apa hari ini?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => { triggerHaptic(); setActiveCategory(cat); }} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase transition-all border-2 ${activeCategory === cat ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200'}`}>{cat}</button>
              ))}
           </div>
        </div>
      </header>

      {/* GRID MENU */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {processedProducts.map(p => {
            const isHabis = p.stock === 0;
            return (
              <button key={p.id} onClick={() => { if(!isHabis) { triggerHaptic(); setSelectedProduct(p); }}} className={`group bg-white rounded-[2.5rem] p-3 shadow-sm border-2 transition-all flex flex-col relative active:scale-95 ${isHabis ? 'opacity-50 grayscale' : 'hover:border-orange-500 hover:shadow-xl'}`}>
                <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative">
                  <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                  {isHabis && <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-black text-white italic uppercase text-xs">Habis</div>}
                </div>
                <div className="px-2 flex-1 flex flex-col">
                  <h4 className="font-black text-gray-800 text-xs uppercase leading-tight line-clamp-2 mb-2 italic">{p.name}</h4>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-orange-600 font-black text-sm">{formatRupiah(p.price)}</span>
                    {!isHabis && <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Plus size={16} strokeWidth={4} /></div>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* FAB KERANJANG MOBILE */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-[9999]"> {/* Tambahkan z-[9999] */}
          <button 
            onClick={onViewCart} 
            className="w-full py-4 bg-orange-600 text-white rounded-3xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 animate-bounce"
          >
              <ShoppingBag /> LIHAT PESANAN ({cartCount})
          </button>
        </div>
      )}

      {selectedProduct && (
        <ItemSelectionModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onConfirm={(item) => { onAddToCart(item); setSelectedProduct(null); }} />
      )}
    </div>
  );
};

export default PublicOrderView;
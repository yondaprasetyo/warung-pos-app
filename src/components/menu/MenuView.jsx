import React, { useMemo, useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from './ItemSelectionModal';
import { Utensils, Info, Search } from 'lucide-react';

const MenuView = ({ onAddToCart, currentDay }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const sectionRefs = useRef({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isAvailable === false || p.stock === 0) return false;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDay = !p.availableDays || p.availableDays.length === 0 || p.availableDays.includes(currentDay !== undefined ? currentDay : new Date().getDay());
      return matchesSearch && matchesDay;
    });
  }, [products, currentDay, searchTerm]);

  const categories = useMemo(() => [...new Set(filteredProducts.map(p => p.category))], [filteredProducts]);

  const scrollToSection = (category) => {
    sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black text-orange-500 uppercase italic tracking-widest text-[10px]">Menyiapkan Menu...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      {/* Search & Category Bar (Sticky) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari menu favoritmu..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => scrollToSection(cat)}
                className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tighter text-gray-500 whitespace-nowrap hover:border-orange-500 hover:text-orange-500 transition-all active:scale-90"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-12 pb-32 mt-4">
        {categories.length > 0 ? (
          categories.map(category => (
            <section key={category} ref={el => sectionRefs.current[category] = el} className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter border-l-8 border-orange-500 pl-3">
                  {category}
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredProducts
                  .filter(p => p.category === category)
                  .map(product => (
                    <div 
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white rounded-[2rem] p-3 flex gap-4 shadow-sm border border-gray-100 active:scale-[0.97] transition-all relative group"
                    >
                      <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-gray-50 shrink-0 shadow-inner">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-300 uppercase italic">No Photo</div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center flex-1">
                        <h3 className="font-black text-gray-800 uppercase italic leading-tight text-sm mb-1 line-clamp-1">{product.name}</h3>
                        <p className="text-orange-600 font-black text-lg italic tracking-tighter">
                          {formatRupiah(product.price)}
                        </p>
                        
                        {product.stock > 0 && product.stock <= 5 && (
                          <div className="flex items-center gap-1 mt-1 text-red-500">
                            <Info size={10} />
                            <span className="text-[8px] font-black uppercase">Sisa {product.stock}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center pr-2">
                        <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                          <span className="text-xl font-black">+</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-20">
            <Utensils className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="font-black text-gray-400 text-xs italic uppercase">Menu tidak ditemukan</p>
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
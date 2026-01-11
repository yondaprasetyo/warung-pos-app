import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatRupiah } from '../../utils/format';
import ItemSelectionModal from '../menu/ItemSelectionModal';
import { Search, Grid, List, Hash } from 'lucide-react';

const PublicOrderView = ({ onAddToCart }) => {
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
      const isAvailable = p.stock !== 0;
      return matchesSearch && matchesCategory && isAvailable;
    });
  }, [products, searchTerm, activeCategory]);

  if (loading) return <div className="p-10 text-center font-black text-orange-500 animate-pulse">LOADING POS...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Top Bar: Search & Categories */}
      <div className="bg-white p-4 shadow-sm z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Cari Menu (Tekan Enter)..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Menu Kasir */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white p-3 rounded-[2rem] shadow-sm hover:shadow-md border-2 border-transparent hover:border-orange-500 transition-all flex flex-col text-left relative group active:scale-95"
            >
              {/* Thumbnail Kecil */}
              <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-gray-50 mb-3">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-200 uppercase italic">No Pic</div>
                )}
              </div>

              {/* Info Produk */}
              <div className="flex-1">
                <h4 className="font-black text-gray-800 uppercase italic text-[11px] leading-tight mb-1 line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-orange-600 font-black text-sm italic">
                  {formatRupiah(product.price)}
                </p>
              </div>

              {/* Badge Stok */}
              {product.stock !== -1 && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-black border border-orange-100 shadow-sm">
                  STOK: {product.stock}
                </div>
              )}

              {/* Indikator Varian */}
              {product.variants?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex items-center gap-1 text-[8px] font-bold text-blue-500 uppercase">
                  <Hash size={10} /> {product.variants.length} Varian
                </div>
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Grid size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase italic text-sm">Menu tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal Pilihan (Varian, Qty, Catatan) */}
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
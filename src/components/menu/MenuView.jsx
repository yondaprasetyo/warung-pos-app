import React, { useState } from 'react';
import { Search } from 'lucide-react'; // Import Icon Search
import { MENU_ITEMS, CATEGORIES } from '../../data/menuItems';
import ProductCard from './ProductCard';

const MenuView = ({ onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); // State baru untuk search

  // Logic filter diperbarui: Kategori AND Nama Barang
  const filteredMenu = MENU_ITEMS.filter(item => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* --- Bagian Search Bar Baru --- */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Cari menu (misal: Nasi Goreng)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* --- Bagian Kategori (Tetap) --- */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition font-medium ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-orange-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- Grid Menu --- */}
      {filteredMenu.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Menu tidak ditemukan</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMenu.map(item => (
            <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};
export default MenuView;
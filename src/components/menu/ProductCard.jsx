import React from 'react';
import { Plus } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ProductCard = ({ item, onAddToCart }) => (
  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full">
    <div className="text-6xl text-center py-6 bg-gradient-to-br from-orange-100 to-red-100">
      {item.image}
    </div>
    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-lg mb-1">{item.name}</h3>
      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
      <div className="mt-auto flex justify-between items-center">
        <span className="text-orange-600 font-bold text-lg">{formatRupiah(item.price)}</span>
        <button
          onClick={() => onAddToCart(item)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-1 text-sm font-semibold"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>
    </div>
  </div>
);
export default ProductCard;
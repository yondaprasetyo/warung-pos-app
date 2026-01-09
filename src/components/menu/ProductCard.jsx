import React from 'react';

const ProductCard = ({ item, onAddToCart }) => {
  // Cek apakah stok benar-benar habis (bukan -1 dan bernilai 0 atau kurang)
  const isOutOfStock = item.stock !== -1 && item.stock <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
      {/* Container Gambar */}
      <div className="relative h-40 bg-orange-50 flex items-center justify-center overflow-hidden">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/150'} 
          alt={item.name}
          className={`w-full h-full object-cover transition duration-300 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Habis</span>
          </div>
        )}
      </div>

      {/* Detail Produk */}
      <div className="p-4">
        <div className="text-xs text-orange-500 font-bold mb-1 uppercase tracking-wider">
          {item.category}
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{item.name}</h3>
        
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Rp {item.price?.toLocaleString()}</span>
            
            {/* Status Stok */}
            <div className="text-[10px] sm:text-xs">
              {item.stock === -1 ? (
                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md font-medium">Tersedia</span>
              ) : item.stock > 0 ? (
                <span className="text-gray-500 italic">Sisa: {item.stock}</span>
              ) : (
                <span className="text-red-500 font-bold italic">Habis</span>
              )}
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation(); // Mencegah pemicu ganda dari elemen parent
              onAddToCart(item);
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 
              ${isOutOfStock 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 shadow-lg active:scale-95'}`}
          >
            {isOutOfStock ? 'Stok Habis' : '+ Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
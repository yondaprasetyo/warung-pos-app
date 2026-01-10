import React from 'react';
import { Plus, Info } from 'lucide-react';

const ProductCard = ({ item, onAddToCart }) => {
  // Logika stok menggunakan item.imageUrl dari Firebase
  const isStockLow = item.stock !== -1 && item.stock <= 3 && item.stock > 0;
  const isOutOfStock = item.stock === 0;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full">
      {/* AREA GAMBAR */}
      <div className="relative h-40 overflow-hidden bg-gray-50">
        <img 
          src={item.imageUrl || "/api/placeholder/400/320"} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = "/api/placeholder/400/320" }}
        />
        {/* OVERLAY STATUS STOK */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase">
              Habis Terjual
            </span>
          </div>
        )}
      </div>

      {/* AREA KONTEN */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
            {item.category}
          </span>
          <h3 className="font-bold text-gray-800 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 h-10">
            {item.name}
          </h3>
        </div>

        <div className="mt-auto">
          <div className="flex flex-col mb-3">
            <span className="text-lg font-black text-gray-900">
              Rp {item.price?.toLocaleString()}
            </span>
            
            {/* INDIKATOR STOK */}
            <div className="flex items-center gap-1.5 mt-1">
              {item.stock === -1 ? (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                  Stok Tersedia
                </span>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isStockLow 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : isOutOfStock 
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {isStockLow && <Info size={10} />}
                  Sisa {item.stock} Porsi
                </span>
              )}
            </div>
          </div>

          {/* TOMBOL AKSI */}
          <button
            onClick={() => onAddToCart(item)}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-100 active:scale-95'
            }`}
          >
            {isOutOfStock ? 'Habis' : <><Plus size={16} /> Tambah</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
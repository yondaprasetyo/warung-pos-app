import React from 'react';

const ProductCard = ({ item, onAddToCart }) => {
  // PERBAIKAN: Menu dianggap habis jika (stok bukan -1 DAN stok <= 0) ATAU status isAvailable adalah false
  const isOutOfStock = (item.stock !== -1 && item.stock <= 0) || item.isAvailable === false;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col h-full">
      {/* Container Gambar Produk */}
      <div className="relative h-40 bg-orange-50 flex items-center justify-center overflow-hidden">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/150'} 
          alt={item.name}
          className={`w-full h-full object-cover transition duration-500 group-hover:scale-110 
            ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
        />
        
        {/* Badge Stok Habis / Tidak Tersedia */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              {item.isAvailable === false ? 'Tidak Tersedia' : 'Habis'}
            </span>
          </div>
        )}
      </div>

      {/* Detail Produk */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Kategori */}
        <div className="text-[10px] text-orange-500 font-bold mb-1 uppercase tracking-widest">
          {item.category}
        </div>
        
        {/* Nama Produk */}
        <h3 className={`font-bold text-sm mb-1 truncate leading-tight group-hover:text-orange-600 transition-colors ${isOutOfStock ? 'text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </h3>
        
        {/* Harga */}
        <span className={`font-black mb-4 block ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
          Rp {item.price?.toLocaleString()}
        </span>

        {/* Tombol Aksi */}
        <div className="mt-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onAddToCart(item);   
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 
              ${isOutOfStock 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-orange-200 active:scale-95'}`}
          >
            {isOutOfStock ? 'Tidak Tersedia' : '+ Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
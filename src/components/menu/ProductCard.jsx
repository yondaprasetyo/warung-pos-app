import React, { useState } from 'react';

const ProductCard = ({ item, onAddToCart }) => {
  // Pecah string varian menjadi array
  const variantsArray = item.variants 
    ? item.variants.split(',').map(v => v.trim()).filter(v => v !== "") 
    : [];

  // PERBAIKAN: Set nilai awal langsung di useState, bukan di useEffect
  const [selectedVariant, setSelectedVariant] = useState(variantsArray.length > 0 ? variantsArray[0] : '');
  const [note, setNote] = useState('');

  const isOutOfStock = item.stock !== -1 && item.stock <= 0;

  const handleAddClick = (e) => {
    e.stopPropagation();
    // Gunakan varian yang dipilih, atau fallback ke yang pertama jika kosong
    const finalVariant = selectedVariant || (variantsArray.length > 0 ? variantsArray[0] : '');
    onAddToCart(item, finalVariant, note);
    setNote('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col h-full">
      {/* Container Gambar */}
      <div className="relative h-40 bg-orange-50 flex items-center justify-center overflow-hidden">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/150'} 
          alt={item.name}
          className={`w-full h-full object-cover transition duration-300 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Habis</span>
          </div>
        )}
      </div>

      {/* Detail Produk */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-[10px] text-orange-500 font-bold mb-1 uppercase tracking-widest">{item.category}</div>
        <h3 className="font-bold text-gray-800 text-base mb-1 truncate leading-tight">{item.name}</h3>
        <span className="font-black text-gray-900 mb-3 block">Rp {item.price?.toLocaleString()}</span>

        {/* Pilihan Varian */}
        {!isOutOfStock && variantsArray.length > 0 && (
          <div className="mb-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pilih Varian:</label>
            <select 
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-orange-500 outline-none"
            >
              {variantsArray.map((v, idx) => (
                <option key={idx} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* Input Catatan */}
        {!isOutOfStock && (
          <div className="mb-4">
            <input 
              type="text"
              placeholder="Catatan (paha bawah, dll)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-[11px] bg-transparent border-b border-gray-100 focus:border-orange-300 outline-none py-1 italic"
            />
          </div>
        )}

        <div className="mt-auto">
          <button 
            onClick={handleAddClick}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 
              ${isOutOfStock 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100 shadow-lg active:scale-95'}`}
          >
            {isOutOfStock ? 'Stok Habis' : '+ Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ItemSelectionModal = ({ product, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [note, setNote] = useState('');

  // Hitung harga dasar atau harga varian
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const totalPrice = basePrice * quantity;

  const handleConfirm = () => {
    onConfirm({
      ...product,
      id: `${product.id}-${selectedVariant?.name || 'default'}`,
      productId: product.id,
      quantity,
      selectedVariant,
      note,
      price: basePrice,
      totalPrice
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header & Foto */}
        <div className="relative h-64 bg-gray-100">
          {product.imageUrl ? (
            <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-black italic uppercase">No Photo</div>
          )}
          <button onClick={onClose} className="absolute top-6 right-6 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg">
            <X size={24} className="text-gray-800" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">{product.name}</h2>
            <p className="text-orange-600 font-black text-xl italic">{formatRupiah(basePrice)}</p>
          </div>

          {/* Pilihan Varian (Jika Ada) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Varian</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                      selectedVariant?.name === variant.name
                        ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                        : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {variant.name} (+{formatRupiah(variant.price - product.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan (Contoh: Tidak Pedas)</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-orange-500"
              placeholder="Tambahkan catatan di sini..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Quantity & Button */}
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-orange-600"
              >
                <Minus size={20} />
              </button>
              <span className="w-8 text-center font-black text-lg">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-orange-600"
              >
                <Plus size={20} />
              </button>
            </div>

            <button 
              onClick={handleConfirm}
              className="flex-1 bg-orange-500 text-white py-4 rounded-[1.5rem] font-black uppercase italic shadow-xl shadow-orange-200 flex items-center justify-center gap-3 hover:bg-orange-600 active:scale-95 transition-all"
            >
              <ShoppingBag size={20} /> Tambah {formatRupiah(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;
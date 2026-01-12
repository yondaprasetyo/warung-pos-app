import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ItemSelectionModal = ({ product, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [note, setNote] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // FIX Error: Gunakan requestAnimationFrame agar state update tidak bentrok dengan render
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsAnimating(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  // Logika Harga: Jika ada varian, gunakan harga varian. Jika tidak, harga produk.
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const totalPrice = basePrice * quantity;

  const handleConfirm = () => {
    onConfirm({
      ...product,
      // Buat ID unik jika varian dipilih agar tidak tertumpuk di keranjang
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
    // PERBAIKAN PENTING:
    // Ubah z-[200] menjadi z-[9999] agar tampil DI ATAS Header (z-1000)
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      
      {/* Backdrop dengan animasi opacity */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel Modal dengan animasi Slide-Up */}
      <div 
        className={`relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden transition-transform duration-300 ease-out shadow-2xl flex flex-col max-h-[90vh] ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar kecil untuk mobile */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header Gambar */}
        <div className="relative h-60 sm:h-64 bg-gray-100 shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-black italic uppercase">No Photo</div>
          )}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/40 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Area Konten dengan Scroll Otomatis (overflow-y-auto) */}
        {/* Ini penting agar di HP kecil tombol 'Tambah' tidak terpotong */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Info Utama */}
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-tight">
              {product.name}
            </h2>
            <p className="text-orange-600 font-black text-xl italic">{formatRupiah(basePrice)}</p>
          </div>

          {/* FITUR VARIAN */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Varian</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border-2 ${
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

          {/* Catatan Tambahan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catatan (Contoh: Tidak Pedas)</label>
            <input 
              type="text" 
              placeholder="Tambahkan catatan di sini..."
              className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/5 transition-all"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Quantity & Action Button */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1 shrink-0">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-orange-600 active:scale-90 transition-transform"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-black text-lg italic">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-orange-600 active:scale-90 transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>

            <button 
              onClick={handleConfirm}
              className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-orange-200 flex items-center justify-center gap-3 hover:bg-orange-700 active:scale-95 transition-all"
            >
              <ShoppingBag size={18} />
              Tambah {formatRupiah(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;
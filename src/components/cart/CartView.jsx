import React from 'react';
import { Trash2, Plus, Minus, ChevronDown, ArrowLeft, ShoppingBag, StickyNote } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const CartView = ({ 
  cart, 
  updateQuantity, 
  removeFromCart, 
  updateCartItemDetails, 
  onCheckout, 
  onBack 
}) => {
  // Hitung Total Harga
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl h-[calc(100vh-140px)] flex flex-col overflow-hidden border border-gray-100">
      
      {/* --- HEADER: Solid & Clean --- */}
      <div className="p-6 bg-white border-b border-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-orange-500 rounded-2xl transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
              Keranjang
            </h2>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
              {cart.length} Menu Terpilih
            </p>
          </div>
        </div>
      </div>

      {/* --- BODY / LIST ITEM --- */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-gray-50/30">
        {cart.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ShoppingBag size={40} className="text-gray-100" />
            </div>
            <p className="text-gray-300 font-black mb-6 italic uppercase text-sm tracking-widest">Keranjang Kosong</p>
            <button 
              onClick={onBack}
              className="bg-white border-2 border-orange-500 text-orange-600 px-8 py-3 rounded-2xl font-black text-xs uppercase italic hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95"
            >
              Cari Menu Enak
            </button>
          </div>
        ) : (
          cart.map((item, index) => {
            const isMaxStockReached = item.stock !== -1 && item.quantity >= item.stock;

            // FIX: Ambil nama varian dari selectedVariant (modal) atau fallback ke variant (legacy)
            const currentVariantName = item.selectedVariant?.name || item.variant || "";

            // FIX: Ambil catatan dari notes (cart standard) atau note (modal standard)
            const currentNote = item.notes || item.note || "";

            return (
              <div key={`cart-item-${item.id}-${index}`} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
                
                <div className="flex gap-4">
                  {/* 1. FOTO PRODUK */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-50">
                    <img 
                      src={item.imageUrl || "https://via.placeholder.com/100"} 
                      alt={item.name} 
                      className="w-full h-full object-cover shadow-inner"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/100" }}
                    />
                  </div>

                  {/* 2. DETAIL PRODUK */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate pr-2">
                        <h3 className="font-black text-gray-800 leading-tight text-xs uppercase italic truncate">{item.name}</h3>
                        <p className="text-orange-600 font-black text-sm italic mt-0.5">{formatRupiah(item.price)}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(index)} 
                        className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* DROPDOWN VARIAN (Tampil jika ada varian) */}
                    {Array.isArray(item.variants) && item.variants.length > 0 && (
                      <div className="mt-2 relative">
                        <select 
                          value={currentVariantName}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            // Cari object varian lengkap berdasarkan nama
                            const variantObj = item.variants.find(v => (v.name || v) === selectedName);
                            
                            // Hitung harga baru
                            const newPrice = variantObj?.price ? Number(variantObj.price) : Number(item.basePrice || item.price);

                            updateCartItemDetails(index, { 
                              selectedVariant: variantObj, 
                              variant: selectedName,       
                              price: newPrice              
                            });
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[9px] font-black text-blue-600 outline-none appearance-none pr-8 uppercase italic"
                        >
                          {item.variants.map((v, i) => (
                            <option key={i} value={v.name || v}>{v.name || v}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. INPUT CATATAN */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${currentNote ? 'bg-orange-50/50 border-orange-200' : 'bg-gray-50 border-gray-50'}`}>
                  <StickyNote size={12} className={currentNote ? 'text-orange-500' : 'text-gray-300'} />
                  <input 
                    type="text"
                    placeholder="Catatan tambahan..."
                    value={currentNote}
                    onChange={(e) => updateCartItemDetails(index, { notes: e.target.value })}
                    className="flex-1 bg-transparent text-[10px] font-bold text-gray-700 outline-none placeholder:text-gray-300 placeholder:italic"
                  />
                </div>

                {/* 4. TOTAL PER ITEM & QUANTITY CONTROL */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 tracking-tighter">
                      Subtotal: {formatRupiah(item.price * item.quantity)}
                    </span>
                    {item.stock !== -1 && (
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isMaxStockReached ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                        {isMaxStockReached ? 'Stok Terbatas' : `Sisa: ${item.stock - item.quantity}`}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                    <button 
                      onClick={() => updateQuantity(index, -1)} 
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition-all"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center font-black text-xs text-gray-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(index, 1)} 
                      disabled={isMaxStockReached}
                      className={`w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm transition-all ${isMaxStockReached ? 'text-gray-200 cursor-not-allowed' : 'text-orange-600 hover:text-orange-500'}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- FOOTER: Total & Checkout --- */}
      <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-1">
            <p className="text-gray-400 font-black uppercase text-[9px] tracking-[0.2em]">Total Pembayaran</p>
            <p className="text-3xl font-black text-orange-600 tracking-tighter italic leading-none">
              {formatRupiah(total)}
            </p>
          </div>
        </div>
        
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-[1.8rem] font-black text-sm uppercase italic tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
        >
          Konfirmasi Pesanan
        </button>
      </div>
    </div>
  );
};

export default CartView;
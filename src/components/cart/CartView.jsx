import React from 'react';
import { Trash2, Plus, Minus, ChevronDown, ArrowLeft, ShoppingBag, AlertCircle, StickyNote } from 'lucide-react';

const CartView = ({ 
  cart, 
  updateQuantity, 
  removeFromCart, 
  updateCartItemDetails, 
  onCheckout, 
  onBack 
}) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-white rounded-3xl shadow-xl h-[calc(100vh-120px)] flex flex-col overflow-hidden border border-gray-100">
      
      {/* HEADER */}
      <div className="p-6 bg-orange-500 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase italic tracking-tighter">
            🛒 Keranjang <span className="bg-white text-orange-500 px-2 py-0.5 rounded-lg text-sm">{cart.length}</span>
          </h2>
        </div>
      </div>

      {/* BODY / LIST ITEM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold mb-6 italic">Keranjang Anda masih kosong</p>
            <button 
              onClick={onBack}
              className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all shadow-sm"
            >
              Cari Menu Enak
            </button>
          </div>
        ) : (
          cart.map((item, index) => {
            const isMaxStockReached = item.stock !== -1 && item.quantity >= item.stock;

            return (
              <div key={`cart-item-${item.id}-${index}`} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-4 hover:border-orange-200 transition-colors">
                
                <div className="flex gap-4">
                  {/* 1. FOTO PRODUK */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                    <img 
                      src={item.imageUrl || "/api/placeholder/100/100"} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/api/placeholder/100/100" }}
                    />
                  </div>

                  {/* 2. DETAIL PRODUK */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate">
                        <h3 className="font-black text-gray-800 leading-tight text-sm uppercase italic">{item.name}</h3>
                        <p className="text-orange-600 font-black text-xs mt-0.5">Rp {item.price.toLocaleString()}</p>
                        
                        {/* WARNING STOK */}
                        {item.stock !== -1 && (
                          <div className="mt-1">
                            {isMaxStockReached ? (
                              <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-md font-black animate-pulse flex items-center gap-1 w-fit uppercase">
                                <AlertCircle size={10} /> Stok Limit
                              </span>
                            ) : (
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                Sisa: {item.stock - item.quantity} porsi
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeFromCart(index)} 
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 bg-gray-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* 3. DROPDOWN VARIAN */}
                    {Array.isArray(item.variants) && item.variants.length > 0 && (
                      <div className="mt-2 relative">
                        <select 
                          value={item.variant}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const variantObj = item.variants.find(v => (v.name || v) === selectedName);
                            const newPrice = variantObj?.price ? Number(variantObj.price) : Number(item.basePrice);
                            updateCartItemDetails(index, { 
                              variant: selectedName,
                              price: newPrice 
                            });
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-black text-gray-600 outline-none appearance-none pr-8 uppercase italic"
                        >
                          {item.variants.map((v, i) => (
                            <option key={i} value={v.name || v}>{v.name || v}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. INPUT CATATAN (Highlight jika terisi) */}
                <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl transition-all border-2 ${item.notes ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <StickyNote size={12} className={item.notes ? 'text-orange-500' : 'text-gray-400'} />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Instruksi Khusus</span>
                  </div>
                  <input 
                    type="text"
                    placeholder="Contoh: Kuah pisah, jangan pedas..."
                    value={item.notes || ""}
                    onChange={(e) => updateCartItemDetails(index, { notes: e.target.value })}
                    className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none placeholder:text-gray-300 placeholder:italic"
                  />
                </div>

                {/* 5. SUBTOTAL & QUANTITY CONTROL */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Total Harga Item</span>
                    <span className="text-sm font-black text-gray-800 tracking-tighter">
                      Rp {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden p-1">
                    <button 
                      onClick={() => updateQuantity(index, -1)} 
                      className="w-8 h-8 flex items-center justify-center hover:bg-white hover:text-red-500 rounded-xl transition-all text-gray-400"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-black text-sm text-gray-800 italic">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(index, 1)} 
                      disabled={isMaxStockReached}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isMaxStockReached ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-white text-orange-500'}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t bg-white shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4 px-2">
          <div>
            <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Ringkasan Pembayaran</p>
            <p className="text-3xl font-black text-orange-600 tracking-tighter italic">
              Rp {total.toLocaleString()}
            </p>
          </div>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-gradient-to-br from-orange-400 to-orange-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-orange-200 hover:shadow-orange-300 active:scale-[0.97] transition-all disabled:from-gray-200 disabled:to-gray-300 disabled:shadow-none uppercase italic tracking-wider"
        >
          Konfirmasi Pesanan
        </button>
      </div>
    </div>
  );
};

export default CartView;
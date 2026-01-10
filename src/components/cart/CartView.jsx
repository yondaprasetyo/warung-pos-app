import React from 'react';
import { Trash2, Plus, Minus, ChevronDown, Check, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';

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
          <h2 className="text-xl font-bold flex items-center gap-2">
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
            <p className="text-gray-400 font-bold mb-6">Keranjang Anda masih kosong</p>
            <button 
              onClick={onBack}
              className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all"
            >
              Lihat Menu Sekarang
            </button>
          </div>
        ) : (
          cart.map((item, index) => {
            const isMaxStockReached = item.stock !== -1 && item.quantity >= item.stock;

            return (
              <div key={`cart-item-${item.id}-${index}`} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4">
                
                {/* 1. PENAMBAHAN FOTO PRODUK (Menggunakan imageUrl) */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-200">
                  <img 
                    src={item.imageUrl || "/api/placeholder/100/100"} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/api/placeholder/100/100" }}
                  />
                </div>

                {/* 2. DETAIL PRODUK */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight text-sm">{item.name}</h3>
                      <p className="text-orange-600 font-bold text-xs">Rp {item.price.toLocaleString()}</p>
                      
                      {/* WARNING STOK */}
                      {item.stock !== -1 && (
                        <div className="mt-1 flex flex-col gap-1">
                          {isMaxStockReached ? (
                            <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-md font-black animate-pulse flex items-center gap-1 w-fit">
                              <AlertCircle size={10} /> STOK HABIS
                            </span>
                          ) : (
                            <p className="text-[9px] text-gray-400 font-medium">
                              Sisa: <span className="font-bold">{item.stock - item.quantity}</span> porsi
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)} 
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* 3. DROPDOWN VARIAN (Solusi error unused-vars) */}
                  {Array.isArray(item.variants) && item.variants.length > 0 && (
                    <div className="mt-2 relative">
                      <select 
                        value={item.variant}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const variantObj = item.variants.find(v => (v.name || v) === selectedName);
                          const newPrice = variantObj?.price ? Number(variantObj.price) : Number(item.basePrice);
                          
                          // MEMANGGIL FUNGSI AGAR TIDAK ERROR DI VS CODE
                          updateCartItemDetails(index, { 
                            variant: selectedName,
                            price: newPrice 
                          });
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-gray-600 outline-none appearance-none pr-8"
                      >
                        {item.variants.map((v, i) => (
                          <option key={i} value={v.name || v}>{v.name || v}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {/* 4. SUBTOTAL & QUANTITY */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200/50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Sub: Rp {(item.price * item.quantity).toLocaleString()}
                    </span>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(index, -1)} 
                        className="p-1.5 hover:bg-orange-50 text-orange-500"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(index, 1)} 
                        disabled={isMaxStockReached}
                        className={`p-1.5 ${isMaxStockReached ? 'text-gray-200 bg-gray-50' : 'hover:bg-orange-50 text-orange-500'}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t bg-white">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Bayar</span>
          <span className="text-2xl font-black text-gray-800">
            Rp {total.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-orange-600 active:scale-95 transition-all disabled:bg-gray-200"
        >
          KONFIRMASI PESANAN
        </button>
      </div>
    </div>
  );
};

export default CartView;
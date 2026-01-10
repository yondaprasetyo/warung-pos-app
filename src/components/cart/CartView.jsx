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
      
      <div className="p-6 bg-orange-500 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
            title="Kembali ke Menu"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🛒 Keranjang <span className="bg-white text-orange-500 px-2 py-0.5 rounded-lg text-sm">{cart.length}</span>
          </h2>
        </div>
      </div>

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
            // Logika cek apakah stok sudah habis berdasarkan jumlah di keranjang
            const isMaxStockReached = item.stock !== -1 && item.quantity >= item.stock;

            return (
              <div key={`cart-item-${item.id}-${index}`} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{item.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">Rp {item.price.toLocaleString()}</p>
                    
                    {/* LABEL WARNING STOK HABIS */}
                    {item.stock !== -1 && (
                      <div className="mt-1 flex flex-col gap-1">
                        {isMaxStockReached ? (
                          <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-black animate-pulse flex items-center gap-1 w-fit">
                            <AlertCircle size={10} /> STOK TERAKHIR SUDAH DI KERANJANG
                          </span>
                        ) : (
                          <p className="text-[10px] text-gray-400">
                            Sisa stok tersedia: <span className="font-bold text-gray-600">{item.stock - item.quantity}</span> porsi lagi
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)} 
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* DROPDOWN VARIAN */}
                {Array.isArray(item.variants) && item.variants.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <Check size={10} className="text-green-500" /> Pilih Bagian
                    </div>
                    <div className="relative group">
                      <select 
                        value={item.variant}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const variantObj = item.variants.find(v => (v.name || v) === selectedName);
                          const newPrice = variantObj?.price ? Number(variantObj.price) : Number(item.basePrice);
                          
                          if (typeof updateCartItemDetails === 'function') {
                            updateCartItemDetails(index, { 
                              variant: selectedName,
                              price: newPrice 
                            });
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer pr-10 shadow-sm appearance-none"
                      >
                        {item.variants.map((v, i) => {
                          const vName = v.name || v;
                          return <option key={i} value={vName}>{vName}</option>;
                        })}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Sub: Rp {(item.price * item.quantity).toLocaleString()}
                  </span>
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => updateQuantity(index, -1)} 
                      className="p-2 hover:bg-orange-50 text-orange-500 transition"
                    >
                      <Minus size={14} />
                    </button>
                    
                    <span className="w-8 text-center font-bold text-sm text-gray-700">
                      {item.quantity}
                    </span>
                    
                    <button 
                      onClick={() => updateQuantity(index, 1)} 
                      disabled={isMaxStockReached}
                      className={`p-2 transition ${
                        isMaxStockReached 
                        ? 'text-gray-200 cursor-not-allowed bg-gray-50' 
                        : 'hover:bg-orange-50 text-orange-500'
                      }`}
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

      <div className="p-6 border-t bg-white">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Total Bayar</span>
          <span className="text-2xl font-black text-gray-800 tracking-tighter">
            Rp {total.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-600 active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-orange-100"
        >
          KONFIRMASI PESANAN
        </button>
      </div>
    </div>
  );
};

export default CartView;
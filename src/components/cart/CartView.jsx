import React from 'react';
import { Trash2, Plus, Minus, MessageSquare, ChevronDown, Check } from 'lucide-react';

const CartView = ({ cart, updateQuantity, removeFromCart, updateCartItemDetails, onCheckout }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-white rounded-3xl shadow-xl h-[calc(100vh-120px)] flex flex-col overflow-hidden border border-gray-100">
      <div className="p-6 bg-orange-500 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🛒 Keranjang Belanja <span className="bg-white text-orange-500 px-2 py-0.5 rounded-lg text-sm">{cart.length}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">😶‍🌫️</div>
            <p>Belum ada pesanan</p>
          </div>
        ) : (
          cart.map((item, index) => (
            // Menggunakan key yang lebih unik untuk menghindari bug UI
            <div key={`cart-item-${item.id}-${index}`} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{item.name}</h3>
                  <p className="text-orange-600 font-bold text-sm">Rp {item.price.toLocaleString()}</p>
                </div>
                {/* Tombol Hapus */}
                <button 
                  type="button"
                  onClick={() => removeFromCart(index)} 
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Dropdown Varian (Logika Array) */}
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
                        const selectedObj = item.variants.find(v => (v.name || v) === selectedName);
                        // Ambil harga dari objek varian, jika tidak ada pakai harga dasar
                        const newPrice = selectedObj?.price || item.basePrice || item.price;
                        
                        updateCartItemDetails(index, { 
                          variant: selectedName,
                          price: Number(newPrice) 
                        });
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer pr-10 shadow-sm"
                    >
                      {item.variants.map((v, i) => {
                        const vName = v.name || v;
                        return <option key={i} value={vName}>{vName}</option>;
                      })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-orange-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div className="mt-3 flex items-start gap-2 bg-white rounded-xl border border-gray-200 p-2 focus-within:border-orange-300">
                <MessageSquare size={14} className="text-gray-400 mt-1" />
                <input 
                  type="text"
                  placeholder="Tambah catatan..."
                  className="w-full text-xs outline-none bg-transparent text-gray-600 font-medium"
                  value={item.note || ''}
                  onChange={(e) => updateCartItemDetails(index, { note: e.target.value })}
                />
              </div>

              {/* Kontrol Quantity */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                  Sub: Rp {(item.price * item.quantity).toLocaleString()}
                </span>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Tombol Kurang (-) */}
                  <button 
                    type="button"
                    onClick={() => updateQuantity(index, -1)} 
                    className="p-2 hover:bg-orange-50 text-orange-500 transition active:bg-orange-100"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <span className="w-8 text-center font-bold text-sm text-gray-700 select-none">
                    {item.quantity}
                  </span>
                  
                  {/* Tombol Tambah (+) */}
                  <button 
                    type="button"
                    onClick={() => updateQuantity(index, 1)} 
                    className="p-2 hover:bg-orange-50 text-orange-500 transition active:bg-orange-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t bg-white">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Total Bayar</span>
          <span className="text-2xl font-black text-gray-800 tracking-tighter">Rp {total.toLocaleString()}</span>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
        >
          KONFIRMASI PESANAN
        </button>
      </div>
    </div>
  );
};

export default CartView;
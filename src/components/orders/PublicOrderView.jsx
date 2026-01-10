import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft, Trash2, StickyNote } from 'lucide-react';
import MenuView from '../menu/MenuView';
import { formatRupiah } from '../../utils/format';

const PublicOrderView = ({ onBack, addToCart, cart, removeFromCart, checkout }) => {
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!customerName.trim()) return alert("Mohon isi nama Anda");

    try {
      await checkout(customerName); 
      alert("Pesanan berhasil dibuat! Mohon tunggu konfirmasi.");
      window.location.reload(); 
    } catch (error) {
      console.error("Gagal checkout:", error);
      alert("Terjadi kesalahan saat memesan.");
    }
  };

  if (showCart) {
    return (
      <div className="max-w-md mx-auto p-4 bg-white min-h-screen">
        <button onClick={() => setShowCart(false)} className="flex items-center gap-2 mb-4 text-orange-600 font-bold">
          <ArrowLeft size={20} /> Kembali ke Menu
        </button>
        <h2 className="text-2xl font-black mb-6 uppercase italic">Pesanan Anda</h2>
        
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Keranjang kosong</div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-black text-gray-800 uppercase italic">{item.name}</div>
                    <div className="text-sm font-bold text-orange-600">
                      {item.quantity} x {formatRupiah(item.price)}
                    </div>
                    
                    {/* MENAMPILKAN VARIAN */}
                    {item.variant && (
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-1">
                        Varian: {item.variant}
                      </p>
                    )}

                    {/* MENAMPILKAN CATATAN (DARI MODAL) */}
                    {item.notes && (
                      <div className="mt-2 flex items-start gap-1 bg-orange-50 p-2 rounded-lg border border-orange-100">
                        <StickyNote size={12} className="text-orange-500 mt-0.5" />
                        <p className="text-[11px] font-bold text-orange-700 italic leading-tight">
                          "{item.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)} 
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t-2 border-dashed border-gray-100 font-black text-xl flex justify-between text-gray-800 italic">
              <span>TOTAL</span>
              <span className="text-orange-600">{formatRupiah(total)}</span>
            </div>
            
            <div className="mt-8 bg-gray-50 p-4 rounded-2xl">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nama Pemesan / No. Meja</label>
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold outline-none focus:border-orange-500 transition-all"
                placeholder="Contoh: Budi - Meja 5"
              />
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-lg mt-6 shadow-lg shadow-orange-100 active:scale-95 transition-all uppercase italic"
            >
              Kirim Pesanan Sekarang
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center border-b border-gray-100">
        <h1 className="text-xl font-black uppercase italic tracking-tighter text-orange-600">🍔 Warung Online</h1>
        <button onClick={onBack} className="text-[10px] font-black text-gray-400 border-2 border-gray-100 px-3 py-1.5 rounded-xl uppercase hover:bg-gray-50">Staff Only</button>
      </div>
      
      <MenuView onAddToCart={addToCart} />

      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-[2rem] shadow-2xl shadow-orange-200 flex justify-between items-center font-black italic tracking-tighter"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm not-italic font-black">
                {cartCount}
              </div>
              <span className="uppercase">Lihat Keranjang</span>
            </div>
            <span className="text-lg">{formatRupiah(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicOrderView;
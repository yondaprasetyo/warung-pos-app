import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
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
    // 2. Tambahkan 'await' agar browser MENUNGGU sampai kirim data selesai
    await checkout(customerName); 
    
    alert("Pesanan berhasil dibuat! Mohon tunggu konfirmasi.");
    
    // 3. Baru refresh halaman setelah selesai
    window.location.reload(); 
  } catch (error) {
    console.error("Gagal checkout:", error);
    alert("Terjadi kesalahan saat memesan.");
  }
};

  if (showCart) {
    return (
      <div className="max-w-md mx-auto p-4 bg-white min-h-screen">
        <button onClick={() => setShowCart(false)} className="flex items-center gap-2 mb-4 text-gray-600">
          <ArrowLeft /> Kembali ke Menu
        </button>
        <h2 className="text-2xl font-bold mb-4">Keranjang Anda</h2>
        
        {cart.length === 0 ? <p>Keranjang kosong</p> : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.quantity} x {formatRupiah(item.price)}</div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm">Hapus</button>
              </div>
            ))}
            <div className="pt-4 font-bold text-xl flex justify-between">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-1">Nama Pemesan</label>
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Contoh: Budi (Meja 5)"
              />
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-green-700"
            >
              Pesan Sekarang
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">🍔 Pesan Online</h1>
        <button onClick={onBack} className="text-sm text-gray-500 border px-2 py-1 rounded">Login Staff</button>
      </div>
      
      {/* Gunakan komponen Menu yang sudah ada */}
      <MenuView onAddToCart={addToCart} />

      {/* Floating Button Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-600 text-white p-4 rounded-xl shadow-xl flex justify-between items-center font-bold"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart />
              <span>{cartCount} Item</span>
            </div>
            <span>{formatRupiah(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicOrderView;
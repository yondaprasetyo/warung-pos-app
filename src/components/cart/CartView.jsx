import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const CartView = ({ cart, onUpdateQty, onRemove, onCheckout }) => {
  const [customerName, setCustomerName] = useState('');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center py-20 text-gray-400">
        <ShoppingCart size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-xl">Keranjang masih kosong</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Keranjang Belanja</h2>
        <div className="space-y-4 mb-6">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-4xl">{item.image}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-orange-600 font-bold">{formatRupiah(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateQty(item.id, -1)} className="bg-gray-200 p-2 rounded hover:bg-gray-300"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.id, 1)} className="bg-gray-200 p-2 rounded hover:bg-gray-300"><Plus size={16} /></button>
              </div>
              <div className="text-right min-w-[100px] font-bold">
                {formatRupiah(item.price * item.quantity)}
              </div>
              <button onClick={() => onRemove(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mb-6 flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span className="text-orange-600">{formatRupiah(total)}</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Nama Pelanggan</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Masukkan nama pelanggan"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={() => onCheckout(customerName)}
          disabled={!customerName.trim()}
          className="w-full py-4 rounded-lg font-bold text-white text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proses Pembayaran
        </button>
      </div>
    </div>
  );
};
export default CartView;
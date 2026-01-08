import React from 'react';
import { Receipt, CheckCircle, Clock } from 'lucide-react'; // Tambah icon baru
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop'; // Import hooks untuk aksi update

const OrderHistory = ({ orders }) => {
  const { markOrderDone } = useShop(); // Ambil fungsi update

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Receipt size={64} className="mx-auto mb-4 opacity-50" />
        <p>Belum ada riwayat pesanan</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Daftar Pesanan</h2>
      <div className="space-y-4">
        {[...orders].map(order => (
          <div 
            key={order.id} 
            className={`border rounded-lg p-5 shadow-sm transition ${
              order.status === 'Baru' 
                ? 'bg-yellow-50 border-yellow-300 shadow-yellow-100 ring-1 ring-yellow-200' 
                : 'bg-white'
            }`}
          >
            {/* Header Card */}
            <div className="flex justify-between items-start mb-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                  {/* Badge Online */}
                  {order.type === 'Online' && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold border border-blue-200">
                      ONLINE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} /> {order.date}
                </p>
                <p className="text-sm text-gray-600">Kasir: {order.cashier}</p>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                  order.status === 'Baru' 
                    ? 'bg-yellow-400 text-yellow-900 animate-pulse' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.status === 'Baru' ? '⏳ Menunggu' : '✅ Selesai'}
                </span>

                {/* Tombol Aksi Admin (Hanya muncul jika status Baru) */}
                {order.status === 'Baru' && (
                  <button 
                    onClick={() => markOrderDone(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition"
                  >
                    <CheckCircle size={14} /> Selesaikan
                  </button>
                )}
              </div>
            </div>
            
            {/* List Barang */}
            <div className="space-y-1 mb-3 bg-white/50 p-2 rounded">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name} <span className="text-gray-500">x{item.quantity}</span></span>
                  <span className="font-mono">{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-700">Total Transaksi:</span>
              <span className="text-orange-600 font-bold text-xl">{formatRupiah(order.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default OrderHistory;
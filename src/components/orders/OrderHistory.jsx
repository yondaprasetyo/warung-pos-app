import React from 'react';
import { Receipt, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';

const OrderHistory = ({ orders }) => {
  const { markOrderDone } = useShop();

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
            className={`border rounded-xl p-5 shadow-sm transition ${
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
                  {order.userId === 'public' && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200 uppercase">
                      Pelanggan
                    </span>
                  )}
                </div>
                {/* PERBAIKAN: Menampilkan Tanggal & Jam dari Firebase */}
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> 
                  {order.createdAt?.toLocaleString ? order.createdAt.toLocaleString('id-ID', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Memproses waktu...'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  order.status === 'Baru' 
                    ? 'bg-yellow-400 text-yellow-900 animate-pulse' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.status === 'Baru' ? '⏳ Menunggu' : '✅ Selesai'}
                </span>

                {order.status === 'Baru' && (
                  <button 
                    onClick={() => markOrderDone && markOrderDone(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition"
                  >
                    <CheckCircle size={14} /> Selesaikan
                  </button>
                )}
              </div>
            </div>
            
            {/* List Barang */}
            <div className="space-y-2 mb-3 bg-gray-50/50 p-3 rounded-lg">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-100 last:border-0 pb-1 mb-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                    <span className="font-mono text-gray-600">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  {item.variant && <span className="text-[10px] text-orange-500 font-bold uppercase italic">Varian: {item.variant}</span>}
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total</span>
              <span className="text-orange-600 font-black text-xl">{formatRupiah(order.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
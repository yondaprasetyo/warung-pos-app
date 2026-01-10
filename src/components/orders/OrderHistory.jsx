import React from 'react';
import { Receipt, CheckCircle, Clock, StickyNote } from 'lucide-react'; // Tambah StickyNote
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
      <h2 className="text-2xl font-black mb-6 text-gray-800 uppercase italic">Daftar Pesanan</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`border-2 rounded-[2rem] p-6 shadow-sm transition-all duration-300 ${
              order.status === 'Baru' 
                ? 'bg-yellow-50 border-yellow-200 ring-4 ring-yellow-50' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-xl uppercase tracking-tighter text-gray-800 italic">{order.customerName}</h3>
                  {order.userId === 'public' && (
                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-lg font-black tracking-widest uppercase shadow-sm shadow-blue-200">
                      PELANGGAN
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                  <Clock size={12} className="text-gray-300" /> 
                  {order.createdAt?.toLocaleString('id-ID', {
                    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'Baru' 
                    ? 'bg-yellow-400 text-yellow-900 animate-pulse' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.status === 'Baru' ? '⏳ Menunggu' : '✅ Selesai'}
                </span>

                {order.status === 'Baru' && (
                  <button 
                    onClick={() => markOrderDone(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-black uppercase tracking-tighter px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
                  >
                    <CheckCircle size={14} /> Selesaikan
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3 mb-4 bg-white/50 p-4 rounded-2xl border border-gray-50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-100 last:border-0 pb-3 mb-3 last:pb-0 last:mb-0">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-black text-gray-700 uppercase italic">
                      {item.name} <span className="text-orange-500 ml-1">x{item.quantity}</span>
                    </span>
                    <span className="font-black text-gray-800">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  
                  {/* TAMPILAN VARIAN */}
                  {item.variant && (
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      Bagian: {item.variant}
                    </span>
                  )}

                  {/* TAMPILAN CATATAN (DARI MODAL) */}
                  {item.notes && (
                    <div className="mt-2 flex items-start gap-2 bg-orange-50 p-2 rounded-xl border border-orange-100 w-fit">
                      <StickyNote size={12} className="text-orange-500 mt-0.5" />
                      <p className="text-[11px] font-black text-orange-700 italic tracking-tight">
                        "{item.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Total Bayar</span>
              <span className="text-orange-600 font-black text-2xl italic tracking-tighter">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
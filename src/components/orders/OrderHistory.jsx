import React, { useMemo } from 'react';
import { Receipt, CheckCircle, Clock, StickyNote, ChefHat, Flame } from 'lucide-react';
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';

const OrderHistory = ({ orders }) => {
  const { markOrderDone } = useShop();

  // --- LOGIKA RINGKASAN DAPUR (AGGREGATOR) ---
  const kitchenSummary = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'Baru');
    const summary = {};

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        // Buat kunci unik berdasarkan Nama + Varian
        const variantText = item.variant && item.variant.toUpperCase() !== "TANPA VARIAN" 
          ? ` (${item.variant})` 
          : '';
        const key = `${item.name}${variantText}`;

        if (!summary[key]) {
          summary[key] = {
            quantity: 0,
            notes: new Set() // Menggunakan Set agar catatan tidak duplikat
          };
        }

        summary[key].quantity += item.quantity;
        if (item.notes) {
          summary[key].notes.add(item.notes);
        }
      });
    });

    return Object.entries(summary);
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Receipt size={64} className="mx-auto mb-4 opacity-50" />
        <p>Belum ada riwayat pesanan</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20">
      <h2 className="text-2xl font-black mb-6 text-gray-800 italic uppercase tracking-tighter flex items-center gap-2">
        <Receipt className="text-orange-500" size={28} />
        Manajemen Pesanan
      </h2>

      {/* --- PANEL RINGKASAN DAPUR (HANYA MUNCUL JIKA ADA PESANAN BARU) --- */}
      {kitchenSummary.length > 0 && (
        <div className="mb-10 bg-gray-900 rounded-[2rem] p-6 shadow-2xl border-4 border-orange-500/20">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="bg-orange-500 p-2 rounded-xl">
              <ChefHat className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter leading-none text-lg">Antrean Produksi</h3>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">Total yang harus disiapkan saat ini</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenSummary.map(([name, data], idx) => (
              <div key={idx} className="bg-gray-800/40 border border-gray-700 p-4 rounded-2xl flex flex-col justify-between hover:border-orange-500/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-100 font-bold text-sm uppercase leading-tight italic">{name}</span>
                  <span className="bg-orange-600 text-white font-black px-3 py-1 rounded-lg text-lg flex items-center gap-1 shadow-lg">
                    <Flame size={14} className="animate-pulse" /> {data.quantity}
                  </span>
                </div>
                
                {data.notes.size > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">Catatan:</p>
                    {Array.from(data.notes).map((note, nIdx) => (
                      <div key={nIdx} className="text-[10px] text-orange-300 font-bold italic leading-tight mb-1 flex items-start gap-1">
                        <span className="text-orange-500">•</span> "{note}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DAFTAR PESANAN DETAIL --- */}
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 italic">Riwayat Transaksi Terakhir</h3>
      <div className="space-y-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 ${
              order.status === 'Baru' 
                ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100' 
                : 'bg-white border-gray-100 opacity-80'
            }`}
          >
            <div className="flex justify-between items-start mb-4 border-b border-dashed border-gray-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter italic">{order.customerName}</h3>
                  {order.userId === 'public' && (
                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black border border-blue-700 uppercase tracking-tighter">
                      ORDER ONLINE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                  <Clock size={12} className="text-gray-400" /> 
                  {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'Baru' 
                    ? 'bg-orange-500 text-white animate-pulse' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.status === 'Baru' ? '⏳ Proses' : '✅ Selesai'}
                </span>

                {order.status === 'Baru' && (
                  <button 
                    onClick={() => markOrderDone(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-90"
                  >
                    <CheckCircle size={14} /> Selesaikan
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-xl border border-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-50 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-black text-gray-700 uppercase italic">
                      {item.name} <span className="text-orange-500 not-italic">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-gray-600">{formatRupiah(item.price * item.quantity)}</span>
                  </div>

                  {item.variant && item.variant.toUpperCase() !== "TANPA VARIAN" && (
                    <span className="text-[10px] text-orange-500 font-black italic uppercase">
                      Varian: {item.variant}
                    </span>
                  )}

                  {item.notes && (
                    <div className="mt-1.5 flex items-start gap-1.5 bg-orange-50 px-2 py-1.5 rounded-lg border border-orange-100 w-fit">
                      <StickyNote size={10} className="text-orange-600 mt-0.5" />
                      <p className="text-[10px] font-bold text-orange-800 italic">
                        "{item.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Transaksi</span>
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
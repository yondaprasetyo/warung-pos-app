import React, { useMemo } from 'react';
import { Receipt, CheckCircle, Clock, StickyNote, ChefHat, Flame, CalendarDays, X, Check, Trash2 } from 'lucide-react'; // <--- Import Trash2
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';

const OrderHistory = ({ orders }) => {
  // Ambil fungsi removeOrder dari hook
  const { updateOrderStatus, removeOrder } = useShop();

  // --- LOGIKA RINGKASAN DAPUR ---
  const kitchenSummary = useMemo(() => {
    const activeOrders = orders.filter(o => {
        const s = (o.status || 'pending').toLowerCase();
        return s === 'pending' || s === 'processing' || s === 'baru' || s === 'proses';
    });

    const summary = {};

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const currentVariant = item.selectedVariant?.name || item.variant;
        const variantText = currentVariant && currentVariant.toUpperCase() !== "TANPA VARIAN" 
          ? ` (${currentVariant})` 
          : '';
          
        const key = `${item.name}${variantText}`;

        if (!summary[key]) {
          summary[key] = { quantity: 0, notes: new Set() };
        }

        summary[key].quantity += item.quantity;
        
        const itemNote = item.notes || item.note;
        if (itemNote) {
          summary[key].notes.add(itemNote);
        }
      });
    });

    return Object.entries(summary);
  }, [orders]);

  // Urutkan Pesanan: Pending -> Processing -> Completed -> Cancelled, lalu Waktu Descending
  const sortedOrders = [...orders].sort((a, b) => {
      const statusScore = (status) => {
          const s = (status || 'pending').toLowerCase();
          if (s === 'pending' || s === 'baru') return 1;
          if (s === 'processing' || s === 'proses') return 2;
          if (s === 'completed' || s === 'selesai') return 3;
          return 4; // Cancelled
      };
      
      const scoreA = statusScore(a.status);
      const scoreB = statusScore(b.status);
      
      if (scoreA !== scoreB) return scoreA - scoreB;
      return b.createdAt - a.createdAt;
  });

  // --- FUNGSI KLIK HAPUS ---
  const handleConfirmDelete = (orderId, customerName) => {
      if (window.confirm(`⚠️ PERINGATAN:\n\nApakah Anda yakin ingin menghapus permanen pesanan atas nama "${customerName}"?\nData yang dihapus tidak bisa dikembalikan.`)) {
          removeOrder(orderId);
      }
  };

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

      {/* --- PANEL RINGKASAN DAPUR --- */}
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
        {sortedOrders.map(order => {
          const status = (order.status || 'pending').toLowerCase();
          const isPending = status === 'pending' || status === 'baru';
          const isProcessing = status === 'processing' || status === 'proses';
          const isCompleted = status === 'completed' || status === 'selesai';

          return (
            <div 
              key={order.id} 
              className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 ${
                isPending 
                  ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100' 
                  : isProcessing
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                  : 'bg-white border-gray-100 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-dashed border-gray-200 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter italic">{order.customerName}</h3>
                    {order.userId === 'public' && (
                      <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black border border-blue-700 uppercase tracking-tighter">
                        ONLINE
                      </span>
                    )}
                  </div>

                  {order.note && (
                      <div className="mb-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                        <CalendarDays size={12} />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            {order.note}
                        </p>
                      </div>
                  )}

                  <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                    <Clock size={12} className="text-gray-400" /> 
                    {new Date(order.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                    {/* LABEL STATUS */}
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        isPending ? 'bg-yellow-500 text-white animate-pulse' :
                        isProcessing ? 'bg-blue-500 text-white' :
                        isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {isPending ? '⏳ Menunggu Konfirmasi' : 
                         isProcessing ? '🍳 Sedang Dimasak' : 
                         isCompleted ? '✅ Selesai' : '❌ Batal'}
                    </span>

                    {/* TOMBOL AKSI ADMIN */}
                    <div className="flex gap-2 w-full sm:w-auto mt-2 justify-end">
                        {isPending && (
                            <>
                                <button 
                                    onClick={() => updateOrderStatus(order.id, 'processing')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex justify-center items-center gap-1 shadow-md transition-all active:scale-95"
                                >
                                    <ChefHat size={14} /> TERIMA
                                </button>
                                <button 
                                    onClick={() => { if(window.confirm('Tolak pesanan ini?')) updateOrderStatus(order.id, 'cancelled') }}
                                    className="bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-black px-3 py-2 rounded-xl flex justify-center items-center gap-1 transition-all active:scale-95"
                                >
                                    <X size={14} /> TOLAK
                                </button>
                            </>
                        )}

                        {isProcessing && (
                            <button 
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex justify-center items-center gap-2 shadow-md transition-all active:scale-95"
                            >
                                <Check size={14} /> SELESAI
                            </button>
                        )}

                        {/* TOMBOL HAPUS PERMANEN (SELALU MUNCUL) */}
                        <button 
                            onClick={() => handleConfirmDelete(order.id, order.customerName)} 
                            className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-400 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                            title="Hapus Permanen Data Ini"
                        >
                            <Trash2 size={16} /> <span className="hidden sm:inline">HAPUS</span>
                        </button>
                    </div>
                </div>
              </div>
              
              {/* Detail Items */}
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-xl border border-gray-100">
                {order.items.map((item, idx) => {
                   const displayVariant = item.selectedVariant?.name || item.variant;
                   const displayNote = item.notes || item.note;

                   return (
                    <div key={idx} className="flex flex-col border-b border-gray-50 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-black text-gray-700 uppercase italic">
                          {item.name} <span className="text-orange-500 not-italic">x{item.quantity}</span>
                        </span>
                        <span className="font-bold text-gray-600">{formatRupiah(item.price * item.quantity)}</span>
                      </div>

                      {displayVariant && displayVariant.toUpperCase() !== "TANPA VARIAN" && (
                        <span className="text-[10px] text-orange-500 font-black italic uppercase">
                          Varian: {displayVariant}
                        </span>
                      )}

                      {displayNote && (
                        <div className="mt-1.5 flex items-start gap-1.5 bg-orange-50 px-2 py-1.5 rounded-lg border border-orange-100 w-fit">
                          <StickyNote size={10} className="text-orange-600 mt-0.5" />
                          <p className="text-[10px] font-bold text-orange-800 italic">
                            "{displayNote}"
                          </p>
                        </div>
                      )}
                    </div>
                   );
                })}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Transaksi</span>
                <span className="text-orange-600 font-black text-2xl italic tracking-tighter">
                  {formatRupiah(order.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
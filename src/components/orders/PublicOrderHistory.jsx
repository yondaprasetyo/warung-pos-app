import React, { useMemo } from 'react';
import { 
  Receipt, Clock, ChefHat, CalendarDays, CheckCircle2
} from 'lucide-react'; 
import { maskName } from '../../utils/format';

const PublicOrderHistory = ({ orders }) => {
  // --- LOGIKA FILTER: HARI INI & MASA DEPAN ---
  const displayOrders = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayISO = new Date(today.getTime() - offset).toISOString().split('T')[0];

    return [...orders]
      .filter(o => {
        const status = (o.status || 'pending').toLowerCase();
        const orderTargetDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');

        // Syarat Tampil: Hari ini atau masa depan, dan belum selesai/batal
        const isTodayOrFuture = orderTargetDate >= todayISO;
        const isNotCancelled = status !== 'cancelled' && status !== 'batal';
        const isNotDone = status !== 'completed' && status !== 'selesai';

        return isTodayOrFuture && isNotCancelled && isNotDone;
      })
      .sort((a, b) => {
        const dateA = a.orderDate || a.createdAt;
        const dateB = b.orderDate || b.createdAt;
        return new Date(dateA) - new Date(dateB);
      });
  }, [orders]);

  if (displayOrders.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100 mx-4">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt size={40} className="opacity-20" />
        </div>
        <p className="font-black uppercase italic tracking-widest text-sm">Tidak ada antrean saat ini</p>
        <p className="text-[10px] mt-1 font-bold">Belum ada pesanan masuk untuk jadwal mendatang</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-8 border-b-2 border-orange-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-200">
            <ChefHat className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tighter">
              Antrean Pesanan
            </h2>
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
              Jadwal Hari Ini & Mendatang
            </p>
          </div>
        </div>
        <div className="text-right">
           <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Antrean</span>
           <span className="text-3xl font-black text-gray-800 italic leading-none">{displayOrders.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        {displayOrders.map((order) => {
          const status = (order.status || 'pending').toLowerCase();
          const isPending = status === 'pending' || status === 'baru';
          const isProcessing = status === 'processing' || status === 'proses';
          
          // Logika Progress dari Checklist Admin
          const checkedMap = order.checkedItems || {};
          const totalItems = order.items?.length || 0;
          const readyItemsCount = Object.values(checkedMap).filter(val => val === true).length;
          const progressPercentage = totalItems > 0 ? (readyItemsCount / totalItems) * 100 : 0;

          const orderDateRaw = order.orderDate || order.createdAt;
          const formattedOrderDate = new Date(orderDateRaw).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short'
          });

          return (
            <div 
              key={order.id} 
              className={`relative overflow-hidden border-2 rounded-[2.5rem] p-6 transition-all duration-500 shadow-sm 
                ${isPending ? 'bg-white border-yellow-200 ring-4 ring-yellow-50/50' : 
                  isProcessing ? 'bg-white border-orange-500 ring-4 ring-orange-100/50' : 
                  'bg-gray-50 border-gray-100 opacity-75'}`}
            >
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 px-6 py-1 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest text-white shadow-md z-10
                ${isPending ? 'bg-yellow-500' : isProcessing ? 'bg-orange-500' : 'bg-green-500'}`}>
                {isPending ? '⏳ Menunggu' : isProcessing ? '🍳 Sedang Dimasak' : '✅ Siap'}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-black text-gray-800 text-2xl uppercase tracking-tighter italic mb-1 leading-none">
                    {maskName(order.customerName)}
                  </h3>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      <CalendarDays size={12} /> {formattedOrderDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Hanya muncul jika sedang diproses) */}
                {isProcessing && (
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-orange-600 uppercase italic">Progres Masak</span>
                      <span className="text-[10px] font-black text-orange-600">{readyItemsCount} / {totalItems} Menu</span>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-orange-200">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-700 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50/50 rounded-[1.8rem] p-5 border border-gray-100 space-y-3">
                  {order.items.map((item, idx) => {
                    const isItemReady = checkedMap[idx] === true;
                    return (
                      <div key={idx} className="flex items-start gap-3 border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0 transition-all">
                        <div className={`flex items-center justify-center rounded-lg px-2 py-0.5 min-w-[32px] ${isItemReady ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                          <span className="text-[11px] font-black">
                            {isItemReady ? <CheckCircle2 size={12} /> : `${item.quantity}x`}
                          </span>
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className={`font-black uppercase italic text-sm ${isItemReady ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {item.selectedVariant?.name && item.selectedVariant.name.toUpperCase() !== "TANPA VARIAN" && (
                            <span className={`text-[9px] font-bold uppercase italic ${isItemReady ? 'text-gray-300' : 'text-orange-500'}`}>
                              {item.selectedVariant.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicOrderHistory;

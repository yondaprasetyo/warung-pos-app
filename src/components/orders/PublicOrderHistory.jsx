import React, { useMemo } from 'react';
import { 
  Receipt, Clock, ChefHat, CalendarDays
} from 'lucide-react'; 

const PublicOrderHistory = ({ orders }) => {
  // --- LOGIKA FILTER: HARI INI & MASA DEPAN ---
  const displayOrders = useMemo(() => {
    // Ambil string tanggal hari ini (YYYY-MM-DD) untuk perbandingan
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayISO = new Date(today.getTime() - offset).toISOString().split('T')[0];

    return [...orders]
      .filter(o => {
        const status = (o.status || 'pending').toLowerCase();
        
        // 1. Ambil tanggal target pesanan (orderDate) atau createdAt sebagai fallback
        const orderTargetDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');

        // 2. Syarat Tampil:
        // - Tanggal harus HARI INI atau LEBIH BESAR dari hari ini (Masa Depan)
        // - Status bukan dibatalkan
        const isTodayOrFuture = orderTargetDate >= todayISO;
        const isNotCancelled = status !== 'cancelled' && status !== 'batal';

        return isTodayOrFuture && isNotCancelled;
      })
      // Urutkan berdasarkan tanggal jadwal terdekat
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
           <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Pesanan</span>
           <span className="text-3xl font-black text-gray-800 italic leading-none">{displayOrders.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        {displayOrders.map((order) => {
          const status = (order.status || 'pending').toLowerCase();
          const isPending = status === 'pending' || status === 'baru';
          const isProcessing = status === 'processing' || status === 'proses';
          
          // Ambil tanggal untuk tampilan
          const orderDateRaw = order.orderDate || order.createdAt;
          const formattedOrderDate = new Date(orderDateRaw).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short'
          });

          return (
            <div 
              key={order.id} 
              className={`relative overflow-hidden border-2 rounded-[2.5rem] p-6 transition-all duration-500 shadow-sm 
                ${isPending ? 'bg-white border-yellow-200 ring-4 ring-yellow-50/50' : 
                  isProcessing ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-100/50 animate-pulse' : 
                  'bg-gray-50 border-gray-100 opacity-75'}`}
            >
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 px-6 py-1 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest text-white shadow-md
                ${isPending ? 'bg-yellow-500' : isProcessing ? 'bg-orange-500' : 'bg-green-500'}`}>
                {isPending ? '⏳ Menunggu' : isProcessing ? '🍳 Sedang Dimasak' : '✅ Siap Diambil'}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-black text-gray-800 text-2xl uppercase tracking-tighter italic mb-1 leading-none">
                    {order.customerName}
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

                <div className="bg-white/60 rounded-[1.8rem] p-5 border border-white/50 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                      <span className="bg-orange-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg h-fit">
                        {item.quantity}x
                      </span>
                      <div className="flex flex-col leading-tight">
                        <span className="font-black text-gray-700 uppercase italic text-sm">
                          {item.name}
                        </span>
                        {item.selectedVariant?.name && item.selectedVariant.name.toUpperCase() !== "TANPA VARIAN" && (
                          <span className="text-[9px] text-orange-500 font-bold uppercase italic">
                            {item.selectedVariant.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
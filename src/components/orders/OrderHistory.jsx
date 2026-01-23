import React, { useState, useMemo } from 'react';
import { 
  Receipt, CheckCircle, Clock, StickyNote, ChefHat, Flame, 
  CalendarDays, X, Check, Trash2, Wallet, MessageCircle, AlertCircle, Filter
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';

// --- HELPER UNTUK FORMAT TANGGAL ---
const formatDateKey = (dateString) => {
  if (!dateString) return 'invalid';
  const d = new Date(dateString);
  // Format YYYY-MM-DD untuk key grouping
  return d.toISOString().split('T')[0];
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  // Format Bahasa Indonesia: Senin, 23 Oktober 2025
  return d.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const OrderHistory = ({ orders }) => {
  const { updateOrderStatus, removeOrder, togglePaymentStatus } = useShop();
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all' atau 'YYYY-MM-DD'

  // --- 1. LOGIKA RINGKASAN DAPUR (TETAP SAMA) ---
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

  // --- 2. PERSIAPAN DATA FILTER & GROUPING ---

  // A. Urutkan semua pesanan terlebih dahulu (Terbaru ke Terlama)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Descending by time
    });
  }, [orders]);

  // B. Ambil daftar tanggal unik yang tersedia di history untuk opsi Filter
  const availableDates = useMemo(() => {
    const dates = new Set(orders.map(o => formatDateKey(o.createdAt)));
    // Ubah ke array dan urutkan descending (hari ini paling kiri)
    return Array.from(dates).sort().reverse();
  }, [orders]);

  // C. Kelompokkan Pesanan Berdasarkan Tanggal (Setelah Filter)
  const groupedOrders = useMemo(() => {
    // 1. Filter dulu
    const filtered = sortedOrders.filter(order => {
      if (selectedDateFilter === 'all') return true;
      return formatDateKey(order.createdAt) === selectedDateFilter;
    });

    // 2. Grouping
    const groups = {};
    filtered.forEach(order => {
      const dateKey = formatDateKey(order.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });

    return groups;
  }, [sortedOrders, selectedDateFilter]);


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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tighter flex items-center gap-2">
          <Receipt className="text-orange-500" size={28} />
          Manajemen Pesanan
        </h2>
      </div>

      {/* --- FILTER BAR (NEW) --- */}
      <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-gray-400 mr-2 sticky left-0 bg-orange-50/30 backdrop-blur-sm p-1 rounded-lg">
                <Filter size={18} />
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Filter Tgl:</span>
            </div>
            
            {/* Tombol SEMUA */}
            <button
                onClick={() => setSelectedDateFilter('all')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    selectedDateFilter === 'all'
                    ? 'bg-gray-800 text-white shadow-lg scale-105'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                }`}
            >
                Semua Riwayat
            </button>

            {/* Tombol TANGGAL */}
            {availableDates.map(dateKey => {
                const isToday = dateKey === formatDateKey(new Date().toISOString());
                const label = isToday ? 'Hari Ini' : formatDateDisplay(dateKey); // Gunakan helper display

                return (
                    <button
                        key={dateKey}
                        onClick={() => setSelectedDateFilter(dateKey)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            selectedDateFilter === dateKey
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
      </div>

      {/* --- PANEL RINGKASAN DAPUR (Hanya muncul jika tidak difilter ke tanggal lama, opsional) --- */}
      {/* Kita tampilkan selalu agar Admin tau apa yang harus dimasak SEKARANG, terlepas dari filter history */}
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

      {/* --- DAFTAR PESANAN (GROUPED BY DATE) --- */}
      
      {Object.keys(groupedOrders).length === 0 ? (
           <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-300">
               <p className="text-gray-400 font-bold italic">Tidak ada transaksi pada tanggal ini.</p>
           </div>
      ) : (
          Object.keys(groupedOrders).map((dateKey) => (
            <div key={dateKey} className="mb-10">
                {/* DIVIDER TANGGAL */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <div className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-orange-200 shadow-sm flex items-center gap-2">
                        <CalendarDays size={14} />
                        {formatDateDisplay(dateKey)}
                        <span className="bg-white text-orange-600 px-1.5 rounded-md ml-1 text-[10px] border border-orange-100">
                            {groupedOrders[dateKey].length} Order
                        </span>
                    </div>
                    <div className="h-px bg-gray-300 flex-1"></div>
                </div>

                {/* LIST KARTU PER TANGGAL */}
                <div className="space-y-4">
                    {groupedOrders[dateKey].map(order => {
                        const status = (order.status || 'pending').toLowerCase();
                        const isPending = status === 'pending' || status === 'baru';
                        const isProcessing = status === 'processing' || status === 'proses';
                        const isCompleted = status === 'completed' || status === 'selesai';
                        
                        const isPaid = order.isPaid === true;
                        const isWaitingVerification = order.paymentStatus === 'verification_via_wa' && !isPaid;

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
                                        <StickyNote size={12} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">
                                            {order.note}
                                        </p>
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                                    <Clock size={12} className="text-gray-400" /> 
                                    {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
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

                                        {/* TOMBOL HAPUS */}
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

                            {/* FOOTER: STATUS BAYAR & TOTAL */}
                            <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                
                                {/* --- TOMBOL STATUS BAYAR ADMIN --- */}
                                <button 
                                onClick={() => togglePaymentStatus(order.id, isPaid)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all w-full sm:w-auto justify-center ${
                                    isPaid 
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                    : isWaitingVerification
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 animate-pulse'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:border-orange-200 hover:text-orange-500'
                                }`}
                                title="Klik untuk ubah status pembayaran"
                                >
                                {isPaid ? (
                                    <>
                                    <CheckCircle size={18} className="fill-green-600 text-white" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Status Pembayaran</span>
                                        <span className="text-sm font-black italic">SUDAH LUNAS</span>
                                    </div>
                                    </>
                                ) : isWaitingVerification ? (
                                    <>
                                    <MessageCircle size={18} className="text-blue-600" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <AlertCircle size={10} /> Konfirmasi WA
                                        </span>
                                        <span className="text-sm font-black italic">VERIFIKASI BAYAR?</span>
                                    </div>
                                    </>
                                ) : (
                                    <>
                                    <Wallet size={18} />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Status Pembayaran</span>
                                        <span className="text-sm font-black italic">BELUM BAYAR</span>
                                    </div>
                                    </>
                                )}
                                </button>

                                {/* TOTAL */}
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Transaksi</span>
                                    <span className={`font-black text-2xl italic tracking-tighter ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatRupiah(order.total)}
                                    </span>
                                </div>
                            </div>

                            </div>
                        );
                    })}
                </div>
            </div>
          ))
      )}
    </div>
  );
};

export default OrderHistory;
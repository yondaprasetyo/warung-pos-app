import React, { useState, useMemo } from 'react';
import { 
  Receipt, CheckCircle, Clock, StickyNote, ChefHat, Flame, 
  CalendarDays, X, Check, Trash2, Wallet, MessageCircle, Filter, Calendar
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';

// --- HELPER BARU: AMBIL TANGGAL TARGET (JADWAL) ---
// Prioritaskan 'orderDate' (Target Hari H), jika tidak ada (data lama) pakai 'createdAt'
const getTargetDate = (order) => {
  return order.orderDate || order.createdAt;
};

// --- HELPER FORMAT TANGGAL ---
const formatDateKey = (dateString) => {
  if (!dateString) return 'invalid';
  
  // Jika format sudah YYYY-MM-DD (dari orderDate), kembalikan langsung
  if (dateString.length === 10 && dateString.includes('-')) {
      return dateString;
  }

  // Jika format ISO Long / Timestamp (dari createdAt)
  const d = new Date(dateString);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  // Format: Senin, 23 Oktober 2025
  return d.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const OrderHistory = ({ orders }) => {
  const { updateOrderStatus, removeOrder, togglePaymentStatus } = useShop();
  
  // State filter: 'all' atau 'YYYY-MM-DD'
  const [filterDate, setFilterDate] = useState('all'); 
  const todayKey = formatDateKey(new Date().toISOString());

  // --- 1. RINGKASAN DAPUR (YANG HARUS DIMASAK) ---
  const kitchenSummary = useMemo(() => {
    // Ambil order yang statusnya aktif
    const activeOrders = orders.filter(o => {
        const s = (o.status || 'pending').toLowerCase();
        // Cek Status (harus aktif)
        const isActiveStatus = s === 'pending' || s === 'processing' || s === 'baru' || s === 'proses';
        
        // Cek Tanggal (Jika sedang filter tanggal, hanya hitung masakan untuk tanggal tsb)
        if (filterDate !== 'all') {
            const orderTargetDate = formatDateKey(getTargetDate(o));
            return isActiveStatus && orderTargetDate === filterDate;
        }

        return isActiveStatus;
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
        if (itemNote) summary[key].notes.add(itemNote);
      });
    });

    return Object.entries(summary);
  }, [orders, filterDate]); // Update jika filter tanggal berubah

  // --- 2. DATA PROCESSING ---

  // A. Urutkan Pesanan (Berdasarkan Target Date, bukan CreatedAt)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(getTargetDate(a));
      const dateB = new Date(getTargetDate(b));
      // Urutkan: Jadwal paling jauh/masa depan di atas
      return dateB - dateA; 
    });
  }, [orders]);

  // B. Grouping Logic (Filter & Grouping berdasarkan Target Date)
  const groupedOrders = useMemo(() => {
    // 1. Filter
    const filtered = sortedOrders.filter(order => {
      if (filterDate === 'all') return true;
      // Bandingkan tanggal jadwal (orderDate)
      return formatDateKey(getTargetDate(order)) === filterDate;
    });

    // 2. Grouping
    const groups = {};
    filtered.forEach(order => {
      const dateKey = formatDateKey(getTargetDate(order));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });

    return groups;
  }, [sortedOrders, filterDate]);

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

      {/* --- FILTER BAR --- */}
      <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <div className="flex items-center gap-2 text-gray-400 mr-2 shrink-0">
                    <Filter size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Filter Jadwal:</span>
                </div>
                
                <button
                    onClick={() => setFilterDate('all')}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        filterDate === 'all'
                        ? 'bg-gray-800 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    Semua
                </button>

                <button
                    onClick={() => setFilterDate(todayKey)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        filterDate === todayKey
                        ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'
                    }`}
                >
                    Hari Ini
                </button>
            </div>

            <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors w-full ${
                    filterDate !== 'all' && filterDate !== todayKey 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                    <Calendar size={18} className={filterDate !== 'all' && filterDate !== todayKey ? "text-orange-600" : "text-gray-400"} />
                    <input 
                        type="date" 
                        value={filterDate === 'all' ? '' : filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent outline-none text-sm font-bold text-gray-700 uppercase tracking-wide w-full sm:w-auto cursor-pointer"
                    />
                </div>
                {filterDate !== 'all' && filterDate !== todayKey && (
                     <span className="absolute -top-2.5 right-3 bg-white px-2 py-0.5 rounded text-[9px] font-black text-orange-500 uppercase tracking-widest border border-orange-100 shadow-sm">
                        Custom Date
                     </span>
                )}
            </div>
        </div>
      </div>

      {/* --- PANEL RINGKASAN DAPUR --- */}
      {kitchenSummary.length > 0 && (
        <div className="mb-10 bg-gray-900 rounded-[2rem] p-6 shadow-2xl border-4 border-orange-500/20">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="bg-orange-500 p-2 rounded-xl">
              <ChefHat className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter leading-none text-lg">Antrean Produksi</h3>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">
                 {filterDate === 'all' ? 'Total Seluruh Jadwal' : `Persiapan Masak: ${formatDateDisplay(filterDate)}`}
              </p>
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

      {/* --- LIST PESANAN --- */}
      {Object.keys(groupedOrders).length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
               <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <CalendarDays size={32} className="text-gray-300" />
               </div>
               <p className="text-gray-500 font-bold text-lg">Tidak ada jadwal pesanan</p>
               <p className="text-gray-400 text-sm">Untuk tanggal yang dipilih</p>
           </div>
      ) : (
          Object.keys(groupedOrders).map((dateKey) => (
            <div key={dateKey} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* DIVIDER TANGGAL (Sticky) */}
                <div className="flex items-center gap-4 mb-6 sticky top-[80px] z-10 py-2 bg-orange-50/95 backdrop-blur-sm shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:shadow-none sm:static">
                    <div className="h-px bg-gray-300 flex-1 hidden sm:block"></div>
                    <div className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-orange-200 shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                        <CalendarDays size={14} />
                        {formatDateDisplay(dateKey)}
                        <span className="bg-white text-orange-600 px-1.5 rounded-md ml-1 text-[10px] border border-orange-100 min-w-[20px] text-center">
                            {groupedOrders[dateKey].length}
                        </span>
                    </div>
                    <div className="h-px bg-gray-300 flex-1 hidden sm:block"></div>
                </div>

                <div className="space-y-4">
                    {groupedOrders[dateKey].map(order => {
                        const status = (order.status || 'pending').toLowerCase();
                        const isPending = status === 'pending' || status === 'baru';
                        const isProcessing = status === 'processing' || status === 'proses';
                        const isCompleted = status === 'completed' || status === 'selesai';
                        const isPaid = order.isPaid === true;
                        const isWaitingVerification = order.paymentStatus === 'verification_via_wa' && !isPaid;

                        return (
                            <div key={order.id} className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md ${isPending ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100' : isProcessing ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-100 opacity-90'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-dashed border-gray-200 pb-4">
                                <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter italic">{order.customerName}</h3>
                                    {order.userId === 'public' && <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black border border-blue-700 uppercase tracking-tighter">ONLINE</span>}
                                </div>
                                
                                {order.note && (
                                    <div className="mb-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                                        <StickyNote size={12} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{order.note}</p>
                                    </div>
                                )}

                                {/* --- TAMPILAN TANGGAL YANG LEBIH JELAS --- */}
                                <div className="flex flex-col gap-1 mt-1">
                                     {/* 1. TANGGAL JADWAL (TARGET) */}
                                     {order.orderDate ? (
                                         <p className="text-[10px] text-orange-600 font-black flex items-center gap-1 uppercase tracking-widest bg-orange-50 w-fit px-2 py-0.5 rounded">
                                            <CalendarDays size={12} /> 
                                            Jadwal: {formatDateDisplay(order.orderDate)}
                                         </p>
                                     ) : (
                                         // Fallback untuk data lama
                                         <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                            <CalendarDays size={12} /> 
                                            Jadwal: Sesuai Tgl Pesan
                                         </p>
                                     )}

                                     {/* 2. TANGGAL INPUT (CREATED) */}
                                     <p className="text-[9px] text-gray-400 font-medium flex items-center gap-1 uppercase tracking-widest pl-1">
                                        <Clock size={10} /> 
                                        Dipesan: {new Date(order.createdAt).toLocaleString('id-ID')}
                                     </p>
                                </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPending ? 'bg-yellow-500 text-white animate-pulse' : isProcessing ? 'bg-blue-500 text-white' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {isPending ? '⏳ Menunggu' : isProcessing ? '🍳 Dimasak' : isCompleted ? '✅ Selesai' : '❌ Batal'}
                                    </span>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 justify-end">
                                        {isPending && (
                                            <>
                                                <button onClick={() => updateOrderStatus(order.id, 'processing')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95"><ChefHat size={14} /> TERIMA</button>
                                                <button onClick={() => { if(window.confirm('Tolak?')) updateOrderStatus(order.id, 'cancelled') }} className="bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-black px-3 py-2 rounded-xl active:scale-95"><X size={14} /> TOLAK</button>
                                            </>
                                        )}
                                        {isProcessing && <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95"><Check size={14} /> SELESAI</button>}
                                        <button onClick={() => handleConfirmDelete(order.id, order.customerName)} className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-400 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"><Trash2 size={16} /> <span className="hidden sm:inline">HAPUS</span></button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-xl border border-gray-100">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col border-b border-gray-50 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-black text-gray-700 uppercase italic">{item.name} <span className="text-orange-500 not-italic">x{item.quantity}</span></span>
                                            <span className="font-bold text-gray-600">{formatRupiah(item.price * item.quantity)}</span>
                                        </div>
                                        {item.selectedVariant?.name && item.selectedVariant.name.toUpperCase() !== "TANPA VARIAN" && <span className="text-[10px] text-orange-500 font-black italic uppercase">Varian: {item.selectedVariant.name}</span>}
                                        {(item.notes || item.note) && <div className="mt-1 bg-orange-50 px-2 py-1 rounded w-fit"><p className="text-[10px] font-bold text-orange-800 italic">"{item.notes || item.note}"</p></div>}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <button onClick={() => togglePaymentStatus(order.id, isPaid)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all w-full sm:w-auto justify-center ${isPaid ? 'bg-green-50 border-green-200 text-green-700' : isWaitingVerification ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    {isPaid ? <><CheckCircle size={18} className="fill-green-600 text-white" /><div className="text-left"><span className="text-[10px] font-black uppercase block">Status</span><span className="text-sm font-black italic">LUNAS</span></div></> 
                                    : isWaitingVerification ? <><MessageCircle size={18} /><div className="text-left"><span className="text-[10px] font-black uppercase block">Cek WA</span><span className="text-sm font-black italic">VERIFIKASI?</span></div></>
                                    : <><Wallet size={18} /><div className="text-left"><span className="text-[10px] font-black uppercase block">Status</span><span className="text-sm font-black italic">BELUM BAYAR</span></div></>}
                                </button>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total</span>
                                    <span className={`font-black text-2xl italic tracking-tighter ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>{formatRupiah(order.total)}</span>
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
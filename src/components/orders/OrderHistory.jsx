import React, { useState, useMemo } from 'react';
import { 
  Receipt, CheckCircle, Clock, StickyNote, ChefHat, Flame, 
  CalendarDays, X, Check, Trash2, Wallet, MessageCircle, Filter, Calendar
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import { useShop } from '../../hooks/useShop';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// --- HELPER BARU: AMBIL TANGGAL TARGET (JADWAL) ---
const getTargetDate = (order) => {
  return order.orderDate || order.createdAt;
};

// --- HELPER FORMAT TANGGAL ---
const formatDateKey = (dateString) => {
  if (!dateString) return 'invalid';
  if (dateString.length === 10 && dateString.includes('-')) {
      return dateString;
  }
  const d = new Date(dateString);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const OrderHistory = ({ orders }) => {
  const { updateOrderStatus, removeOrder, togglePaymentStatus } = useShop();
  const [filterDate, setFilterDate] = useState('all'); 
  const todayKey = formatDateKey(new Date().toISOString());

  // --- FUNGSI BARU: TOGGLE CHECKLIST PER ITEM (SYNC KE FIREBASE) ---
  const toggleItemCheck = async (orderId, itemIdx, currentCheckedMap = {}) => {
    try {
      const newCheckedMap = { ...currentCheckedMap };
      if (newCheckedMap[itemIdx]) {
        delete newCheckedMap[itemIdx]; // Hapus jika sudah ada (uncheck)
      } else {
        newCheckedMap[itemIdx] = true; // Tambah jika belum ada (check)
      }
      
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { checkedItems: newCheckedMap });
    } catch (error) {
      console.error("Gagal update progres item:", error);
    }
  };

  // --- 1. RINGKASAN DAPUR ---
  const kitchenSummary = useMemo(() => {
    const activeOrders = orders.filter(o => {
        const s = (o.status || 'pending').toLowerCase();
        const isActiveStatus = ['pending', 'processing', 'baru', 'proses'].includes(s);
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
  }, [orders, filterDate]);

  // --- 2. DATA PROCESSING ---
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(getTargetDate(a));
      const dateB = new Date(getTargetDate(b));
      return dateB - dateA; 
    });
  }, [orders]);

  const groupedOrders = useMemo(() => {
    const filtered = sortedOrders.filter(order => {
      if (filterDate === 'all') return true;
      return formatDateKey(getTargetDate(order)) === filterDate;
    });

    const groups = {};
    filtered.forEach(order => {
      const dateKey = formatDateKey(getTargetDate(order));
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    });
    return groups;
  }, [sortedOrders, filterDate]);

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
                <button onClick={() => setFilterDate('all')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterDate === 'all' ? 'bg-gray-800 text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Semua</button>
                <button onClick={() => setFilterDate(todayKey)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterDate === todayKey ? 'bg-orange-500 text-white shadow-lg transform scale-105' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'}`}>Hari Ini</button>
            </div>
            <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors w-full ${filterDate !== 'all' && filterDate !== todayKey ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <Calendar size={18} className={filterDate !== 'all' && filterDate !== todayKey ? "text-orange-600" : "text-gray-400"} />
                    <input type="date" value={filterDate === 'all' ? '' : filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-gray-700 uppercase tracking-wide w-full sm:w-auto cursor-pointer" />
                </div>
            </div>
        </div>
      </div>

      {/* --- PANEL RINGKASAN DAPUR --- */}
      {kitchenSummary.length > 0 && (
        <div className="mb-10 bg-gray-900 rounded-[2rem] p-6 shadow-2xl border-4 border-orange-500/20">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="bg-orange-500 p-2 rounded-xl"><ChefHat className="text-white" size={20} /></div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter leading-none text-lg">Antrean Produksi</h3>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">{filterDate === 'all' ? 'Total Seluruh Jadwal' : `Persiapan Masak: ${formatDateDisplay(filterDate)}`}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenSummary.map(([name, data], idx) => (
              <div key={idx} className="bg-gray-800/40 border border-gray-700 p-4 rounded-2xl flex flex-col justify-between hover:border-orange-500/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-100 font-bold text-sm uppercase leading-tight italic">{name}</span>
                  <span className="bg-orange-600 text-white font-black px-3 py-1 rounded-lg text-lg flex items-center gap-1 shadow-lg"><Flame size={14} className="animate-pulse" /> {data.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- LIST PESANAN --- */}
      {Object.keys(groupedOrders).map((dateKey) => (
        <div key={dateKey} className="mb-10">
            <div className="flex items-center gap-4 mb-6 sticky top-[80px] z-10 py-2 bg-orange-50/95 backdrop-blur-sm shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="h-px bg-gray-300 flex-1 hidden sm:block"></div>
                <div className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-orange-200 shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                    <CalendarDays size={14} /> {formatDateDisplay(dateKey)}
                    <span className="bg-white text-orange-600 px-1.5 rounded-md ml-1 text-[10px] border border-orange-100 min-w-[20px] text-center">{groupedOrders[dateKey].length}</span>
                </div>
                <div className="h-px bg-gray-300 flex-1 hidden sm:block"></div>
            </div>

            <div className="space-y-4">
                {groupedOrders[dateKey].map(order => {
                    const status = (order.status || 'pending').toLowerCase();
                    const isPending = status === 'pending';
                    const isProcessing = ['processing', 'proses'].includes(status);
                    const isPaid = order.isPaid === true;
                    
                    // Logika Progres Checklist
                    const checkedMap = order.checkedItems || {};
                    const itemsReadyCount = Object.keys(checkedMap).length;
                    const isAllItemsReady = itemsReadyCount === order.items.length;

                    return (
                        <div key={order.id} className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isPending ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100' : isProcessing ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-100 opacity-90'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-dashed border-gray-200 pb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter italic">{order.customerName}</h3>
                                        {order.userId === 'public' && <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black border border-blue-700 uppercase tracking-tighter">ONLINE</span>}
                                    </div>
                                    <p className="text-[10px] text-orange-600 font-black flex items-center gap-1 uppercase tracking-widest bg-orange-50 w-fit px-2 py-0.5 rounded">
                                        <CalendarDays size={12} /> Jadwal: {formatDateDisplay(order.orderDate || order.createdAt)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPending ? 'bg-yellow-500 text-white animate-pulse' : isProcessing ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700'}`}>
                                        {isPending ? '⏳ Menunggu' : isProcessing ? '🍳 Dimasak' : '✅ Selesai'}
                                    </span>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 justify-end">
                                        {isPending && <button onClick={() => updateOrderStatus(order.id, 'processing')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95"><ChefHat size={14} /> TERIMA</button>}
                                        {isProcessing && (
                                            <button 
                                              onClick={() => {
                                                  if (!isAllItemsReady && !window.confirm("Beberapa item belum siap (dicentang). Tetap selesaikan pesanan?")) return;
                                                  updateOrderStatus(order.id, 'completed');
                                              }} 
                                              className={`w-full ${isAllItemsReady ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'} text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95`}
                                            >
                                              <Check size={14} /> SELESAI
                                            </button>
                                        )}
                                        <button onClick={() => handleConfirmDelete(order.id, order.customerName)} className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-400 px-3 py-2 rounded-xl font-bold text-xs"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* --- LIST ITEM DENGAN CHECKBOX --- */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Persiapan Item ({itemsReadyCount}/{order.items.length})</span>
                                    {isAllItemsReady && isProcessing && <span className="text-[9px] font-black text-green-600 uppercase bg-green-100 px-2 py-0.5 rounded">Semua Siap!</span>}
                                </div>
                                <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    {order.items.map((item, idx) => {
                                        const isChecked = checkedMap[idx] === true;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => toggleItemCheck(order.id, idx, checkedMap)}
                                                className={`flex items-start gap-3 p-2.5 rounded-lg transition-all cursor-pointer border ${isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-white hover:border-gray-200'}`}
                                            >
                                                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                                    {isChecked && <Check size={14} className="text-white stroke-[4px]" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className={`font-black uppercase italic transition-all ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                            {item.name} <span className="text-orange-500 not-italic">x{item.quantity}</span>
                                                        </span>
                                                        <span className={`font-bold ${isChecked ? 'text-gray-300' : 'text-gray-600'}`}>{formatRupiah(item.price * item.quantity)}</span>
                                                    </div>
                                                    {item.selectedVariant?.name && item.selectedVariant.name.toUpperCase() !== "TANPA VARIAN" && <p className={`text-[10px] font-black italic uppercase ${isChecked ? 'text-gray-300' : 'text-orange-400'}`}>Varian: {item.selectedVariant.name}</p>}
                                                    {(item.notes || item.note) && <p className={`text-[10px] font-bold italic mt-1 ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}>"{item.notes || item.note}"</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <button onClick={() => togglePaymentStatus(order.id, isPaid)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all w-full sm:w-auto justify-center ${isPaid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    {isPaid ? <><CheckCircle size={18} className="fill-green-600 text-white" /><span className="text-sm font-black italic">LUNAS</span></> : <><Wallet size={18} /><span className="text-sm font-black italic">BELUM BAYAR</span></>}
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
      ))}
    </div>
  );
};

export default OrderHistory;

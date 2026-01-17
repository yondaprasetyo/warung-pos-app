import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; // Tambah getDoc
import { Printer, ArrowLeft, StickyNote, Clock, ChefHat, CheckCircle, XCircle, RefreshCw } from 'lucide-react'; // Tambah RefreshCw
import { formatRupiah } from '../../utils/format';

const ReceiptView = ({ order, onBack }) => {
  const [liveOrder, setLiveOrder] = useState(order);
  const [isRefreshing, setIsRefreshing] = useState(false); // State untuk animasi loading tombol refresh

  // --- 1. LISTENER REAL-TIME (OTOMATIS) ---
  useEffect(() => {
    if (!order?.id) return;

    const unsubscribe = onSnapshot(doc(db, "orders", order.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLiveOrder({ 
            id: docSnapshot.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    });

    return () => unsubscribe();
  }, [order?.id]);

  // --- 2. FUNGSI REFRESH MANUAL (TOMBOL) ---
  const handleManualRefresh = async () => {
    if (!order?.id) return;
    
    setIsRefreshing(true); // Mulai animasi muter
    
    try {
      // Tarik data paksa dari database (sekalipun onSnapshot sudah jalan)
      const docRef = doc(db, "orders", order.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveOrder({ 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    } catch (error) {
      console.error("Gagal refresh:", error);
    } finally {
      // Beri jeda sedikit biar user sadar tombolnya bekerja
      setTimeout(() => setIsRefreshing(false), 800); 
    }
  };

  if (!liveOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatOrderDate = (dateObj) => {
    if (!dateObj) return '-';
    return dateObj.toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- HELPER STATUS UI ---
  const getStatusUI = (status) => {
    const s = (status || 'pending').toLowerCase();
    
    if (s === 'pending' || s === 'baru') {
        return { 
            style: 'bg-yellow-50 border-yellow-200 text-yellow-700', 
            icon: <Clock size={48} className="animate-pulse text-yellow-500" />, 
            title: 'MENUNGGU KONFIRMASI', 
            desc: 'Mohon tunggu, Admin sedang mengecek pesananmu...',
            canRefresh: true // Hanya muncul tombol refresh di status ini (opsional)
        };
    }
    if (s === 'processing' || s === 'proses') {
        return { 
            style: 'bg-blue-50 border-blue-200 text-blue-700', 
            icon: <ChefHat size={48} className="animate-bounce text-blue-500" />, 
            title: 'PESANAN DITERIMA', 
            desc: 'Hore! Makananmu sedang disiapkan di dapur.',
            canRefresh: true
        };
    }
    if (s === 'completed' || s === 'selesai') {
        return { 
            style: 'bg-green-50 border-green-200 text-green-700', 
            icon: <CheckCircle size={48} className="text-green-500" />, 
            title: 'PESANAN SELESAI', 
            desc: 'Pesanan sudah selesai/diantar. Terima kasih!',
            canRefresh: false
        };
    }
    if (s === 'cancelled' || s === 'batal') {
        return { 
            style: 'bg-red-50 border-red-200 text-red-700', 
            icon: <XCircle size={48} className="text-red-500" />, 
            title: 'PESANAN DIBATALKAN', 
            desc: 'Maaf, pesanan ini tidak dapat diproses.',
            canRefresh: false
        };
    }
    return { style: 'bg-gray-50', icon: null, title: s, desc: '', canRefresh: true };
  };

  const statusUI = getStatusUI(liveOrder.status);

  return (
    <div className="max-w-md mx-auto p-4 mt-6 mb-20 animate-in fade-in zoom-in duration-300">
      
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden"
      >
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

      {/* --- BANNER STATUS LIVE --- */}
      <div className={`print:hidden mb-6 p-8 rounded-[2rem] text-center border-4 border-double shadow-lg transition-all duration-500 flex flex-col items-center gap-3 ${statusUI.style}`}>
          <div>{statusUI.icon}</div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-1">{statusUI.title}</h2>
            <p className="text-xs font-bold opacity-80 mb-4">{statusUI.desc}</p>
            
            {/* --- TOMBOL REFRESH MANUAL --- */}
            {statusUI.canRefresh && (
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="mx-auto flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-sm border border-black/5 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                  {isRefreshing ? 'Mengecek...' : 'Refresh Status'}
                </button>
            )}
          </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-orange-500 print:border-0 print:shadow-none relative overflow-hidden receipt-card">
        
        {/* Header Toko */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none italic uppercase">Warung Makan<br/>Mamah Yonda</h2>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed font-bold uppercase italic">
            Jl. Cipulir 5 No. 17D, Jakarta Selatan<br/>
            WA: 087774223733
          </p>
        </div>

        {/* Info Pelanggan & Order */}
        <div className="border-y-2 border-dashed border-gray-100 py-6 mb-6 space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Pelanggan:</span>
                <span className="font-black text-gray-800 uppercase text-sm italic">{liveOrder.customerName}</span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Status:</span>
                <span className={`font-black uppercase text-[10px] italic px-2 py-0.5 rounded ${statusUI.style}`}>
                    {liveOrder.status || 'Pending'}
                </span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Waktu:</span>
                <span className="font-black text-gray-700 text-[10px] italic">
                    {formatOrderDate(liveOrder.createdAt)}
                </span>
            </div>
        </div>

        {/* Daftar Item */}
        <div className="space-y-6 mb-8">
            {liveOrder.items?.map((item, idx) => {
              const variantLabel = item.selectedVariant?.name || item.variant;
              const itemNote = item.notes || item.note;

              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-gray-800 uppercase tracking-tight italic">
                          {item.name} <span className="text-orange-600 ml-1">x{item.quantity}</span>
                      </span>
                      
                      {variantLabel && variantLabel !== 'Tanpa Varian' && (
                          <span className="text-[9px] font-black text-gray-400 italic uppercase tracking-tighter">
                             Varian: {variantLabel}
                          </span>
                      )}
                    </div>
                    <span className="text-sm font-black text-gray-800 italic">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  {itemNote && (
                      <div className="mt-2 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border-l-4 border-orange-500 print:bg-white print:border-gray-300">
                          <StickyNote size={12} className="text-orange-500 mt-0.5 print:text-black" />
                          <p className="text-[11px] text-gray-700 font-black italic leading-tight uppercase tracking-tight">
                                "{itemNote}"
                          </p>
                      </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Total Bayar */}
        <div className="border-t-2 border-double border-gray-100 pt-6 mb-8">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl print:bg-transparent print:p-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Total Akhir</span>
            <span className="text-2xl font-black text-orange-600 print:text-black italic tracking-tighter">
                {formatRupiah(liveOrder.total)}
            </span>
          </div>
        </div>

        {/* Footer Struk */}
        <div className="text-center space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Terima Kasih</p>
            <div className="flex justify-center gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-1 bg-gray-200 rounded-full"></div>)}
            </div>
        </div>

        {/* Tombol Cetak */}
        <div className="mt-10 print:hidden">
          <button 
            onClick={handlePrint} 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-[2rem] font-black transition-all flex justify-center items-center gap-3 shadow-xl shadow-orange-100 active:scale-95 italic uppercase tracking-wider"
          >
            <Printer size={20} /> Cetak Struk
          </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          @page { margin: 0; }
          body { margin: 0; padding: 0.5cm; background: white; }
          .print\\:hidden { display: none !important; }
          .receipt-card { 
            border: none !important; 
            box-shadow: none !important; 
            padding: 0 !important; 
            width: 100% !important; 
            max-width: none !important; 
          }
          .text-orange-600, .text-orange-500 { color: black !important; }
          .bg-orange-50, .bg-gray-50 { background-color: transparent !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
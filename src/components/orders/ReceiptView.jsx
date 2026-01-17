import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Printer, ArrowLeft, StickyNote, Clock, ChefHat, CheckCircle, XCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ReceiptView = ({ order, onBack }) => {
  // State untuk data order yang LIVE (real-time updates)
  const [liveOrder, setLiveOrder] = useState(order);

  // --- LISTENER LIVE UPDATE ---
  useEffect(() => {
    if (!order?.id) return;

    // Dengarkan perubahan pada dokumen order ini di Firestore
    const unsub = onSnapshot(doc(db, "orders", order.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLiveOrder({ 
            id: docSnapshot.id, 
            ...data,
            // Pastikan createdAt dikonversi dengan aman
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    });

    return () => unsub(); // Cleanup listener saat unmount
  }, [order?.id]);

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
  const getStatusInfo = (status) => {
    // Normalisasi status (handle 'Baru'/'Selesai' dari versi lama)
    const s = status?.toLowerCase() || 'pending';
    
    if (s === 'pending' || s === 'baru') {
        return { 
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
            icon: <Clock size={40} className="mb-2 animate-pulse" />, 
            title: 'MENUNGGU KONFIRMASI', 
            desc: 'Admin sedang mengecek pesananmu...' 
        };
    }
    if (s === 'processing' || s === 'proses') {
        return { 
            color: 'bg-blue-100 text-blue-700 border-blue-200', 
            icon: <ChefHat size={40} className="mb-2 animate-bounce" />, 
            title: 'PESANAN DITERIMA', 
            desc: 'Hore! Makananmu sedang dimasak.' 
        };
    }
    if (s === 'completed' || s === 'selesai') {
        return { 
            color: 'bg-green-100 text-green-700 border-green-200', 
            icon: <CheckCircle size={40} className="mb-2" />, 
            title: 'SELESAI', 
            desc: 'Pesanan sudah selesai/diantar.' 
        };
    }
    if (s === 'cancelled' || s === 'batal') {
        return { 
            color: 'bg-red-100 text-red-700 border-red-200', 
            icon: <XCircle size={40} className="mb-2" />, 
            title: 'DIBATALKAN', 
            desc: 'Maaf, pesanan ini tidak dapat diproses.' 
        };
    }
    return { color: 'bg-gray-100', icon: null, title: s, desc: '' };
  };

  const statusUI = getStatusInfo(liveOrder.status);

  return (
    <div className="max-w-md mx-auto p-4 mt-6 mb-20">
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden"
      >
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

      {/* --- LIVE STATUS BANNER (Hanya tampil di layar, tidak diprint) --- */}
      <div className={`print:hidden mb-6 p-6 rounded-3xl text-center border-2 shadow-lg transition-all duration-500 ${statusUI.color}`}>
          <div className="flex justify-center">{statusUI.icon}</div>
          <h2 className="text-xl font-black italic tracking-tighter leading-none mb-1">{statusUI.title}</h2>
          <p className="text-xs font-bold opacity-80">{statusUI.desc}</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-orange-500 print:border-0 print:shadow-none relative overflow-hidden receipt-card">
        
        {/* Header Toko */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none italic uppercase">Warung Makan<br/>Mamah Yonda</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-[1px] w-8 bg-gray-200"></span>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black italic">Struk Resmi</p>
            <span className="h-[1px] w-8 bg-gray-200"></span>
          </div>
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
                <span className="font-black text-gray-800 uppercase text-[10px] italic bg-gray-100 px-2 rounded">{liveOrder.status || 'Pending'}</span>
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
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-orange-600 uppercase italic print:text-black">Catatan Khusus:</span>
                            <p className="text-[11px] text-gray-700 font-black italic leading-tight uppercase tracking-tight">
                                "{itemNote}"
                            </p>
                          </div>
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
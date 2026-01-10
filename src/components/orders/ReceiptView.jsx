import React from 'react';
import { Printer, CheckCircle2, ArrowLeft, MessageSquare, StickyNote } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ReceiptView = ({ order, onBack }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatOrderDate = (createdAt) => {
    if (!createdAt) return new Date().toLocaleString('id-ID');
    
    // Handle Firestore Timestamp
    if (createdAt && typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return new Date().toLocaleString('id-ID');
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-6 mb-20">
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden"
      >
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

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
                <span className="font-black text-gray-800 uppercase text-sm italic">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Waktu:</span>
                <span className="font-black text-gray-700 text-[10px] italic">
                    {formatOrderDate(order.createdAt)}
                </span>
            </div>
        </div>

        {/* Daftar Item */}
        <div className="space-y-6 mb-8">
            {order.items?.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight italic">
                        {item.name} <span className="text-orange-600 ml-1">x{item.quantity}</span>
                    </span>
                    
                    {item.variant && (
                        <span className="text-[9px] font-black text-gray-400 italic uppercase tracking-tighter">
                           Varian: {item.variant}
                        </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-gray-800 italic">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>

                {/* CATATAN (NOTES) - Dioptimalkan untuk Print */}
                {item.notes && (
                    <div className="mt-2 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border-l-4 border-orange-500 print:bg-white print:border-gray-300">
                        <StickyNote size={12} className="text-orange-500 mt-0.5 print:text-black" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-orange-600 uppercase italic print:text-black">Catatan Khusus:</span>
                          <p className="text-[11px] text-gray-700 font-black italic leading-tight uppercase tracking-tight">
                              "{item.notes}"
                          </p>
                        </div>
                    </div>
                )}
              </div>
            ))}
        </div>

        {/* Total Bayar */}
        <div className="border-t-2 border-double border-gray-100 pt-6 mb-8">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl print:bg-transparent print:p-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Total Akhir</span>
            <span className="text-2xl font-black text-orange-600 print:text-black italic tracking-tighter">
                {formatRupiah(order.total)}
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
          /* Memastikan teks terlihat tajam saat diprint hitam putih */
          .text-orange-600, .text-orange-500 { color: black !important; }
          .bg-orange-50, .bg-gray-50 { background-color: transparent !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
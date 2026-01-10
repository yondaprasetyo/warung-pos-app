import React from 'react';
import { Printer, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';
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

    // Handle JS Date Object atau Timestamp
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
      {/* Tombol Kembali (Hanya muncul di layar, hilang saat print) */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden"
      >
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

      <div className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-orange-500 print:border-0 print:shadow-none relative overflow-hidden receipt-card">
        
        {/* Dekorasi Background */}
        <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] print:hidden">
          <CheckCircle2 size={150} />
        </div>

        {/* Header Toko */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">Warung Makan<br/>Mamah Yonda</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-[1px] w-8 bg-gray-200"></span>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Struk Resmi</p>
            <span className="h-[1px] w-8 bg-gray-200"></span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed italic">
            Jl. Cipulir 5 No. 17D, Cipulir, Kebayoran Lama, Jakarta Selatan<br/>
            WhatsApp: 087774223733
          </p>
        </div>

        {/* Info Pelanggan & Order */}
        <div className="border-y-2 border-dashed border-gray-100 py-6 mb-6 space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pelanggan</span>
                <span className="font-black text-gray-800 uppercase text-sm">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">ID Pesanan</span>
                <span className="font-mono font-bold text-xs text-gray-600">#{order.id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Waktu</span>
                <span className="font-bold text-gray-700 text-[11px]">
                    {formatOrderDate(order.createdAt)}
                </span>
            </div>
        </div>

        {/* Daftar Item */}
        <div className="space-y-5 mb-8">
            {order.items?.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                        {item.name} <span className="text-orange-500 ml-1">x{item.quantity}</span>
                    </span>
                    
                    {/* Varian */}
                    {item.variant && (
                        <span className="text-[9px] font-black text-orange-400 italic uppercase">
                           Varian: {item.variant}
                        </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>

                {/* CATATAN (NOTES) - Dibuat lebih mencolok */}
                {item.notes && (
                    <div className="mt-2 flex items-start gap-2 bg-gray-50 p-2 rounded-lg border-l-2 border-orange-200">
                        <MessageSquare size={10} className="text-orange-400 mt-0.5" />
                        <p className="text-[10px] text-gray-500 font-medium italic leading-tight">
                           "{item.notes}"
                        </p>
                    </div>
                )}
              </div>
            ))}
        </div>

        {/* Total Bayar */}
        <div className="border-t-2 border-double border-gray-100 pt-6 mb-8">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Akhir</span>
            <span className="text-2xl font-black text-orange-600 print:text-black">
                {formatRupiah(order.total)}
            </span>
          </div>
        </div>

        {/* Footer Struk */}
        <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Terima Kasih</p>
            <p className="text-[9px] text-gray-300 italic font-medium tracking-tight">
                Pesanan yang sudah dibeli tidak dapat ditukar/dikembalikan
            </p>
        </div>

        {/* Tombol Cetak (Hanya layar) */}
        <div className="mt-10 space-y-3 print:hidden relative z-20">
          <button 
            onClick={handlePrint} 
            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 shadow-xl active:scale-95"
          >
            <Printer size={20} /> CETAK STRUK SEKARANG
          </button>
        </div>
      </div>
      
      {/* CSS Khusus Cetak */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1cm; background: white; }
          .print\\:hidden { display: none !important; }
          .receipt-card { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
          body * { visibility: hidden; }
          .receipt-card, .receipt-card * { visibility: visible; }
          .receipt-card { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
import React from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const ReceiptView = ({ order, onBack }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatOrderDate = (createdAt) => {
    if (!createdAt) return new Date().toLocaleString('id-ID');

    // Jika dari Firestore Server Timestamp (memiliki fungsi toDate)
    if (createdAt && typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleString('id-ID');
    }

    // Jika sudah menjadi objek Date JS
    if (createdAt instanceof Date) {
        return createdAt.toLocaleString('id-ID');
    }

    // Jika dalam bentuk angka/string timestamp
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString('id-ID');
    }

    // Terakhir, jika semua gagal, tampilkan waktu saat ini saja
    return new Date().toLocaleString('id-ID');
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-8 border-orange-500 print:border-0 print:shadow-none relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-4 opacity-5 print:hidden">
          <CheckCircle2 size={100} />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Warung Makan Mamah Yonda</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-bold">Struk Pemesanan Sah</p>
          <p className="text-[10px] text-gray-400 italic">Jl. Cipulir 5 No. 17D, Cipulir, Kebayoran Lama, Jakarta Selatan</p>
          <p className="text-[9px] text-gray-400 italic">WhatsApp: 087774223733</p>
        </div>

        <div className="border-y-2 border-dashed border-gray-200 py-6 mb-6">
           <div className="space-y-3 text-xs">
            <div className="flex justify-between">
                <span className="text-gray-400">PELANGGAN</span>
                <span className="font-bold text-gray-700 uppercase">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">NO. ORDER</span>
                <span className="font-mono font-bold">#{order.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">WAKTU</span>
                <span className="font-bold text-gray-700">
                    {formatOrderDate(order.createdAt)}
                </span>
            </div>
           </div>

           <div className="my-6 border-t border-gray-100"></div>

           <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm font-bold text-gray-800">
                  <span>{item.name} <span className="text-gray-400 font-normal">x{item.quantity}</span></span>
                  <span>{formatRupiah(item.price * item.quantity)}</span>
                </div>
                {item.variant && (
                    <div className="text-[10px] text-orange-500 font-bold italic uppercase">
                        Varian: {item.variant}
                    </div>
                )}
                {item.note && (
                    <div className="text-[10px] text-gray-400 bg-gray-50 p-1 rounded">
                        Ket: {item.note}
                    </div>
                )}
              </div>
            ))}
           </div>

           <div className="my-6 border-t-2 border-double border-gray-200"></div>

           <div className="flex justify-between items-center">
            <span className="text-sm font-black text-gray-400 uppercase">Total Bayar</span>
            <span className="text-2xl font-black text-orange-600 print:text-black">{formatRupiah(order.total)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">*** Terima Kasih ***</p>
            <p className="text-[9px] text-gray-300 mt-1">Simpan struk ini sebagai bukti pemesanan</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 print:hidden relative z-10">
          <button 
            onClick={handlePrint} 
            className="w-full bg-gray-800 hover:bg-black text-white py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg active:scale-95"
          >
            <Printer size={20} /> CETAK STRUK
          </button>
          
          <button 
            onClick={onBack} 
            className="w-full bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 py-4 rounded-xl font-bold transition-all active:scale-95"
          >
            KEMBALI KE MENU
          </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-md, .max-w-md * { visibility: visible; }
          .max-w-md { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; shadow: none; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
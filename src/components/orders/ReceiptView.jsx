import React from 'react';
import { Printer } from 'lucide-react'; // Import Icon Printer
import { formatRupiah } from '../../utils/format';

const ReceiptView = ({ order, onBack }) => {
  if (!order) return null;

  // Fungsi cetak browser bawaan
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      {/* Tambahkan class 'print:shadow-none' agar bayangan hilang saat print */}
      <div className="bg-white rounded-xl shadow-2xl p-8 border-t-8 border-orange-500 print:border-0 print:shadow-none">
        
        {/* Konten Struk (Sama seperti sebelumnya) */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 print:hidden">✅</div> {/* Sembunyikan icon saat print */}
          <h2 className="text-2xl font-bold text-gray-800">Warung POS</h2>
          <p className="text-sm text-gray-500">Jl. Contoh No. 123, Jakarta</p>
        </div>

        <div className="border-y border-dashed py-4 mb-4 bg-gray-50 p-4 rounded print:bg-white">
           {/* ... (Isi detail pesanan biarkan sama) ... */}
           {/* Copy paste bagian detail pesanan dari kode sebelumnya di sini */}
           <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>No. Order:</span><span className="font-mono">#{order.id}</span></div>
            <div className="flex justify-between"><span>Tanggal:</span><span>{order.date}</span></div>
            <div className="flex justify-between"><span>Kasir:</span><span>{order.cashier}</span></div>
           </div>
           <div className="my-4 border-t border-gray-200"></div>
           <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
           </div>
           <div className="my-4 border-t border-gray-200"></div>
           <div className="flex justify-between items-center text-lg font-bold">
            <span>TOTAL</span>
            <span className="text-orange-600 print:text-black">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Tombol Aksi (Disembunyikan saat print menggunakan class 'print:hidden') */}
        <div className="space-y-3 print:hidden">
          <button 
            onClick={handlePrint} 
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2"
          >
            <Printer size={20} /> Cetak Struk
          </button>
          
          <button 
            onClick={onBack} 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
      
      {/* Tambahkan style print manual di JSX jika Tailwind config belum support 'print:' modifier secara default, 
          tapi biasanya Tailwind modern sudah support class `print:hidden`. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-md, .max-w-md * { visibility: visible; }
          .max-w-md { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};
export default ReceiptView;
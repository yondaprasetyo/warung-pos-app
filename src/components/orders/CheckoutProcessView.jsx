import React, { useState } from 'react';
import { Utensils, ShoppingBag, Wallet, QrCode, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const CheckoutProcessView = ({ customerName, total, onConfirm, onBack, isProcessing }) => {
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'takeaway'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qris'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Tombol Kembali */}
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 font-bold hover:text-orange-600 transition-colors">
          <ArrowLeft size={20} /> KEMBALI KE MENU
        </button>

        {/* Header Kartu */}
        <div className="bg-orange-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200">
          <p className="text-orange-100 font-bold text-xs uppercase tracking-widest mb-1">Total Pesanan {customerName}</p>
          <h1 className="text-4xl font-black italic">{formatRupiah(total)}</h1>
        </div>

        {/* Opsi Makan/Bawa Pulang */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-tighter ml-2 italic">Makan Dimana?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setOrderType('dine-in')}
              className={`p-6 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all active:scale-95 ${orderType === 'dine-in' ? 'bg-white border-orange-500 shadow-lg' : 'bg-gray-100 border-transparent text-gray-400'}`}
            >
              <Utensils size={32} className={orderType === 'dine-in' ? 'text-orange-500' : 'text-gray-300'} />
              <span className="font-black italic text-xs uppercase">Makan Disini</span>
            </button>
            <button 
              onClick={() => setOrderType('takeaway')}
              className={`p-6 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all active:scale-95 ${orderType === 'takeaway' ? 'bg-white border-orange-500 shadow-lg' : 'bg-gray-100 border-transparent text-gray-400'}`}
            >
              <ShoppingBag size={32} className={orderType === 'takeaway' ? 'text-orange-500' : 'text-gray-300'} />
              <span className="font-black italic text-xs uppercase">Bawa Pulang</span>
            </button>
          </div>
        </div>

        {/* Opsi Pembayaran */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-tighter ml-2 italic">Metode Pembayaran</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-5 rounded-3xl border-4 flex items-center justify-between transition-all active:scale-[0.98] ${paymentMethod === 'cash' ? 'bg-white border-green-500 shadow-lg' : 'bg-gray-100 border-transparent text-gray-400'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${paymentMethod === 'cash' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                  <Wallet size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-black uppercase italic leading-none ${paymentMethod === 'cash' ? 'text-gray-800' : 'text-gray-400'}`}>Tunai</p>
                  <p className="text-[10px] font-bold opacity-60">Bayar di Kasir</p>
                </div>
              </div>
              {paymentMethod === 'cash' && <CheckCircle2 className="text-green-500" />}
            </button>

            <button 
              onClick={() => setPaymentMethod('qris')}
              className={`w-full p-5 rounded-3xl border-4 flex items-center justify-between transition-all active:scale-[0.98] ${paymentMethod === 'qris' ? 'bg-white border-blue-500 shadow-lg' : 'bg-gray-100 border-transparent text-gray-400'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${paymentMethod === 'qris' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                  <QrCode size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-black uppercase italic leading-none ${paymentMethod === 'qris' ? 'text-gray-800' : 'text-gray-400'}`}>QRIS</p>
                  <p className="text-[10px] font-bold opacity-60">Scan Langsung</p>
                </div>
              </div>
              {paymentMethod === 'qris' && <CheckCircle2 className="text-blue-500" />}
            </button>
          </div>
        </div>

        {/* Tombol Final */}
        <button 
          disabled={isProcessing}
          onClick={() => onConfirm(orderType, paymentMethod)}
          className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xl italic shadow-2xl shadow-orange-300 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : (
            'KIRIM PESANAN SEKARANG'
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutProcessView;
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { 
  ArrowLeft, Clock, ChefHat, CheckCircle, XCircle, 
  Download, Loader2, QrCode, Maximize2, Utensils, ShoppingBag, Wallet, X
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import html2canvas from 'html2canvas';

const QRIS_IMAGE_URL = "/qris.jpg"; 

const PublicReceiptView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [liveOrder, setLiveOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isQrisFullscreen, setIsQrisFullscreen] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderId) return;
    const unsubscribe = onSnapshot(doc(db, "orders", orderId), (snapshot) => {
      if (snapshot.exists()) {
        setLiveOrder({ id: snapshot.id, ...snapshot.data() });
      }
    });
    return () => unsubscribe();
  }, [orderId]);

  const handleSaveImage = async () => {
    if (!receiptRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `Struk-${liveOrder.customerName}.png`;
      link.click();
    } finally { setIsSaving(false); }
  };

  if (!liveOrder) return <div className="min-h-screen flex items-center justify-center font-black text-orange-500 italic">MEMUAT STRUK...</div>;

  const isQRIS = liveOrder.note?.includes('QRIS');
  const isDineIn = liveOrder.note?.includes('DINE-IN');

  return (
    <div className="max-w-md mx-auto p-4 mb-24">
      {/* MODAL QRIS FULLSCREEN */}
      {isQrisFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4" onClick={() => setIsQrisFullscreen(false)}>
          <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <img src={QRIS_IMAGE_URL} className="max-w-xs w-full rounded-2xl bg-white p-2" alt="QRIS" />
          <p className="text-white mt-6 font-black text-3xl italic">{formatRupiah(liveOrder.total)}</p>
        </div>
      )}

      <button onClick={() => navigate('/self-service')} className="mb-6 flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest">
        <ArrowLeft size={16} /> Kembali ke Menu
      </button>

      {/* STRUK AREA */}
      <div ref={receiptRef} className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-t-[15px] border-orange-500 relative overflow-hidden ring-1 ring-black/5">
        <div className="text-center mb-10 mt-4">
          <h2 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter leading-[0.8]">Warung Makan<br/><span className="text-orange-500">Mamah Yonda</span></h2>
          <p className="text-[9px] text-gray-400 font-black uppercase italic tracking-[0.2em] mt-4">SELF SERVICE ORDER</p>
        </div>

        <div className="mb-8 p-4 bg-orange-50 rounded-2xl border-2 border-orange-200 flex items-center justify-center gap-3">
           {isDineIn ? <Utensils className="text-orange-600" size={20}/> : <ShoppingBag className="text-orange-600" size={20}/>}
           <span className="font-black italic text-orange-600 uppercase text-sm">
             {isDineIn ? "MAKAN DI SINI" : "DIBAWA PULANG"}
           </span>
        </div>

        <div className="space-y-4 mb-8">
          {liveOrder.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm font-black italic uppercase">
              <span>{item.name} x{item.quantity}</span>
              <span>{formatRupiah(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center bg-gray-50 px-6 py-5 rounded-[2rem] mb-8">
          <span className="text-xs font-black text-gray-400 uppercase italic">Total</span>
          <span className="text-3xl font-black text-orange-600 italic">{formatRupiah(liveOrder.total)}</span>
        </div>

        {/* INSTRUKSI PEMBAYARAN LANGSUNG */}
        {!liveOrder.isPaid && (
          <div className="mt-4">
            {isQRIS ? (
              <div className="flex flex-col items-center">
                <p className="text-blue-700 font-black italic mb-4 flex items-center gap-2"><QrCode size={18}/> SCAN UNTUK BAYAR</p>
                <img src={QRIS_IMAGE_URL} onClick={() => setIsQrisFullscreen(true)} className="w-56 h-56 p-2 bg-white rounded-2xl shadow-md border cursor-pointer" alt="QRIS" />
                <p className="mt-4 text-[10px] font-black text-blue-400 uppercase italic">Tunjukkan bukti ke kasir</p>
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-[2.5rem] border-4 border-green-200 text-center">
                <p className="text-green-700 font-black italic text-xl uppercase flex items-center justify-center gap-2"><Wallet size={24}/> BAYAR DI KASIR</p>
                <p className="text-green-500 text-[10px] font-bold uppercase mt-1 italic">Nama: {liveOrder.customerName}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={handleSaveImage} disabled={isSaving} className="w-full mt-8 bg-gray-900 text-white py-5 rounded-[2rem] font-black flex justify-center items-center gap-3 italic uppercase tracking-widest shadow-xl">
        {isSaving ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Simpan Struk</>}
      </button>
    </div>
  );
};

export default PublicReceiptView;
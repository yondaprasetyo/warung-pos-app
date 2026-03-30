import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { 
  ArrowLeft, Download, Loader2, QrCode, Utensils, ShoppingBag, Wallet, X, Camera
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
      // Jeda untuk memastikan rendering stabil
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const canvas = await html2canvas(receiptRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        width: 380, // Mengunci lebar thermal standar
        useCORS: true 
      });
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `STRUK-${liveOrder.customerName.toUpperCase()}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal simpan, silakan gunakan screenshot.");
    } finally { 
      setIsSaving(false); 
    }
  };

  if (!liveOrder) return <div className="min-h-screen flex items-center justify-center font-black text-orange-500 italic uppercase">MEMUAT STRUK...</div>;

  const isQRIS = liveOrder.note?.includes('QRIS');
  const isDineIn = liveOrder.note?.includes('DINE-IN');

  return (
    <div className="max-w-md mx-auto p-4 mb-24 font-sans">
      {/* MODAL QRIS FULLSCREEN */}
      {isQrisFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4" onClick={() => setIsQrisFullscreen(false)}>
          <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <img src={QRIS_IMAGE_URL} className="max-w-xs w-full rounded-2xl bg-white p-2" alt="QRIS" />
          <p className="text-white mt-6 font-black text-3xl italic tracking-tighter">{formatRupiah(liveOrder.total)}</p>
        </div>
      )}

      <button onClick={() => navigate('/self-service')} className="mb-6 flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-orange-500 transition-colors">
        <ArrowLeft size={16} /> Kembali ke Menu
      </button>

      {/* --- STRUK AREA (HIDDEN FROM OVERFLOW BUT CAPTURABLE) --- */}
      <div className="overflow-hidden rounded-[2.5rem] shadow-2xl border border-gray-100">
        <div 
          ref={receiptRef} 
          className="bg-white p-8 text-black"
          style={{ 
            width: '380px', 
            margin: '0 auto', 
            fontFamily: '"Courier New", Courier, monospace', // Font Thermal
            backgroundColor: 'white'
          }}
        >
          {/* Header Thermal */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h2 className="text-xl font-bold uppercase tracking-tighter">WARUNG MAKAN</h2>
            <h2 className="text-2xl font-black uppercase">MAMAH YONDA</h2>
            <p className="text-[10px] mt-1 italic tracking-widest uppercase">Self Service Order</p>
          </div>

          {/* Info Transaksi */}
          <div className="text-[11px] mb-4 space-y-1 uppercase font-bold">
            <div className="flex justify-between">
              <span>TGL: {new Date().toLocaleDateString('id-ID')}</span>
              <span>JAM: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>ID : #{orderId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>PEL: {liveOrder.customerName}</span>
            </div>
            <div className="mt-2 py-1 bg-black text-white text-center rounded-sm">
              {isDineIn ? "--- MAKAN DI SINI ---" : "--- DIBAWA PULANG ---"}
            </div>
            <div className="border-b border-dashed border-black my-2"></div>
          </div>

          {/* List Items */}
          <div className="text-[12px] mb-6 space-y-3 font-bold uppercase">
            {liveOrder.items?.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start">
                  <span className="max-w-[70%]">{item.name} x{item.quantity}</span>
                  <span>{formatRupiah(item.price * item.quantity)}</span>
                </div>
                {item.selectedVariant && <div className="text-[9px] italic">- {item.selectedVariant.name}</div>}
              </div>
            ))}
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-black pt-4 mb-8">
            <div className="flex justify-between text-xl font-black uppercase tracking-tighter">
              <span>Total</span>
              <span>{formatRupiah(liveOrder.total)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold mt-1">
              <span>Status</span>
              <span>{liveOrder.isPaid ? '*** LUNAS ***' : 'BELUM BAYAR'}</span>
            </div>
          </div>

          {/* QRIS / Kasir Instruction (Hanya tampil di struk jika belum bayar) */}
          {!liveOrder.isPaid && (
            <div className="flex flex-col items-center border-t border-dashed border-black pt-6 text-center">
              {isQRIS ? (
                <>
                  <p className="text-[10px] font-bold mb-3 uppercase tracking-widest underline">Scan untuk Bayar</p>
                  <img src={QRIS_IMAGE_URL} className="w-40 h-40 border p-1" alt="QRIS" />
                  <p className="text-[8px] mt-4 font-bold italic uppercase">Silakan screenshot & tunjukkan bukti bayar ke kasir</p>
                </>
              ) : (
                <div className="border-2 border-black p-4 w-full">
                  <p className="text-sm font-black uppercase tracking-widest italic">Bayar di Kasir</p>
                  <p className="text-[9px] mt-1 font-bold">Informasikan nama: {liveOrder.customerName}</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-10 border-t border-black pt-4">
            <p className="text-[10px] font-bold tracking-[0.2em]">TERIMA KASIH</p>
            <p className="text-[8px] mt-1 opacity-50 italic">#{orderId.substring(0,12).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="space-y-3 mt-8">
        <button 
          onClick={handleSaveImage} 
          disabled={isSaving} 
          className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black flex justify-center items-center gap-3 italic uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Simpan Struk</>}
        </button>

        {!liveOrder.isPaid && isQRIS && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
             <Camera className="text-blue-600" size={24}/>
             <p className="text-[10px] font-black text-blue-700 uppercase leading-tight">
               Klik "Simpan Struk" lalu scan kode di atas atau klik gambar untuk memperbesar.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicReceiptView;
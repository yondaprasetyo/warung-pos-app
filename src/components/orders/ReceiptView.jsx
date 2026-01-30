import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'; 
import { 
  ArrowLeft, Clock, ChefHat, CheckCircle, XCircle, 
  RefreshCw, Download, Loader2, QrCode, MessageCircle, X, Share2, Copy, Check,
  Maximize2 // <--- TAMBAHKAN INI
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import html2canvas from 'html2canvas';

const QRIS_IMAGE_URL = "/qris.jpg"; 
const ADMIN_PHONE_NUMBER = "6287774223733"; 

const ReceiptView = ({ order, onBack }) => {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  
  // ID prioritas dari URL (untuk sharing) baru kemudian dari props
  const targetOrderId = urlOrderId || order?.id;

  const [liveOrder, setLiveOrder] = useState(order || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isQrisFullscreen, setIsQrisFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const receiptRef = useRef(null);

  // 1. LISTEN REALTIME KE FIRESTORE
  useEffect(() => {
    if (!targetOrderId) return;
    
    const unsubscribe = onSnapshot(doc(db, "orders", targetOrderId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLiveOrder({ 
            id: docSnapshot.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    }, (error) => {
      console.error("Error listening to order:", error);
    });

    return () => unsubscribe();
  }, [targetOrderId]);

  // 2. FUNGSI COPY LINK
  const handleCopyLink = () => {
    const fullUrl = window.location.origin + "/receipt/" + targetOrderId;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    if (!targetOrderId) return;
    setIsRefreshing(true);
    try {
      const docRef = doc(db, "orders", targetOrderId);
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
      setTimeout(() => setIsRefreshing(false), 800); 
    }
  };

  const handleSaveImage = async () => {
    if (!receiptRef.current) return;
    setIsSaving(true);
    try {
      // Tunggu sebentar agar render stabil
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, 
        backgroundColor: '#ffffff', 
        useCORS: true, 
        logging: false,
        width: receiptRef.current.offsetWidth,
        height: receiptRef.current.offsetHeight
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Struk-${liveOrder.customerName}-${targetOrderId.substring(0,5)}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal menyimpan gambar:", error);
      alert("Gagal menyimpan otomatis. Silakan screenshot layar Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmViaWA = async () => {
    const message = `Halo Admin Mamah Yonda,%0A%0ASaya sudah bayar via QRIS:%0AOrder: *${targetOrderId.toUpperCase()}*%0ANama: *${liveOrder.customerName}*%0ATotal: *${formatRupiah(liveOrder.total)}*`;
    window.open(`https://wa.me/${ADMIN_PHONE_NUMBER}?text=${message}`, '_blank');
    try {
        await updateDoc(doc(db, "orders", targetOrderId), { paymentStatus: 'verification_via_wa' });
    } catch (err) { 
      console.error("Gagal update status:", err); 
    }
    setShowPaymentModal(false);
  };

  if (!liveOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
          <h2 className="text-xl font-black text-gray-800 italic uppercase tracking-tighter">Mencari Pesanan...</h2>
          <button onClick={() => navigate('/')} className="mt-8 text-orange-600 font-bold underline">Kembali ke Menu</button>
      </div>
    );
  }

  const getStatusUI = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending' || s === 'baru') return { style: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: <Clock size={48} className="animate-pulse text-yellow-500" />, title: 'MENUNGGU KONFIRMASI', desc: 'Sabar ya, Admin sedang mengecek pesananmu.' };
    if (s === 'processing' || s === 'proses') return { style: 'bg-blue-50 border-blue-200 text-blue-700', icon: <ChefHat size={48} className="animate-bounce text-blue-500" />, title: 'SEDANG DIMASAK', desc: 'Pesananmu sudah diterima dan sedang diproses.' };
    if (s === 'completed' || s === 'selesai') return { style: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle size={48} className="text-green-500" />, title: 'PESANAN SELESAI', desc: 'Makanan sudah siap/diantar. Selamat makan!' };
    if (s === 'cancelled' || s === 'batal') return { style: 'bg-red-50 border-red-200 text-red-700', icon: <XCircle size={48} className="text-red-500" />, title: 'DIBATALKAN', desc: 'Maaf, pesananmu tidak dapat kami proses.' };
    return { style: 'bg-gray-50', icon: null, title: s, desc: '' };
  };

  const statusUI = getStatusUI(liveOrder.status);
  const canPayNow = !liveOrder.isPaid && liveOrder.status !== 'cancelled' && liveOrder.paymentStatus !== 'verification_via_wa';

  return (
    <div className="max-w-md mx-auto p-4 mb-24 animate-in fade-in duration-500">
      
      {/* MODAL QRIS FULLSCREEN */}
      {isQrisFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4" onClick={() => setIsQrisFullscreen(false)}>
          <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <div className="bg-white p-4 rounded-2xl max-w-xs w-full">
            <img src={QRIS_IMAGE_URL} className="w-full h-auto" alt="QRIS" />
          </div>
          <p className="text-white mt-6 font-black text-3xl italic">{formatRupiah(liveOrder.total)}</p>
          <p className="text-gray-400 text-sm mt-2 font-bold uppercase tracking-widest">Ketuk untuk menutup</p>
        </div>
      )}

      {/* MODAL PEMBAYARAN */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-5 flex justify-between items-center text-white">
              <h3 className="font-black italic uppercase flex items-center gap-2 tracking-tighter"><QrCode size={20} /> Pembayaran QRIS</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={24} /></button>
            </div>
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border-4 border-dashed border-gray-100 rounded-3xl p-3 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setIsQrisFullscreen(true)}>
                <img src={QRIS_IMAGE_URL} className="w-full aspect-square object-contain" alt="QRIS" />
                <div className="flex justify-center mt-2 text-gray-400 italic font-bold text-[10px] uppercase tracking-widest gap-1"><Maximize2 size={10}/> Klik untuk memperbesar</div>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Total Tagihan</p>
                <p className="text-4xl font-black text-gray-800 italic tracking-tighter">{formatRupiah(liveOrder.total)}</p>
              </div>
              <button onClick={handleConfirmViaWA} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black flex justify-center items-center gap-3 shadow-lg shadow-green-200 active:scale-95 transition-all uppercase italic tracking-wider">
                <MessageCircle size={22} /> Konfirmasi ke WA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ACTION */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack || (() => navigate('/'))} className="flex items-center gap-2 text-gray-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>
        <button onClick={handleCopyLink} className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 active:scale-95 transition-all">
          {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Tersalin' : 'Bagikan Struk'}
        </button>
      </div>

      {/* BANNER STATUS */}
      <div className={`mb-6 p-8 rounded-[2.5rem] text-center border-4 border-double shadow-xl shadow-gray-100 flex flex-col items-center gap-2 ${statusUI.style}`}>
          <div className="mb-2">{statusUI.icon}</div>
          <h2 className="text-2xl font-black italic tracking-tighter leading-none">{statusUI.title}</h2>
          <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider mb-2">{statusUI.desc}</p>
          <button onClick={handleManualRefresh} disabled={isRefreshing} className="flex items-center gap-2 px-5 py-2 bg-white/60 hover:bg-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-orange-500" : ""} /> 
            {isRefreshing ? 'Mengecek...' : 'Refresh Status'}
          </button>
      </div>

      {/* TOMBOL BAYAR CEPAT */}
      {canPayNow && ( liveOrder.status !== 'completed' && (
        <button onClick={() => setShowPaymentModal(true)} className="w-full mb-8 bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-orange-100 flex items-center justify-center gap-4 animate-pulse hover:animate-none transition-all active:scale-95">
          <QrCode size={28} />
          <div className="text-left leading-none">
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1 text-white">Sudah lapar?</p>
            <p className="text-xl font-black italic uppercase tracking-tighter">Bayar Sekarang via QRIS</p>
          </div>
        </button>
      ))}

      {/* KONTEN STRUK (DAPAT DISIMPAN) */}
      <div id="receipt-capture" ref={receiptRef} className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-t-[15px] border-orange-500 relative overflow-hidden ring-1 ring-black/5" style={{ backgroundColor: 'white' }}>
        {/* Dekorasi Lubang Struk */}
        <div className="absolute top-0 left-10 right-10 flex justify-between">
           {[...Array(6)].map((_, i) => <div key={i} className="w-3 h-6 bg-orange-500/20 rounded-b-full"></div>)}
        </div>

        <div className="text-center mb-10 mt-4">
          <h2 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter leading-[0.8]">Warung Makan<br/><span className="text-orange-500">Mamah Yonda</span></h2>
          <div className="mt-4 flex flex-col items-center gap-1">
             <div className="h-0.5 w-12 bg-gray-200 rounded-full"></div>
             <p className="text-[9px] text-gray-400 font-black uppercase italic tracking-[0.2em]">Cipulir 5 No. 17D, Jak-Sel</p>
          </div>
        </div>

        <div className="border-y-2 border-dashed border-gray-100 py-6 mb-8 grid grid-cols-2 gap-y-3 text-[10px]">
          <div className="flex flex-col">
            <span className="text-gray-400 font-black uppercase tracking-widest italic mb-0.5">Pelanggan</span>
            <span className="font-black text-gray-800 uppercase text-sm italic tracking-tighter">{liveOrder.customerName}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-gray-400 font-black uppercase tracking-widest italic mb-0.5">Order ID</span>
            <span className="font-black text-gray-800 text-xs italic">#{targetOrderId.substring(0,8).toUpperCase()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-black uppercase tracking-widest italic mb-0.5">Tanggal</span>
            <span className="font-black text-gray-700 italic">{liveOrder.createdAt?.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-gray-400 font-black uppercase tracking-widest italic mb-0.5">Status Bayar</span>
            <span className={`font-black text-[10px] uppercase italic ${liveOrder.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
              {liveOrder.isPaid ? 'Lunas' : 'Belum Lunas'}
            </span>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          {liveOrder.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start group">
              <div className="flex flex-col max-w-[70%]">
                <span className="text-sm font-black text-gray-800 uppercase italic tracking-tighter leading-tight group-hover:text-orange-500 transition-colors">
                  {item.name} <span className="text-orange-500 ml-1">x{item.quantity}</span>
                </span>
                {item.selectedVariant && (
                  <span className="text-[9px] font-black text-gray-400 italic mt-0.5 bg-gray-50 self-start px-2 py-0.5 rounded-full border border-gray-100">
                    Varian: {item.selectedVariant.name}
                  </span>
                )}
                {item.notes && <span className="text-[9px] text-orange-400 font-bold italic mt-1 leading-tight">"{item.notes}"</span>}
              </div>
              <span className="text-sm font-black text-gray-800 italic tracking-tighter">{formatRupiah(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t-4 border-double border-gray-100 pt-8 mb-4">
          <div className="flex justify-between items-center bg-gray-50 px-6 py-5 rounded-[2rem] border border-gray-100">
            <span className="text-xs font-black text-gray-400 uppercase italic tracking-widest">Total Bayar</span>
            <span className="text-3xl font-black text-orange-600 italic tracking-tighter drop-shadow-sm">{formatRupiah(liveOrder.total)}</span>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
           <div className="flex gap-2">
             {[...Array(12)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-gray-100 rounded-full"></div>)}
           </div>
           <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] italic">Terima Kasih Atas Pesanannya</p>
        </div>
      </div>
      
      {/* ACTION FOOTER */}
      <div className="mt-8 flex flex-col gap-3">
          <button onClick={handleSaveImage} disabled={isSaving} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black transition-all flex justify-center items-center gap-3 active:scale-95 italic uppercase tracking-widest shadow-xl shadow-gray-200 disabled:opacity-70">
            {isSaving ? <><Loader2 size={20} className="animate-spin text-orange-500" /> Menyimpan...</> : <><Download size={20} /> Simpan Gambar Struk</>}
          </button>
          
          <div className="p-4 bg-orange-50 rounded-2xl border border-dashed border-orange-200 text-center">
            <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">Punya kendala?</p>
            <a href={`https://wa.me/${ADMIN_PHONE_NUMBER}`} target="_blank" rel="noreferrer" className="text-[10px] font-black text-orange-600 uppercase italic underline decoration-2 underline-offset-4 flex items-center justify-center gap-1">
              <MessageCircle size={12} /> Hubungi Admin via WhatsApp
            </a>
          </div>
      </div>

    </div>
  );
};

export default ReceiptView;
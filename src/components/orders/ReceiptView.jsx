import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { useAuth } from '../../hooks/useAuth'; // Tambahkan hook auth
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { 
  ArrowLeft, Clock, ChefHat, CheckCircle, XCircle, 
  RefreshCw, Download, Loader2, QrCode, MessageCircle, X, Share2, Check,
  Maximize2, Camera, ShieldCheck // Tambahkan icon ShieldCheck
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import html2canvas from 'html2canvas';

const QRIS_IMAGE_URL = "/qris.jpg"; 
const ADMIN_PHONE_NUMBER = "6287774223733"; 

const ReceiptView = ({ order, onBack }) => {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Ambil data user yang sedang login
  
  const targetOrderId = urlOrderId || order?.id;

  const [liveOrder, setLiveOrder] = useState(order || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isQrisFullscreen, setIsQrisFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const receiptRef = useRef(null);

  // 1. Listen Realtime
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

  // 2. Fungsi Update Status Khusus Admin
  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Yakin ingin mengubah status pesanan menjadi ${newStatus.toUpperCase()}?`)) return;
    
    try {
      await updateDoc(doc(db, "orders", targetOrderId), { 
        status: newStatus,
        // Jika diselesaikan, otomatis tandai lunas
        isPaid: newStatus === 'completed' ? true : liveOrder.isPaid,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert("Gagal update status: " + err.message);
    }
  };

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
    // Beri jeda sedikit agar rendering browser stabil
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2, // Menaikkan resolusi (2-3 sudah cukup)
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // Memaksa lebar agar konsisten dengan tampilan printer thermal
      width: 380, 
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `STRUK-MAMAH-YONDA-${targetOrderId.substring(0,5)}.png`;
    link.click();
  } catch (error) {
    console.error("Gagal simpan:", error);
    alert("Gunakan Screenshot jika gagal simpan otomatis.");
  } finally {
    setIsSaving(false);
  }
};

  const handleConfirmViaWA = async () => {
    const orderIDShort = targetOrderId.toUpperCase();
    const totalAmount = formatRupiah(liveOrder.total);
    // Link yang akan dikirim ke WA Admin
    const receiptUrl = `${window.location.origin}/receipt/${targetOrderId}`;
    
    const message = `Halo Admin Warung Makan Mamah Yonda,%0ABerikut ini saya lampirkan bukti pembayaran via QRIS:%0A%0A*DETAIL PESANAN*%0AOrder ID: *${orderIDShort}*%0ANama: *${liveOrder.customerName}*%0ATotal: *${totalAmount}*%0A%0A*CEK STATUS PESANAN:*%0A${receiptUrl}%0A%0A*(Berikut saya lampirkan screenshot bukti bayar di bawah ini ya, Min. Terima kasih)*`;
    
    window.open(`https://wa.me/${ADMIN_PHONE_NUMBER}?text=${message}`, '_blank');
    
    try {
        await updateDoc(doc(db, "orders", targetOrderId), { 
          paymentStatus: 'verification_via_wa',
          updatedAt: serverTimestamp()
        });
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
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-orange-500 p-5 flex justify-between items-center text-white">
              <h3 className="font-black italic uppercase flex items-center gap-2 tracking-tighter"><QrCode size={20} /> Pembayaran QRIS</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={24} /></button>
            </div>
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border-4 border-dashed border-gray-100 rounded-3xl p-3 cursor-pointer hover:scale-[1.02] transition-transform relative group" onClick={() => setIsQrisFullscreen(true)}>
                <img src={QRIS_IMAGE_URL} className="w-full aspect-square object-contain" alt="QRIS" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-3xl flex items-center justify-center text-transparent group-hover:text-gray-400">
                   <Maximize2 size={24} />
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Total Tagihan</p>
                <p className="text-4xl font-black text-gray-800 italic tracking-tighter">{formatRupiah(liveOrder.total)}</p>
              </div>

              <div className="w-full p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <div className="bg-blue-500 p-1.5 rounded-lg text-white shrink-0 mt-0.5">
                  <Camera size={14} />
                </div>
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase italic">
                  Langkah: Bayar QRIS &gt; <span className="underline decoration-2">Screenshot Bukti</span> &gt; Klik tombol hijau di bawah untuk kirim bukti ke WA Admin.
                </p>
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
      {canPayNow && (
        <button 
          onClick={() => setShowPaymentModal(true)} 
          className="w-full mb-8 bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-orange-100 flex items-center justify-center gap-4 animate-pulse hover:animate-none transition-all active:scale-95"
        >
          <QrCode size={28} />
          <div className="text-left leading-none">
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1 text-white">Belum Bayar?</p>
            <p className="text-xl font-black italic uppercase tracking-tighter">Bayar Sekarang via QRIS</p>
          </div>
        </button>
      )}

      {/* KONTEN STRUK */}
      <div 
        id="receipt-capture" 
        ref={receiptRef} 
        className="bg-white p-6 leading-tight text-gray-800" 
        style={{ 
          width: '380px', // Standar lebar kertas thermal
          margin: '0 auto',
          fontFamily: '"Courier New", Courier, monospace', // Font khas struk
          backgroundColor: 'white'
        }}
      >
        {/* Header Struk */}
        <div className="text-center mb-4 border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase">WARUNG MAKAN</h2>
          <h2 className="text-2xl font-black uppercase">MAMAH YONDA</h2>
          <p className="text-[10px] mt-1">Jl. Cipulir 5 No. 17D, Kebayoran Lama</p>
          <p className="text-[10px]">Jakarta Selatan</p>
        </div>

        {/* Info Transaksi */}
        <div className="text-[11px] mb-4 space-y-1 uppercase">
          <div className="flex justify-between">
            <span>Tgl: {liveOrder.createdAt?.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Order: #{targetOrderId.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan: {liveOrder.customerName}</span>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>
        </div>

        {/* List Item */}
        <div className="text-[12px] mb-4 space-y-2">
          {liveOrder.items?.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between font-bold">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatRupiah(item.price * item.quantity)}</span>
              </div>
              {item.selectedVariant && (
                <div className="text-[10px] italic">- {item.selectedVariant.name}</div>
              )}
              {item.notes && (
                <div className="text-[10px] italic text-gray-500">Note: {item.notes}</div>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t-2 border-black pt-2 space-y-1">
          <div className="flex justify-between text-lg font-black uppercase">
            <span>Total</span>
            <span>{formatRupiah(liveOrder.total)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Status</span>
            <span className="font-bold italic uppercase">{liveOrder.isPaid ? 'LUNAS' : 'BELUM LUNAS'}</span>
          </div>
        </div>

        {/* Footer Struk */}
        <div className="text-center mt-8 pt-4 border-t border-dashed border-black">
          <p className="text-[10px] font-bold uppercase italic tracking-widest">
            Terima Kasih Atas Kunjungannya
          </p>
          <p className="text-[9px] mt-1 italic text-gray-400">#Simpan struk ini sebagai bukti sah</p>
        </div>
      </div>

      {/* PANEL KONTROL ADMIN (Hanya muncul jika yang buka adalah Admin yang sudah Login) */}
      {currentUser && currentUser.role === 'admin' && (
        <div className="mt-8 p-6 bg-gray-900 rounded-[2.5rem] border-2 border-orange-500 shadow-xl shadow-orange-100/20 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-orange-500" size={18} />
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Panel Kontrol Admin</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleUpdateStatus('processing')}
              className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase italic hover:bg-blue-700 active:scale-95 transition-all"
            >
              Mulai Masak
            </button>
            <button 
              onClick={() => handleUpdateStatus('completed')}
              className="bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase italic hover:bg-green-700 active:scale-95 transition-all"
            >
              Lunas & Selesai
            </button>
            <button 
              onClick={() => handleUpdateStatus('cancelled')}
              className="bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase italic hover:bg-red-700 active:scale-95 transition-all col-span-2 opacity-60 hover:opacity-100"
            >
              Batalkan Pesanan
            </button>
          </div>
        </div>
      )}
      
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
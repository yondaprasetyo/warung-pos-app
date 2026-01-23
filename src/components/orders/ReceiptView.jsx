import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase'; 
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'; 
import { 
  ArrowLeft, StickyNote, Clock, ChefHat, CheckCircle, XCircle, 
  RefreshCw, Download, Loader2, QrCode, MessageCircle, Maximize2, ZoomIn, X 
} from 'lucide-react'; 
import { formatRupiah } from '../../utils/format';
import html2canvas from 'html2canvas';

// --- GANTI URL INI DENGAN LINK GAMBAR QRIS ANDA ---
const QRIS_IMAGE_URL = "/qris.jpg"; 

// --- GANTI DENGAN NOMOR WA ADMIN ---
const ADMIN_PHONE_NUMBER = "6287774223733"; 

const ReceiptView = ({ order, onBack }) => {
  const [liveOrder, setLiveOrder] = useState(order);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref untuk elemen struk agar capture lebih akurat
  const receiptRef = useRef(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isQrisFullscreen, setIsQrisFullscreen] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    const unsubscribe = onSnapshot(doc(db, "orders", order.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLiveOrder({ 
            id: docSnapshot.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    });
    return () => unsubscribe();
  }, [order?.id]);

  const handleManualRefresh = async () => {
    if (!order?.id) return;
    setIsRefreshing(true);
    try {
      const docRef = doc(db, "orders", order.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveOrder({ 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        });
      }
    } catch (error) { console.error("Gagal refresh:", error); } 
    finally { setTimeout(() => setIsRefreshing(false), 800); }
  };

  // --- PERBAIKAN LOGIKA SIMPAN GAMBAR ---
  const handleSaveImage = async () => {
    if (!receiptRef.current) return;
    
    setIsSaving(true);
    try {
      // Tunggu sebentar untuk memastikan render selesai
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // Resolusi dipertinggi (3x) agar tajam
        backgroundColor: '#ffffff', // Paksa background putih
        useCORS: true, // Izinkan gambar eksternal
        logging: false,
        // Opsi ini membantu menjaga layout tetap rapi saat dicapture
        windowWidth: 400, 
        onclone: (documentClone) => {
            const element = documentClone.getElementById('receipt-content');
            if (element) {
                // Paksa font dan layout saat capture agar tidak default ke Times New Roman
                element.style.fontFamily = 'Arial, Helvetica, sans-serif';
                element.style.padding = '40px';
                element.style.width = '100%';
                
                // Paksa warna teks agar terbaca
                const texts = element.querySelectorAll('*');
                texts.forEach(el => {
                    if (window.getComputedStyle(el).color === 'rgba(0, 0, 0, 0)') {
                        el.style.color = '#000000';
                    }
                });
            }
        }
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Struk-${liveOrder.customerName}-${liveOrder.id.substring(0,5)}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal menyimpan gambar:", error);
      alert("Maaf, gagal menyimpan struk. Coba screenshot manual saja.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmViaWA = async () => {
    const message = `Halo Admin Mamah Yonda,%0A%0ASaya sudah melakukan pembayaran via QRIS untuk:%0AOrder ID: *${liveOrder.id.toUpperCase()}*%0AAtas Nama: *${liveOrder.customerName}*%0ATotal: *${formatRupiah(liveOrder.total)}*%0A%0ABerikut saya lampirkan bukti transfernya (foto di chat ini). Mohon dicek ya!`;
    window.open(`https://wa.me/${ADMIN_PHONE_NUMBER}?text=${message}`, '_blank');
    try {
        const orderDocRef = doc(db, "orders", liveOrder.id);
        await updateDoc(orderDocRef, { paymentStatus: 'verification_via_wa' });
    } catch (err) { console.error("Gagal update status lokal:", err); }
    setShowPaymentModal(false);
  };

  if (!liveOrder) return null;

  const formatOrderDate = (dateObj) => {
    if (!dateObj) return '-';
    return dateObj.toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusUI = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending' || s === 'baru') return { style: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: <Clock size={48} className="animate-pulse text-yellow-500" />, title: 'MENUNGGU KONFIRMASI', desc: 'Mohon tunggu, Admin sedang mengecek pesananmu...', canRefresh: true };
    if (s === 'processing' || s === 'proses') return { style: 'bg-blue-50 border-blue-200 text-blue-700', icon: <ChefHat size={48} className="animate-bounce text-blue-500" />, title: 'PESANAN DITERIMA', desc: 'Hore! Makananmu sedang disiapkan di dapur.', canRefresh: true };
    if (s === 'completed' || s === 'selesai') return { style: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle size={48} className="text-green-500" />, title: 'PESANAN SELESAI', desc: 'Pesanan sudah selesai/diantar. Terima kasih!', canRefresh: false };
    if (s === 'cancelled' || s === 'batal') return { style: 'bg-red-50 border-red-200 text-red-700', icon: <XCircle size={48} className="text-red-500" />, title: 'PESANAN DIBATALKAN', desc: 'Maaf, pesanan ini tidak dapat diproses.', canRefresh: false };
    return { style: 'bg-gray-50', icon: null, title: s, desc: '', canRefresh: true };
  };

  const statusUI = getStatusUI(liveOrder.status);
  const isCancelled = liveOrder.status === 'cancelled' || liveOrder.status === 'batal';
  const canPayNow = !liveOrder.isPaid && !isCancelled && !isWaitingVerification;

  const isWaitingVerification = liveOrder.paymentStatus === 'verification_via_wa';

  return (
    <div className="max-w-md mx-auto p-4 mt-6 mb-20 animate-in fade-in zoom-in duration-300 relative">
      
      {/* 1. LAYAR PENUH (FULLSCREEN OVERLAY) JIKA GAMBAR DIKLIK */}
      {isQrisFullscreen && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsQrisFullscreen(false)} 
        >
             <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full"><X size={24} /></button>
             <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse mt-10">Ketuk Layar Untuk Kembali</p>
             <div className="bg-white p-4 rounded-2xl w-full max-w-sm flex items-center justify-center shadow-2xl shadow-white/10">
                <img src={QRIS_IMAGE_URL} alt="QRIS Full" className="w-full h-auto object-contain" />
             </div>
             <div className="text-center mt-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest">Total Tagihan</p>
                <p className="text-orange-500 text-4xl font-black italic">{formatRupiah(liveOrder.total)}</p>
             </div>
        </div>
      )}

      {/* 2. MODAL PEMBAYARAN */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <div className="bg-orange-500 p-4 flex justify-between items-center text-white shadow-md z-10 relative">
                      <h3 className="font-black italic uppercase flex items-center gap-2 text-lg"><QrCode size={20} /> Scan QRIS</h3>
                      <button onClick={() => setShowPaymentModal(false)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors"><X size={20} /></button>
                  </div>
                  <div className="p-5 flex flex-col items-center gap-4 bg-gray-50/50">
                      <div 
                        className="bg-white p-3 border-2 border-gray-200 rounded-2xl shadow-lg w-full relative group cursor-pointer hover:border-orange-400 transition-all"
                        onClick={() => setIsQrisFullscreen(true)} 
                      >
                          <div className="aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl bg-white">
                             <img src={QRIS_IMAGE_URL} alt="QRIS Code" className="w-full h-full object-contain" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-2xl">
                             <span className="bg-black/70 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm"><Maximize2 size={14} /> Perbesar</span>
                          </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-2">Ketuk gambar untuk memperbesar</p>
                      <div className="w-full h-px bg-gray-200 my-1"></div>
                      <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Tagihan</p>
                          <p className="text-4xl font-black text-gray-800 italic tracking-tighter">{formatRupiah(liveOrder.total)}</p>
                      </div>
                      <div className="w-full mt-2">
                          <button onClick={handleConfirmViaWA} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95 shadow-green-200">
                               <MessageCircle size={22} className="fill-white text-[#25D366]" /> KONFIRMASI KE WHATSAPP
                          </button>
                          <p className="text-[10px] text-center text-gray-400 mt-3 font-medium px-4 leading-tight">Setelah transfer, wajib kirim bukti transfer agar pesanan diproses lunas.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* TOMBOL KEMBALI */}
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden">
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

      {/* Banner Status */}
      <div className={`print:hidden mb-6 p-8 rounded-[2rem] text-center border-4 border-double shadow-lg flex flex-col items-center gap-3 ${statusUI.style}`}>
          <div>{statusUI.icon}</div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-1">{statusUI.title}</h2>
            <p className="text-xs font-bold opacity-80 mb-4">{statusUI.desc}</p>
            {statusUI.canRefresh && (
                <button onClick={handleManualRefresh} disabled={isRefreshing} className="mx-auto flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border border-black/5 disabled:opacity-50">
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? 'Mengecek...' : 'Refresh Status'}
                </button>
            )}
          </div>
      </div>

      {/* BANNER TOMBOL BAYAR */}
      {canPayNow && (
        <div className="print:hidden mb-6 animate-bounce">
            <button onClick={() => setShowPaymentModal(true)} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-[2rem] shadow-xl shadow-orange-200 flex items-center justify-center gap-3 transform transition-transform hover:scale-105 active:scale-95">
                <div className="bg-white/20 p-2 rounded-full"><QrCode size={24} /></div>
                <div className="text-left">
                  {/* Ubah teks label kecil agar cocok untuk pesanan baru */}
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-90">
                      {liveOrder.status === 'completed' || liveOrder.status === 'selesai' ? 'Pesanan Selesai?' : 'Menunggu Pembayaran'}
                  </p>
                  <p className="text-lg font-black italic leading-none">BAYAR VIA QRIS</p>
                </div>
            </button>
        </div>
      )}

      {/* Banner Menunggu Verifikasi */}
      {isWaitingVerification && !liveOrder.isPaid && (
          <div className="print:hidden mb-6 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3 text-blue-800">
              <MessageCircle size={32} className="text-blue-500 animate-pulse" />
              <div><p className="font-black italic uppercase text-sm">Sedang Diverifikasi</p><p className="text-[11px] leading-tight mt-1">Anda sudah konfirmasi via WA. Admin akan segera mengubah status menjadi LUNAS.</p></div>
          </div>
      )}

      {/* ================================================== 
          STRUK KONTEN (YANG AKAN DI-DOWNLOAD)
          Saya tambahkan Inline Style (style={{...}}) di sini
          untuk menjamin layout tidak hancur saat didownload.
          ==================================================
      */}
      <div 
        id="receipt-content" 
        ref={receiptRef}
        className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-orange-500 relative overflow-hidden receipt-card"
        style={{ backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }} 
      >
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none italic uppercase" style={{ margin: 0, color: '#1f2937' }}>Warung Makan<br/>Mamah Yonda</h2>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed font-bold uppercase italic" style={{ color: '#9ca3af' }}>Jl. Cipulir 5 No. 17D, Jakarta Selatan<br/>WA: 087774223733</p>
        </div>

        <div className="border-y-2 border-dashed border-gray-100 py-6 mb-6 space-y-2" style={{ borderTop: '2px dashed #f3f4f6', borderBottom: '2px dashed #f3f4f6', padding: '20px 0' }}>
            {/* Menggunakan Flexbox di Inline Style agar html2canvas membacanya */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic" style={{ color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase' }}>Pelanggan:</span>
                <span className="font-black text-gray-800 uppercase text-sm italic" style={{ fontWeight: 900, color: '#1f2937' }}>{liveOrder.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic" style={{ color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase' }}>Status:</span>
                <span className={`font-black uppercase text-[10px] italic px-2 py-0.5 rounded ${statusUI.style}`} style={{ fontWeight: 900, fontSize: '10px' }}>{liveOrder.status || 'Pending'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic" style={{ color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase' }}>Pembayaran:</span>
                <span className={`font-black uppercase text-[10px] italic px-2 py-0.5 rounded ${liveOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={{ fontWeight: 900, fontSize: '10px' }}>{liveOrder.isPaid ? 'LUNAS' : 'BELUM LUNAS'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic" style={{ color: '#9ca3af', fontSize: '9px', textTransform: 'uppercase' }}>Waktu:</span>
                <span className="font-black text-gray-700 text-[10px] italic" style={{ fontWeight: 900, fontSize: '10px', color: '#374151' }}>{formatOrderDate(liveOrder.createdAt)}</span>
            </div>
        </div>

        <div className="space-y-6 mb-8" style={{ marginBottom: '30px' }}>
            {liveOrder.items?.map((item, idx) => {
              const variantLabel = item.selectedVariant?.name || item.variant;
              return (
                <div key={idx} className="relative" style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight italic" style={{ fontWeight: 900, color: '#1f2937' }}>
                            {item.name} <span className="text-orange-600 ml-1" style={{ color: '#ea580c' }}>x{item.quantity}</span>
                        </span>
                        {variantLabel && variantLabel !== 'Tanpa Varian' && (
                            <span className="text-[9px] font-black text-gray-400 italic uppercase tracking-tighter" style={{ fontSize: '9px', color: '#9ca3af' }}>Varian: {variantLabel}</span>
                        )}
                    </div>
                    <span className="text-sm font-black text-gray-800 italic" style={{ fontWeight: 900, color: '#1f2937' }}>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  {(item.notes || item.note) && (
                      <div className="mt-2 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border-l-4 border-orange-500" style={{ marginTop: '5px', padding: '10px', backgroundColor: '#f9fafb', borderLeft: '4px solid #f97316' }}>
                          <StickyNote size={12} className="text-orange-500 mt-0.5" color="#f97316" />
                          <p className="text-[11px] text-gray-700 font-black italic leading-tight uppercase tracking-tight" style={{ margin: 0, fontSize: '11px', color: '#374151' }}>"{item.notes || item.note}"</p>
                      </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="border-t-2 border-double border-gray-100 pt-6 mb-8" style={{ borderTop: '4px double #f3f4f6', paddingTop: '20px', marginBottom: '30px' }}>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '15px' }}>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic" style={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase' }}>Total Akhir</span>
            <span className="text-2xl font-black text-orange-600 print:text-black italic tracking-tighter" style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c' }}>{formatRupiah(liveOrder.total)}</span>
          </div>
        </div>

        <div className="text-center space-y-3" style={{ textAlign: 'center' }}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic" style={{ color: '#9ca3af', letterSpacing: '0.3em' }}>Terima Kasih</p>
            <div className="flex justify-center gap-1" style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-1 bg-gray-200 rounded-full" style={{ width: '4px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '50%' }}></div>)}
            </div>
        </div>
      </div>
      
      <div className="mt-6">
          <button onClick={handleSaveImage} disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-[2rem] font-black transition-all flex justify-center items-center gap-3 shadow-xl shadow-orange-100 active:scale-95 italic uppercase tracking-wider disabled:opacity-70">
            {isSaving ? <><Loader2 size={20} className="animate-spin" /> Memproses Gambar...</> : <><Download size={20} /> Simpan Struk (Galeri)</>}
          </button>
          <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Gambar akan tersimpan otomatis di Folder Download / Galeri HP Anda.</p>
      </div>

      <style>{`
        @media print { 
            @page { margin: 0; } 
            body { margin: 0; padding: 0.5cm; background: white; } 
            .print\\:hidden { display: none !important; } 
            .receipt-card { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: none !important; } 
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
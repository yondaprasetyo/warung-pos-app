import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Hapus import storage karena tidak dipakai
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'; 
import { 
  ArrowLeft, StickyNote, Clock, ChefHat, CheckCircle, XCircle, 
  RefreshCw, Download, Loader2, QrCode, MessageCircle 
} from 'lucide-react'; // Ganti Upload/Wallet jadi MessageCircle (Icon WA)
import { formatRupiah } from '../../utils/format';
import html2canvas from 'html2canvas';

// --- GANTI URL INI DENGAN LINK GAMBAR QRIS ANDA ---
// Tips: Simpan foto QRIS di folder 'public' project Anda (misal: public/qris.jpg)
// Lalu ubah const di bawah menjadi: const QRIS_IMAGE_URL = "/qris.jpg";
const QRIS_IMAGE_URL = "/qris.jpg"; 

// --- GANTI DENGAN NOMOR WA ADMIN (Format 62...) ---
const ADMIN_PHONE_NUMBER = "6287774223733"; 

const ReceiptView = ({ order, onBack }) => {
  const [liveOrder, setLiveOrder] = useState(order);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE MODAL PEMBAYARAN ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // --- 1. LISTENER REAL-TIME ---
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

  // --- 2. FUNGSI REFRESH MANUAL ---
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
    } catch (error) {
      console.error("Gagal refresh:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800); 
    }
  };

  // --- 3. FUNGSI SIMPAN GAMBAR ---
  const handleSaveImage = async () => {
    setIsSaving(true);
    try {
      const element = document.getElementById('receipt-content');
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true 
      });
      const image = canvas.toDataURL("image/png");
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

  // --- 4. FUNGSI KONFIRMASI VIA WHATSAPP ---
  const handleConfirmViaWA = async () => {
    // 1. Susun Pesan WA
    const message = `Halo Admin Mamah Yonda,%0A%0ASaya sudah melakukan pembayaran via QRIS untuk:%0AOrder ID: *${liveOrder.id.toUpperCase()}*%0AAtas Nama: *${liveOrder.customerName}*%0ATotal: *${formatRupiah(liveOrder.total)}*%0A%0ABerikut saya lampirkan bukti transfernya (foto di chat ini). Mohon dicek ya!`;
    
    // 2. Buka WhatsApp di Tab Baru
    // Menggunakan API wa.me
    window.open(`https://wa.me/${ADMIN_PHONE_NUMBER}?text=${message}`, '_blank');

    // 3. Update Status Pembayaran di Database (Opsional: memberi tanda bahwa user sudah lapor)
    // Kita set status pembayaran jadi 'verification_via_wa'
    try {
        const orderDocRef = doc(db, "orders", liveOrder.id);
        await updateDoc(orderDocRef, {
            paymentStatus: 'verification_via_wa'
        });
    } catch (err) {
        console.error("Gagal update status lokal:", err);
    }

    // 4. Tutup Modal
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

  // --- HELPER STATUS UI ---
  const getStatusUI = (status) => {
    const s = (status || 'pending').toLowerCase();
    
    if (s === 'pending' || s === 'baru') {
        return { 
            style: 'bg-yellow-50 border-yellow-200 text-yellow-700', 
            icon: <Clock size={48} className="animate-pulse text-yellow-500" />, 
            title: 'MENUNGGU KONFIRMASI', 
            desc: 'Mohon tunggu, Admin sedang mengecek pesananmu...',
            canRefresh: true 
        };
    }
    if (s === 'processing' || s === 'proses') {
        return { 
            style: 'bg-blue-50 border-blue-200 text-blue-700', 
            icon: <ChefHat size={48} className="animate-bounce text-blue-500" />, 
            title: 'PESANAN DITERIMA', 
            desc: 'Hore! Makananmu sedang disiapkan di dapur.',
            canRefresh: true
        };
    }
    if (s === 'completed' || s === 'selesai') {
        return { 
            style: 'bg-green-50 border-green-200 text-green-700', 
            icon: <CheckCircle size={48} className="text-green-500" />, 
            title: 'PESANAN SELESAI', 
            desc: 'Pesanan sudah selesai/diantar. Terima kasih!',
            canRefresh: false
        };
    }
    if (s === 'cancelled' || s === 'batal') {
        return { 
            style: 'bg-red-50 border-red-200 text-red-700', 
            icon: <XCircle size={48} className="text-red-500" />, 
            title: 'PESANAN DIBATALKAN', 
            desc: 'Maaf, pesanan ini tidak dapat diproses.',
            canRefresh: false
        };
    }
    return { style: 'bg-gray-50', icon: null, title: s, desc: '', canRefresh: true };
  };

  const statusUI = getStatusUI(liveOrder.status);

  // Logic Tombol Bayar:
  // Muncul jika status sudah SELESAI tapi BELUM LUNAS (isPaid false)
  const isCompletedButUnpaid = 
    (liveOrder.status === 'completed' || liveOrder.status === 'selesai') && 
    !liveOrder.isPaid;

  // Cek apakah user sudah pernah klik tombol Konfirmasi WA
  const isWaitingVerification = liveOrder.paymentStatus === 'verification_via_wa';

  return (
    <div className="max-w-md mx-auto p-4 mt-6 mb-20 animate-in fade-in zoom-in duration-300 relative">
      
      {/* --- MODAL PEMBAYARAN QRIS & WA --- */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl">
                  {/* Header Modal */}
                  <div className="bg-orange-500 p-4 flex justify-between items-center text-white">
                      <h3 className="font-black italic uppercase flex items-center gap-2">
                          <QrCode size={20} /> Scan QRIS
                      </h3>
                      <button onClick={() => setShowPaymentModal(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/40 transition-colors">
                          <XCircle size={24} />
                      </button>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center gap-4">
                      {/* Area Gambar QRIS */}
                      <div className="bg-white p-2 border-2 border-gray-100 rounded-xl shadow-lg">
                          <img src={QRIS_IMAGE_URL} alt="QRIS Code" className="w-48 h-48 object-contain" />
                      </div>
                      
                      {/* Info Nominal */}
                      <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Tagihan</p>
                          <p className="text-3xl font-black text-orange-600 italic tracking-tighter">
                             {formatRupiah(liveOrder.total)}
                          </p>
                      </div>

                      <div className="w-full h-px bg-gray-100 my-2"></div>

                      {/* Instruksi & Tombol WA */}
                      <div className="text-center w-full space-y-3">
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                              Silakan transfer sesuai nominal di atas, lalu konfirmasi dan kirim foto bukti transfer via WhatsApp.
                          </p>
                          
                          <button 
                              onClick={handleConfirmViaWA}
                              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95"
                          >
                               <MessageCircle size={20} className="fill-white text-[#25D366]" /> Konfirmasi ke WhatsApp
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Tombol Kembali */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold text-xs transition-all print:hidden"
      >
        <ArrowLeft size={16} /> KEMBALI KE MENU
      </button>

      {/* --- BANNER STATUS PESANAN --- */}
      <div className={`print:hidden mb-6 p-8 rounded-[2rem] text-center border-4 border-double shadow-lg transition-all duration-500 flex flex-col items-center gap-3 ${statusUI.style}`}>
          <div>{statusUI.icon}</div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-1">{statusUI.title}</h2>
            <p className="text-xs font-bold opacity-80 mb-4">{statusUI.desc}</p>
            
            {statusUI.canRefresh && (
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="mx-auto flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-sm border border-black/5 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                  {isRefreshing ? 'Mengecek...' : 'Refresh Status'}
                </button>
            )}
          </div>
      </div>

      {/* --- BANNER TOMBOL BAYAR (Jika Selesai & Belum Lunas) --- */}
      {isCompletedButUnpaid && !isWaitingVerification && (
          <div className="print:hidden mb-6 animate-bounce">
              <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-[2rem] shadow-xl shadow-orange-200 flex items-center justify-center gap-3 transform transition-transform hover:scale-105 active:scale-95"
              >
                  <div className="bg-white/20 p-2 rounded-full">
                      <QrCode size={24} />
                  </div>
                  <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Pesanan Selesai?</p>
                      <p className="text-lg font-black italic leading-none">BAYAR VIA QRIS</p>
                  </div>
              </button>
          </div>
      )}

      {/* --- BANNER INFO SUDAH KONFIRMASI --- */}
      {isWaitingVerification && !liveOrder.isPaid && (
          <div className="print:hidden mb-6 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3 text-blue-800">
              <MessageCircle size={32} className="text-blue-500 animate-pulse" />
              <div>
                  <p className="font-black italic uppercase text-sm">Sedang Diverifikasi</p>
                  <p className="text-[11px] leading-tight mt-1">
                      Anda sudah konfirmasi via WA. Admin akan segera mengubah status menjadi LUNAS.
                  </p>
              </div>
          </div>
      )}

      {/* --- KONTEN STRUK (Printable Area) --- */}
      <div 
        id="receipt-content" 
        className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-orange-500 relative overflow-hidden receipt-card"
      >
        {/* Header Toko */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none italic uppercase">Warung Makan<br/>Mamah Yonda</h2>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed font-bold uppercase italic">
            Jl. Cipulir 5 No. 17D, Jakarta Selatan<br/>
            WA: 087774223733
          </p>
        </div>

        {/* Info Pelanggan & Order */}
        <div className="border-y-2 border-dashed border-gray-100 py-6 mb-6 space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Pelanggan:</span>
                <span className="font-black text-gray-800 uppercase text-sm italic">{liveOrder.customerName}</span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Status:</span>
                <span className={`font-black uppercase text-[10px] italic px-2 py-0.5 rounded ${statusUI.style}`}>
                    {liveOrder.status || 'Pending'}
                </span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Pembayaran:</span>
                <span className={`font-black uppercase text-[10px] italic px-2 py-0.5 rounded ${liveOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {liveOrder.isPaid ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">Waktu:</span>
                <span className="font-black text-gray-700 text-[10px] italic">
                    {formatOrderDate(liveOrder.createdAt)}
                </span>
            </div>
        </div>

        {/* Daftar Item */}
        <div className="space-y-6 mb-8">
            {liveOrder.items?.map((item, idx) => {
              const variantLabel = item.selectedVariant?.name || item.variant;
              const itemNote = item.notes || item.note;

              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-gray-800 uppercase tracking-tight italic">
                          {item.name} <span className="text-orange-600 ml-1">x{item.quantity}</span>
                      </span>
                      
                      {variantLabel && variantLabel !== 'Tanpa Varian' && (
                          <span className="text-[9px] font-black text-gray-400 italic uppercase tracking-tighter">
                             Varian: {variantLabel}
                          </span>
                      )}
                    </div>
                    <span className="text-sm font-black text-gray-800 italic">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  {itemNote && (
                      <div className="mt-2 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border-l-4 border-orange-500 print:bg-white print:border-gray-300">
                          <StickyNote size={12} className="text-orange-500 mt-0.5 print:text-black" />
                          <p className="text-[11px] text-gray-700 font-black italic leading-tight uppercase tracking-tight">
                                "{itemNote}"
                          </p>
                      </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Total Bayar */}
        <div className="border-t-2 border-double border-gray-100 pt-6 mb-8">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl print:bg-transparent print:p-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Total Akhir</span>
            <span className="text-2xl font-black text-orange-600 print:text-black italic tracking-tighter">
                {formatRupiah(liveOrder.total)}
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
      </div>
      
      {/* --- 4. TOMBOL SIMPAN KE GALERI --- */}
      <div className="mt-6">
          <button 
            onClick={handleSaveImage} 
            disabled={isSaving}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-[2rem] font-black transition-all flex justify-center items-center gap-3 shadow-xl shadow-orange-100 active:scale-95 italic uppercase tracking-wider disabled:opacity-70"
          >
            {isSaving ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Memproses Gambar...
                </>
            ) : (
                <>
                    <Download size={20} />
                    Simpan Struk (Galeri)
                </>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">
              Gambar akan tersimpan otomatis di Folder Download / Galeri HP Anda.
          </p>
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
          .text-orange-600, .text-orange-500 { color: black !important; }
          .bg-orange-50, .bg-gray-50 { background-color: transparent !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;
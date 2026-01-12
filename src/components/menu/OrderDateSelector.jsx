import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';

const OrderDateSelector = ({ onSelectDate, user, authLoading }) => {
  const [selectedDate, setSelectedDate] = useState('');

  // 1. Logika Otomatis untuk Admin/Kasir (Bypass tampilan ini)
  useEffect(() => {
    // Jalankan HANYA jika loading selesai
    if (!authLoading && user && (user.role === 'admin' || user.role === 'cashier')) {
      // Kirim object Date hari ini agar App.jsx bisa memformatnya dengan benar
      onSelectDate({
        dateObj: new Date() 
      });
    }
  }, [user, authLoading, onSelectDate]);

  // 2. Safety Check: 
  // Jika sedang loading auth atau user adalah admin/kasir, jangan render form (tunggu redirect)
  if (authLoading || (user && (user.role === 'admin' || user.role === 'cashier'))) {
    return null; 
  }

  // --- LOGIKA UNTUK CUSTOMER (TAMPILAN POPUP) ---

  const getDayName = (dateString) => {
    if (!dateString) return '';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate) {
      // PERBAIKAN UTAMA:
      // Kita kirim object Date asli, bukan string yang diformat manual.
      // Biarkan App.jsx yang melakukan formatting (isoDate, fullDate, dll)
      // agar konsisten dengan zona waktu dan logika Libur Toko.
      onSelectDate({
        dateObj: new Date(selectedDate)
      });
    }
  };

  // Setup batas tanggal (Min = Hari ini, Max = 7 hari ke depan)
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0');
  const day = String(todayDate.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const maxDate = nextWeek.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[999] bg-orange-600 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="text-orange-600" size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter mb-2">
          Mau Pesan Untuk Kapan?
        </h2>
        <p className="text-gray-400 text-xs font-bold uppercase mb-8">
          Pilih tanggal order agar kami bisa menyiapkan menu terbaik untukmu
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input 
              type="date" 
              required
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-center outline-none focus:border-orange-500 transition-all cursor-pointer text-gray-800 uppercase"
            />
          </div>

          {selectedDate && (
            <div className="bg-orange-50 p-4 rounded-2xl flex items-center justify-center gap-2 animate-bounce">
              <Clock className="text-orange-600" size={16} />
              <span className="text-sm font-black text-orange-600 uppercase italic">
                Pesanan Hari {getDayName(selectedDate)}
              </span>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gray-800 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
          >
            Lihat Menu <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderDateSelector;
import React, { useState } from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';

const OrderDateSelector = ({ onSelectDate }) => {
  const [selectedDate, setSelectedDate] = useState('');

  const getDayName = (dateString) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      onSelectDate({
        fullDate: selectedDate,
        dayId: dateObj.getDay() // Mengambil ID hari (0-6)
      });
    }
  };

  // Batasi pemilihan tanggal (hari ini sampai 7 hari ke depan)
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const maxDate = nextWeek.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[999] bg-orange-600 flex items-center justify-center p-6">
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
              min={today}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-center outline-none focus:border-orange-500 transition-all"
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
            className="w-full bg-gray-800 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            Lihat Menu <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderDateSelector;
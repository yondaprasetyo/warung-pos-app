import React, { useState } from 'react';
import { useStoreSchedule } from '../../hooks/useStoreSchedule';
import { CalendarOff, Trash2, Plus } from 'lucide-react';

const StoreScheduleSettings = () => {
  const { schedules, addSchedule, deleteSchedule } = useStoreSchedule();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return alert("Mohon lengkapi data");
    
    if (endDate < startDate) return alert("Tanggal selesai tidak boleh sebelum tanggal mulai");

    try {
      await addSchedule(startDate, endDate, reason);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch {
      alert("Gagal menyimpan jadwal");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-100 p-2 rounded-xl text-red-600">
          <CalendarOff size={24} />
        </div>
        <h3 className="text-xl font-black text-gray-800 italic uppercase">Atur Jadwal Tutup Toko</h3>
      </div>

      {/* Form Input */}
      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Mulai Tanggal</label>
            <input 
              type="date" 
              className="w-full p-2 rounded-xl border border-gray-200 text-sm font-bold"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Sampai Tanggal</label>
            <input 
              type="date" 
              className="w-full p-2 rounded-xl border border-gray-200 text-sm font-bold"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3">
           <label className="text-[10px] font-bold text-gray-400 uppercase">Alasan (Contoh: Libur Lebaran)</label>
           <input 
              type="text" 
              placeholder="Masukkan alasan..."
              className="w-full p-2 rounded-xl border border-gray-200 text-sm font-bold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
           />
        </div>
        <button className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition">
          <Plus size={16} /> Tambahkan Jadwal Libur
        </button>
      </form>

      {/* List Jadwal */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Daftar Libur Mendatang</h4>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-300 italic">Tidak ada jadwal libur.</p>
        ) : (
          schedules.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-white border border-red-100 p-3 rounded-xl shadow-sm">
              <div>
                <p className="font-black text-red-600 text-sm italic uppercase">{item.reason}</p>
                <p className="text-xs text-gray-500 font-bold">
                  {new Date(item.startDate).toLocaleDateString('id-ID')} - {new Date(item.endDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button 
                onClick={() => deleteSchedule(item.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StoreScheduleSettings;
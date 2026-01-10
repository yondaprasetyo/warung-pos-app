import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);
  const scrollRef = useRef(null);

  // Perbaikan Error Impure Function: Hitung default date di luar useState
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultStartISO = defaultStart.toISOString().split('T')[0];
  const defaultEndISO = new Date().toISOString().split('T')[0];

  // 1. STATE FILTER
  const [startDate, setStartDate] = useState(defaultStartISO);
  const [endDate, setEndDate] = useState(defaultEndISO);
  const [viewMode, setViewMode] = useState('harian');

  // AUTO-SCROLL KE KANAN (Data Terbaru)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [startDate, endDate, viewMode, orders]);

  const stats = useMemo(() => {
    const getLocalDate = (dateSource) => {
      try {
        if (!dateSource) return null;
        const d = dateSource.toDate ? dateSource.toDate() : new Date(dateSource);
        return d.toLocaleDateString('en-CA'); 
      } catch { return null; }
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // CEK JARAK HARI UNTUK LIMITASI
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Jika > 31 hari, paksa ke mode bulanan agar grafik tidak hilang/rusak
    const currentMode = (diffDays > 31 && viewMode === 'harian') ? 'bulanan' : viewMode;

    const dataMap = new Map();
    let curr = new Date(start);

    // GENERATE LABELS & PLACEHOLDERS
    let safety = 0;
    while (curr <= end && safety < 400) {
      const dStr = getLocalDate(new Date(curr));
      const mKey = dStr.substring(0, 7);
      const key = currentMode === 'harian' ? dStr : mKey;
      const label = currentMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (!dataMap.has(key)) dataMap.set(key, { key, label, total: 0 });
      curr.setDate(curr.getDate() + 1);
      safety++;
    }

    let totalRevenue = 0;
    const filtered = orders.filter(o => {
      if (!o.createdAt || o.status !== 'Selesai') return false;
      const oDate = getLocalDate(o.createdAt);
      return oDate >= startDate && oDate <= endDate;
    }).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    filtered.forEach(o => {
      const oDate = getLocalDate(o.createdAt);
      const amt = Number(o.total) || 0;
      totalRevenue += amt;
      const key = currentMode === 'harian' ? oDate : oDate.substring(0, 7);
      if (dataMap.has(key)) dataMap.get(key).total += amt;
    });

    const chartData = Array.from(dataMap.values());
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    return { 
      totalRevenue, 
      totalCount: filtered.length, 
      chartData, 
      maxTotal, 
      displayOrders: filtered, 
      isForced: (diffDays > 31 && viewMode === 'harian') 
    };
  }, [orders, startDate, endDate, viewMode]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-20">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h2>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setViewMode('harian')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${viewMode === 'harian' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>HARIAN</button>
            <button onClick={() => setViewMode('bulanan')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${viewMode === 'bulanan' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>BULANAN</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold p-2 outline-none" />
          <span className="text-gray-400 font-bold text-xs">s/d</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold p-2 outline-none" />
        </div>
      </div>

      {stats.isForced && (
        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl text-xs font-bold border border-blue-100 animate-pulse">
          ℹ️ Rentang waktu lebih dari 31 hari. Dialihkan ke mode Bulanan agar grafik tetap rapi.
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-200">
          <p className="text-[10px] opacity-80 uppercase font-black mb-1">Total Omzet</p>
          <h3 className="text-3xl font-black">Rp {stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Pesanan Sukses</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.totalCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Rata-rata Pendapatan</p>
          <h3 className="text-3xl font-black text-gray-800">
            Rp {Math.round(stats.totalRevenue / (stats.chartData.length || 1)).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* CHART BOX WITH AUTO-SCROLL */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">📈 Tren Pendapatan</h4>
        <div ref={scrollRef} className="overflow-x-auto pb-6 scroll-smooth scrollbar-hide">
          <div 
            className="flex items-end h-64 gap-3 px-2 border-b-2 border-gray-50"
            style={{ 
              minWidth: stats.chartData.length > 10 ? `${stats.chartData.length * 60}px` : '100%',
              width: '100%'
            }}
          >
            {stats.chartData.map((d, i) => {
              const height = (d.total / stats.maxTotal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                  {d.total > 0 && (
                    <div className="absolute -top-10 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all z-50 font-bold whitespace-nowrap">
                      Rp {d.total.toLocaleString()}
                    </div>
                  )}
                  <div 
                    className="w-full bg-orange-500 rounded-t-xl transition-all duration-1000 hover:bg-orange-600 shadow-sm"
                    style={{ height: `${height}%`, minHeight: d.total > 0 ? '6px' : '2px' }}
                  />
                  <span className="text-[10px] font-bold text-gray-400 mt-4 whitespace-nowrap">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-gray-700">📜 Detail Transaksi</h4>
          <button onClick={() => window.print()} className="text-xs font-black text-orange-600 border border-orange-100 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all">CETAK</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black">
              <tr>
                <th className="p-5">Waktu</th>
                <th className="p-5">Pelanggan</th>
                <th className="p-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {stats.displayOrders.length > 0 ? (
                [...stats.displayOrders].reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-5 text-gray-500 font-medium">
                      {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 font-bold text-gray-800 uppercase">{o.customerName}</td>
                    <td className="p-5 text-right font-black text-gray-900">Rp {Number(o.total).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-10 text-center text-gray-400 font-bold italic">Tidak ada data transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesLaporan;
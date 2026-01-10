import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);
  const scrollRef = useRef(null);

  // LOGIKA TANGGAL (Di luar useState untuk menghindari Error ESLint)
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultStartISO = defaultStart.toISOString().split('T')[0];
  const defaultEndISO = new Date().toISOString().split('T')[0];

  // STATE
  const [startDate, setStartDate] = useState(defaultStartISO);
  const [endDate, setEndDate] = useState(defaultEndISO);
  const [viewMode, setViewMode] = useState('harian');

  // AUTO-SCROLL KE DATA TERBARU (KANAN)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [startDate, endDate, viewMode, orders]);

  // PERHITUNGAN STATISTIK & GRAFIK
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
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    
    // Paksa mode bulanan jika rentang > 31 hari
    const currentMode = (diffDays > 31 && viewMode === 'harian') ? 'bulanan' : viewMode;

    const dataMap = new Map();
    let curr = new Date(start);

    // Generate Labels (Hari/Bulan)
    let safety = 0;
    while (curr <= end && safety < 400) {
      const dStr = getLocalDate(new Date(curr));
      const key = currentMode === 'harian' ? dStr : dStr.substring(0, 7);
      const label = currentMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (!dataMap.has(key)) dataMap.set(key, { key, label, total: 0 });
      curr.setDate(curr.getDate() + 1);
      safety++;
    }

    // Filter & Sort Order
    const filtered = orders.filter(o => {
      if (!o.createdAt || o.status !== 'Selesai') return false;
      const oDate = getLocalDate(o.createdAt);
      return oDate >= startDate && oDate <= endDate;
    }).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    // Masukkan data ke Map
    filtered.forEach(o => {
      const oDate = getLocalDate(o.createdAt);
      const key = currentMode === 'harian' ? oDate : oDate.substring(0, 7);
      if (dataMap.has(key)) dataMap.get(key).total += Number(o.total) || 0;
    });

    const chartData = Array.from(dataMap.values());
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    return { 
      totalRevenue: filtered.reduce((acc, o) => acc + (Number(o.total) || 0), 0), 
      totalCount: filtered.length, 
      chartData, 
      maxTotal, 
      displayOrders: filtered,
      isForced: (diffDays > 31 && viewMode === 'harian') 
    };
  }, [orders, startDate, endDate, viewMode]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Laporan Penjualan</h2>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setViewMode('harian')} className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${viewMode === 'harian' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>HARIAN</button>
            <button onClick={() => setViewMode('bulanan')} className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${viewMode === 'bulanan' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>BULANAN</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-3 rounded-[2rem] border-2 border-orange-50 shadow-sm">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
          <span className="text-orange-300 font-black text-[10px]">TO</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
        </div>
      </div>

      {stats.isForced && (
        <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl text-xs font-bold border border-blue-100 animate-pulse">
          ℹ️ Tampilan dialihkan ke mode Bulanan karena rentang waktu lebih dari 31 hari.
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Omzet</p>
            <h3 className="text-4xl font-black italic">Rp {stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 w-24 h-24 bg-white rounded-full" />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Pesanan Sukses</p>
          <h3 className="text-4xl font-black text-gray-800 text-center">{stats.totalCount}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Rata-rata per Pesanan</p>
          <h3 className="text-4xl font-black text-orange-500 text-center">
            {/* PERBAIKAN: Pembagi menggunakan totalCount agar lebih akurat */}
            Rp {stats.totalCount > 0 ? Math.round(stats.totalRevenue / stats.totalCount).toLocaleString() : 0}
          </h3>
        </div>
      </div>

      {/* CHART BOX */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
        <h4 className="font-black text-gray-700 mb-12 flex items-center gap-2 uppercase text-xs tracking-widest">📈 Grafik Pendapatan</h4>
        <div ref={scrollRef} className="overflow-x-auto pb-6 scroll-smooth scrollbar-hide">
          <div 
            className="flex items-end h-72 gap-4 px-4 border-b-2 border-gray-50"
            style={{ 
              minWidth: stats.chartData.length > 8 ? `${stats.chartData.length * 70}px` : '100%',
              width: '100%'
            }}
          >
            {stats.chartData.map((d, i) => {
              const height = (d.total / stats.maxTotal) * 100;
              const labelNominal = d.total >= 1000 
                ? `${(d.total / 1000).toFixed(0)}k` 
                : d.total;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                  {d.total > 0 && (
                    <span className="text-[11px] font-black text-orange-600 mb-3 animate-bounce-short">
                      {labelNominal}
                    </span>
                  )}
                  
                  {/* Tooltip on Hover */}
                  {d.total > 0 && (
                    <div className="absolute -top-14 bg-gray-900 text-white text-[10px] px-4 py-2 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-50 font-bold whitespace-nowrap">
                      <p className="text-gray-400 text-[8px] uppercase">{d.label}</p>
                      <p className="text-orange-400 text-xs">Rp {d.total.toLocaleString()}</p>
                    </div>
                  )}

                  <div 
                    className="w-full bg-orange-500 rounded-t-2xl transition-all duration-700 hover:bg-orange-600 hover:shadow-lg shadow-orange-200"
                    style={{ height: `${height}%`, minHeight: d.total > 0 ? '8px' : '3px' }}
                  />
                  
                  <span className="text-[10px] font-black text-gray-400 mt-5 whitespace-nowrap uppercase tracking-tighter">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs">📜 Rincian Transaksi</h4>
          <button onClick={() => window.print()} className="bg-white border-2 border-orange-100 text-orange-600 px-6 py-2 rounded-2xl text-[10px] font-black hover:bg-orange-500 hover:text-white transition-all shadow-sm">CETAK</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="p-6">Waktu</th>
                <th className="p-6">Pelanggan & Pesanan</th>
                <th className="p-6 text-right">Total Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.displayOrders.length > 0 ? (
                [...stats.displayOrders].reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/20 transition-all group">
                    <td className="p-6">
                      <div className="text-xs font-bold text-gray-500">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] font-black text-gray-300">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-gray-800 uppercase text-xs mb-2 group-hover:text-orange-600 transition-colors">{o.customerName}</div>
                      <div className="space-y-2">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-[10px] text-gray-500 max-w-sm italic">
                            <span className="flex-1">• {item.name} {item.variant ? <span className="text-orange-400 font-black not-italic ml-1">({item.variant})</span> : ''} <span className="ml-1 text-gray-300 font-bold">x{item.quantity}</span></span>
                            <span className="font-black text-gray-400 ml-4">Rp {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-6 text-right font-black text-gray-900 text-lg">Rp {Number(o.total).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="font-black uppercase text-xs tracking-widest">Belum ada transaksi</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesLaporan;
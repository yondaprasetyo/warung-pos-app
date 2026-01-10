import React, { useMemo, useState } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);

  // 1. STATE UNTUK FILTER
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('harian'); // 'harian' atau 'bulanan'

  const stats = useMemo(() => {
    const getLocalDate = (dateSource) => {
      try {
        if (!dateSource) return null;
        const d = dateSource.toDate ? dateSource.toDate() : new Date(dateSource);
        return d.toLocaleDateString('en-CA'); 
      } catch { return null; }
    };

    const dataMap = new Map();
    const curr = new Date(startDate);
    const end = new Date(endDate);

    // 2. GENERATE PLACEHOLDERS BERDASARKAN MODE
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 400) {
      const dateKey = getLocalDate(new Date(curr));
      // Jika mode bulanan, gunakan key "YYYY-MM"
      const monthKey = dateKey.substring(0, 7); 
      const label = viewMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const key = viewMode === 'harian' ? dateKey : monthKey;
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { key, label, total: 0 });
      }
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }

    let totalRevenue = 0;
    let totalCount = 0;

    // 3. FILTER & AGREGASI DATA
    const filteredOrders = orders.filter(order => {
      if (!order.createdAt || order.status !== 'Selesai') return false;
      const orderDate = getLocalDate(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    filteredOrders.forEach(order => {
      const orderDateStr = getLocalDate(order.createdAt);
      const orderTotal = Number(order.total) || 0;
      totalRevenue += orderTotal;
      totalCount++;

      const key = viewMode === 'harian' ? orderDateStr : orderDateStr.substring(0, 7);
      if (dataMap.has(key)) {
        dataMap.get(key).total += orderTotal;
      }
    });

    const chartData = Array.from(dataMap.values());
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    return { totalRevenue, totalCount, chartData, maxTotal, displayOrders: filteredOrders };
  }, [orders, startDate, endDate, viewMode]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h2>
          {/* TOMBOL TOGGLE MODE */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl mt-2">
            <button 
              onClick={() => setViewMode('harian')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'harian' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
            >HARIAN</button>
            <button 
              onClick={() => setViewMode('bulanan')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'bulanan' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
            >BULANAN</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold p-2 bg-gray-50 rounded-xl outline-none" />
          <span className="text-gray-400 font-bold">s/d</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold p-2 bg-gray-50 rounded-xl outline-none" />
        </div>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-100 text-center md:text-left">
          <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Omzet</p>
          <h3 className="text-3xl font-black">Rp {stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center md:text-left">Pesanan Sukses</p>
          <h3 className="text-3xl font-black text-gray-800 text-center md:text-left">{stats.totalCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center md:text-left">Rata-rata Pendapatan</p>
          <h3 className="text-3xl font-black text-gray-800 text-center md:text-left">
            Rp {Math.round(stats.totalRevenue / (stats.chartData.length || 1)).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* GRAFIK DINAMIS DENGAN SCROLL */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-8 flex items-center gap-2">
          📈 Tren {viewMode === 'harian' ? 'Harian' : 'Bulanan'}
        </h4>
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-orange-200">
          <div 
            className="flex items-end justify-between h-64 gap-3 px-2 border-b border-gray-50"
            style={{ 
              minWidth: viewMode === 'harian' ? `${stats.chartData.length * 60}px` : '100%',
              width: '100%' 
            }}
          >
            {stats.chartData.map((day, i) => {
              const percentage = (day.total / stats.maxTotal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                  {day.total > 0 && (
                    <div className="absolute -top-10 bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl font-bold">
                      Rp {day.total.toLocaleString()}
                    </div>
                  )}
                  <div 
                    className="w-full bg-orange-500 rounded-t-xl transition-all duration-1000 hover:bg-orange-600 shadow-sm"
                    style={{ height: `${percentage}%`, minHeight: day.total > 0 ? '6px' : '2px' }}
                  />
                  <span className={`text-[10px] font-bold mt-4 whitespace-nowrap ${viewMode === 'bulanan' ? 'text-orange-600' : 'text-gray-400'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TABEL DETAIL */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center text-center md:text-left">
          <h4 className="font-bold text-gray-700 text-center md:text-left">📜 Detail Transaksi Sukses</h4>
          <button onClick={() => window.print()} className="text-xs font-black text-orange-600 uppercase tracking-widest border border-orange-100 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all">Cetak</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="p-5">Waktu Transaksi</th>
                <th className="p-5">Nama Pelanggan</th>
                <th className="p-5 text-right">Total Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {stats.displayOrders.length > 0 ? (
                stats.displayOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-5 text-gray-500 font-medium">
                      {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 font-bold text-gray-800 uppercase tracking-tighter">{order.customerName}</td>
                    <td className="p-5 text-right font-black text-gray-900">Rp {Number(order.total).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-10 text-center text-gray-400 font-bold italic">Data transaksi tidak ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesLaporan;
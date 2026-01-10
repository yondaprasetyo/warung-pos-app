import React, { useMemo, useState } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);

  // 1. STATE UNTUK FILTER TANGGAL (Default: 7 hari terakhir hingga hari ini)
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    // Fungsi pembantu untuk standarisasi tanggal ke YYYY-MM-DD
    const getLocalDate = (dateSource) => {
      try {
        if (!dateSource) return null;
        const d = dateSource.toDate ? dateSource.toDate() : new Date(dateSource);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-CA'); 
      } catch { return null; }
    };

    // 2. GENERATE LIST TANGGAL BERDASARKAN RENTANG PILIHAN
    const dateList = [];
    const curr = new Date(startDate);
    const end = new Date(endDate);
    
    // Batasi generate agar tidak crash jika rentang terlalu jauh
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 100) {
      dateList.push({
        dateStr: getLocalDate(new Date(curr)),
        label: new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        total: 0
      });
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }

    let totalRevenue = 0;
    let totalCount = 0;

    // 3. FILTER & PROSES DATA
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

      const dayData = dateList.find(d => d.dateStr === orderDateStr);
      if (dayData) dayData.total += orderTotal;
    });

    const maxTotal = Math.max(...dateList.map(d => d.total), 1);

    return { 
      totalRevenue, 
      totalCount, 
      chartData: dateList, 
      maxTotal,
      displayOrders: filteredOrders 
    };
  }, [orders, startDate, endDate]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h2>
          <p className="text-sm text-gray-500 font-medium">Pantau performa warung Anda</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-bold p-2 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-orange-500"
          />
          <span className="text-gray-400 font-bold">s/d</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-bold p-2 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-orange-500"
          />
        </div>
      </div>

      {/* KARTU STATISTIK BERDASARKAN FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-200">
          <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Omzet Periode Ini</p>
          <h3 className="text-3xl font-black">Rp {stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Pesanan Sukses</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.totalCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Record Filtered</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.displayOrders.length}</h3>
        </div>
      </div>

      {/* GRAFIK DINAMIS */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-8 flex items-center gap-2">📈 Tren Penjualan</h4>
        <div className="flex items-end justify-between h-56 gap-2 px-2 border-b border-gray-50">
          {stats.chartData.map((day, i) => {
            const percentage = (day.total / stats.maxTotal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {day.total > 0 && (
                  <div className="absolute -top-8 bg-gray-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Rp {day.total.toLocaleString()}
                  </div>
                )}
                <div 
                  className="w-full bg-orange-500 rounded-t-lg transition-all duration-700 hover:bg-orange-600"
                  style={{ height: `${percentage}%`, minHeight: day.total > 0 ? '4px' : '2px' }}
                />
                <span className="text-[9px] font-bold text-gray-400 mt-3 rotate-45 md:rotate-0">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABEL TRANSAKSI TERFILTER */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
          <h4 className="font-bold text-gray-700">📜 Detail Transaksi</h4>
          <button onClick={() => window.print()} className="text-xs font-black text-orange-600 uppercase tracking-widest">Cetak Laporan</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="p-5">Tanggal</th>
                <th className="p-5">Pelanggan</th>
                <th className="p-5 text-right">Total</th>
                <th className="p-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {stats.displayOrders.length > 0 ? (
                stats.displayOrders.slice(0, 50).map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-5 text-gray-500 font-medium">
                      {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 font-bold text-gray-800">{order.customerName}</td>
                    <td className="p-5 text-right font-black text-gray-900">Rp {Number(order.total).toLocaleString()}</td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-green-100 text-green-600">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 font-bold italic">Tidak ada data di rentang tanggal ini</td>
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
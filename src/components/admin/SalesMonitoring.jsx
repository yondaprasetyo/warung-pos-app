import React, { useMemo } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesMonitoring = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);

  // 1. Kalkulasi Statistik & Data Grafik
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    // Ambil data 7 hari terakhir untuk grafik
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateStr: d.toDateString(),
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        total: 0
      };
    }).reverse();

    let todayRevenue = 0;
    let todayCount = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      const isDone = order.status === 'Selesai';

      // Hitung Omzet Hari Ini
      if (orderDate === todayStr && isDone) {
        todayRevenue += (order.total || 0);
        todayCount++;
      }

      // Masukkan ke data grafik mingguan
      const dayData = last7Days.find(d => d.dateStr === orderDate);
      if (dayData && isDone) {
        dayData.total += (order.total || 0);
      }
    });

    // Cari nilai tertinggi untuk skala grafik
    const maxTotal = Math.max(...last7Days.map(d => d.total), 1);

    return {
      revenue: todayRevenue,
      count: todayCount,
      allTimeCount: orders.length,
      chartData: last7Days,
      maxTotal
    };
  }, [orders]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Monitoring Penjualan</h2>

      {/* 2. Kartu Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-lg shadow-orange-200">
          <p className="text-xs opacity-80 uppercase tracking-wider font-bold">Omzet Hari Ini</p>
          <h3 className="text-2xl font-black">Rp {stats.revenue.toLocaleString()}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Pesanan Selesai</p>
          <h3 className="text-2xl font-black text-gray-800">{stats.count} Transaksi</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Rekap Database</p>
          <h3 className="text-2xl font-black text-gray-800">{stats.allTimeCount}</h3>
        </div>
      </div>

      {/* 3. Grafik Batang Mingguan Manual (CSS Tailwind) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-6">Tren Omzet 7 Hari Terakhir</h4>
        <div className="flex items-end justify-between h-48 gap-2 px-2">
          {stats.chartData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
              {/* Batang Grafik */}
              <div className="w-full bg-orange-100 rounded-t-lg relative transition-all duration-500 group-hover:bg-orange-200"
                   style={{ height: `${(day.total / stats.maxTotal) * 100}%`, minHeight: '4px' }}>
                {/* Popover Nilai saat Hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Rp {day.total.toLocaleString()}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 mt-2">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tabel Transaksi Terbaru */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-gray-700">10 Transaksi Terakhir</h4>
          <span className="text-xs text-gray-500 italic">*Semua Status</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black">
              <tr>
                <th className="p-4">Waktu</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-bold text-gray-800">{order.customerName}</td>
                  <td className="p-4 text-right font-black">Rp {order.total?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                      order.status === 'Selesai' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesMonitoring;
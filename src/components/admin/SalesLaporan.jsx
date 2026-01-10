import React, { useMemo } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);

  const stats = useMemo(() => {
    // 1. Fungsi penanganan tanggal (Firebase Timestamp vs Date standar)
    const getLocalDate = (dateSource) => {
      try {
        if (!dateSource) return null;
        // Penanganan toDate() untuk Firebase
        const d = dateSource.toDate ? dateSource.toDate() : new Date(dateSource);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      } catch {
        return null;
      }
    };

    const todayStr = getLocalDate(new Date());
    
    // 2. Inisialisasi 7 hari terakhir
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateStr: getLocalDate(d),
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        total: 0
      };
    }).reverse();

    let todayRevenue = 0;
    let todayCount = 0;

    // 3. Iterasi pesanan untuk mengisi data
    orders.forEach(order => {
      // Hanya proses status 'Selesai'
      if (!order.createdAt || order.status !== 'Selesai') return;

      const orderDateStr = getLocalDate(order.createdAt);
      const orderTotal = Number(order.total) || 0;

      // Update Angka Kartu
      if (orderDateStr === todayStr) {
        todayRevenue += orderTotal;
        todayCount++;
      }

      // Update Array Grafik
      const dayData = last7Days.find(d => d.dateStr === orderDateStr);
      if (dayData) {
        dayData.total += orderTotal;
      }
    });

    // Cari nilai tertinggi untuk skala grafik (minimal 1 agar tidak bagi nol)
    const maxTotal = Math.max(...last7Days.map(d => d.total), 1);

    return { todayRevenue, todayCount, allTimeCount: orders.length, chartData: last7Days, maxTotal };
  }, [orders]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h2>
        <div className="text-sm font-medium text-orange-600 bg-orange-50 px-4 py-1 rounded-full border border-orange-100">
          Real-time
        </div>
      </div>

      {/* SECTION KARTU ANGKA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-lg shadow-orange-100">
          <p className="text-xs opacity-80 uppercase font-bold tracking-widest">Omzet Hari Ini</p>
          <h3 className="text-3xl font-black">Rp {stats.todayRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Pesanan Sukses</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.todayCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Record</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.allTimeCount}</h3>
        </div>
      </div>

      {/* SECTION GRAFIK */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-8 flex items-center gap-2">
          📈 Tren Omzet 7 Hari Terakhir
        </h4>
        <div className="flex items-end justify-between h-56 gap-3 px-2 border-b-2 border-gray-50">
          {stats.chartData.map((day, i) => {
            // FORCE CALCULATION: Pastikan hasil pembagian tidak menghasilkan NaN
            const percentage = stats.maxTotal > 0 ? (day.total / stats.maxTotal) * 100 : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Label Nilai di Atas Batang (Selalu Muncul jika > 0) */}
                {day.total > 0 && (
                  <span className="text-[9px] font-black text-orange-500 mb-2">
                    {(day.total / 1000)}k
                  </span>
                )}

                {/* Batang Grafik dengan Inline Style yang Lebih Kuat */}
                <div 
                  className="w-full bg-orange-500 rounded-t-lg transition-all duration-500 hover:bg-orange-600 shadow-sm"
                  style={{ 
                    height: `${percentage}%`, 
                    minHeight: day.total > 0 ? '4px' : '2px', // Agar yang ada isinya terlihat beda
                    display: 'block' 
                  }}
                >
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                    Rp {day.total.toLocaleString()}
                  </div>
                </div>

                {/* Label Hari */}
                <span className={`text-[10px] mt-4 font-bold ${day.dateStr === new Date().toLocaleDateString('en-CA') ? 'text-orange-600' : 'text-gray-400'}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION TABEL TRANSAKSI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
          <h4 className="font-bold text-gray-700">📜 10 Transaksi Terakhir</h4>
          <button onClick={() => window.print()} className="text-xs font-bold text-orange-600 hover:text-orange-700">
            Cetak Laporan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="p-4 border-b">Jam</th>
                <th className="p-4 border-b">Nama Pelanggan</th>
                <th className="p-4 border-b text-right">Total Bayar</th>
                <th className="p-4 border-b text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {orders.slice(0, 10).map((order) => {
                const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                return (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 text-gray-500 font-medium">
                      {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-gray-800">{order.customerName}</td>
                    <td className="p-4 text-right font-black text-gray-900">Rp {Number(order.total).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                        order.status === 'Selesai' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesLaporan;
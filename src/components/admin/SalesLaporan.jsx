import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const scrollRef = useRef(null);

  // --- LOGIKA TANGGAL ---
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('harian');

  // --- AMBIL DATA PRODUK UNTUK STOK ---
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchStock();
  }, [orders]); // Refresh stok jika ada pesanan baru

  // --- LOGIKA FILTER STOK ---
  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredStock = useMemo(() => {
    if (selectedCategory === 'Semua') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // --- PERHITUNGAN STATISTIK & GRAFIK ---
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
    const currentMode = (diffDays > 31 && viewMode === 'harian') ? 'bulanan' : viewMode;

    const dataMap = new Map();
    let curr = new Date(start);
    
    // Generate Range Tanggal untuk Grafik
    while (curr <= end) {
      const dStr = getLocalDate(new Date(curr));
      const key = currentMode === 'harian' ? dStr : dStr.substring(0, 7);
      const label = currentMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (!dataMap.has(key)) dataMap.set(key, { key, label, total: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    // Filter Order Selesai
    const filtered = orders.filter(o => {
      if (!o.createdAt || o.status !== 'Selesai') return false;
      const oDate = getLocalDate(o.createdAt);
      return oDate >= startDate && oDate <= endDate;
    }).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    // Mapping Data ke Grafik
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

  // Auto-scroll grafik ke kanan
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [stats.chartData]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24 font-sans select-none">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic uppercase">Laporan & Stok</h2>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setViewMode('harian')} className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${viewMode === 'harian' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400'}`}>HARIAN</button>
            <button onClick={() => setViewMode('bulanan')} className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${viewMode === 'bulanan' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400'}`}>BULANAN</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-3 rounded-[2rem] border-2 border-orange-50 shadow-sm">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
          <span className="text-orange-300 font-black text-[10px]">KE</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
        </div>
      </div>

      {stats.isForced && (
        <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl text-xs font-bold border border-blue-100 animate-pulse">
          ℹ️ Mode otomatis dialihkan ke Bulanan karena rentang waktu &gt; 31 hari.
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Omzet</p>
            <h3 className="text-3xl font-black">Rp {stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 w-24 h-24 bg-white rounded-full" />
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Stok Kritis (&le;5)</p>
          <h3 className={`text-4xl font-black ${products.filter(p => p.stock >= 0 && p.stock <= 5).length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
            {products.filter(p => p.stock >= 0 && p.stock <= 5).length}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Pesanan Sukses</p>
          <h3 className="text-4xl font-black text-orange-500">{stats.totalCount}</h3>
        </div>
      </div>

      {/* GRAPH & STOCK MONITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH (2/3) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
          <h4 className="font-black text-gray-700 mb-10 flex items-center gap-2 uppercase text-xs tracking-widest">📈 Grafik Pendapatan</h4>
          <div ref={scrollRef} className="overflow-x-auto pb-6 scroll-smooth scrollbar-hide">
            <div 
              className="flex items-end h-64 gap-4 px-4 border-b-2 border-gray-50"
              style={{ minWidth: stats.chartData.length > 8 ? `${stats.chartData.length * 60}px` : '100%' }}
            >
              {stats.chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                  {d.total > 0 && (
                    <span className="text-[10px] font-black text-orange-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(d.total / 1000).toFixed(0)}k
                    </span>
                  )}
                  <div 
                    className="w-full bg-orange-500 rounded-t-xl transition-all duration-500 hover:bg-orange-600 shadow-orange-100"
                    style={{ height: `${(d.total / stats.maxTotal) * 100}%`, minHeight: d.total > 0 ? '6px' : '2px' }}
                  />
                  <span className="text-[9px] font-black text-gray-400 mt-4 uppercase whitespace-nowrap tracking-tighter">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STOCK MONITOR (1/3) */}
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col border-4 border-gray-800">
          <div className="flex flex-col gap-4 mb-6">
            <h4 className="font-black text-orange-400 uppercase text-xs tracking-widest italic">📦 Monitor Stok</h4>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 text-[10px] font-black uppercase p-3 rounded-xl outline-none border-none text-orange-200 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1 max-h-[400px]">
            {filteredStock.length > 0 ? filteredStock.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3 group">
                <div className="flex flex-col max-w-[140px]">
                  <span className="text-[11px] font-bold group-hover:text-orange-300 transition-colors truncate uppercase">{p.name}</span>
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">{p.category || 'N/A'}</span>
                </div>
                <div className="text-right">
                  {p.stock === -1 ? (
                    <span className="text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-md tracking-tighter">∞ UNLIMITED</span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full ${p.stock <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                        {p.stock}
                      </span>
                      <span className="text-[7px] font-black text-gray-600 uppercase mt-1">Sisa Stok</span>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20 text-[10px] font-black uppercase tracking-widest">Kosong</div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSAKSI TERBARU */}
      <div className="bg-white rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs">📜 Rincian Transaksi Selesai</h4>
          <button onClick={() => window.print()} className="bg-white border-2 border-orange-500 text-orange-500 px-6 py-2 rounded-2xl text-[10px] font-black hover:bg-orange-500 hover:text-white transition-all">CETAK PDF</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="p-6">Waktu</th>
                <th className="p-6">Pelanggan & Menu</th>
                <th className="p-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.displayOrders.length > 0 ? (
                [...stats.displayOrders].reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/20 transition-all group">
                    <td className="p-6">
                      <div className="text-xs font-bold text-gray-600 uppercase">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] font-black text-gray-300">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-gray-800 uppercase text-xs mb-1">{o.customerName}</div>
                      <div className="flex flex-wrap gap-1">
                        {o.items?.map((item, idx) => (
                          <span key={idx} className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold uppercase">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-6 text-right font-black text-gray-900 text-sm italic">Rp {Number(o.total).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">Tidak ada transaksi</td>
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
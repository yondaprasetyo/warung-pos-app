import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Search, MessageSquare, Filter, Package, TrendingUp, Calendar, Printer, StickyNote } from 'lucide-react';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedVariant, setSelectedVariant] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [orders]);

  // --- EXTRACT VARIAN UNIK (HANYA YANG RELEVAN) ---
  const allVariants = useMemo(() => {
    const variants = new Set();
    orders.forEach(o => {
      o.items?.forEach(item => {
        if (item.variant && item.variant.toUpperCase() !== "TANPA VARIAN") {
          variants.add(item.variant);
        }
      });
    });
    return ['Semua', ...Array.from(variants)];
  }, [orders]);

  const categories = useMemo(() => {
    return ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
  }, [products]);

  const filteredStock = useMemo(() => {
    if (selectedCategory === 'Semua') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // --- PERHITUNGAN STATISTIK & FILTERING ---
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
    
    while (curr <= end) {
      const dStr = getLocalDate(new Date(curr));
      const key = currentMode === 'harian' ? dStr : dStr.substring(0, 7);
      const label = currentMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (!dataMap.has(key)) dataMap.set(key, { key, label, total: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    const filteredByDate = orders.filter(o => {
      if (!o.createdAt || o.status !== 'Selesai') return false;
      const oDate = getLocalDate(o.createdAt);
      return oDate >= startDate && oDate <= endDate;
    }).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    // Logic Pencarian & Varian
    const displayOrders = filteredByDate.filter(o => {
      const matchSearch = o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVariant = selectedVariant === 'Semua' || 
                           o.items?.some(item => item.variant === selectedVariant);
      return matchSearch && matchVariant;
    });

    filteredByDate.forEach(o => {
      const oDate = getLocalDate(o.createdAt);
      const key = currentMode === 'harian' ? oDate : oDate.substring(0, 7);
      if (dataMap.has(key)) dataMap.get(key).total += Number(o.total) || 0;
    });

    const chartData = Array.from(dataMap.values());
    const maxTotal = Math.max(...chartData.map(d => d.total), 1);

    return { 
      totalRevenue: filteredByDate.reduce((acc, o) => acc + (Number(o.total) || 0), 0), 
      totalCount: filteredByDate.length, 
      chartData, 
      maxTotal, 
      displayOrders,
      isForced: (diffDays > 31 && viewMode === 'harian') 
    };
  }, [orders, startDate, endDate, viewMode, searchQuery, selectedVariant]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [stats.chartData]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24 font-sans select-none bg-gray-50/50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic uppercase flex items-center gap-3">
            <TrendingUp className="text-orange-500" size={32} />
            Laporan & Stok
          </h2>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setViewMode('harian')} className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all shadow-sm ${viewMode === 'harian' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>HARIAN</button>
            <button onClick={() => setViewMode('bulanan')} className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all shadow-sm ${viewMode === 'bulanan' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>BULANAN</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border-2 border-orange-50 shadow-xl shadow-orange-100/20">
          <Calendar size={18} className="text-orange-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
          <span className="text-orange-200 font-black text-[10px]">SAMPAI</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold bg-transparent outline-none text-gray-600 cursor-pointer" />
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-black text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">Total Omzet</p>
            <h3 className="text-3xl font-black italic">Rp {stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" size={120} />
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center group">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Stok Kritis (&le;5)</p>
          <h3 className={`text-4xl font-black italic ${products.filter(p => p.stock >= 0 && p.stock <= 5).length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
            {products.filter(p => p.stock >= 0 && p.stock <= 5).length}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Pesanan Sukses</p>
          <h3 className="text-4xl font-black text-orange-500 italic">{stats.totalCount}</h3>
        </div>
      </div>

      {/* GRAPH & STOCK MONITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
          <h4 className="font-black text-gray-700 mb-10 flex items-center gap-2 uppercase text-xs tracking-widest italic">📈 Grafik Arus Kas</h4>
          <div ref={scrollRef} className="overflow-x-auto pb-6 scrollbar-hide">
            <div className="flex items-end h-64 gap-4 px-4 border-b-2 border-gray-50" style={{ minWidth: stats.chartData.length > 8 ? `${stats.chartData.length * 70}px` : '100%' }}>
              {stats.chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                  {d.total > 0 && (
                    <span className="text-[9px] font-black text-orange-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-50 px-2 py-1 rounded-lg">
                      Rp {(d.total / 1000).toFixed(0)}k
                    </span>
                  )}
                  <div 
                    className="w-full bg-orange-500 rounded-t-2xl transition-all duration-500 hover:bg-black shadow-lg"
                    style={{ height: `${(d.total / stats.maxTotal) * 100}%`, minHeight: d.total > 0 ? '8px' : '2px' }}
                  />
                  <span className="text-[9px] font-black text-gray-400 mt-4 uppercase whitespace-nowrap tracking-tighter">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STOCK MONITOR */}
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col border-4 border-gray-800">
          <div className="flex flex-col gap-4 mb-8">
            <h4 className="font-black text-orange-400 uppercase text-xs tracking-widest italic flex items-center gap-2">
              <Package size={16} /> Monitor Stok
            </h4>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 text-[10px] font-black uppercase p-4 rounded-2xl outline-none border-none text-orange-200 cursor-pointer hover:bg-gray-700 transition-all"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1 max-h-[380px]">
            {filteredStock.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3 group">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold group-hover:text-orange-300 transition-colors uppercase">{p.name}</span>
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">{p.category}</span>
                </div>
                <div className="text-right">
                  {p.stock === -1 ? (
                    <span className="text-[8px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-md">UNLIMITED</span>
                  ) : (
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full ${p.stock <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                      {p.stock}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED TRANSACTIONS TABLE */}
      <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs italic flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" /> Rincian Transaksi Selesai
          </h4>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* VARIANT FILTER */}
            <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-2xl px-4 py-2 group focus-within:border-orange-500 transition-all shadow-sm">
              <Filter size={14} className="text-orange-500 mr-2" />
              <select 
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="bg-transparent text-[10px] font-black text-gray-600 outline-none uppercase cursor-pointer"
              >
                <option value="Semua">Varian: Semua</option>
                {allVariants.filter(v => v !== 'Semua').map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* SEARCH BOX */}
            <div className="relative group w-full md:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cari nama atau ID pesanan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold text-gray-600 outline-none focus:border-orange-500 transition-all shadow-sm"
              />
            </div>

            <button onClick={() => window.print()} className="bg-black text-white p-3 rounded-2xl hover:bg-orange-500 transition-all shadow-lg active:scale-90">
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-50">
              <tr>
                <th className="p-8">Waktu Transaksi</th>
                <th className="p-8">Pelanggan & Rincian Pesanan</th>
                <th className="p-8 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.displayOrders.length > 0 ? (
                [...stats.displayOrders].reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/10 transition-all group">
                    <td className="p-8">
                      <div className="text-xs font-black text-gray-700 uppercase">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })}
                      </div>
                      <div className="text-[10px] font-black text-orange-400 mt-1">
                        {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-xs">
                          {o.customerName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-800 uppercase text-xs tracking-tight">{o.customerName}</span>
                          <span className="text-[9px] font-bold text-gray-300 tracking-widest">ID: {o.id?.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="flex flex-col border-l-4 border-gray-50 pl-4 group-hover:border-orange-200 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-600 uppercase italic leading-none">{item.name}</span>
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black">x{item.quantity}</span>
                              
                              {/* FIX 1: HANYA TAMPILKAN VARIAN YANG BUKAN "TANPA VARIAN" */}
                              {item.variant && item.variant.toUpperCase() !== "TANPA VARIAN" && (
                                <span className={`text-[8px] px-2 py-0.5 rounded-md font-black italic uppercase shadow-sm ${item.variant === selectedVariant ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                  {item.variant}
                                </span>
                              )}
                            </div>

                            {/* FIX 2: MENAMPILKAN NOTES (CATATAN) DENGAN VISUAL MENCOLOK */}
                            {item.notes && (
                              <div className="text-[9px] text-orange-600 font-black italic mt-1.5 uppercase tracking-tighter flex items-center gap-1.5 bg-orange-50 w-fit px-2 py-1 rounded-lg border border-orange-100">
                                <StickyNote size={10} className="text-orange-500" /> "{item.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="text-sm font-black text-gray-900 italic">Rp {Number(o.total).toLocaleString()}</div>
                      <div className="text-[9px] text-green-500 font-black uppercase mt-1">Lunas ✔</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Search size={64} className="mb-4 text-gray-400" />
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                      <p className="text-[10px] mt-1 font-bold italic">Coba ubah kata kunci atau filter Anda</p>
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
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { formatRupiah } from '../../utils/format';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Search, Filter, Package, TrendingUp, Calendar, 
  Printer, StickyNote, CheckCircle, X, Clock, Award, BarChart3,
  ChevronLeft, ChevronRight 
} from 'lucide-react';

const SalesLaporan = () => {
  const { currentUser } = useAuth();
  const { orders } = useShop(currentUser);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedTransactionCategory, setSelectedTransactionCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- LOGIKA TANGGAL ---
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('harian');

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getOrderTargetDate = (order) => {
    try {
      if (order.orderDate) return new Date(order.orderDate);
      if (order.note && typeof order.note === 'string' && order.note.includes("Order untuk tanggal:")) {
        const dateString = order.note.split("Order untuk tanggal:")[1].trim();
        const months = {
          'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
          'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
        };
        const parts = dateString.split(', ');
        if (parts.length > 1) {
           const [day, monthName, year] = parts[1].split(' ');
           if (months[monthName] !== undefined) return new Date(year, months[monthName], parseInt(day));
        }
      }
      return order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    } catch { 
      return order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || new Date());
    }
  };

  // --- PERHITUNGAN STATISTIK, MENU TERLARIS & PAGINATION ---
  const stats = useMemo(() => {
    const getFormattedISODate = (dateObj) => {
      try {
        if (!dateObj) return null;
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localDate = new Date(dateObj.getTime() - offset);
        return localDate.toISOString().split('T')[0];
      } catch { return null; }
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dataMap = new Map();
    let curr = new Date(start);
    while (curr <= end) {
      const dStr = getFormattedISODate(new Date(curr));
      const key = viewMode === 'harian' ? dStr : dStr.substring(0, 7);
      const label = viewMode === 'harian' 
        ? new Date(curr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : new Date(curr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!dataMap.has(key)) dataMap.set(key, { key, label, total: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    const filteredByDate = orders.filter(o => {
      const status = (o.status || '').toLowerCase();
      if (status !== 'selesai' && status !== 'completed') return false;
      const targetDateISO = getFormattedISODate(getOrderTargetDate(o));
      return targetDateISO >= startDate && targetDateISO <= endDate;
    }).sort((a, b) => getOrderTargetDate(a) - getOrderTargetDate(b));

    const productMap = new Map();
    filteredByDate.forEach(o => {
      const targetDateISO = getFormattedISODate(getOrderTargetDate(o));
      const key = viewMode === 'harian' ? targetDateISO : targetDateISO.substring(0, 7);
      if (dataMap.has(key)) dataMap.get(key).total += Number(o.total) || 0;

      o.items?.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.id === item.id?.split('-')[0]);
        item.virtualCategory = prod?.category || "Lainnya";

        const fullName = `${item.name}${item.variant && item.variant.toUpperCase() !== "TANPA VARIAN" ? ` (${item.variant})` : ""}`;
        if (!productMap.has(fullName)) {
          productMap.set(fullName, { name: item.name, fullName, qty: 0, revenue: 0 });
        }
        const prodData = productMap.get(fullName);
        prodData.qty += Number(item.quantity) || 0;
        prodData.revenue += (Number(item.price) * Number(item.quantity)) || 0;
      });
    });

    const excludedKeywords = ['NASI', 'SAMBAL GORENG'];
    const topMenuStats = Array.from(productMap.values())
      .filter(m => !excludedKeywords.some(key => m.fullName.toUpperCase().includes(key)))
      .sort((a, b) => b.qty - a.qty);

    const filteredOrders = filteredByDate.filter(o => {
      const matchSearch = o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedTransactionCategory === 'Semua' || o.items?.some(item => item.virtualCategory === selectedTransactionCategory);
      return matchSearch && matchCategory;
    });

    const indexOfLastOrder = currentPage * rowsPerPage;
    const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
    const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

    return { 
      totalRevenue: filteredByDate.reduce((acc, o) => acc + (Number(o.total) || 0), 0), 
      totalCount: filteredByDate.length, 
      chartData: Array.from(dataMap.values()), 
      maxTotal: Math.max(...Array.from(dataMap.values()).map(d => d.total), 1), 
      displayOrders: paginatedOrders,
      totalFiltered: filteredOrders.length,
      totalPages,
      topMenuStats
    };
  }, [orders, startDate, endDate, viewMode, searchQuery, selectedTransactionCategory, products, currentPage, rowsPerPage]);

  // --- LOGIKA MONITOR STOK PRIORITAS ---
  const filteredStock = useMemo(() => {
    let list = selectedCategory === 'Semua' ? products : products.filter(p => p.category === selectedCategory);
    return [...list].sort((a, b) => {
      const getPriority = (item) => {
        if (item.stock === -1) return 3; // Unlimited paling bawah
        if (item.stock <= 5) return 1;   // Stok kritis paling atas
        return 2;
      };
      const priA = getPriority(a);
      const priB = getPriority(b);
      return priA !== priB ? priA - priB : a.name.localeCompare(b.name);
    });
  }, [products, selectedCategory]);

  // --- USE EFFECTS ---
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;
    let isDown = false; let startX; let scrollLeft;
    const handleMouseDown = (e) => { isDown = true; slider.classList.add('active'); startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; };
    const handleMouseLeave = () => isDown = false;
    const handleMouseUp = () => isDown = false;
    const handleMouseMove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 2; slider.scrollLeft = scrollLeft - walk; };
    slider.addEventListener('mousedown', handleMouseDown); slider.addEventListener('mouseleave', handleMouseLeave); slider.addEventListener('mouseup', handleMouseUp); slider.addEventListener('mousemove', handleMouseMove);
    return () => {
      slider.removeEventListener('mousedown', handleMouseDown); slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp); slider.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; }, [stats.chartData]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); }
    };
    fetchStock();
  }, [orders]);

  // --- HANDLERS ---
  const handleModeChange = (mode) => {
    const now = new Date();
    setCurrentPage(1);
    if (mode === 'bulanan') {
      setViewMode('bulanan');
      setStartDate(formatLocalDate(new Date(now.getFullYear(), 0, 1)));
      setEndDate(formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    } else {
      setViewMode('harian');
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 6);
      setStartDate(formatLocalDate(sevenDaysAgo)); setEndDate(formatLocalDate(now));
    }
  };

  const categories = useMemo(() => ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24 font-sans select-none bg-gray-50/50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic uppercase flex items-center gap-3">
            <TrendingUp className="text-orange-500" size={32} /> Laporan & Stok
          </h2>
          <div className="flex gap-2 mt-4">
            <button onClick={() => handleModeChange('harian')} className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all shadow-sm ${viewMode === 'harian' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>HARIAN</button>
            <button onClick={() => handleModeChange('bulanan')} className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all shadow-sm ${viewMode === 'bulanan' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>BULANAN</button>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border-2 border-orange-50 shadow-xl shadow-orange-100/20">
          <Calendar size={18} className="text-orange-400" />
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="text-xs font-bold bg-transparent outline-none cursor-pointer text-gray-600" />
          <span className="text-orange-200 font-black text-[10px]">SAMPAI</span>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="text-xs font-bold bg-transparent outline-none cursor-pointer text-gray-600" />
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-black text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">Total Omzet</p>
            <h3 className="text-3xl font-black italic">{formatRupiah(stats.totalRevenue)}</h3>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" size={120} />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center group">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Stok Kritis (&le;5 pcs)</p>
          <h3 className={`text-4xl font-black italic ${products.filter(p => p.stock >= 0 && p.stock <= 5).length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>{products.filter(p => p.stock >= 0 && p.stock <= 5).length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Pesanan</p>
          <h3 className="text-4xl font-black text-orange-500 italic">{stats.totalCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* GRAFIK */}
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
            <h4 className="font-black text-gray-700 mb-10 flex items-center gap-2 uppercase text-xs tracking-widest italic">📈 Grafik Penjualan</h4>
            <div ref={scrollRef} className="overflow-x-auto pb-6 scrollbar-hide select-none cursor-grab active:cursor-grabbing">
              <div className="flex items-end h-64 gap-4 px-4 border-b-2 border-gray-50" style={{ minWidth: viewMode === 'harian' ? `${stats.chartData.length * 65}px` : '100%' }}>
                {stats.chartData.map((d, i) => {
                  const colors = ['bg-orange-500', 'bg-red-500', 'bg-yellow-500', 'bg-rose-500', 'bg-amber-500'];
                  const barColor = colors[i % colors.length];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[50px]">
                      {d.total > 0 && <span className="text-[9px] font-black text-gray-700 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 px-2 py-1 rounded-lg z-20 whitespace-nowrap shadow-sm">{formatRupiah(d.total)}</span>}
                      <div className={`w-full ${barColor} rounded-t-2xl transition-all duration-500 hover:brightness-110 shadow-lg`} style={{ height: `${(d.total / stats.maxTotal) * 100}%`, minHeight: d.total > 0 ? '8px' : '2px' }} />
                      <span className="text-[9px] font-black text-gray-400 mt-4 uppercase whitespace-nowrap tracking-tighter">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TOP MENU */}
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h4 className="font-black text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest italic"><Award className="text-orange-500" size={18} /> 5 Menu Paling Diminati</h4>
               <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase italic">Juara: {stats.topMenuStats[0]?.fullName || '-'}</span>
            </div>
            <div className="space-y-3">
              {stats.topMenuStats.slice(0, 5).map((menu, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-3xl border border-gray-100 group hover:border-orange-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400'}`}>#{idx + 1}</div>
                    <span className="text-xs font-black text-gray-800 uppercase leading-none">{menu.fullName}</span>
                  </div>
                  <div className="flex items-center gap-8 text-right">
                    <div className="flex flex-col text-right"><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Terjual</span><span className="text-sm font-black text-gray-800">{menu.qty} <span className="text-[10px]">Porsi</span></span></div>
                    <div className="flex flex-col min-w-[100px] text-right"><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Kontribusi</span><span className="text-sm font-black text-orange-600">{formatRupiah(menu.revenue)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MONITOR STOK */}
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col border-4 border-gray-800 h-fit sticky top-24">
          <div className="flex flex-col gap-4 mb-8">
            <h4 className="font-black text-orange-400 uppercase text-xs tracking-widest italic flex items-center gap-2"><Package size={16} /> Monitor Stok</h4>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-800 text-[10px] font-black uppercase p-4 rounded-2xl outline-none border-none text-orange-200 cursor-pointer hover:bg-gray-700 transition-all">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide max-h-[500px]">
            {filteredStock.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3 group">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold group-hover:text-orange-300 transition-colors uppercase">{p.name}</span>
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">{p.category}</span>
                </div>
                <div className="text-right">
                  {p.stock === -1 ? <span className="text-[8px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-md">UNLIMITED</span> : <span className={`text-[11px] font-black px-3 py-1 rounded-full ${p.stock <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>{p.stock}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE RINCIAN DENGAN PAGINATION */}
      <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden mt-6">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs italic flex items-center gap-2"><TrendingUp size={16} className="text-orange-500" /> Rincian Transaksi</h4>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-2">
              <span className="text-[9px] font-black text-gray-400 uppercase mr-3 italic">Lihat:</span>
              {[10, 30, 50, 100].map(num => (
                <button key={num} onClick={() => { setRowsPerPage(num); setCurrentPage(1); }} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${rowsPerPage === num ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-orange-500'}`}>{num}</button>
              ))}
            </div>

            <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-2xl px-4 py-2 group focus-within:border-orange-500 transition-all shadow-sm">
              <Filter size={14} className="text-orange-500 mr-2" />
              <select value={selectedTransactionCategory} onChange={(e) => { setSelectedTransactionCategory(e.target.value); setCurrentPage(1); }} className="bg-transparent text-[10px] font-black text-gray-600 outline-none uppercase cursor-pointer">
                <option value="Semua">Kategori: Semua</option>
                {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="relative group w-full md:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input type="text" placeholder="Cari nama atau ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold text-gray-600 outline-none focus:border-orange-500 transition-all shadow-sm" />
            </div>
            
            <button onClick={() => window.print()} className="bg-black text-white p-3 rounded-2xl hover:bg-orange-500 transition-all active:scale-90"><Printer size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-50">
              <tr>
                <th className="p-8 text-orange-600">Pesanan Untuk Tanggal</th>
                <th className="p-8">Tanggal/Waktu Input Pemesanan</th>
                <th className="p-8">Pelanggan & Pesanan</th>
                <th className="p-8 text-right">Nominal & Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.displayOrders.map((o) => {
                const targetDate = getOrderTargetDate(o);
                return (
                  <tr key={o.id} className="hover:bg-orange-50/10 transition-all group">
                    <td className="p-8">
                      <div className="text-sm font-black text-orange-500 uppercase italic">{targetDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{targetDate.toLocaleDateString('id-ID', { weekday: 'long' })}</div>
                    </td>
                    <td className="p-8 opacity-60">
                       <div className="text-[10px] font-bold text-gray-700 flex items-center gap-1"><Clock size={10} />{new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                       <div className="text-[9px] font-bold text-gray-400 mt-0.5">{new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-xs">{o.customerName?.charAt(0).toUpperCase()}</div>
                        <div className="flex flex-col"><span className="font-black text-gray-800 uppercase text-xs tracking-tight">{o.customerName}</span><span className="text-[9px] font-bold text-gray-300 tracking-widest">ID: {o.id?.slice(-8).toUpperCase()}</span></div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className={`flex flex-col border-l-4 pl-4 transition-colors ${item.virtualCategory === selectedTransactionCategory ? 'border-orange-500' : 'border-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-600 uppercase italic leading-none">{item.name}</span>
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black">x{item.quantity}</span>
                              <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase italic shadow-sm">{item.virtualCategory}</span>
                            </div>
                            {/* CATATAN ITEM (MENCEGAH TERHAPUS) */}
                            {item.notes && (
                              <div className="text-[9px] text-orange-600 font-black italic mt-1.5 uppercase tracking-tighter flex items-center gap-1.5 bg-orange-50 w-fit px-2 py-1 rounded-lg border border-orange-100 shadow-sm shadow-orange-100/50 animate-in fade-in slide-in-from-left-2 duration-300">
                                <StickyNote size={10} className="text-orange-500" /> "{item.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="text-sm font-black text-gray-900 italic text-right">{formatRupiah(o.total)}</div>
                      {o.isPaid ? <div className="text-[9px] text-green-500 font-black uppercase mt-1 flex justify-end items-center gap-1 text-right">Lunas <CheckCircle size={10} /></div> : <div className="text-[9px] text-red-500 font-black uppercase mt-1 flex justify-end items-center gap-1 text-right">Belum Bayar <X size={10} /></div>}
                    </td>
                  </tr>
                );
              })}
              {stats.displayOrders.length === 0 && (
                <tr><td colSpan="4" className="p-32 text-center"><div className="flex flex-col items-center justify-center opacity-20"><Search size={64} className="mb-4 text-gray-400" /><p className="text-sm font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-gray-400 uppercase italic">
            Menampilkan <span className="text-gray-800">{stats.displayOrders.length}</span> dari <span className="text-orange-600">{stats.totalFiltered}</span> pesanan
          </p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-3 rounded-xl bg-white border border-gray-100 text-gray-400 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-30"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-1">
              {[...Array(stats.totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 border border-gray-100 hover:border-orange-500'}`}>{i + 1}</button>
              )).slice(Math.max(0, currentPage - 3), Math.min(stats.totalPages, currentPage + 2))}
            </div>
            <button disabled={currentPage === stats.totalPages || stats.totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-3 rounded-xl bg-white border border-gray-100 text-gray-400 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesLaporan;
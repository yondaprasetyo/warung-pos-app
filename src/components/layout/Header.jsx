import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Receipt, 
  User, 
  LogOut, 
  Users, 
  ArrowLeft, 
  Utensils, 
  BarChart3, 
  Menu, 
  X,
  CalendarClock 
} from 'lucide-react';

const Header = ({ user, cartCount, ordersCount, onNavigate, onLogout, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- DAFTAR MENU ---
  const navItems = [
    { 
      id: 'laporan', 
      label: 'Laporan', 
      icon: <BarChart3 size={20} />, 
      show: user?.role === 'admin' 
    },
    { 
      id: 'manage-menu', 
      label: 'Kelola Menu', 
      icon: <Utensils size={20} />, 
      show: user?.role === 'admin' 
    },
    { 
      id: 'schedule', 
      label: 'Atur Jadwal', 
      icon: <CalendarClock size={20} />, 
      show: user?.role === 'admin' 
    },
    { 
      id: 'users', 
      label: 'Kelola User', 
      icon: <Users size={20} />, 
      show: user?.role === 'admin' 
    },
    { 
      id: 'orders', 
      label: 'Pesanan', 
      icon: <Receipt size={20} />, 
      show: true,
      badge: ordersCount 
    },
    { 
      id: 'cart', 
      label: 'Keranjang', 
      icon: <ShoppingCart size={20} />, 
      show: true,
      badge: cartCount 
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: <User size={20} />, 
      show: true 
    },
  ];

  const handleNavClick = (view) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const renderBadge = (count) => {
    if (!count || count <= 0) return null;
    return (
      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-lg px-1 animate-bounce">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg z-[1000] h-[72px]">
      <div className="max-w-6xl mx-auto px-4 h-full flex justify-between items-center relative">
        
        {/* --- KIRI: LOGO & JUDUL --- */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {currentView !== 'menu' && (
            <button 
              onClick={() => onNavigate('exit-to-welcome')}
              className="hover:bg-white/20 p-2 rounded-lg transition active:scale-95 flex-shrink-0"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          
          <h1 
            onClick={() => onNavigate('exit-to-welcome')}
            className="font-bold truncate tracking-tight cursor-pointer leading-tight text-sm sm:text-xl"
          >
            🍽️ Warung Makan Mamah Yonda
          </h1>
        </div>
        
        {/* --- KANAN (DESKTOP) --- */}
        <div className="hidden md:flex gap-1 items-center">
          <div className="text-sm mr-2 text-right">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-[10px] opacity-90 capitalize bg-white/20 px-2 py-0.5 rounded-full inline-block">
              {user?.role}
            </div>
          </div>

          {navItems.map((item) => (
            item.show && (
              <button 
                key={item.id} 
                onClick={() => handleNavClick(item.id)}
                className={`p-2.5 rounded-xl transition relative flex items-center justify-center ${
                  currentView === item.id ? 'bg-white text-orange-600 shadow-md' : 'hover:bg-white/20 text-white'
                }`}
                title={item.label}
              >
                {item.icon}
                {renderBadge(item.badge)} 
              </button>
            )
          ))}
          
          <div className="w-px h-6 bg-white/30 mx-1"></div>

          <button 
            onClick={onLogout} 
            className="hover:bg-red-700/50 p-2.5 rounded-xl transition text-white/90 hover:text-white" 
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* --- KANAN (MOBILE) --- */}
        <div className="md:hidden flex items-center gap-1">
          <button 
            onClick={() => handleNavClick('cart')} 
            className={`p-2 rounded-lg transition relative ${
              currentView === 'cart' ? 'bg-white text-orange-600' : 'hover:bg-white/20'
            }`}
          >
            <ShoppingCart size={24} />
            {renderBadge(cartCount)}
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/20 transition"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* --- MENU DROPDOWN (MOBILE) --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white text-gray-800 shadow-2xl border-t border-gray-100 animate-in slide-in-from-top-5 duration-200">
          <div className="p-4 flex flex-col gap-2">
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-2 border border-orange-100">
               <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
               </div>
               <div>
                  <div className="font-bold text-gray-800 leading-none mb-1">{user?.name}</div>
                  <div className="text-[10px] text-orange-600 uppercase font-black tracking-widest">{user?.role}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                item.show && (
                  <button 
                    key={item.id} 
                    onClick={() => handleNavClick(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition ${
                      currentView === item.id 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-inner' 
                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                      {renderBadge(item.badge)}
                    </div>
                    <span className="text-[10px] font-bold uppercase">{item.label}</span>
                  </button>
                )
              ))}
            </div>

            <button 
              onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
              className="mt-2 w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition"
            >
              <LogOut size={18} /> Keluar Aplikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
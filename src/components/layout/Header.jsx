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
  X 
} from 'lucide-react';

const Header = ({ user, cartCount, onNavigate, onLogout, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      id: 'users', 
      label: 'Kelola User', 
      icon: <Users size={20} />, 
      show: user?.role === 'admin' 
    },
    { 
      id: 'orders', 
      label: 'Pesanan', 
      icon: <Receipt size={20} />, 
      show: true 
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

  return (
    <div className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg z-[1000] h-[72px]">
      <div className="max-w-6xl mx-auto px-4 h-full flex justify-between items-center relative">
        
        {/* --- BAGIAN KIRI: LOGO & JUDUL (DIPERBAIKI) --- */}
        {/* 'min-w-0 flex-1' PENTING: Agar judul mau memendek (truncate) saat layar sempit */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          {currentView !== 'menu' && currentView !== 'public-order' && (
            <button 
              onClick={() => onNavigate('menu')} 
              className="hover:bg-white/20 p-2 rounded-lg transition active:scale-95 flex-shrink-0"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          
          <h1 
            onClick={() => onNavigate('menu')}
            className="text-lg md:text-2xl font-bold truncate tracking-tight cursor-pointer leading-tight"
          >
            🍽️ <span className="hidden sm:inline">Warung Makan</span> Mamah Yonda
          </h1>
        </div>
        
        {/* --- BAGIAN KANAN (DESKTOP) --- */}
        <div className="hidden md:flex gap-2 items-center flex-shrink-0">
          <div className="text-sm mr-2 text-right">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs opacity-90 capitalize bg-white/20 px-2 py-0.5 rounded-full inline-block">
              {user?.role}
            </div>
          </div>

          {navItems.map((item) => (
            item.show && (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)} 
                className={`p-2 rounded-lg transition relative ${
                  currentView === item.id 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'hover:bg-white/20'
                }`}
                title={item.label}
              >
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-orange-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-orange-600 animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          ))}
          
          <div className="w-px h-6 bg-white/30 mx-1"></div>

          <button 
            onClick={onLogout} 
            className="hover:bg-red-700/50 p-2 rounded-lg transition text-white/90 hover:text-white" 
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* --- BAGIAN KANAN (MOBILE) --- */}
        {/* 'flex-shrink-0' PENTING: Agar tombol tidak gepeng terdorong judul */}
        <div className="md:hidden flex items-center gap-1 flex-shrink-0">
          {/* Cart Icon Mobile */}
          <button 
            onClick={() => handleNavClick('cart')} 
            className={`p-2 rounded-lg transition relative ${
              currentView === 'cart' ? 'bg-white text-orange-600' : 'hover:bg-white/20'
            }`}
          >
             <ShoppingCart size={24} />
             {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-orange-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-orange-600">
                  {cartCount}
                </span>
             )}
          </button>

          {/* Tombol Hamburger */}
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
          <div className="p-4 flex flex-col gap-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-2 border border-orange-100">
               <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0) || 'U'}
               </div>
               <div>
                  <div className="font-bold text-gray-800">{user?.name}</div>
                  <div className="text-xs text-orange-600 uppercase font-black">{user?.role}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                item.show && (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                      currentView === item.id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                        : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span className="text-xs font-bold uppercase">{item.label}</span>
                    {item.badge > 0 && currentView !== item.id && (
                       <span className="bg-red-500 text-white text-[10px] px-2 rounded-full font-bold">
                         {item.badge} Item
                       </span>
                    )}
                  </button>
                )
              ))}
            </div>

            <button 
              onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
              className="mt-2 w-full flex items-center justify-center gap-2 p-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition"
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
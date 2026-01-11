import React from 'react';
import { ShoppingCart, Receipt, User, LogOut, Users, ArrowLeft, Utensils, BarChart3 } from 'lucide-react';

const Header = ({ user, cartCount, onNavigate, onLogout, currentView }) => {
  return (
    // FIXED: top-0, z-[1000], tinggi pasti h-[72px]
    <div className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg z-[1000] h-[72px]">
      <div className="max-w-6xl mx-auto px-4 h-full flex justify-between items-center">
        
        {/* Kiri: Logo & Back Button */}
        <div className="flex items-center gap-3">
          {currentView !== 'menu' && currentView !== 'public-order' && (
            <button 
              onClick={() => onNavigate('menu')} 
              className="hover:bg-white/20 p-2 rounded-lg transition active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-bold truncate tracking-tight">
            🍽️ <span className="hidden xs:inline"></span> Warung Makan Mamah Yonda
          </h1>
        </div>
        
        {/* Kanan: Navigasi User */}
        <div className="flex gap-2 items-center">
          {/* Info User (Hidden di HP) */}
          <div className="hidden md:block text-sm mr-2 text-right">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs opacity-90 capitalize bg-white/20 px-2 py-0.5 rounded-full inline-block">
              {user?.role}
            </div>
          </div>

          {/* MENU ADMIN */}
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => onNavigate('laporan')} 
                className={`p-2 rounded-lg transition ${currentView === 'laporan' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
                title="Laporan Penjualan"
              >
                <BarChart3 size={20} />
              </button>

              <button 
                onClick={() => onNavigate('manage-menu')} 
                className={`p-2 rounded-lg transition ${currentView === 'manage-menu' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
                title="Kelola Menu"
              >
                <Utensils size={20} />
              </button>
              
              <button 
                onClick={() => onNavigate('users')} 
                className={`p-2 rounded-lg transition ${currentView === 'users' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
                title="Users"
              >
                <Users size={20} />
              </button>
            </>
          )}
          
          <button 
            onClick={() => onNavigate('orders')} 
            className={`p-2 rounded-lg transition ${currentView === 'orders' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
            title="Pesanan"
          >
            <Receipt size={20} />
          </button>
          
          <button 
            onClick={() => onNavigate('cart')} 
            className={`p-2 rounded-lg transition relative ${currentView === 'cart' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
            title="Keranjang"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-orange-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-orange-600 animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => onNavigate('profile')} 
            className={`p-2 rounded-lg transition ${currentView === 'profile' ? 'bg-white text-orange-600 shadow-sm' : 'hover:bg-white/20'}`}
            title="Profil"
          >
            <User size={20} />
          </button>
          
          <div className="w-px h-6 bg-white/30 mx-1"></div>

          <button 
            onClick={onLogout} 
            className="hover:bg-red-700/50 p-2 rounded-lg transition text-white/90 hover:text-white" 
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
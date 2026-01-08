import React from 'react';
import { ShoppingCart, Receipt, User, LogOut, Users, ArrowLeft } from 'lucide-react';

const Header = ({ user, cartCount, onNavigate, onLogout, currentView }) => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {currentView !== 'menu' && (
            <button onClick={() => onNavigate('menu')} className="hover:bg-white/20 p-2 rounded-lg transition">
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-2xl font-bold">🍽️ Warung POS</h1>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="hidden sm:block text-sm mr-2 text-right">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs opacity-90 capitalize">{user?.role}</div>
          </div>

          {user?.role === 'admin' && (
            <button onClick={() => onNavigate('users')} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition" title="Users">
              <Users size={20} />
            </button>
          )}
          
          <button onClick={() => onNavigate('orders')} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition" title="Pesanan">
            <Receipt size={20} />
          </button>
          
          <button onClick={() => onNavigate('cart')} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition relative" title="Keranjang">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-orange-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          
          <button onClick={() => onNavigate('profile')} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition" title="Profil">
            <User size={20} />
          </button>
          
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition" title="Keluar">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Header;
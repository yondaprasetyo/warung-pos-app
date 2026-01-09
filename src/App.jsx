import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useShop } from './hooks/useShop';

// Components
import Header from './components/layout/Header';
import LoginView from './components/auth/LoginView';
import RegisterView from './components/auth/RegisterView';
import MenuView from './components/menu/MenuView';
import CartView from './components/cart/CartView';
import OrderHistory from './components/orders/OrderHistory';
import ReceiptView from './components/orders/ReceiptView';
import UserManagement from './components/admin/UserManagement';
import ProfileView from './components/admin/ProfileView';
import PublicOrderView from './components/orders/PublicOrderView';
import ProductManagement from './components/admin/ProductManagement';

const App = () => {
  const [currentView, setCurrentView] = useState('menu');
  const [isPublicMode, setIsPublicMode] = useState(false);
  
  // State untuk Modal Nama Pelanggan (Frontend Kustom)
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading 
  } = useAuth();
  
  const { 
    cart, 
    orders,
    currentOrder, 
    setCurrentOrder,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    updateCartItemDetails, 
    checkout 
  } = useShop(currentUser);

  const navigateTo = (view) => {
    setAuthError('');
    setCurrentView(view);
  };

  // 1. Fungsi saat tombol KONFIRMASI di klik
  const handleConfirmCheckout = () => {
    setCustomerNameInput(''); 
    setShowNameModal(true); // Munculkan Modal kustom, bukan prompt browser
  };

  // 2. Fungsi eksekusi checkout setelah nama diisi di modal
  const executeCheckout = async () => {
    if (customerNameInput.trim() !== "") {
      try {
        const order = await checkout(customerNameInput);
        if (order) {
          setShowNameModal(false);
          navigateTo('receipt'); 
        }
      } catch (err) {
        alert("Gagal memproses pesanan: " + err.message);
      }
    } else {
      alert("Mohon masukkan nama pelanggan terlebih dahulu.");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-orange-500 italic">Memuat Data Warung...</div>;

  // --- LOGIC 1: JIKA USER BELUM LOGIN ---
  if (!currentUser) {
    if (isPublicMode) {
      return (
        <PublicOrderView 
          onBack={() => setIsPublicMode(false)} 
          addToCart={addToCart}
          cart={cart}
          removeFromCart={removeFromCart}
          checkout={checkout}
        />
      );
    }

    if (currentView === 'register') {
      return (
        <RegisterView 
          onRegister={(data) => { if(register(data)) navigateTo('login'); }} 
          onBack={() => navigateTo('login')}
          error={authError} 
        />
      );
    }

    return (
      <div className="relative">
        <LoginView 
          onLogin={login} 
          onRegisterClick={() => navigateTo('register')} 
          error={authError} 
        />
        <div className="absolute top-4 right-4">
            <button 
              onClick={() => setIsPublicMode(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-xl shadow-lg font-bold hover:bg-green-700 transition-all active:scale-95"
            >
              🛒 Mode Pelanggan (Public)
            </button>
        </div>
      </div>
    );
  }

  // --- LOGIC 2: JIKA USER LOGIN (ADMIN/KASIR) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-10">
      <Header 
        user={currentUser} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        onNavigate={navigateTo}
        onLogout={logout}
        currentView={currentView}
      />

      <main className="mt-6 px-4 max-w-7xl mx-auto">
        {currentView === 'manage-menu' && currentUser.role === 'admin' && (
          <ProductManagement />
        )}
        
        {currentView === 'menu' && 
          <MenuView 
            onAddToCart={addToCart}
            currentUser={currentUser}
          />
        }
        
        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart}
            updateCartItemDetails={updateCartItemDetails} 
            onCheckout={handleConfirmCheckout} 
          />
        )}

        {currentView === 'receipt' && (
          <ReceiptView 
            order={currentOrder} 
            onBack={() => {
              setCurrentOrder(null); 
              navigateTo('menu');
            }} 
          />
        )}

        {currentView === 'orders' && <OrderHistory orders={orders} />}

        {currentView === 'users' && currentUser.role === 'admin' && (
          <UserManagement 
            users={users} 
            currentUser={currentUser} 
            onDelete={deleteUser} 
            onAddClick={() => { logout(); setCurrentView('register'); }}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView user={currentUser} onUpdate={() => alert('Fitur profil segera hadir')} />
        )}
      </main>

      {/* --- MODAL INPUT NAMA PELANGGAN (FRONTEND UI) --- */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-orange-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-xl font-bold italic">Konfirmasi Pesanan</h3>
              <p className="text-orange-100 text-sm opacity-90">Masukkan nama pelanggan untuk struk</p>
            </div>
            
            {/* Body Modal */}
            <div className="p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Nama Pelanggan
                  </label>
                  <input 
                    type="text"
                    autoFocus
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-lg font-bold text-gray-700"
                    placeholder="Contoh: Kak Budi"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCheckout()}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={executeCheckout}
                  className="w-full py-4 rounded-2xl font-black text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all active:scale-[0.98]"
                >
                  SIMPAN & CETAK STRUK
                </button>
                <button 
                  onClick={() => setShowNameModal(false)}
                  className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
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
import ProductManagement from './components/admin/ProductManagement';
import SalesLaporan from './components/admin/SalesLaporan';

const App = () => {
  const [currentView, setCurrentView] = useState('menu');
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading 
  } = useAuth();
  
  const { 
    cart, orders, currentOrder, setCurrentOrder,
    addToCart, updateQuantity, removeFromCart, checkout,
    updateCartItemDetails // PASTIKAN FUNGSI INI ADA DI useShop.js
  } = useShop(currentUser);

  const navigateTo = (view) => {
    setAuthError('');
    setCurrentView(view);
  };

  const handleConfirmCheckout = () => {
    setCustomerNameInput('');
    setShowNameModal(true);
  };

  const executeCheckout = async () => {
    if (customerNameInput.trim()) {
      try {
        const order = await checkout(customerNameInput);
        if (order) {
          setShowNameModal(false);
          navigateTo('receipt');
        }
      } catch (err) {
        alert("Gagal: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-orange-500 italic">Memuat...</div>;

  // UI MODAL NAMA
  const renderNameModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-500 p-6 text-white text-center">
          <h3 className="text-xl font-bold italic">Konfirmasi Pesanan</h3>
          <p className="text-orange-100 text-sm">Masukkan nama pelanggan</p>
        </div>
        <div className="p-8">
          <input 
            type="text" autoFocus className="w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none focus:border-orange-500 text-lg font-bold"
            placeholder="Contoh: Kak Budi" value={customerNameInput} onChange={(e) => setCustomerNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCheckout()}
          />
          <div className="flex flex-col gap-3 mt-8">
            <button onClick={executeCheckout} className="w-full py-4 rounded-2xl font-black text-white bg-orange-500 shadow-xl hover:bg-orange-600 active:scale-95 transition-all">SIMPAN & CETAK STRUK</button>
            <button onClick={() => setShowNameModal(false)} className="w-full py-3 text-gray-400 font-bold">Nanti Saja</button>
          </div>
        </div>
      </div>
    </div>
  );

  // LOGIC: PUBLIC MODE (Mode Pelanggan)
  if (!currentUser && isPublicMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
          <h1 className="font-black text-orange-500 text-xl italic">Warung Makan Mamah Yonda</h1>
          <div className="flex gap-2">
            <button onClick={() => navigateTo('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold">
              🛒 {cart.reduce((a, b) => a + b.quantity, 0)}
            </button>
            <button onClick={() => setIsPublicMode(false)} className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold">Login</button>
          </div>
        </header>
        <main className="p-4 max-w-7xl mx-auto">
          {currentView === 'menu' && <MenuView onAddToCart={addToCart} />}
          {currentView === 'cart' && (
            <CartView 
              cart={cart} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
              updateCartItemDetails={updateCartItemDetails} // Baris ini krusial!
              onCheckout={handleConfirmCheckout} 
            />
          )}
          {currentView === 'receipt' && <ReceiptView order={currentOrder} onBack={() => { setCurrentOrder(null); navigateTo('menu'); }} />}
        </main>
        {showNameModal && renderNameModal()}
      </div>
    );
  }

  // LOGIC: AUTH VIEWS
  if (!currentUser) {
    if (currentView === 'register') return <RegisterView onRegister={(d) => register(d) && navigateTo('login')} onBack={() => navigateTo('login')} error={authError} />;
    return (
      <div className="relative">
        <LoginView onLogin={login} onRegisterClick={() => navigateTo('register')} error={authError} />
        <button onClick={() => setIsPublicMode(true)} className="absolute top-4 right-4 bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all">🛒 Mode Pelanggan</button>
      </div>
    );
  }

  // LOGIC: ADMIN/STAFF DASHBOARD
  return (
    <div className="min-h-screen bg-orange-50/30 pb-10">
      <Header user={currentUser} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onNavigate={navigateTo} onLogout={logout} currentView={currentView} />
      <main className="mt-6 px-4 max-w-7xl mx-auto">
        {currentView === 'menu' && <MenuView onAddToCart={addToCart} />}
        
        {/* PERBAIKAN: Menambahkan updateCartItemDetails pada props CartView */}
        {currentView === 'cart' && (
          <CartView 
            cart={cart} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            updateCartItemDetails={updateCartItemDetails}
            onCheckout={handleConfirmCheckout} 
          />
        )}
        
        {currentView === 'orders' && <OrderHistory orders={orders} />}
        {currentView === 'laporan' && currentUser.role === 'admin' && <SalesLaporan />}
        {currentView === 'manage-menu' && currentUser.role === 'admin' && <ProductManagement />}
        {currentView === 'users' && currentUser.role === 'admin' && <UserManagement users={users} currentUser={currentUser} onDelete={deleteUser} onAddClick={() => { logout(); navigateTo('register'); }} />}
        {currentView === 'receipt' && <ReceiptView order={currentOrder} onBack={() => { setCurrentOrder(null); navigateTo('menu'); }} />}
        {currentView === 'profile' && <ProfileView user={currentUser} onUpdate={() => alert('Fitur segera hadir')} />}
      </main>
      {showNameModal && renderNameModal()}
    </div>
  );
};

export default App;
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
// Import baru
import PublicOrderView from './components/orders/PublicOrderView';

const App = () => {
  const [currentView, setCurrentView] = useState('menu');
  const [isPublicMode, setIsPublicMode] = useState(false); // State baru untuk Mode Publik
  
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading // Hapus updateUser jika error
  } = useAuth();
  
  const { 
    cart, orders, currentOrder, 
    addToCart, updateQuantity, removeFromCart, checkout 
  } = useShop(currentUser);

  const navigateTo = (view) => {
    setAuthError('');
    setCurrentView(view);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // --- LOGIC 1: JIKA USER BELUM LOGIN ---
  if (!currentUser) {
    // Jika masuk mode publik (Customer)
    if (isPublicMode) {
      return (
        <PublicOrderView 
          onBack={() => setIsPublicMode(false)} // Kembali ke Login
          addToCart={addToCart}
          cart={cart}
          removeFromCart={removeFromCart}
          checkout={checkout}
        />
      );
    }

    // Jika sedang Register
    if (currentView === 'register') {
      return (
        <RegisterView 
          onRegister={(data) => { if(register(data)) navigateTo('login'); }} 
          onBack={() => navigateTo('login')}
          error={authError} 
        />
      );
    }

    // Tampilan Login Default (+ Tombol Pesan Online)
    return (
      <div className="relative">
        <LoginView 
          onLogin={login} 
          onRegisterClick={() => navigateTo('register')} 
          error={authError} 
        />
        {/* Tombol Akses Publik */}
        <div className="absolute top-4 right-4">
            <button 
              onClick={() => setIsPublicMode(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-green-700 transition"
            >
              🛒 Pesan Makanan (Pelanggan)
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

      <main className="mt-6">
        {currentView === 'menu' && <MenuView onAddToCart={addToCart} />}
        
        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            onUpdateQty={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={(name) => { checkout(name); navigateTo('receipt'); }}
          />
        )}

        {currentView === 'receipt' && <ReceiptView order={currentOrder} onBack={() => navigateTo('menu')} />}

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
          <ProfileView user={currentUser} onUpdate={() => alert('Fitur update belum diaktifkan')} />
        )}
      </main>
    </div>
  );
};

export default App;
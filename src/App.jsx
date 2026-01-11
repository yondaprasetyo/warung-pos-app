import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useShop } from './hooks/useShop';
import { db } from './firebase'; 
import { doc, writeBatch } from 'firebase/firestore'; 

// Components
import Header from './components/layout/Header';
import LoginView from './components/auth/LoginView';
import RegisterView from './components/auth/RegisterView';
import MenuView from './components/menu/MenuView';
import OrderDateSelector from './components/menu/OrderDateSelector';
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
  
  // State baru untuk filter tanggal pesanan
  const [orderDate, setOrderDate] = useState(null);
  
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading 
  } = useAuth();
  
  const { 
    cart, orders, currentOrder, setCurrentOrder,
    addToCart, updateQuantity, removeFromCart, checkout,
    updateCartItemDetails 
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
        // Gabungkan info tanggal ke dalam catatan order jika perlu
        const orderNote = `Order untuk tanggal: ${orderDate?.fullDate}`;
        const order = await checkout(customerNameInput, orderNote);
        
        if (order) {
          const batch = writeBatch(db);
          let hasStockUpdate = false;

          cart.forEach((item) => {
            if (item.stock !== -1) {
              const productRef = doc(db, "products", item.id);
              const newStock = Math.max(0, item.stock - item.quantity);
              batch.update(productRef, { stock: newStock });
              hasStockUpdate = true;
            }
          });

          if (hasStockUpdate) {
            await batch.commit();
          }

          setShowNameModal(false);
          navigateTo('receipt');
        }
      } catch (err) {
        alert("Gagal memproses pesanan: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-orange-500 italic">Memuat...</div>;

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

  // --- LOGIKA URUTAN TAMPILAN ---

  // 1. PRIORITAS UTAMA: JIKA USER LOGIN (ADMIN/STAFF)
  if (currentUser) {
    // Admin tetap harus pilih tanggal jika ingin melihat filter menu
    if (!orderDate && currentView === 'menu') {
        return (
          <OrderDateSelector 
            onSelectDate={(info) => setOrderDate(info)} 
            user={currentUser}        // Kirim data user (agar tahu role admin)
            authLoading={loading}     // Kirim status loading
          />
        );
    }

    return (
      <div className="min-h-screen bg-orange-50/30 pb-10">
        <Header 
            user={currentUser} 
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
            onNavigate={navigateTo} 
            onLogout={logout} 
            currentView={currentView} 
        />
        
        {/* --- FIXED AREA START --- */}
        {/* pt-[88px] digunakan karena Header fixed tingginya 72px + 16px gap */}
        <main className="pt-[88px] px-4 max-w-7xl mx-auto">
        {/* --- FIXED AREA END --- */}
        
          {currentView === 'menu' && (
            <MenuView 
                onAddToCart={addToCart} 
                orderDateInfo={orderDate} 
                onChangeDate={() => setOrderDate(null)} 
            />
          )}
          {currentView === 'cart' && (
            <CartView 
              cart={cart} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
              updateCartItemDetails={updateCartItemDetails}
              onCheckout={handleConfirmCheckout} 
              onBack={() => setCurrentView('menu')}
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
  }

  // 2. JIKA DALAM MODE PELANGGAN
  if (isPublicMode) {
    // WAJIB PILIH TANGGAL DULU
    if (!orderDate) {
        // Mode publik tidak punya user logged in, jadi user={null}
        return (
          <OrderDateSelector 
            onSelectDate={(info) => setOrderDate(info)} 
            user={null}
            authLoading={false}
          />
        );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Note: Header publik menggunakan sticky, bukan fixed, jadi aman tanpa padding khusus */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
          <h1 className="font-black text-orange-500 text-xl italic leading-none">Warung Makan<br/><span className="text-gray-800">Mamah Yonda</span></h1>
          <div className="flex gap-2">
            <button onClick={() => navigateTo('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold">
              🛒 {cart.reduce((a, b) => a + b.quantity, 0)}
            </button>
            <button onClick={() => { setIsPublicMode(false); setOrderDate(null); }} className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold">Login</button>
          </div>
        </header>
        <main className="p-0 max-w-7xl mx-auto">
          {currentView === 'menu' && (
            <MenuView 
                onAddToCart={addToCart} 
                orderDateInfo={orderDate} 
                onChangeDate={() => setOrderDate(null)} 
            />
          )}
          {currentView === 'cart' && (
            <CartView 
              cart={cart} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
              updateCartItemDetails={updateCartItemDetails}
              onCheckout={handleConfirmCheckout} 
              onBack={() => setCurrentView('menu')}
            />
          )}
          {currentView === 'receipt' && <ReceiptView order={currentOrder} onBack={() => { setCurrentOrder(null); navigateTo('menu'); }} />}
        </main>
        {showNameModal && renderNameModal()}
      </div>
    );
  }

  // 3. JIKA TIDAK LOGIN DAN TIDAK MODE PELANGGAN
  if (currentView === 'register') return <RegisterView onRegister={(d) => register(d) && navigateTo('login')} onBack={() => navigateTo('login')} error={authError} />;
  
  return (
    <div className="relative">
      <LoginView onLogin={login} onRegisterClick={() => navigateTo('register')} error={authError} />
      <button 
        onClick={() => setIsPublicMode(true)} 
        className="absolute top-4 right-4 bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95"
      >
        🛒 Pesan Sekarang
      </button>
    </div>
  );
};

export default App;
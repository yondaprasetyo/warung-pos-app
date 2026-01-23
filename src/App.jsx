import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useShop } from './hooks/useShop';
import { useStoreSchedule } from './hooks/useStoreSchedule'; 
import { db } from './firebase'; 
import { logActivity } from './utils/logger'; 
import { doc, writeBatch } from 'firebase/firestore'; 
import { ShoppingBag, LogIn, UtensilsCrossed, ChevronRight, ArrowLeft } from 'lucide-react';

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
import StoreScheduleSettings from './components/admin/StoreScheduleSettings';

const getFormattedDateInfo = (dateObj) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const offset = dateObj.getTimezoneOffset() * 60000; 
  const localDate = new Date(dateObj.getTime() - offset);
  const isoDate = localDate.toISOString().split('T')[0]; 

  return {
    dateObj: dateObj, 
    dayId: dateObj.getDay(), 
    fullDate: `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
    isoDate: isoDate 
  };
};

const App = () => {
  const [currentView, setCurrentView] = useState('menu'); 
  const [isPublicMode, setIsPublicMode] = useState(false);
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false); 
  
  const [orderDate, setOrderDate] = useState(null);
  
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading 
  } = useAuth();
  
  const { 
    cart, orders, currentOrder, setCurrentOrder,
    addToCart, updateQuantity, removeFromCart, checkout,
    updateCartItemDetails,
    loadingOrder, 
    resetCurrentOrder
  } = useShop(currentUser);

  const { checkIsClosed } = useStoreSchedule();
  
  const shopClosedInfo = useMemo(() => {
     if (!orderDate || !orderDate.isoDate) return null;
     return checkIsClosed(orderDate.isoDate); 
  }, [orderDate, checkIsClosed]);

  useEffect(() => {
    if (currentOrder && !currentUser) {
      setIsPublicMode(true);
      setCurrentView('receipt');
      if (currentOrder.createdAt) {
         setOrderDate(getFormattedDateInfo(new Date(currentOrder.createdAt)));
      }
    }
  }, [currentOrder, currentUser]);

  useEffect(() => {
    if (currentUser && !orderDate) {
      setOrderDate(getFormattedDateInfo(new Date()));
    }
  }, [currentUser, orderDate]); 

  const handleAdminDateChange = (newDateString) => {
    if (!newDateString) return;
    const newDate = new Date(newDateString);
    setOrderDate(getFormattedDateInfo(newDate));
  };

  const navigateTo = (view) => {
    setAuthError('');
    setCurrentView(view);
  };

  const handleConfirmCheckout = () => {
    setCustomerNameInput('');
    setShowNameModal(true);
  };

  const executeCheckout = async () => {
      if (!customerNameInput.trim()) return;
      setIsProcessingCheckout(true); 

      try {
        const orderNote = `Order untuk tanggal: ${orderDate?.fullDate}`;
        // UPDATE: Ambil tanggal target (ISO String YYYY-MM-DD)
        const targetDate = orderDate?.isoDate;

        // UPDATE: Kirim targetDate sebagai argumen ke-3
        const order = await checkout(customerNameInput, orderNote, targetDate);
        
        if (order) {
          const batch = writeBatch(db);
          let hasStockUpdate = false;

          cart.forEach((item) => {
            if (item.stock !== undefined && item.stock !== -1) {
              const realProductId = (item.productId || item.id).split('-')[0];
              const productRef = doc(db, "products", realProductId); 
              
              const newStock = Math.max(0, item.stock - item.quantity);
              batch.update(productRef, { stock: newStock });
              hasStockUpdate = true;
            }
          });

          if (hasStockUpdate) {
            await batch.commit();
          }

          if (currentUser) {
            logActivity(
              currentUser.uid, 
              currentUser.name, 
              "TRANSAKSI", 
              `Pesanan a.n ${customerNameInput} (Total: Rp ${currentOrder?.total?.toLocaleString('id-ID')})`
            );
          }

          setShowNameModal(false);
          navigateTo('receipt');
        }
      } catch (err) {
        console.error("Checkout Error:", err);
        alert("Gagal memproses pesanan: " + err.message);
      } finally {
        setIsProcessingCheckout(false); 
      }
    };

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="animate-pulse text-orange-500 font-bold text-xl">Memuat Warung Mamah Yonda...</div>
      </div>
    );
  }

  const renderNameModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-500 p-6 text-white text-center">
          <h3 className="text-xl font-bold italic">Konfirmasi Pesanan</h3>
          <p className="text-orange-100 text-sm">Siapa nama pemesannya?</p>
        </div>
        <div className="p-8">
          <input 
            type="text" 
            autoFocus 
            className="w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none focus:border-orange-500 text-lg font-bold text-center"
            placeholder="Contoh: Kak Budi" 
            value={customerNameInput} 
            onChange={(e) => setCustomerNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCheckout()}
            disabled={isProcessingCheckout}
          />
          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={executeCheckout} 
              disabled={isProcessingCheckout || !customerNameInput.trim()}
              className="w-full py-4 rounded-2xl font-black text-white bg-orange-500 shadow-xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isProcessingCheckout ? 'Memproses...' : 'KIRIM PESANAN'}
            </button>
            <button 
              onClick={() => setShowNameModal(false)} 
              disabled={isProcessingCheckout}
              className="w-full py-3 text-gray-400 font-bold hover:text-gray-600"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 1. MODE ADMIN
  if (currentUser) {
    return (
      <div className="min-h-screen bg-orange-50/30 pb-10">
        <Header 
            user={currentUser} 
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
            onNavigate={navigateTo} 
            onLogout={logout} 
            currentView={currentView} 
        />
        
        <main className="pt-[88px] px-4 max-w-7xl mx-auto">
          {currentView === 'menu' && (
            <MenuView 
                onAddToCart={addToCart} 
                orderDateInfo={orderDate || getFormattedDateInfo(new Date())} 
                onChangeDate={() => setOrderDate(null)} 
                onUpdateDate={handleAdminDateChange}
                isAdmin={true}
                shopClosedInfo={shopClosedInfo} 
            />
          )}
          {currentView === 'cart' && (
            <CartView 
              cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} updateCartItemDetails={updateCartItemDetails}
              onCheckout={handleConfirmCheckout} onBack={() => setCurrentView('menu')}
            />
          )}
          {currentView === 'orders' && <OrderHistory orders={orders} />}
          {currentView === 'laporan' && currentUser.role === 'admin' && <SalesLaporan />}
          {currentView === 'manage-menu' && currentUser.role === 'admin' && <ProductManagement />}
          {currentView === 'schedule' && currentUser.role === 'admin' && <StoreScheduleSettings />}
          {currentView === 'users' && currentUser.role === 'admin' && (
            <UserManagement users={users} currentUser={currentUser} onDelete={deleteUser} onAddClick={() => { logout(); navigateTo('register'); }} />
          )}
          {currentView === 'receipt' && (
            <ReceiptView 
                order={currentOrder} 
                onBack={() => { setCurrentOrder(null); navigateTo('menu'); }} 
            />
          )}
          {currentView === 'profile' && <ProfileView user={currentUser} onUpdate={() => alert('Fitur segera hadir')} />}
        </main>
        {showNameModal && renderNameModal()}
      </div>
    );
  }

  // 2. MODE PELANGGAN
  if (isPublicMode) {
    if (currentView === 'receipt' && currentOrder) {
         return (
            <ReceiptView 
                order={currentOrder} 
                onBack={() => { 
                    resetCurrentOrder(); 
                    setCurrentView('menu'); 
                }} 
            />
         );
    }

    if (!orderDate) {
        return (
          <OrderDateSelector 
            onSelectDate={(info) => {
               if (info?.dateObj) {
                  setOrderDate(getFormattedDateInfo(info.dateObj));
               } else {
                  setOrderDate(getFormattedDateInfo(new Date())); 
               }
            }} 
            user={null}
            authLoading={false}
            onBack={() => setIsPublicMode(false)}
          />
        );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-20"> 
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
           <div className="flex items-center gap-2">
              <button onClick={() => { setIsPublicMode(false); setOrderDate(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="text-gray-600" size={20} />
              </button>
              <div>
                <h1 className="font-black text-orange-500 text-lg italic leading-none">
                    Mamah Yonda
                </h1>
                <p className="text-xs text-gray-500">{orderDate.fullDate}</p>
              </div>
           </div>

          <div className="flex gap-2">
            <button onClick={() => navigateTo('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 relative">
              <ShoppingBag size={18} /> 
              <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto">
          {currentView === 'menu' && (
            <MenuView 
                onAddToCart={addToCart} 
                orderDateInfo={orderDate} 
                onChangeDate={() => setOrderDate(null)} 
                isAdmin={false}
                shopClosedInfo={shopClosedInfo}
            />
          )}
          {currentView === 'cart' && (
            <CartView 
              cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} updateCartItemDetails={updateCartItemDetails}
              onCheckout={handleConfirmCheckout} onBack={() => setCurrentView('menu')}
            />
          )}
        </main>
        {showNameModal && renderNameModal()}
      </div>
    );
  }

  // 3. LANDING PAGE
  if (currentView === 'login') {
      return <LoginView onLogin={login} onRegisterClick={() => navigateTo('register')} error={authError} onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'register') {
      return <RegisterView onRegister={(d) => register(d) && navigateTo('login')} onBack={() => navigateTo('login')} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="z-10 flex flex-col items-center max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-100 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
           <UtensilsCrossed size={64} className="text-orange-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">
          Warung Makan <span className="text-orange-600 italic block">Mamah Yonda</span>
        </h1>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          Masakan rumahan yang hangat,<br/>siap dinikmati kapan saja.
        </p>
        <button 
          onClick={() => {
              setCurrentView('menu'); 
              setIsPublicMode(true);
          }}
          className="group relative w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transform transition-all active:scale-95 hover:-translate-y-1"
        >
          <div className="flex items-center justify-center gap-3">
             <span className="text-xl font-bold tracking-wide">PESAN SEKARANG</span>
             <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <div className="mt-12">
            <button 
                onClick={() => setCurrentView('login')}
                className="text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-orange-100/50"
            >
                <LogIn size={14} />
                <span>Masuk sebagai Admin</span>
            </button>
        </div>
      </div>
      <footer className="absolute bottom-6 text-xs text-gray-300 font-medium">
        &copy; {new Date().getFullYear()} Mamah Yonda POS
      </footer>
    </div>
  );
};

export default App;
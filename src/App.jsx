import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useShop } from './hooks/useShop';
import { useStoreSchedule } from './hooks/useStoreSchedule'; 
import { db } from './firebase'; 
import { logActivity } from './utils/logger'; 
import { doc, writeBatch } from 'firebase/firestore'; 
import { 
  ShoppingBag, 
  LogIn, 
  UtensilsCrossed, 
  ChevronRight, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import ProtectedRoute from './components/auth/ProtectedRoute';

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

// Helper function untuk format tanggal
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
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  
  // 1. STATE
  const [currentView, setCurrentView] = useState('menu'); 
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false); 
  const [orderDate, setOrderDate] = useState(null);
  
  // 2. CUSTOM HOOKS
  const { 
    users, currentUser, authError, setAuthError,
    login, logout, register, deleteUser, loading 
  } = useAuth();
  
  const { 
    cart, orders, currentOrder, 
    addToCart, updateQuantity, removeFromCart, checkout,
    updateCartItemDetails,
    loadingOrder, 
    resetCurrentOrder
  } = useShop(currentUser);

  const { checkIsClosed } = useStoreSchedule();

  // 3. MEMO & EFFECTS
  const shopClosedInfo = useMemo(() => {
     if (!orderDate || !orderDate.isoDate) return null;
     return checkIsClosed(orderDate.isoDate); 
  }, [orderDate, checkIsClosed]);

  useEffect(() => {
    if (currentUser && !orderDate) {
      setOrderDate(getFormattedDateInfo(new Date()));
    }
  }, [currentUser, orderDate]);

  // 4. HANDLER FUNCTIONS
  const handleAdminDateChange = (newDateString) => {
    if (!newDateString) return;
    const newDate = new Date(newDateString);
    setOrderDate(getFormattedDateInfo(newDate));
  };

  // Fungsi baru untuk mereset tanggal (digunakan oleh pelanggan online)
  const handleResetDate = () => {
    setOrderDate(null);
    setCurrentView('menu');
  };

  const navigateTo = (view) => {
    setAuthError('');
    setCurrentView(view);
  };

  const executeCheckout = async () => {
      if (!customerNameInput.trim()) return;
      setIsProcessingCheckout(true); 

      try {
        const orderNote = `Order untuk tanggal: ${orderDate?.fullDate}`;
        const targetDate = orderDate?.isoDate;

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

          if (hasStockUpdate) await batch.commit();

          if (currentUser) {
            logActivity(
              currentUser.uid, 
              currentUser.name, 
              "TRANSAKSI", 
              `Pesanan a.n ${customerNameInput}`
            );
          }

          setShowNameModal(false);
          navigate(`/receipt/${order.id}`);
        }
      } catch (err) {
        console.error("Checkout Error:", err);
        alert("Gagal memproses pesanan: " + err.message);
      } finally {
        setIsProcessingCheckout(false); 
      }
    };

  // 5. CONDITIONAL LOADING RENDER
  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50">
        <Loader2 className="text-orange-500 animate-spin mb-4" size={48} />
        <h2 className="text-orange-800 font-black italic tracking-widest animate-pulse">
          MEMUAT WARUNG...
        </h2>
      </div>
    );
  }

  const renderNameModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-500 p-6 text-white text-center">
          <h3 className="text-xl font-bold italic uppercase">Nama Pemesan</h3>
          <p className="text-orange-100 text-xs">Mohon isi nama untuk identifikasi pesanan</p>
        </div>
        <div className="p-8">
          <input 
            type="text" autoFocus 
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
              className="w-full py-4 rounded-2xl font-black text-white bg-orange-500 shadow-xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessingCheckout ? <Loader2 className="animate-spin" /> : 'KIRIM PESANAN'}
            </button>
            <button 
              onClick={() => setShowNameModal(false)} 
              disabled={isProcessingCheckout} 
              className="w-full py-2 text-gray-400 font-bold"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = (isAdminView = false) => {
    switch (currentView) {
      case 'menu':
        return (
          <MenuView 
            onAddToCart={addToCart} 
            orderDateInfo={orderDate || getFormattedDateInfo(new Date())} 
            onUpdateDate={isAdminView ? handleAdminDateChange : handleResetDate} 
            isAdmin={isAdminView} 
            shopClosedInfo={shopClosedInfo} 
          />
        );
      case 'cart':
        return (
          <CartView 
            cart={cart} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            updateCartItemDetails={updateCartItemDetails} 
            onCheckout={() => setShowNameModal(true)} 
            onBack={() => setCurrentView('menu')} 
          />
        );
      case 'orders': return <OrderHistory orders={orders} />;
      case 'laporan': return currentUser?.role === 'admin' && <SalesLaporan />;
      case 'manage-menu': return currentUser?.role === 'admin' && <ProductManagement />;
      case 'schedule': return currentUser?.role === 'admin' && <StoreScheduleSettings />;
      case 'users': return currentUser?.role === 'admin' && <UserManagement users={users} currentUser={currentUser} onDelete={deleteUser} onAddClick={() => navigate('/register')} />;
      case 'profile': return <ProfileView user={currentUser} onUpdate={() => alert('Fit? segera hadir')} />;
      default: return <MenuView onAddToCart={addToCart} orderDateInfo={orderDate} />;
    }
  };

  return (
    <Routes>
      {/* 1. RUTE PUBLIK: LOGIN & REGISTER */}
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginView onLogin={login} error={authError} />} />
      <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <RegisterView onRegister={(d) => register(d) && navigate('/login')} onBack={() => navigate('/login')} error={authError} />} />

      {/* 2. RUTE PUBLIK: RECEIPT (Bisa diakses tanpa login) */}
      <Route path="/receipt/:orderId" element={
        <ReceiptView order={currentOrder} onBack={() => { resetCurrentOrder(); navigate('/'); setCurrentView('menu'); }} />
      } />

      {/* 3. RUTE UTAMA */}
      <Route path="/" element={
        currentUser ? (
          /* TAMPILAN JIKA SUDAH LOGIN (ADMIN/STAF) */
          <div className="min-h-screen bg-orange-50/30 pb-10">
            <Header user={currentUser} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onNavigate={navigateTo} onLogout={logout} currentView={currentView} />
            <main className="pt-[88px] px-4 max-w-7xl mx-auto">
              {renderMainContent(true)}
            </main>
            {showNameModal && renderNameModal()}
          </div>
        ) : isPublicMode ? (
          /* TAMPILAN MODE PELANGGAN UMUM */
          !orderDate ? (
            <OrderDateSelector onSelectDate={(info) => setOrderDate(getFormattedDateInfo(info?.dateObj || new Date()))} user={null} authLoading={false} onBack={() => setIsPublicMode(false)} />
          ) : (
            <div className="min-h-screen bg-gray-50 pb-20"> 
              <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                  <button onClick={handleResetDate} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                  <div>
                    <h1 className="font-black text-orange-500 text-lg italic leading-none">Mamah Yonda</h1>
                    <p className="text-xs text-gray-500">{orderDate.fullDate}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentView('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                  <ShoppingBag size={18} /> <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </button>
              </header>
              <main className="max-w-7xl mx-auto">
                {renderMainContent(false)}
              </main>
              {showNameModal && renderNameModal()}
            </div>
          )
        ) : (
          /* TAMPILAN AWAL (WELCOME SCREEN) */
          <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center relative">
            <div className="z-10 flex flex-col items-center max-w-md w-full">
              <div className="bg-white p-6 rounded-3xl shadow-xl mb-8"><UtensilsCrossed size={64} className="text-orange-500" /></div>
              <h1 className="text-4xl font-black text-gray-800 mb-2 italic">Warung Makan <span className="text-orange-600">Mamah Yonda</span></h1>
              <p className="text-gray-500 mb-10 text-lg">Masakan rumahan yang hangat,<br/>siap dinikmati kapan saja.</p>
              <button onClick={() => { setCurrentView('menu'); setIsPublicMode(true); }} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                <span className="text-xl font-black italic tracking-widest">PESAN SEKARANG</span><ChevronRight />
              </button>
              <button onClick={() => navigate('/login')} className="mt-12 text-sm font-bold text-gray-400 hover:text-orange-500 flex items-center gap-2">
                <LogIn size={14} /><span>MASUK ADMIN</span>
              </button>
            </div>
          </div>
        )
      } />
    </Routes>
  );
};

export default App;
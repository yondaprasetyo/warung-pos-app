import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useShop } from './hooks/useShop';
import { useStoreSchedule } from './hooks/useStoreSchedule'; 
import { db } from './firebase'; 
import { doc, writeBatch } from 'firebase/firestore'; 
import { 
  ShoppingBag, LogIn, UtensilsCrossed, 
  ArrowLeft, Loader2, ClipboardList 
} from 'lucide-react';

// Components
import Header from './components/layout/Header';
import LoginView from './components/auth/LoginView';
import RegisterView from './components/auth/RegisterView';
import MenuView from './components/menu/MenuView';
import OrderDateSelector from './components/menu/OrderDateSelector';
import CartView from './components/cart/CartView';
import OrderHistory from './components/orders/OrderHistory';
import PublicOrderHistory from './components/orders/PublicOrderHistory';
import ReceiptView from './components/orders/ReceiptView';
import PublicReceiptView from './components/orders/PublicReceiptView'; 
import UserManagement from './components/admin/UserManagement';
import ProfileView from './components/admin/ProfileView';
import ProductManagement from './components/admin/ProductManagement';
import SalesLaporan from './components/admin/SalesLaporan';
import StoreScheduleSettings from './components/admin/StoreScheduleSettings';
import PublicOrderView from './components/orders/PublicOrderView';
import CheckoutProcessView from './components/orders/CheckoutProcessView';

const getFormattedDateInfo = (dateObj) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const offset = dateObj.getTimezoneOffset() * 60000; 
  const localDate = new Date(dateObj.getTime() - offset);
  const isoDate = localDate.toISOString().split('T')[0]; 

  return {
    dateObj, 
    dayId: dateObj.getDay(), 
    fullDate: `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
    isoDate: isoDate 
  };
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

const AppContent = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('menu'); 
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false); 
  const [orderDate, setOrderDate] = useState(null);
  const [isCompletingDetails, setIsCompletingDetails] = useState(false);
  const { users, currentUser, authError, setAuthError, login, logout, register, deleteUser, loading } = useAuth();
  const { cart, orders, currentOrder, addToCart, updateQuantity, removeFromCart, checkout, updateCartItemDetails, loadingOrder, resetCurrentOrder } = useShop(currentUser);
  const { checkIsClosed } = useStoreSchedule();

  const pendingOrdersCount = useMemo(() => {
    if (!orders) return 0;
    
    return orders.filter(order => 
      (order.status || '').toLowerCase() === 'pending'
    ).length;
  }, [orders]);


  const shopClosedInfo = useMemo(() => {
      const dateToCheck = orderDate?.isoDate || getFormattedDateInfo(new Date()).isoDate;
      return checkIsClosed(dateToCheck); 
  }, [orderDate, checkIsClosed]);

  useEffect(() => {
    if (currentUser && !orderDate) {
      setOrderDate(getFormattedDateInfo(new Date()));
    }
  }, [currentUser, orderDate]);

  const handleResetDate = () => {
    setOrderDate(null);
    setIsCompletingDetails(false);
    setCurrentView('menu');
  };

  // Fungsi navigasi khusus untuk kembali ke Welcome Screen
  const handleExitToWelcome = () => {
    setIsPublicMode(false);
    setOrderDate(null);
    setIsCompletingDetails(false);
    setCurrentView('menu');
    navigate('/');
  };

  const executeCheckout = async (orderType = 'dine-in', paymentMethod = 'cash') => {
    if (!customerNameInput.trim()) return;
    setIsProcessingCheckout(true); 
    try {
      const isSelfService = window.location.pathname.includes('/self-service');
      const orderNote = isSelfService 
        ? `[${orderType.toUpperCase()}] - BAYAR: ${paymentMethod.toUpperCase()} (MANDIRI)`
        : `[ONLINE] - BAYAR: QRIS - Jadwal: ${orderDate?.fullDate}`;
      
      const finalOrderDate = isSelfService ? getFormattedDateInfo(new Date()) : orderDate;
      const order = await checkout(customerNameInput, orderNote, finalOrderDate?.isoDate);
      
      if (order) {
        const batch = writeBatch(db);
        cart.forEach((item) => {
          if (item.stock !== undefined && item.stock !== -1) {
            const realId = (item.productId || item.id).split('-')[0];
            batch.update(doc(db, "products", realId), { stock: Math.max(0, item.stock - item.quantity) });
          }
        });
        await batch.commit();
        
        setShowNameModal(false);
        setIsCompletingDetails(false); 
        setCustomerNameInput('');

        if (isSelfService) {
          navigate(`/self-receipt/${order.id}`);
        } else {
          navigate(`/receipt/${order.id}`);
        }
      }
    } catch (err) {
      alert("Gagal memproses pesanan: " + err.message);
    } finally {
      setIsProcessingCheckout(false); 
    }
  };

  const renderNameModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-500 p-6 text-white text-center">
          <h3 className="text-xl font-black italic uppercase tracking-wider">NAMA PEMESAN</h3>
          <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mt-1">Isi nama untuk identifikasi pesanan</p>
        </div>
        <div className="p-8">
          <input 
            type="text" autoFocus 
            className="w-full p-4 bg-gray-50 border-2 border-orange-500 rounded-2xl outline-none text-lg font-bold text-center placeholder:text-gray-300 focus:ring-4 focus:ring-orange-500/10"
            placeholder="Contoh: Kak Budi" 
            value={customerNameInput} 
            onChange={(e) => setCustomerNameInput(e.target.value)}
          />
          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={() => {
                const isSelfService = window.location.pathname.includes('/self-service');
                setShowNameModal(false);
                if (isSelfService) {
                  setIsCompletingDetails(true); 
                } else {
                  executeCheckout('online', 'qris');
                }
              }} 
              disabled={!customerNameInput.trim() || isProcessingCheckout}
              className="w-full py-4 rounded-2xl font-black text-white bg-orange-500 shadow-xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 uppercase italic tracking-widest"
            >
              {isProcessingCheckout ? <Loader2 className="animate-spin mx-auto" /> : 'KIRIM PESANAN'}
            </button>
            <button onClick={() => setShowNameModal(false)} className="w-full py-2 text-gray-400 font-bold">Batal</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Perbaikan Loading State: Menggunakan variabel agar tidak error linting
  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 text-orange-500 font-black italic">
        <Loader2 className="animate-spin mb-4" size={48} />
        MENYIAPKAN DATA...
      </div>
    );
  }

  const renderMainContent = (isAdminView = false) => {
    switch (currentView) {
      case 'menu': return <MenuView onAddToCart={addToCart} orderDateInfo={orderDate || getFormattedDateInfo(new Date())} onUpdateDate={isAdminView ? (d) => setOrderDate(getFormattedDateInfo(new Date(d))) : handleResetDate} isAdmin={isAdminView} shopClosedInfo={shopClosedInfo} />;
      case 'cart': return <CartView cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} updateCartItemDetails={updateCartItemDetails} onCheckout={() => setShowNameModal(true)} onBack={() => setCurrentView('menu')} />;
      case 'orders': return <OrderHistory orders={orders} />;
      case 'laporan': return <SalesLaporan />;
      case 'manage-menu': return <ProductManagement />;
      case 'schedule': return <StoreScheduleSettings />;
      case 'users': return <UserManagement users={users} currentUser={currentUser} onDelete={deleteUser} onAddClick={() => navigate('/register')} />;
      case 'profile': return <ProfileView user={currentUser} onUpdate={() => {}} />;
      default: return <MenuView onAddToCart={addToCart} orderDateInfo={orderDate} />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginView onLogin={login} error={authError} />} />
      <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <RegisterView onRegister={register} onBack={() => navigate('/login')} error={authError} />} />
      
      {/* STRUK ONLINE & MANDIRI */}
      <Route path="/receipt/:orderId" element={<ReceiptView order={currentOrder} onBack={() => { resetCurrentOrder(); navigate('/'); }} />} />
      <Route path="/self-receipt/:orderId" element={<PublicReceiptView />} />
      
      {/* HALAMAN SELF-SERVICE */}
      <Route path="/self-service" element={
        <div className="min-h-screen bg-gray-50">
          {!isCompletingDetails ? (
            <div className="pb-20">
              <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                  <button onClick={handleExitToWelcome} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                  <h1 className="font-black text-orange-500 text-lg italic leading-none"> Warung Makan Mamah Yonda <span className="text-[8px] block text-gray-400 uppercase not-italic tracking-widest mt-1">Self Service</span></h1>
                </div>
                <button onClick={() => setCurrentView('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                  <ShoppingBag size={18} /> <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </button>
              </header>
              <main className="max-w-7xl mx-auto">{renderMainContent(false)}</main>
              {showNameModal && renderNameModal()}
            </div>
          ) : (
            <CheckoutProcessView 
              customerName={customerNameInput}
              total={cart.reduce((a, b) => a + (b.price * b.quantity), 0)}
              onBack={() => setIsCompletingDetails(false)}
              onConfirm={(type, payment) => executeCheckout(type, payment)}
              isProcessing={isProcessingCheckout}
            />
          )}
        </div>
      } />

      <Route path="/order-status" element={
        <PublicOrderView 
          onAddToCart={addToCart} 
          orderDateInfo={orderDate || getFormattedDateInfo(new Date())} 
          onChangeDate={() => navigate('/')} 
          shopClosedInfo={shopClosedInfo}
          onBack={() => navigate('/')}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
          onViewCart={() => { setIsPublicMode(true); setCurrentView('cart'); navigate('/'); }}
        />
      } />

      <Route path="/track-orders" element={
        <div className="min-h-screen bg-gray-50 pb-10">
          <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
            <h1 className="font-black text-orange-600 italic uppercase tracking-tighter text-xl">Status Antrean</h1>
          </header>
          <main className="max-w-4xl mx-auto">
             <PublicOrderHistory orders={orders} />
          </main>
        </div>
      } />

      <Route path="/" element={
        currentUser ? (
          <div className="min-h-screen bg-orange-50/30">
            <Header 
              user={currentUser} 
              cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
              ordersCount={pendingOrdersCount}
              onNavigate={(v) => { 
                if (v === 'exit-to-welcome') handleExitToWelcome();
                else { setCurrentView(v); setAuthError(''); }
              }} 
              onLogout={logout} 
              currentView={currentView} 
            />
            <main className="pt-[88px] px-4 max-w-7xl mx-auto">{renderMainContent(true)}</main>
            {showNameModal && renderNameModal()}
          </div>
        ) : isPublicMode ? (
          !orderDate ? (
            <OrderDateSelector onSelectDate={(info) => setOrderDate(getFormattedDateInfo(info?.dateObj || new Date()))} user={null} authLoading={false} onBack={() => setIsPublicMode(false)} />
          ) : (
            <div className="min-h-screen bg-gray-50 pb-20"> 
              {!isCompletingDetails ? (
                <>
                  <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                      <button onClick={handleExitToWelcome} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                      <div>
                        <h1 className="font-black text-orange-500 text-lg italic leading-none">Warung Makan Mamah Yonda</h1>
                        <p className="text-xs text-gray-500">{orderDate.fullDate}</p>
                      </div>
                    </div>
                    <button onClick={() => setCurrentView('cart')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                      <ShoppingBag size={18} /> <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                    </button>
                  </header>
                  <main className="max-w-7xl mx-auto">{renderMainContent(false)}</main>
                  {showNameModal && renderNameModal()}
                </>
              ) : (
                <CheckoutProcessView 
                  customerName={customerNameInput} 
                  total={cart.reduce((a, b) => a + (b.price * b.quantity), 0)} 
                  onBack={() => setIsCompletingDetails(false)} 
                  onConfirm={(type, payment) => executeCheckout(type, payment)} 
                  isProcessing={isProcessingCheckout} 
                />
              )}
            </div>
          )
        ) : (
          <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-6 rounded-full shadow-xl mb-6"><UtensilsCrossed size={64} className="text-orange-500" /></div>
            <h1 className="text-4xl font-black mb-2 italic uppercase">Warung Makan <span className="text-orange-600">Mamah Yonda</span></h1>
            <p className="text-gray-500 mb-10 max-w-xs font-bold italic">Perut Kenyang, Hati Tenang, Kantong Senang!</p>
            <div className="flex flex-col w-full max-w-xs gap-3">
              <button 
                onClick={() => { 
                  setIsPublicMode(true);
                  setOrderDate(null);
                  setIsCompletingDetails(false); 
                }} 
                className="w-full bg-orange-500 text-white p-5 rounded-[2rem] font-black text-xl shadow-lg hover:scale-105 transition-all italic uppercase tracking-widest"
              >
                PESAN SEKARANG
              </button>
              <button onClick={() => navigate('/track-orders')} className="w-full bg-white text-orange-600 border-2 border-orange-500 p-4 rounded-[2rem] font-black flex items-center justify-center gap-2 uppercase italic tracking-wider">
                <ClipboardList size={20} /> Lacak Antrean
              </button>
            </div>
            <button onClick={() => navigate('/login')} className="mt-16 text-gray-400 font-bold text-xs tracking-widest flex items-center gap-2 uppercase">
              <LogIn size={14} /> Admin
            </button>
          </div>
        )
      } />
    </Routes>
  );
};

export default App;
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

export const useShop = (currentUser) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true); 

  // --- 1. AMBIL DATA PESANAN (Real-time untuk Admin & Public) ---
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalisasi format tanggal agar tidak error saat rendering
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
      }));
      setOrders(ordersList);
    }, (err) => { 
      console.error("Firestore error:", err); 
    });
    return () => unsubscribe();
  }, []);

  // --- 2. RESTORE SESSION (Agar pelanggan tidak kehilangan struk saat refresh) ---
  useEffect(() => {
    const restoreSession = async () => {
      const savedOrderId = localStorage.getItem('activeOrderId');
      if (savedOrderId) {
        try {
          const docRef = doc(db, "orders", savedOrderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentOrder({
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
          } else {
            localStorage.removeItem('activeOrderId');
          }
        } catch (error) {
          console.error("Gagal restore session:", error);
        }
      }
      setLoadingOrder(false); 
    };
    restoreSession();
  }, []);

  // --- 3. LOGIKA KERANJANG ---
  const addToCart = (newItem) => {
    setCart(prevCart => {
      // Gunakan kombinasi ID dan Varian untuk pengecekan item unik
      const itemKey = newItem.selectedVariant ? `${newItem.id}-${newItem.selectedVariant.name}` : newItem.id;
      const existingItemIndex = prevCart.findIndex(item => (item.cartId || item.id) === itemKey);

      if (existingItemIndex > -1) {
        const existingItem = prevCart[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        
        if (existingItem.stock !== undefined && existingItem.stock !== -1 && newQuantity > existingItem.stock) {
          alert(`Stok terbatas! Maksimal ${existingItem.stock} porsi.`);
          return prevCart;
        }
        
        const newCart = [...prevCart];
        newCart[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        return newCart;
      } else {
        return [...prevCart, {
          ...newItem,
          cartId: itemKey,
          quantity: 1,
          notes: newItem.note || newItem.notes || "", 
          variant: newItem.selectedVariant?.name || newItem.variant || 'Tanpa Varian'
        }];
      }
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + delta;
      
      if (delta > 0 && item.stock !== undefined && item.stock !== -1 && newQty > item.stock) {
        alert(`Sisa stok hanya ${item.stock}.`);
        return prev;
      }
      if (newQty > 0) {
        newCart[index] = { ...newCart[index], quantity: newQty };
        return newCart;
      } else {
        newCart.splice(index, 1);
        return newCart;
      }
    });
  };

  const updateCartItemDetails = (index, details) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], ...details };
      return newCart;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- 4. CHECKOUT (Dengan Inisialisasi Checklist Dapur) ---
  const checkout = async (customerName, orderNote = '', targetDate = null) => {
    if (cart.length === 0) return;
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const orderData = {
        customerName: customerName || "Pelanggan",
        items: cart,
        total: total,
        note: orderNote,
        orderDate: targetDate || new Date().toISOString().split('T')[0],
        status: 'pending', 
        isPaid: false, 
        checkedItems: {}, // PENTING: Untuk fitur checklist dapur
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      const newOrder = { 
        id: docRef.id, 
        ...orderData, 
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('activeOrderId', docRef.id);
      setCurrentOrder(newOrder);
      setCart([]); 
      return newOrder;
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  // --- 5. MANAJEMEN PESANAN (Admin) ---
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
    } catch (error) { 
      console.error("Update error:", error); 
    }
  };

  const togglePaymentStatus = async (orderId, currentPaymentStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const newIsPaid = !currentPaymentStatus;
      await updateDoc(orderRef, { 
        isPaid: newIsPaid,
        paymentStatus: newIsPaid ? 'paid' : 'unpaid' 
      });
    } catch (err) {
      console.error("Gagal update status bayar:", err);
    }
  };

  const removeOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (localStorage.getItem('activeOrderId') === orderId) {
        resetCurrentOrder();
      }
    } catch (error) { 
      console.error("Delete error:", error); 
    }
  };

  const resetCurrentOrder = () => {
    setCurrentOrder(null);
    localStorage.removeItem('activeOrderId'); 
  };

  return {
    cart, 
    setCart,
    orders, 
    currentOrder, 
    setCurrentOrder,
    loadingOrder, 
    resetCurrentOrder, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    checkout,
    updateOrderStatus,
    updateCartItemDetails,
    removeOrder,
    togglePaymentStatus 
  };
};

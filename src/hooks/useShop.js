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

  // --- AMBIL DATA PESANAN (Admin) ---
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setOrders(ordersList);
    }, (err) => { console.error("Firestore error:", err); });
    return () => unsubscribe();
  }, []);

  // --- RESTORE SESSION ---
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
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
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

  // --- LOGIKA CART ---
  const addToCart = (newItem) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === newItem.id);
      if (existingItemIndex > -1) {
        const existingItem = prevCart[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;
        if (existingItem.stock !== undefined && existingItem.stock !== -1 && newQuantity > existingItem.stock) {
          alert(`Maaf, stok ${existingItem.name} maksimal ${existingItem.stock}.`);
          return prevCart;
        }
        const newCart = [...prevCart];
        newCart[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        return newCart;
      } else {
        return [...prevCart, {
          ...newItem,
          notes: newItem.note || newItem.notes || "", 
          variant: newItem.selectedVariant?.name || newItem.variant || 'Tanpa Varian',
          selectedVariant: newItem.selectedVariant || null
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
        alert(`Maaf, sisa stok ${item.name} hanya ada ${item.stock}.`);
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

  // --- CHECKOUT ---
  // UPDATE: Menerima targetDate (tanggal pesanan dikonsumsi)
  const checkout = async (customerName, orderNote = '', targetDate = null) => {
    if (cart.length === 0) return;
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderItems = cart.map(item => ({
        id: item.id,
        productId: item.productId || item.id.split('-')[0],
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        selectedVariant: item.selectedVariant || null,
        variant: item.variant || (item.selectedVariant?.name) || 'Tanpa Varian',
        notes: item.notes || item.note || "" 
      }));

      const orderData = {
        customerName: customerName || "Pelanggan",
        items: orderItems,
        total: total,
        note: orderNote,
        orderDate: targetDate, // <--- MENYIMPAN TANGGAL TARGET PESANAN
        status: 'pending', 
        isPaid: false, 
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      const newOrder = { 
        id: docRef.id, 
        ...orderData, 
        createdAt: new Date()
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

  const resetCurrentOrder = () => {
    setCurrentOrder(null);
    localStorage.removeItem('activeOrderId'); 
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) { console.error("Update error:", error); alert("Gagal update status."); }
  };

  // --- TOGGLE STATUS BAYAR ---
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
      alert("Gagal update status bayar");
    }
  };

  const removeOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (error) { console.error("Delete error:", error); alert("Gagal hapus data."); }
  };

  return {
    cart, 
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
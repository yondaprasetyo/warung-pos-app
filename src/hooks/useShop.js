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
  updateDoc 
} from 'firebase/firestore';

export const useShop = (currentUser) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setOrders(ordersList);
    }, (err) => {
      if (err.code === 'permission-denied') {
        console.log("Akses database dihentikan karena sesi berakhir.");
      } else {
        console.error("Firestore error:", err);
      }
    });

    return () => {
      unsubscribe();
      setOrders([]); 
    };
  }, [currentUser]);

  // --- PERBAIKAN 1: Logika Harga Varian di AddToCart ---
  const addToCart = (product, variantName, note) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => 
        item.id === product.id && item.variant === variantName
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      // Pastikan mengambil harga yang benar dari array varian
      const variantObj = Array.isArray(product.variants) 
        ? product.variants.find(v => (v.name || v) === variantName)
        : null;

      const finalPrice = variantObj?.price ? Number(variantObj.price) : Number(product.price);

      return [...prevCart, {
        ...product,
        basePrice: product.price, 
        price: finalPrice,
        variant: variantName,
        note: note,
        quantity: 1,
        variants: product.variants 
      }];
    });
  };

  // --- PERBAIKAN 2: Gunakan Index untuk Keamanan Tombol ---
  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev; // Proteksi jika index tidak ditemukan
      const newCart = [...prev];
      const newQty = newCart[index].quantity + delta;
      
      if (newQty > 0) {
        newCart[index] = { ...newCart[index], quantity: newQty };
        return newCart;
      }
      return prev;
    });
  };

  // --- PERBAIKAN 3: Fungsi Update Detail untuk Dropdown & Catatan ---
  const updateCartItemDetails = (index, details) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], ...details };
      return newCart;
    });
  };

  // Gunakan index agar penghapusan akurat jika ada nama menu yang sama
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const checkout = async (customerName) => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        customerName,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Baru',
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      const newOrder = { id: docRef.id, ...orderData, createdAt: new Date() };
      
      setCurrentOrder(newOrder);
      setCart([]);
      return newOrder;
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  const markOrderDone = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'Selesai' });
    } catch (error) {
      console.error("Update status error:", error);
      alert("Gagal memperbarui status pesanan.");
    }
  };

  return {
    cart, orders, currentOrder, setCurrentOrder,
    addToCart, updateQuantity, removeFromCart, checkout,
    markOrderDone,
    updateCartItemDetails // WAJIB DI-RETURN AGAR BISA DIPAKAI APP.JSX
  };
};
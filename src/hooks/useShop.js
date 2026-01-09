import { useState, useEffect } from 'react'; 
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

export const useShop = (currentUser) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]); // Kembalikan setOrders
  const [currentOrder, setCurrentOrder] = useState(null);

  // --- REAL-TIME LISTENER UNTUK RIWAYAT PESANAN ---
  useEffect(() => {
    // Referensi ke koleksi 'orders' diurutkan berdasarkan waktu terbaru
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    // Mendengarkan perubahan data secara langsung
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // CEK APAKAH TIMESTAMP ADA, JIKA TIDAK GUNAKAN WAKTU SEKARANG
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      setOrders(ordersList);
    });

    return () => unsubscribe(); // Stop listening saat komponen tidak digunakan
  }, []);

  // Fungsi Tambah ke Keranjang
  const addToCart = (product, variant = '', note = '') => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.id === product.id && item.variant === variant
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        if (note) newCart[existingItemIndex].note = note;
        return newCart;
      }

      return [...prevCart, { 
        ...product, 
        quantity: 1, 
        variant: variant || (product.variants ? product.variants.split(',')[0].trim() : ''),
        note: note 
      }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItemDetails = (index, details) => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, ...details } : item
    ));
  };

  const checkout = async (customerName) => {
    if (cart.length === 0) return null;

    try {
      const orderData = {
        customerName,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        createdAt: serverTimestamp(),
        status: 'success',
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      const finalOrder = { id: docRef.id, ...orderData };
      setCurrentOrder(finalOrder);
      setCart([]); 
      
      return finalOrder;
    } catch (error) {
      console.error("Error saving order:", error);
      throw error;
    }
  };

  return { 
    cart, orders, currentOrder, setCurrentOrder,
    addToCart, updateQuantity, removeFromCart, updateCartItemDetails, checkout 
  };
};
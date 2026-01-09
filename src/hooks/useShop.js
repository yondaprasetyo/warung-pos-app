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
  
  // PERBAIKAN 1: Inisialisasi state dengan logika sederhana
  // Jika tidak ada user, nilai awal langsung array kosong
  const [orders, setOrders] = useState([]); 
  const [currentOrder, setCurrentOrder] = useState(null);

  // --- REAL-TIME LISTENER UNTUK RIWAYAT PESANAN ---
  useEffect(() => {
    // PERBAIKAN 2: Jika tidak ada user, jangan lakukan apa-apa di dalam effect
    // State orders sudah diatur secara default atau akan diupdate oleh listener
    if (!currentUser) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setOrders(ordersList);
    }, () => {
      console.warn("Info: Riwayat pesanan hanya untuk kasir.");
    });

    return () => {
        unsubscribe();
        // Opsional: Jika ingin memastikan data bersih saat logout
        setOrders([]); 
    };
  }, [currentUser]);

  // --- LOGIKA TAMBAH KE KERANJANG ---
  const addToCart = (product, variant = '', note = '') => {
    setCart(prevCart => {
      const defaultVariant = product.variants ? product.variants.split(',')[0].trim() : '';
      const selectedVariant = variant || defaultVariant;

      const existingItemIndex = prevCart.findIndex(
        item => item.id === product.id && item.variant === selectedVariant
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        if (note) {
          newCart[existingItemIndex].note = newCart[existingItemIndex].note 
            ? `${newCart[existingItemIndex].note}, ${note}` 
            : note;
        }
        return newCart;
      }

      return [...prevCart, { 
        ...product, 
        quantity: 1, 
        variant: selectedVariant,
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
        customerName: customerName || "Pelanggan Umum",
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant || null, 
          note: item.note || ""
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        createdAt: serverTimestamp(),
        status: currentUser ? 'Selesai' : 'Baru', 
        userId: currentUser ? currentUser.uid : 'public',
        orderType: currentUser ? 'kasir' : 'mandiri' 
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const finalOrder = { id: docRef.id, ...orderData, createdAt: new Date() };
      setCurrentOrder(finalOrder);
      setCart([]); 
      return finalOrder;
    } catch (error) {
      console.error("Error saving order:", error);
      throw error;
    }
  };

  return {
    cart,
    orders,
    currentOrder,
    addToCart,
    updateQuantity,
    removeFromCart,
    updateCartItemDetails,
    checkout,
    setCurrentOrder
  };
};
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

  // 1. LISTENER PESANAN REAL-TIME
  useEffect(() => {
    // Jika tidak ada user (logout), jangan buat listener
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
      // Menangani error permission secara halus saat logout
      if (err.code === 'permission-denied') {
        console.log("Akses database dihentikan karena sesi berakhir.");
      } else {
        console.error("Firestore error:", err);
      }
    });

    // PERBAIKAN: Fungsi cleanup dijalankan saat logout atau komponen hilang
    return () => {
      unsubscribe();
      setOrders([]); // Reset data pesanan di sini agar tidak cascading render
    };
  }, [currentUser]); //

  // 2. FUNGSI KERANJANG (CART)
  const addToCart = (product, variantName, note) => {
    setCart(prevCart => {
      // Cari apakah item dengan varian yang sama sudah ada
      const existingIndex = prevCart.findIndex(item => 
        item.id === product.id && item.variant === variantName
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      // Ambil harga varian jika ada
      const variantObj = Array.isArray(product.variants) 
        ? product.variants.find(v => (v.name || v) === variantName)
        : null;

      const finalPrice = variantObj?.price ? Number(variantObj.price) : Number(product.price);

      return [...prevCart, {
        ...product,
        basePrice: product.price, // Simpan harga asli sebagai cadangan
        price: finalPrice,
        variant: variantName,
        note: note,
        quantity: 1,
        variants: product.variants // Simpan array varian untuk dropdown di cart
      }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQty = newCart[index].quantity + delta;
      if (newQty > 0) {
        newCart[index].quantity = newQty;
        return newCart;
      }
      return prev;
    });
  };

  const removeFromCart = (id, variant) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.variant === variant)));
  };

  // 3. FUNGSI TRANSAKSI (CHECKOUT)
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

  // 4. FUNGSI UPDATE STATUS PESANAN
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
    markOrderDone
  };
};
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

  const addToCart = (product, variantName, note) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => 
        item.id === product.id && item.variant === variantName
      );

      // VALIDASI STOK: Cek jika sudah ada di keranjang
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.stock !== -1 && item.quantity >= item.stock) {
          alert(`Maaf, stok ${item.name} sudah mencapai batas maksimal (${item.stock}).`);
          return prevCart;
        }
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

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
        variants: product.variants,
        stock: product.stock // Pastikan stok ikut tersimpan di item keranjang
      }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + delta;
      
      // VALIDASI STOK: Jangan biarkan melebihi stok yang ada
      if (delta > 0 && item.stock !== -1 && newQty > item.stock) {
        alert(`Stok terbatas! Hanya tersedia ${item.stock} porsi.`);
        return prev;
      }

      if (newQty > 0) {
        newCart[index] = { ...newCart[index], quantity: newQty };
        return newCart;
      }
      return prev;
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
    updateCartItemDetails 
  };
};
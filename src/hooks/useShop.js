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

  // --- AMBIL DATA PESANAN DARI FIRESTORE (REAL-TIME) ---
  useEffect(() => {
    // Jika Admin, ambil semua order. Jika User biasa, mungkin hanya order dia (opsional)
    // Di sini kita ambil semua order untuk keperluan Admin Dashboard
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalisasi timestamp menjadi Date object JS
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setOrders(ordersList);
    }, (err) => {
      console.error("Firestore error:", err);
    });

    return () => {
      unsubscribe();
    };
  }, []); // Dependensi kosong agar listener tetap hidup selama aplikasi jalan

  // --- 1. TAMBAH KE KERANJANG ---
  const addToCart = (newItem) => {
    setCart(prevCart => {
      // Cek apakah item dengan ID unik ini (ID-Varian) sudah ada
      const existingItemIndex = prevCart.findIndex(item => item.id === newItem.id);

      if (existingItemIndex > -1) {
        // Update quantity jika sudah ada
        const existingItem = prevCart[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;

        // Validasi Stok
        if (existingItem.stock !== -1 && newQuantity > existingItem.stock) {
          alert(`Maaf, stok ${existingItem.name} maksimal ${existingItem.stock}.`);
          return prevCart;
        }

        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        return newCart;
      } else {
        // Masukkan item baru
        return [...prevCart, {
          ...newItem,
          notes: newItem.note || newItem.notes || "", 
          variant: newItem.selectedVariant?.name || newItem.variant || 'Tanpa Varian',
          selectedVariant: newItem.selectedVariant || null
        }];
      }
    });
  };

  // --- 2. UPDATE JUMLAH ITEM ---
  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + delta;
      
      // Cek Stok
      if (delta > 0 && item.stock !== -1 && newQty > item.stock) {
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

  // --- 3. UPDATE DETAIL ---
  const updateCartItemDetails = (index, details) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], ...details };
      return newCart;
    });
  };

  // --- 4. HAPUS DARI KERANJANG ---
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- 5. PROSES CHECKOUT (DIPERBAIKI DENGAN STATUS AWAL 'pending') ---
  const checkout = async (customerName, orderNote = '') => {
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
        // STATUS AWAL: 'pending' (Menunggu Konfirmasi Admin)
        status: 'pending', 
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      const newOrder = { 
        id: docRef.id, 
        ...orderData, 
        createdAt: new Date() // Fallback tanggal lokal sebelum serverTimestamp balik
      };
      
      setCurrentOrder(newOrder);
      setCart([]); 
      return newOrder;

    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  // --- UPDATE STATUS ORDER (ADMIN) ---
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Update status error:", error);
      alert("Gagal memperbarui status pesanan.");
    }
  };

  return {
    cart, 
    orders, 
    currentOrder, 
    setCurrentOrder,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    checkout,
    updateOrderStatus, // Ganti nama markOrderDone jadi lebih umum
    updateCartItemDetails 
  };
};
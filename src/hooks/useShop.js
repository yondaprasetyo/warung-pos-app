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

  // --- AMBIL DATA PESANAN DARI FIRESTORE ---
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

  // --- TAMBAH KE KERANJANG ---
  const addToCart = (product, variantName, note) => {
    setCart(prevCart => {
      // Mencari apakah item dengan ID, Varian, dan CATATAN yang sama sudah ada
      const existingIndex = prevCart.findIndex(item => 
        item.id === product.id && 
        item.variant === variantName &&
        item.notes === note // Memisahkan baris jika catatan berbeda
      );

      // VALIDASI STOK
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

      // AMBIL HARGA BERDASARKAN VARIAN
      const variantObj = Array.isArray(product.variants) 
        ? product.variants.find(v => (v.name || v) === variantName)
        : null;

      const finalPrice = variantObj?.price ? Number(variantObj.price) : Number(product.price);

      // MASUKKAN KE KERANJANG DENGAN KEY 'notes'
      return [...prevCart, {
        ...product,
        basePrice: product.price, 
        price: finalPrice,
        variant: variantName || 'Tanpa Varian',
        notes: note || "", // Konsisten menggunakan 'notes' sesuai UI Keranjang
        quantity: 1,
        variants: product.variants || [],
        stock: product.stock 
      }];
    });
  };

  // --- UPDATE JUMLAH ITEM ---
  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + delta;
      
      // CEK STOK
      if (delta > 0 && item.stock !== -1 && newQty > item.stock) {
        alert(`Maaf, sisa stok ${item.name} hanya ada ${item.stock}.`);
        return prev;
      }

      if (newQty > 0) {
        newCart[index] = { ...newCart[index], quantity: newQty };
        return newCart;
      }
      return prev;
    });
  };

  // --- UPDATE DETAIL (Notes & Varian di Keranjang) ---
  const updateCartItemDetails = (index, details) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], ...details };
      return newCart;
    });
  };

  // --- HAPUS DARI KERANJANG ---
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- PROSES CHECKOUT KE DATABASE ---
  const checkout = async (customerName) => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        customerName: customerName || "Pelanggan",
        // Mapping item agar data yang dikirim ke Firebase bersih dan mengandung notes
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          variant: item.variant || 'Tanpa Varian',
          notes: item.notes || "" // Menyimpan catatan ke database
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Baru',
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // Buat objek untuk tampilan struk instan
      const newOrder = { 
        id: docRef.id, 
        ...orderData, 
        createdAt: new Date() 
      };
      
      setCurrentOrder(newOrder);
      setCart([]); // Kosongkan keranjang
      return newOrder;
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  // --- SELESAIKAN PESANAN ---
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
    cart, 
    orders, 
    currentOrder, 
    setCurrentOrder,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    checkout,
    markOrderDone,
    updateCartItemDetails 
  };
};
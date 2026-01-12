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
      console.error("Firestore error:", err);
    });

    return () => {
      unsubscribe();
      setOrders([]); 
    };
  }, [currentUser]);

  // --- 1. TAMBAH KE KERANJANG (DIPERBAIKI) ---
  // Sekarang menerima 1 parameter objek dari ItemSelectionModal
  const addToCart = (newItem) => {
    setCart(prevCart => {
      // Cek apakah item dengan ID unik ini (ID-Varian) sudah ada di keranjang
      const existingItemIndex = prevCart.findIndex(item => item.id === newItem.id);

      if (existingItemIndex > -1) {
        // Jika sudah ada, update quantity
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
        // Jika belum ada, masukkan item baru
        // Normalisasi data agar konsisten (notes vs note)
        return [...prevCart, {
          ...newItem,
          // Pastikan properti ini ada untuk CartView
          notes: newItem.note || newItem.notes || "", 
          variant: newItem.selectedVariant?.name || newItem.variant || 'Tanpa Varian',
          selectedVariant: newItem.selectedVariant || null // Simpan objek varian
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
      
      // CEK STOK
      if (delta > 0 && item.stock !== -1 && newQty > item.stock) {
        alert(`Maaf, sisa stok ${item.name} hanya ada ${item.stock}.`);
        return prev;
      }

      if (newQty > 0) {
        newCart[index] = { ...newCart[index], quantity: newQty };
        return newCart;
      } else {
        // Jika 0, hapus item (opsional, atau bisa dihandle UI)
        newCart.splice(index, 1);
        return newCart;
      }
    });
  };

  // --- 3. UPDATE DETAIL (Notes & Varian di Keranjang) ---
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

  // --- 5. PROSES CHECKOUT KE DATABASE (DIPERBAIKI) ---
  const checkout = async (customerName, orderNote = '') => {
    if (cart.length === 0) return;
    
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // MAPPING ITEM AGAR DATA VARIAN TERSIMPAN LENGKAP
      const orderItems = cart.map(item => ({
        id: item.id, // ID Unik (Product+Varian)
        productId: item.productId || item.id.split('-')[0], // ID Produk Asli
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        
        // --- DATA PENTING UNTUK RECEIPT ---
        selectedVariant: item.selectedVariant || null, // Simpan Objek Lengkap
        variant: item.variant || (item.selectedVariant?.name) || 'Tanpa Varian', // String Fallback
        
        notes: item.notes || item.note || "" // Catatan
      }));

      const orderData = {
        customerName: customerName || "Pelanggan",
        items: orderItems,
        total: total,
        note: orderNote, // Catatan global order (misal tanggal)
        status: 'Baru',
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : 'public'
      };

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // Buat objek lokal untuk update UI instan (tanpa reload)
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
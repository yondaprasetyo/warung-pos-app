import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

export const useShop = (currentUser) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  // --- LOGIC 1: LOAD ORDERS DARI FIREBASE (REAL-TIME) ---
  useEffect(() => {
    // Query ini akan mengambil SEMUA data di collection 'orders'
    // diurutkan dari yang terbaru. Tidak peduli siapa yang login.
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("dateISO", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Data Orders Terupdate:", ordersData); // Cek Console browser Admin
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []); // Dependency array kosong = jalan sekali saat App start

  // --- LOGIC 2: CART (LOKAL) ---
  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    const newCart = existing
      ? cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { ...item, quantity: 1 }];
    setCart(newCart);
  };

  const updateQuantity = (id, delta) => {
    const newCart = cart.map(item => {
      if (item.id === id) {
        const qty = item.quantity + delta;
        return qty > 0 ? { ...item, quantity: qty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(newCart);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // --- LOGIC 3: CHECKOUT (SIMPAN KE FIREBASE) ---
  const checkout = async (customerName) => {
    // 1. Validasi Input
    if (!customerName || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isPublicOrder = !currentUser; // True jika tamu

    // 2. Pastikan tidak ada data 'undefined'
    // Gunakan nilai default ("") jika data kosong
    const newOrderData = {
      customerName: customerName || "Tanpa Nama",
      items: cart.map(item => ({
        // Kita map ulang item agar bersih dari property aneh
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || "📦"
      })),
      total: Number(total),
      date: new Date().toLocaleString('id-ID'),
      dateISO: new Date().toISOString(),
      status: isPublicOrder ? 'Baru' : 'Selesai',
      type: isPublicOrder ? 'Online' : 'Dine-in',
      // PENTING: Gunakan operator OR (||) agar tidak pernah undefined
      cashier: currentUser?.name || 'Pelanggan Online', 
      cashierId: currentUser?.uid || 'guest'
    };

    console.log("Mengirim Data ke Firebase:", newOrderData); // Cek Console

    try {
      const docRef = await addDoc(collection(db, "orders"), newOrderData);
      console.log("SUKSES! ID:", docRef.id);
      
      const confirmedOrder = { id: docRef.id, ...newOrderData };
      setCurrentOrder(confirmedOrder);
      setCart([]);
      return confirmedOrder;
    } catch (e) {
      // 3. Tampilkan Error Jelas ke Layar
      console.error("ERROR FIREBASE:", e);
      alert("Gagal Simpan: " + e.message); // Alert pesan error asli
    }
  };

  // --- LOGIC 4: UPDATE STATUS (UNTUK ADMIN) ---
  const markOrderDone = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Selesai"
      });
    } catch (error) {
      console.error("Error update status:", error);
      alert("Gagal update status");
    }
  };

  return { 
    cart, 
    orders, 
    currentOrder, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    checkout, 
    setCurrentOrder,
    markOrderDone 
  };
};
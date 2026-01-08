import { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Pastikan import ini benar
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore'; // Tambahkan import collection, getDocs, deleteDoc

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]); // Kembalikan state users
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Cek status login user secara real-time
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
           setCurrentUser(user); 
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Fetch Daftar Semua User (Khusus untuk tampilan Admin)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    fetchUsers();
  }, [currentUser]); // Refresh saat user login/logout

  const login = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      setAuthError('Email atau password salah!');
      return false;
    }
  };

  const register = async (userData) => {
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      const newUser = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString()
      };

      // Simpan ke Firestore
      await setDoc(doc(db, "users", user.uid), newUser);
      
      // Update state lokal agar Admin langsung melihat user baru tanpa refresh
      setUsers(prev => [...prev, { id: user.uid, ...newUser }]);
      
      return true;
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Email sudah terdaftar!');
      } else {
        setAuthError('Gagal mendaftar: ' + error.message);
      }
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // 3. Tambahkan fungsi Delete User (Hapus dari Database Firestore)
  const deleteUser = async (userId) => {
    if (window.confirm("Yakin ingin menghapus user ini?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        // Update state lokal
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Gagal menghapus user");
      }
    }
  };

  // Jangan lupa return 'users' dan 'deleteUser' di sini!
  return { 
    currentUser, 
    users,        // <--- Penting: Kembalikan users
    authError, 
    setAuthError, 
    login, 
    logout, 
    register, 
    deleteUser,   // <--- Penting: Kembalikan deleteUser
    loading 
  };
};
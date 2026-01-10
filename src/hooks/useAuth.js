import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
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
} from 'firebase/firestore';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. MONITOR STATUS AUTH & AMBIL PROFIL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          // Hanya ambil dokumen profil jika user login
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser({ uid: user.uid, email: user.email, ...userDoc.data() });
          } else {
            setCurrentUser(user); 
          }
        } catch (err) {
          // Tangkap error permission agar aplikasi tidak crash
          console.warn("Profil Firestore belum bisa diakses:", err.message);
          setCurrentUser(user); 
        }
      } else {
        setCurrentUser(null);
        setUsers([]); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH DAFTAR SEMUA USER (Dijalankan hanya setelah login berhasil)
  useEffect(() => {
    const fetchUsers = async () => {
      // Pastikan currentUser sudah ada & proses loading profil selesai
      if (!currentUser) return;

      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        // Error ini wajar jika user yang login bukan Admin
        console.error("Gagal mengambil daftar user:", error.message);
      }
    };
    
    fetchUsers();
  }, [currentUser]);

  const login = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login Error:", error.code);
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

      await setDoc(doc(db, "users", user.uid), newUser);
      setUsers(prev => [...prev, { id: user.uid, ...newUser }]);
      return true;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Email sudah terdaftar!');
      } else {
        setAuthError('Gagal mendaftar: ' + error.message);
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Yakin ingin menghapus user ini?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        alert("Gagal menghapus user: " + error.message);
      }
    }
  };

  return { 
    currentUser, 
    users, 
    authError, 
    setAuthError, 
    login, 
    logout, 
    register, 
    deleteUser, 
    loading 
  };
};
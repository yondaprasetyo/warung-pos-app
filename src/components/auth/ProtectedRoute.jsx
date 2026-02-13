import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, loading } = useAuth();

  // Kalau masih loading (ngecek firebase), jangan tampilkan apa-apa dulu
  if (loading) return null; 

  // 1. Kalau user belum login sama sekali
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Kalau halaman ini khusus admin, tapi usernya cuma 'user' biasa
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Kalau lolos semua pengecekan, tampilkan halamannya
  return children;
};

export default ProtectedRoute;
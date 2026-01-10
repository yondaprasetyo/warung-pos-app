import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LoginView = ({ onLogin, error }) => { // Hapus prop onRegisterClick karena tidak digunakan lagi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => onLogin(email, password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍽️</div>
          {/* UBAH NAMA WARUNG DI SINI */}
          <h1 className="text-3xl font-bold text-gray-800">Warung Makan Mamah Yonda</h1>
          <p className="text-gray-600">Masuk untuk memulai</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold">
            Masuk
          </button>
        </div>
        
        {/* Bagian Daftar Akun sudah dihapus dari sini */}
      </div>
    </div>
  );
};

export default LoginView;
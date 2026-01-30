import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
// Tambahkan useNavigate untuk berpindah halaman
import { useNavigate } from 'react-router-dom';

const LoginView = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State untuk loading animasi
  
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      // Tunggu proses login selesai
      await onLogin(email, password);
      // SETELAH LOGIN BERHASIL: Paksa pindah ke halaman utama
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md border-t-8 border-orange-500">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🍽️</div>
          <h1 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter">
            Warung Makan <span className="text-orange-500">Mamah Yonda</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Panel Administrasi</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2 animate-shake">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Email Admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mamahyonda.com"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-5 rounded-2xl font-black italic uppercase tracking-wider shadow-lg shadow-orange-200 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Masuk Sekarang'}
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-orange-500 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
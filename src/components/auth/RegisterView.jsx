import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const RegisterView = ({ onRegister, onBack, error }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'kasir' });

  // HAPUS BARIS INI (const handleChange...) karena tidak dipakai

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.password) return;
    onRegister(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Kembali
        </button>
        <h2 className="text-2xl font-bold mb-6">Daftar Akun Baru</h2>
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Lengkap"
            className="w-full px-4 py-3 border rounded-lg"
            // Handler inline ini sudah benar, jadi handleChange di atas tidak perlu
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <select
            className="w-full px-4 py-3 border rounded-lg bg-white"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="kasir">Kasir</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold">
            Daftar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
import React, { useState } from 'react';

const ProfileView = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');

  const handleUpdate = () => {
    onUpdate({ ...user, name, email, password: password || user.password });
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nama</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Password Baru (Opsional)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Biarkan kosong jika tetap" className="w-full border p-2 rounded" />
          </div>
          <button onClick={handleUpdate} className="w-full bg-orange-500 text-white py-2 rounded font-bold hover:bg-orange-600">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
};
export default ProfileView;
// Hapus { useState } karena tidak dipakai
import React from 'react'; 
import { Trash2, Plus } from 'lucide-react';

const UserManagement = ({ users, currentUser, onDelete, onAddClick }) => {
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* ... sisa kode di bawah tetap sama ... */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen User</h2>
          <button onClick={onAddClick} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={20} /> Tambah User
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Nama</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm capitalize">{user.role}</span></td>
                  <td className="p-4">
                    {user.id !== currentUser.id && (
                      <button onClick={() => onDelete(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
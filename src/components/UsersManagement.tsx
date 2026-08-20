import React, { useState } from 'react';
import { UserPlus, Shield, UserCircle, Edit, Trash2 } from 'lucide-react';
import { User } from '../types';

interface UsersManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  logActivity: (action: string, details: string) => void;
  syncToCloud: (action: string, payloadKey: string, payloadData: any) => void;
}

export function UsersManagement({ users, setUsers, showConfirm, showToast, logActivity, syncToCloud }: UsersManagementProps) {
  const [editingItem, setEditingItem] = useState<User | 'NEW' | null>(null); 
  const [formData, setFormData] = useState<Omit<User, 'id'>>({ username: '', password: '', name: '', email: '', role: 'sales' });
  
  const handleSave = () => { 
    if (editingItem === 'NEW') { 
      const newUser: User = { 
        ...formData, 
        id: `U-${Date.now()}`,
        email: formData.email || `${formData.username}@sra.co.id`,
        salesId: `U-${Date.now()}`
      }; 
      setUsers([newUser, ...users]); 
      logActivity('CREATE_USER', `Buat user: ${formData.name} (${formData.email || formData.username})`); 
      syncToCloud('saveUser', 'user', newUser); 
    } else if (editingItem) { 
      const updatedUser: User = { 
        ...formData, 
        id: editingItem.id,
        salesId: editingItem.salesId || editingItem.id
      }; 
      setUsers(users.map(u => u.id === editingItem.id ? updatedUser : u)); 
      logActivity('UPDATE_USER', `Edit user: ${formData.name}`); 
      syncToCloud('saveUser', 'user', updatedUser); 
    }
    setEditingItem(null); 
    showToast("Data user disimpan"); 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-10 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengguna & Hak Akses</h2>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">Kelola tim sales, manager, dan kredensial sistem</p>
        </div>
        {!editingItem && (
          <button onClick={() => { setFormData({ username: '', password: '', name: '', email: '', role: 'sales' }); setEditingItem('NEW'); }} className="px-5 py-2.5 clay-button-primary text-white font-bold text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Tambah User
          </button>
        )}
      </div>

      {editingItem && (
        <div className="clay-card p-7 mb-6 animate-in zoom-in-95 duration-200">
          <h3 className="text-base font-extrabold mb-5 text-slate-900 border-b border-slate-200/60 pb-3">{editingItem === 'NEW' ? 'Tambah User Baru' : 'Edit Kredensial User'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Nama Lengkap *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" placeholder="Contoh: Andi Triyanto"/></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Alamat Email *</label><input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" placeholder="user@email.com"/></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Username *</label><input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})} disabled={editingItem !== 'NEW'} className="w-full p-3 clay-input text-sm font-semibold disabled:opacity-50" placeholder="username"/></div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Role Akses *</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as any})} 
                className="w-full p-3 clay-input text-sm font-semibold bg-white text-slate-800"
              >
                <option value="sales">Sales Representative / Admin Sales (Akses Pribadi)</option>
                <option value="manager">Manager (Akses Global Monitoring)</option>
                <option value="admin">Admin Global (Full Access Sistem)</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Password *</label><input type="text" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" placeholder="••••••"/></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 clay-button-secondary text-slate-700 font-bold text-sm">Batal</button>
            <button onClick={handleSave} className="px-6 py-2.5 clay-button-primary text-white font-bold text-sm">Simpan</button>
          </div>
        </div>
      )}

      {!editingItem && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(users || []).map((user) => (
            <div key={user?.id || Math.random()} className="clay-card clay-card-hover p-6 group relative overflow-hidden">
               <div className="absolute top-5 right-5 flex gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => { setFormData({ username: user.username, password: user.password || '', name: user.name, email: user.email || '', role: user.role }); setEditingItem(user); }} className="p-2 clay-button-secondary text-blue-700" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if(user?.username === 'admin') return showToast("Admin tak bisa dihapus!", 'error'); showConfirm("Hapus User?", "", () => {setUsers((users || []).filter(u => u?.id !== user?.id)); showToast("Dihapus"); logActivity('DELETE_USER', `Hapus ${user?.name || ''}`); syncToCloud('deleteUser', 'user', { id: user?.id }); })}} className="p-2 clay-button-secondary text-rose-700" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
               <div className="flex items-center gap-3.5 mb-4">
                 <div className={`w-11 h-11 clay-badge rounded-2xl flex items-center justify-center shrink-0 ${
                   user?.role === 'admin' || user?.role === 'administrator'
                     ? 'bg-purple-100 text-purple-800'
                     : user?.role === 'manager'
                     ? 'bg-amber-100 text-amber-800'
                     : 'bg-emerald-100 text-emerald-800'
                 }`}>
                   {user?.role === 'admin' || user?.role === 'administrator' || user?.role === 'manager' ? (
                     <Shield className="w-5 h-5" />
                   ) : (
                     <UserCircle className="w-5 h-5" />
                   )}
                 </div>
                 <div>
                   <h3 className="text-base font-extrabold text-slate-900 leading-tight">{user?.name || 'User'}</h3>
                   <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold ${
                     user?.role === 'admin' || user?.role === 'administrator'
                       ? 'bg-purple-100/80 text-purple-900'
                       : user?.role === 'manager'
                       ? 'bg-amber-100/80 text-amber-900'
                       : 'bg-emerald-100/80 text-emerald-900'
                   }`}>
                     {user?.role === 'admin' || user?.role === 'administrator' 
                       ? 'Admin Global' 
                       : user?.role === 'manager' 
                       ? 'Manager' 
                       : 'Sales / Admin Sales'}
                   </span>
                 </div>
               </div>
               <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/60 pt-3.5 font-medium">
                 <div><span className="text-slate-400 font-bold">Email:</span> <span className="font-extrabold text-slate-800">{user?.email || '-'}</span></div>
                 <div><span className="text-slate-400 font-bold">Username:</span> <span className="font-extrabold text-slate-800">{user?.username || '-'}</span></div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


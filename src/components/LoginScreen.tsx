import React, { useState } from 'react';
import { Package, UserCircle, Lock, ShieldCheck, Terminal } from 'lucide-react';
import { ProductionDiagnosticModal } from './ProductionDiagnosticModal';
import { defaultSettings } from '../utils/helpers';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isDiagOpen, setIsDiagOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef2f7] flex flex-col justify-center items-center p-4 relative font-sans text-slate-900">
      <div className="max-w-[430px] w-full clay-card overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 p-2">
        <div className="p-8 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white relative rounded-2xl border border-white/10 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 border border-white/30 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20 transform hover:scale-105 transition-transform">
             <Package className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1 drop-shadow-xs">SRA Quotify</h1>
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise Quotation Portal
          </p>
        </div>

        <form onSubmit={e => {e.preventDefault(); onLogin(username, password);}} className="p-7 space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Username</label>
            <div className="relative">
              <UserCircle className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                placeholder="admin / sales" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                placeholder="123" 
                required 
              />
            </div>
          </div>

          <button type="submit" className="w-full py-4 clay-button-primary text-white font-bold text-sm tracking-wide mt-2">
            Masuk Portal Sistem
          </button>
        </form>

        <div className="bg-[#eaf0f7] p-5 rounded-2xl border border-slate-200/60 text-xs mt-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Pilih Akun Demo (Klik untuk Masuk):</p>
            <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Multi-Role</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onLogin('admin', '123')}
              className="clay-badge bg-white p-2.5 text-slate-700 font-medium hover:bg-blue-50 transition-all text-left flex flex-col cursor-pointer border border-blue-200 shadow-2xs"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-blue-900 font-black text-xs">Administrator / Manager</span>
                <span className="font-mono text-blue-700 font-extrabold text-[11px] bg-blue-100/70 px-1.5 py-0.5 rounded">admin / 123</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Akses Global: Lihat & pantau penawaran semua sales secara real-time.</span>
            </button>

            <button
              type="button"
              onClick={() => onLogin('sales', '123')}
              className="clay-badge bg-white p-2.5 text-slate-700 font-medium hover:bg-emerald-50 transition-all text-left flex flex-col cursor-pointer border border-emerald-200 shadow-2xs"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-emerald-900 font-black text-xs">Sales Rep (Siti Rahma)</span>
                <span className="font-mono text-emerald-700 font-extrabold text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">sales / 123</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Akses Sales: Hanya melihat penawaran yang dibuat sendiri.</span>
            </button>

            <button
              type="button"
              onClick={() => onLogin('budi', '123')}
              className="clay-badge bg-white p-2.5 text-slate-700 font-medium hover:bg-amber-50 transition-all text-left flex flex-col cursor-pointer border border-slate-200 shadow-2xs"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-900 font-black text-xs">Sales Rep (Budi Santoso)</span>
                <span className="font-mono text-slate-700 font-extrabold text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">budi / 123</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Akses Sales: Hanya melihat penawaran pribadi Budi.</span>
            </button>

            <button
              type="button"
              onClick={() => onLogin('hendra', '123')}
              className="clay-badge bg-white p-2.5 text-slate-700 font-medium hover:bg-purple-50 transition-all text-left flex flex-col cursor-pointer border border-slate-200 shadow-2xs"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-900 font-black text-xs">Sales Rep (Hendra P.)</span>
                <span className="font-mono text-slate-700 font-extrabold text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">hendra / 123</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Akses Sales: Hanya melihat penawaran pribadi Hendra.</span>
            </button>
          </div>
        </div>

        <div className="mt-3 text-center">
          <button 
            type="button"
            onClick={() => setIsDiagOpen(true)}
            className="text-[10px] text-slate-500 font-bold hover:text-slate-800 flex items-center gap-1 mx-auto"
          >
            <Terminal className="w-3 h-3 text-blue-600" /> Environment & Firebase Diagnostic Auditor
          </button>
        </div>
      </div>

      <ProductionDiagnosticModal 
        isOpen={isDiagOpen}
        onClose={() => setIsDiagOpen(false)}
        currentUser={null}
        settings={defaultSettings}
        itemsCount={0}
        customersCount={0}
        quotationsCount={0}
      />
    </div>
  );
}

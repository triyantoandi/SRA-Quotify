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

        <div className="bg-[#eaf0f7] p-5 rounded-2xl border border-slate-200/60 text-center text-xs mt-1">
          <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2.5">Akun Demo Sistem (Klik untuk Masuk Cepat):</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onLogin('admin', '123')}
              className="clay-badge bg-white px-3.5 py-2 text-slate-700 font-medium hover:bg-blue-50 transition-colors text-left flex items-center justify-between cursor-pointer group"
            >
              <span className="text-slate-500 text-[11px]">Manager:</span> 
              <span className="font-mono text-blue-700 font-bold ml-2 group-hover:underline">admin / 123</span>
            </button>
            <button
              type="button"
              onClick={() => onLogin('sales', '123')}
              className="clay-badge bg-white px-3.5 py-2 text-slate-700 font-medium hover:bg-emerald-50 transition-colors text-left flex items-center justify-between cursor-pointer group"
            >
              <span className="text-slate-500 text-[11px]">Sales:</span> 
              <span className="font-mono text-emerald-700 font-bold ml-2 group-hover:underline">sales / 123</span>
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

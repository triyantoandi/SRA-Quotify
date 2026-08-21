import React, { useState, useEffect } from 'react';
import { 
  Package, UserCircle, Lock, ShieldCheck, Terminal, Mail, UserPlus, 
  ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, KeyRound, 
  ArrowRight, Shield, User as UserIcon
} from 'lucide-react';
import { ProductionDiagnosticModal } from './ProductionDiagnosticModal';
import { defaultSettings } from '../utils/helpers';
import { User } from '../types';

interface LoginScreenProps {
  users?: User[];
  onLogin: (identifier: string, password: string) => boolean | void;
  onRegister?: (newUser: User) => void;
  onResetPassword?: (email: string, newPassword: string) => boolean;
}

export function LoginScreen({ 
  users = [], 
  onLogin, 
  onRegister, 
  onResetPassword
}: LoginScreenProps) {
  // Screen views: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');

  // Diagnostics modal
  const [isDiagOpen, setIsDiagOpen] = useState(false);

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // LOGIN FORM STATE
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // REGISTER FORM STATE
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRoleDisplay, setRegRoleDisplay] = useState<'sales_rep' | 'admin_sales'>('sales_rep');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // FORGOT PASSWORD STATE
  const [forgotEmail, setForgotEmail] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Reset messages when changing view
  const switchView = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD') => {
    setViewMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!loginIdentifier.trim()) {
      setErrorMsg('Masukkan username atau alamat email.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Masukkan password akun Anda.');
      return;
    }

    const res = onLogin(loginIdentifier, loginPassword);
    if (res === false) {
      setErrorMsg('Email / Username atau password tidak sesuai. Silakan periksa kembali atau gunakan fitur Lupa Password.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanName = regName.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Masukkan format alamat email yang valid.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Masukkan nama lengkap Anda.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username minimal harus 3 karakter.');
      return;
    }
    if (regPassword.length < 3) {
      setErrorMsg('Password minimal 3 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    // Check if email or username already exists
    const emailExists = users.some(u => u?.email?.trim().toLowerCase() === cleanEmail);
    if (emailExists) {
      setErrorMsg(`Alamat email "${cleanEmail}" sudah terdaftar. Silakan login atau gunakan menu Lupa Password.`);
      return;
    }

    const usernameExists = users.some(u => u?.username?.trim().toLowerCase() === cleanUsername);
    if (usernameExists) {
      setErrorMsg(`Username "${cleanUsername}" sudah digunakan. Silakan pilih username lain.`);
      return;
    }

    const newUserId = `U-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      password: regPassword,
      role: 'sales', // Strict security: public registration is strictly sales-level authority
      salesId: newUserId
    };

    if (onRegister) {
      onRegister(newUser);
    } else {
      // Fallback direct login
      onLogin(cleanUsername, regPassword);
    }
  };

  // Handle Forgot Password - Step 1: Verify Email
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanTarget = forgotEmail.trim().toLowerCase();
    if (!cleanTarget) {
      setErrorMsg('Masukkan alamat email terdaftar.');
      return;
    }

    const matchedUser = users.find(
      u => (u?.email && u.email.trim().toLowerCase() === cleanTarget) ||
           (u?.username && u.username.trim().toLowerCase() === cleanTarget)
    );

    if (!matchedUser) {
      setErrorMsg(`Akun dengan email "${cleanTarget}" tidak ditemukan dalam sistem. Pastikan email sudah benar atau daftar akun baru.`);
      setVerifiedUser(null);
      return;
    }

    setVerifiedUser(matchedUser);
    setSuccessMsg(`Akun ditemukan: ${matchedUser.name} (@${matchedUser.username}). Silakan masukkan password baru Anda.`);
  };

  // Handle Forgot Password - Step 2: Save New Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!verifiedUser) return;

    if (newPassword.length < 3) {
      setErrorMsg('Password baru minimal 3 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (onResetPassword) {
      const ok = onResetPassword(verifiedUser.email || verifiedUser.username, newPassword);
      if (ok) {
        setSuccessMsg('Password berhasil diperbarui! Mengarahkan ke halaman masuk...');
        setTimeout(() => {
          setLoginIdentifier(verifiedUser.email || verifiedUser.username);
          setLoginPassword(newPassword);
          setViewMode('LOGIN');
          setVerifiedUser(null);
          setNewPassword('');
          setConfirmNewPassword('');
          setForgotEmail('');
        }, 1500);
      } else {
        setErrorMsg('Gagal memperbarui password. Silakan coba lagi.');
      }
    } else {
      setSuccessMsg('Password berhasil diatur ulang! Silakan masuk dengan password baru.');
      setTimeout(() => {
        setLoginIdentifier(verifiedUser.email || verifiedUser.username);
        setViewMode('LOGIN');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] flex flex-col justify-center items-center p-4 relative font-sans text-slate-900">
      <div className="max-w-[480px] w-full clay-card overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 p-2">
        {/* HEADER BRANDING */}
        <div className="p-7 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white relative rounded-2xl border border-white/10 shadow-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-600 border border-white/30 rounded-2xl mx-auto flex items-center justify-center mb-3.5 shadow-xl shadow-emerald-500/20 transform hover:scale-105 transition-transform">
            <Package className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1 drop-shadow-xs">SRA Quotify</h1>
          <p className="text-emerald-400 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise Quotation Portal
          </p>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-800 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: LOGIN FORM                                          */}
        {/* ========================================================= */}
        {viewMode === 'LOGIN' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <h2 className="text-base font-black text-slate-800">Masuk ke Portal</h2>
              <span className="text-[11px] font-bold text-slate-500">Kredensial Resmi</span>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                  Email atau Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <input 
                    type="text" 
                    value={loginIdentifier} 
                    onChange={e => { setLoginIdentifier(e.target.value); setErrorMsg(''); }} 
                    className="w-full pl-11 pr-4 py-3 clay-input text-slate-900 text-sm font-semibold outline-none" 
                    placeholder="nama@email.com / username" 
                    autoComplete="username"
                    required 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView('FORGOT_PASSWORD')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={loginPassword} 
                    onChange={e => { setLoginPassword(e.target.value); setErrorMsg(''); }} 
                    className="w-full pl-11 pr-11 py-3 clay-input text-slate-900 text-sm font-semibold outline-none" 
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 clay-button-primary text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 mt-2"
              >
                Masuk ke Portal Sistem <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* REGISTER CALLOUT */}
            <div className="pt-4 border-t border-slate-200/80 text-center">
              <p className="text-xs text-slate-600 font-medium mb-2.5">
                Belum memiliki akun pengguna di sistem?
              </p>
              <button
                type="button"
                onClick={() => switchView('REGISTER')}
                className="w-full py-2.5 clay-button-secondary text-emerald-800 font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Daftar Akun Baru Menggunakan Email
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: REGISTER FORM                                       */}
        {/* ========================================================= */}
        {viewMode === 'REGISTER' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <h2 className="text-base font-black text-slate-800">Daftar Akun Baru</h2>
                <p className="text-[11px] font-bold text-slate-500">Daftarkan akun sales atau manager</p>
              </div>
              <button
                type="button"
                onClick={() => switchView('LOGIN')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali Masuk
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                  Alamat Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <input 
                    type="email" 
                    value={regEmail} 
                    onChange={e => {
                      const val = e.target.value;
                      setRegEmail(val);
                      if (!regUsername && val.includes('@')) {
                        setRegUsername(val.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
                      }
                    }} 
                    className="w-full pl-11 pr-4 py-2.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                    placeholder="nama@email.com" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <input 
                    type="text" 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    className="w-full pl-11 pr-4 py-2.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                    placeholder="Contoh: Andi Triyanto" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <UserCircle className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type="text" 
                      value={regUsername} 
                      onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
                      className="w-full pl-10 pr-3 py-2.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="anditriyanto" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                    Role / Akses Pendaftaran *
                  </label>
                  <select 
                    value={regRoleDisplay} 
                    onChange={e => setRegRoleDisplay(e.target.value as any)}
                    className="w-full p-2.5 clay-input text-slate-900 text-sm font-bold bg-white"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="admin_sales">Admin Sales (Otoritas Sales)</option>
                  </select>
                </div>
              </div>

              {/* Informational notice about Manager / Global Admin registration */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 font-medium leading-relaxed flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Informasi Otoritas:</strong> Pendaftaran mandiri ini khusus untuk akun <strong>Sales / Admin Sales</strong>. Hak akses <strong>Manager / Admin Global</strong> hanya dapat didaftarkan secara internal oleh akun Manager/Admin di menu Pengaturan Pengguna.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={regPassword} 
                      onChange={e => setRegPassword(e.target.value)} 
                      className="w-full pl-10 pr-9 py-2.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="••••••" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                    Ulangi Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={regConfirmPassword} 
                      onChange={e => setRegConfirmPassword(e.target.value)} 
                      className="w-full pl-10 pr-9 py-2.5 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="••••••" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 clay-button-primary text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Daftar & Masuk Sekarang
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200/80 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => switchView('LOGIN')}
                  className="font-black text-blue-600 hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: FORGOT PASSWORD FORM                                */}
        {/* ========================================================= */}
        {viewMode === 'FORGOT_PASSWORD' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <h2 className="text-base font-black text-slate-800">Lupa Password</h2>
                <p className="text-[11px] font-bold text-slate-500">Atur ulang kata sandi akun Anda</p>
              </div>
              <button
                type="button"
                onClick={() => switchView('LOGIN')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Batal
              </button>
            </div>

            {!verifiedUser ? (
              /* STEP 1: Search and verify email/username */
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Masukkan alamat email yang terdaftar di akun SRA Quotify Anda untuk memverifikasi identitas.
                </p>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type="text" 
                      value={forgotEmail} 
                      onChange={e => { setForgotEmail(e.target.value); setErrorMsg(''); }} 
                      className="w-full pl-11 pr-4 py-3 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="nama@email.com" 
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 clay-button-primary text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Cari & Verifikasi Akun
                </button>
              </form>
            ) : (
              /* STEP 2: Enter new password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <p className="font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Akun Terverifikasi
                  </p>
                  <p className="text-emerald-800 font-medium">
                    Nama: <strong className="text-slate-900">{verifiedUser.name}</strong> (@{verifiedUser.username})
                  </p>
                  <p className="text-emerald-800 font-medium">
                    Email: <strong className="text-slate-900">{verifiedUser.email || forgotEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Password Baru *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="w-full pl-11 pr-11 py-3 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="Minimal 3 karakter" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Ulangi Password Baru *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmNewPassword} 
                      onChange={e => setConfirmNewPassword(e.target.value)} 
                      className="w-full pl-11 pr-11 py-3 clay-input text-slate-900 text-sm font-semibold outline-none" 
                      placeholder="Konfirmasi password baru" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifiedUser(null)}
                    className="flex-1 py-3 clay-button-secondary text-slate-700 font-bold text-xs"
                  >
                    Ganti Email
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-3 clay-button-primary text-white font-black text-xs tracking-wide shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Simpan Password Baru
                  </button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-slate-200/80 text-center">
              <button
                type="button"
                onClick={() => switchView('LOGIN')}
                className="text-xs font-black text-blue-600 hover:underline"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          </div>
        )}

        {/* AUDITOR & DIAGNOSTIC LINK */}
        <div className="py-2 text-center border-t border-slate-200/60 mt-1">
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

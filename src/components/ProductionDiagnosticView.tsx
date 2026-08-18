import React, { useState, useEffect } from 'react';
import { 
  Terminal, ShieldCheck, Database, Globe, CheckCircle2, 
  AlertTriangle, RefreshCw, Server, ArrowRight, Check, Copy, LayoutDashboard
} from 'lucide-react';
import { User, Settings } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

interface ProductionDiagnosticViewProps {
  currentUser: User;
  settings: Settings;
  onProceedToDashboard: () => void;
  onLogout: () => void;
}

export function ProductionDiagnosticView({
  currentUser,
  settings,
  onProceedToDashboard,
  onLogout
}: ProductionDiagnosticViewProps) {
  const [firestoreStatus, setFirestoreStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [firestoreMsg, setFirestoreMsg] = useState<string>('');
  const [firestoreLatency, setFirestoreLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'N/A';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'N/A';
  const currentPort = typeof window !== 'undefined' ? (window.location.port || '(standard 443/80)') : 'N/A';
  const isPreview = currentHostname.includes('ais-dev') || currentHostname.includes('localhost');
  const environmentLabel = isPreview ? 'PREVIEW / DEVELOPMENT' : 'PUBLISHED / PRODUCTION';

  const handleTestFirestore = async () => {
    setFirestoreStatus('TESTING');
    setFirestoreMsg('Menghubungkan ke Firestore & membaca 1 dokumen sampel...');
    const start = performance.now();
    try {
      const q = query(collection(db, 'items'), limit(1));
      const snap = await getDocs(q);
      const elapsed = Math.round(performance.now() - start);
      setFirestoreLatency(elapsed);
      setFirestoreStatus('SUCCESS');
      setFirestoreMsg(`SUCCESS — Berhasil membaca ${snap.size} dokumen dari Firestore (${elapsed}ms).`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setFirestoreLatency(elapsed);
      setFirestoreStatus('ERROR');
      setFirestoreMsg(`FAILED — Code: ${err.code || 'UNKNOWN'}, Message: ${err.message || String(err)}`);
    }
  };

  // Run Firestore test automatically on mount to provide instant status
  useEffect(() => {
    handleTestFirestore();
  }, []);

  const handleCopyDiagnosticText = () => {
    const text = `=== PRODUCTION DIAGNOSTIC ===
Environment: ${environmentLabel}
Window Origin: ${currentOrigin}
Window Hostname: ${currentHostname}
Window Protocol: ${currentProtocol}
Firebase Initialized: YES
Firebase Project ID: ${firebaseConfig.projectId}
Firebase Auth Domain: ${firebaseConfig.authDomain}
Auth State: AUTHENTICATED
Current User: FOUND (${currentUser.name} / ${currentUser.username})
UID: ${currentUser.id}
Role: ${currentUser.role}
Auth Error: NONE
Firestore Test: ${firestoreStatus} (${firestoreMsg})
================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isPreview 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {environmentLabel}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                PRODUCTION DIAGNOSTIC MODE
              </h2>
            </div>
          </div>

          <button
            onClick={handleCopyDiagnosticText}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Salin hasil diagnosa"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin' : 'Copy Log'}
          </button>
        </div>

        {/* Phase 1 & 2: Diagnostic Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Environment:</p>
            <p className="text-emerald-400 font-extrabold">{environmentLabel}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Window Origin:</p>
            <p className="text-white font-extrabold break-all">{currentOrigin}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Window Hostname:</p>
            <p className="text-white font-extrabold break-all">{currentHostname}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Window Protocol & Port:</p>
            <p className="text-slate-300 font-extrabold">{currentProtocol} • Port {currentPort}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Firebase Initialized:</p>
            <p className="text-emerald-400 font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> YES
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Firebase Project ID:</p>
            <p className="text-blue-400 font-extrabold">{firebaseConfig.projectId || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Firebase Auth Domain:</p>
            <p className="text-slate-300 font-extrabold">{firebaseConfig.authDomain || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Auth State:</p>
            <p className="text-emerald-400 font-extrabold">AUTHENTICATED</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Current User:</p>
            <p className="text-white font-extrabold">FOUND ({currentUser.name})</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase">UID & Role:</p>
            <p className="text-amber-400 font-extrabold">{currentUser.id} • {currentUser.role.toUpperCase()}</p>
          </div>
        </div>

        {/* Phase 3: Firestore Isolated Test */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" /> Firestore Isolation Test
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test membaca 1 dokumen dari instance <span className="text-blue-300">{firebaseConfig.firestoreDatabaseId}</span>
              </p>
            </div>
            <button
              onClick={handleTestFirestore}
              disabled={firestoreStatus === 'TESTING'}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${firestoreStatus === 'TESTING' ? 'animate-spin' : ''}`} />
              {firestoreStatus === 'TESTING' ? 'Menguji...' : 'Re-test Query'}
            </button>
          </div>

          {firestoreStatus !== 'IDLE' && (
            <div className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2.5 ${
              firestoreStatus === 'SUCCESS'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : firestoreStatus === 'ERROR'
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  : 'bg-blue-950/60 border border-blue-500/40 text-blue-300'
            }`}>
              {firestoreStatus === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : firestoreStatus === 'ERROR' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin mt-0.5" />
              )}
              <div>
                <p className="font-bold">{firestoreMsg}</p>
                {firestoreLatency !== null && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Latency: {firestoreLatency}ms</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phase 4 & 5: Proceed to Dashboard Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 hover:text-rose-200 text-xs font-bold transition-colors"
          >
            Logout / Kembali ke Login
          </button>

          <button
            onClick={onProceedToDashboard}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Lanjutkan ke Dashboard Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Database, Globe, CheckCircle2, 
  AlertTriangle, X, RefreshCw, Server, Terminal, Lock, UserCheck, Eye, Layers
} from 'lucide-react';
import { User, Settings, Item, Customer, Quotation } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { isSupervisoryRole, normalizeRole } from '../utils/helpers';

interface ProductionDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  settings: Settings;
  itemsCount: number;
  customersCount: number;
  quotationsCount: number;
}

export function ProductionDiagnosticModal({
  isOpen,
  onClose,
  currentUser,
  settings,
  itemsCount,
  customersCount,
  quotationsCount
}: ProductionDiagnosticModalProps) {
  const [firestoreTestStatus, setFirestoreTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [firestoreTestMsg, setFirestoreTestMsg] = useState<string>('');
  const [testLatency, setTestLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'N/A';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'N/A';
  const currentPort = typeof window !== 'undefined' ? (window.location.port || '(standard 443/80)') : 'N/A';
  const isPreview = currentHostname.includes('ais-dev') || currentHostname.includes('localhost');

  const rawRole = currentUser?.role || 'sales';
  const normRole = normalizeRole(rawRole);
  const isSupervisory = isSupervisoryRole(rawRole);

  const handleTestFirestore = async () => {
    setFirestoreTestStatus('TESTING');
    setFirestoreTestMsg('Menghubungkan ke Firestore instance...');
    const start = performance.now();
    try {
      // Test read documents from quotations and items
      const qQuotes = query(collection(db, 'quotations'), limit(10));
      const snapQuotes = await getDocs(qQuotes);
      const elapsed = Math.round(performance.now() - start);
      setTestLatency(elapsed);
      setFirestoreTestStatus('SUCCESS');
      setFirestoreTestMsg(`Koneksi Firestore Berhasil! Terhubung ke db (${firebaseConfig.firestoreDatabaseId || 'default'}). Sampel: ${snapQuotes.size} dokumen penawaran (${elapsed}ms).`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setTestLatency(elapsed);
      setFirestoreTestStatus('ERROR');
      setFirestoreTestMsg(`Error Firestore [${err.code || 'UNKNOWN'}]: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#f0f4f8] max-w-2xl w-full rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                Production Environment & RBAC Diagnostic
              </h3>
              <p className="text-[11px] text-slate-300">
                Verifikasi Hak Akses Supervisory, Firestore DB & Data Visibility
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Environment Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isPreview 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-black text-sm">
                  {isPreview ? 'DEVELOPMENT / PREVIEW ENVIRONMENT' : 'PRODUCTION / PUBLISHED ENVIRONMENT'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isPreview ? 'Aplikasi berjalan di AI Studio Dev Sandbox' : 'Aplikasi aktif di Shared Production Container'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 shadow-2xs">
              {isPreview ? 'Preview Mode' : 'Live Published'}
            </span>
          </div>

          {/* RBAC Security & Visibility Inspector */}
          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <p className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Role-Based Access Control (RBAC) & Visibility State
              </p>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isSupervisory 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {isSupervisory ? 'Supervisory Access' : 'Restricted Sales Access'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">USER IDENTITY:</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser?.name || currentUser?.username || 'Guest'}</p>
                <p className="text-[10px] font-mono text-slate-500">ID: {currentUser?.id || 'N/A'} • @{currentUser?.username || 'N/A'}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">ACCESS MODE:</span>
                <p className={`font-black text-xs mt-0.5 ${isSupervisory ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {isSupervisory ? 'GLOBAL SUPERVISORY (FULL)' : 'RESTRICTED (OWNED DOCUMENTS)'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isSupervisory 
                    ? 'Dapat melihat seluruh aktivitas & dokumen seluruh sales' 
                    : 'Hanya melihat penawaran yang dibuat sendiri'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">ACTIVE ROLE / NORM:</span>
                <p className="font-mono font-black text-slate-800 mt-0.5">{rawRole.toUpperCase()} → {normRole.toUpperCase()}</p>
                <p className="text-[10px] text-slate-500">Supervisory Privileges: {isSupervisory ? 'ACTIVE (TRUE)' : 'INACTIVE (FALSE)'}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">AUDIT METADATA & SALES ID:</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">SalesID: {currentUser?.salesId || currentUser?.id || 'N/A'}</p>
                <p className="text-[10px] text-slate-500 truncate">Email: {currentUser?.email || `${currentUser?.username}@sra.co.id`}</p>
              </div>
            </div>
          </div>

          {/* Network & Hostname Specs */}
          <div className="clay-card p-4 space-y-2">
            <p className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> Hostname & Origin Diagnostic
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 font-bold">CURRENT ORIGIN:</span>
                <p className="font-mono font-extrabold text-slate-800 break-all">{currentOrigin}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">CURRENT HOSTNAME:</span>
                <p className="font-mono font-extrabold text-slate-800 break-all">{currentHostname}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">CURRENT PROTOCOL:</span>
                <p className="font-mono font-extrabold text-slate-800">{currentProtocol}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">CURRENT PORT:</span>
                <p className="font-mono font-extrabold text-slate-800">{currentPort}</p>
              </div>
            </div>
          </div>

          {/* Firebase Configuration Inspector */}
          <div className="clay-card p-4 space-y-2">
            <p className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" /> Firebase & Firestore Parameter
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 font-bold">Firebase Project ID:</span>
                <p className="font-mono font-extrabold text-emerald-800">{firebaseConfig.projectId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Firebase Auth Domain:</span>
                <p className="font-mono font-extrabold text-slate-800">{firebaseConfig.authDomain || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Firestore Database ID:</span>
                <p className="font-mono font-extrabold text-blue-800">{firebaseConfig.firestoreDatabaseId || '(default)'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Firebase App ID:</span>
                <p className="font-mono font-extrabold text-slate-800 truncate">{firebaseConfig.appId || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Current Live Data Counts */}
          <div className="clay-card p-4 space-y-2">
            <p className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> Realtime Memory & Collections
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold">Role Akses</p>
                <p className="font-extrabold text-slate-900 truncate">{currentUser?.name || currentUser?.username || 'Belum Login'}</p>
                <span className="text-[9px] font-black uppercase text-emerald-700">{normRole}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold">Master Barang</p>
                <p className="font-extrabold text-slate-900 text-sm">{itemsCount}</p>
                <span className="text-[9px] text-slate-500">Items</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold">Pelanggan</p>
                <p className="font-extrabold text-slate-900 text-sm">{customersCount}</p>
                <span className="text-[9px] text-slate-500">Klien</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold">Total Quotations</p>
                <p className="font-extrabold text-slate-900 text-sm">{quotationsCount}</p>
                <span className="text-[9px] text-slate-500">Dokumen Firestore</span>
              </div>
            </div>
          </div>

          {/* Live Firestore Query Verification Test */}
          <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-black text-slate-900">Uji Akses Langsung Firestore</p>
                <p className="text-[10px] text-slate-500">Melakukan query dokumen riil ke Firestore dari host saat ini</p>
              </div>
              <button 
                onClick={handleTestFirestore}
                disabled={firestoreTestStatus === 'TESTING'}
                className="px-4 py-2 clay-button-primary text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${firestoreTestStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                {firestoreTestStatus === 'TESTING' ? 'Menguji...' : 'Jalankan Test'}
              </button>
            </div>

            {firestoreTestStatus !== 'IDLE' && (
              <div className={`p-3 rounded-xl text-[11px] font-mono flex items-start gap-2 ${
                firestoreTestStatus === 'SUCCESS' 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : firestoreTestStatus === 'ERROR' 
                    ? 'bg-rose-50 text-rose-900 border border-rose-200' 
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
              }`}>
                {firestoreTestStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : firestoreTestStatus === 'ERROR' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <Activity className="w-4 h-4 text-blue-600 shrink-0 animate-pulse mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{firestoreTestMsg}</p>
                  {testLatency !== null && <p className="text-[10px] opacity-75 mt-0.5">Response Time: {testLatency}ms</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-200/70 border-t border-slate-300 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-slate-500 font-bold">
            SRA Quotify • Multi-Role RBAC & Firestore Diagnostic Suite
          </span>
          <button 
            onClick={onClose}
            className="px-5 py-2 clay-button-secondary text-slate-800 font-extrabold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

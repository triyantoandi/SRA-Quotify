import React, { useState } from 'react';
import { Building2, Wand2, Save, Database, ShieldCheck } from 'lucide-react';
import { Settings } from '../types';

interface SettingsManagementProps {
  settings: Settings;
  setSettings: (newSettings: Settings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  logActivity: (action: string, details: string) => void;
  syncToCloud?: (action: string, payloadKey: string, payloadData: any) => void;
}

export function SettingsManagement({ settings, setSettings, showToast, logActivity, syncToCloud }: SettingsManagementProps) {
  const [formData, setFormData] = useState<Settings>(settings || {
    companyName: '',
    companyNpwp: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    bankDetails: '',
    defaultNotes: '',
    defaultTaxRate: 11,
    quotePrefix: 'SRA-QUO',
    themeColor: '#059669',
    logoUrl: '',
    signatureUrl: '',
    apiUrl: ''
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => { 
    setSettings(formData); 
    showToast("Pengaturan disimpan ke Firebase"); 
    logActivity('UPDATE_SETTINGS', 'Update config'); 
    syncToCloud?.('saveSettings', 'settings', formData);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300 relative z-10 font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-slate-500 text-sm font-semibold mt-0.5">Konfigurasi entitas perusahaan, standar dokumen quotation, dan database Firebase</p>
      </div>
      
      <div className="clay-card p-6 overflow-hidden mb-6">
        <div className="pb-4 border-b border-slate-200/60 mb-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600"/> Profil SRA Group
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Nama Perusahaan *</label><input type="text" value={formData?.companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">URL Logo Perusahaan</label><input type="text" value={formData?.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">NPWP Perusahaan</label><input type="text" value={formData?.companyNpwp || ''} onChange={e => setFormData({...formData, companyNpwp: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">Telepon Kantor</label><input type="text" value={formData?.companyPhone || ''} onChange={e => setFormData({...formData, companyPhone: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">Email Resmi</label><input type="email" value={formData?.companyEmail || ''} onChange={e => setFormData({...formData, companyEmail: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Alamat Lengkap Kantor</label><textarea value={formData?.companyAddress || ''} onChange={e => setFormData({...formData, companyAddress: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" rows={2}/></div>
        </div>
      </div>

      <div className="clay-card p-6 overflow-hidden mb-6">
        <div className="pb-4 border-b border-slate-200/60 mb-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-emerald-600"/> Dokumen Quotation & Database
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  Database: Firebase Firestore (Real-Time Cloud)
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Semua data tersimpan otomatis dan persisten di Firebase Firestore. Integrasi eksternal legacy telah dinonaktifkan untuk mencegah konflik database.
                </p>
              </div>
            </div>
            <div className="shrink-0 ml-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> ONLINE
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Aksen Warna Tema PDF</label>
            <div className="flex gap-2.5">
              <input type="color" value={formData?.themeColor || '#059669'} onChange={e => setFormData({...formData, themeColor: e.target.value})} className="h-11 w-12 rounded-xl cursor-pointer bg-white border border-slate-300 p-1 clay-badge"/>
              <input type="text" value={formData?.themeColor || '#059669'} onChange={e => setFormData({...formData, themeColor: e.target.value})} className="flex-1 p-3 clay-input font-mono text-sm font-semibold"/>
            </div>
          </div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">Prefix Nomor Surat</label><input type="text" value={formData?.quotePrefix || ''} onChange={e => setFormData({...formData, quotePrefix: e.target.value})} className="w-full p-3 clay-input font-mono text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">Default PPN (%)</label><input type="number" min="0" value={formData?.defaultTaxRate ?? 11} onChange={e => setFormData({...formData, defaultTaxRate: Number(e.target.value)})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-2">URL Stempel / TTD Digital</label><input type="text" value={formData?.signatureUrl || ''} onChange={e => setFormData({...formData, signatureUrl: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Info Rekening Pembayaran</label><textarea value={formData?.bankDetails || ''} onChange={e => setFormData({...formData, bankDetails: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" rows={2}/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Default Syarat & Ketentuan (T&C)</label><textarea value={formData?.defaultNotes || ''} onChange={e => setFormData({...formData, defaultNotes: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" rows={2}/></div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleSave} className="px-7 py-3 clay-button-primary text-white font-bold flex items-center gap-2 text-sm">
          <Save className="w-4 h-4"/> Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
}


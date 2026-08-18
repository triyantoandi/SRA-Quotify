import React, { useState } from 'react';
import { Building2, Wand2, Save } from 'lucide-react';
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
    showToast("Pengaturan disimpan"); 
    logActivity('UPDATE_SETTINGS', 'Update config'); 
    syncToCloud?.('saveSettings', 'settings', formData);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300 relative z-10 font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-slate-500 text-sm font-semibold mt-0.5">Konfigurasi entitas perusahaan, standar dokumen quotation, dan integrasi</p>
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
            <Wand2 className="w-5 h-5 text-emerald-600"/> Dokumen Quotation & Integrasi
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 p-4 bg-[#eaf0f7] border border-slate-200/80 rounded-2xl">
            <label className="block text-xs font-extrabold text-slate-800 mb-2">API URL Endpoint (Cloud Sync & Email Engine)</label>
            <input type="text" value={formData?.apiUrl || ''} onChange={e => setFormData({...formData, apiUrl: e.target.value})} className="w-full p-3 clay-input font-mono text-xs font-extrabold text-blue-900" placeholder="https://api.sra-group.com"/>
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


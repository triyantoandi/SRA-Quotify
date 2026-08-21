import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, ShieldAlert, X, Database, FileText, Building, Package, RefreshCw } from 'lucide-react';
import { User, Quotation, Customer, Item, ActivityLog } from '../types';
import { isSupervisoryRole } from '../utils/helpers';

interface ClearSimulationDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  quotations: Quotation[];
  customers: Customer[];
  items: Item[];
  activityLogs: ActivityLog[];
  onClearData: (options: {
    clearQuotations: boolean;
    clearCustomers: boolean;
    clearItems: boolean;
    clearLogs: boolean;
  }) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ClearSimulationDataModal({
  isOpen,
  onClose,
  currentUser,
  quotations,
  customers,
  items,
  activityLogs,
  onClearData,
  showToast
}: ClearSimulationDataModalProps) {
  const [clearQuotations, setClearQuotations] = useState(true);
  const [clearCustomers, setClearCustomers] = useState(true);
  const [clearItems, setClearItems] = useState(true);
  const [clearLogs, setClearLogs] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isManager = isSupervisoryRole(currentUser?.role);
  const selectedCount = 
    (clearQuotations ? quotations.length : 0) +
    (clearCustomers ? customers.length : 0) +
    (clearItems ? items.length : 0) +
    (clearLogs ? activityLogs.length : 0);

  const handleExecute = async () => {
    if (!isManager) {
      showToast('Hanya role Manager atau Administrator yang dapat menghapus data simulasi secara massal.', 'error');
      return;
    }

    if (confirmationInput.trim().toUpperCase() !== 'HAPUS DATA') {
      showToast('Ketik konfirmasi "HAPUS DATA" dengan tepat untuk melanjutkan.', 'error');
      return;
    }

    if (!clearQuotations && !clearCustomers && !clearItems && !clearLogs) {
      showToast('Pilih minimal satu kategori data yang ingin dihapus.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await onClearData({
        clearQuotations,
        clearCustomers,
        clearItems,
        clearLogs
      });
      showToast('Data simulasi terpilih berhasil dihapus bersih dari Firestore & sistem.', 'success');
      setConfirmationInput('');
      onClose();
    } catch (err: any) {
      console.error('Error clearing data:', err);
      showToast('Gagal menghapus sebagian data: ' + (err?.message || 'Terjadi kesalahan jaringan'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="clay-modal p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Hapus Data Simulasi / Reset Database
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Bersihkan data demo / simulasi agar sistem siap digunakan untuk data real operasional
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold space-y-1">
            <p className="font-extrabold text-amber-950">Tindakan ini permanen!</p>
            <p className="text-amber-800/90 leading-relaxed">
              Semua dokumen simulasi yang dipilih akan dihapus secara permanen dari database <strong>Firebase Firestore</strong> dan memori lokal browser. Data akun pengguna (Users) dan Pengaturan Sistem tetap aman terjaga.
            </p>
          </div>
        </div>

        {/* Selection Checkboxes */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
            Pilih Kategori Data yang Akan Dihapus:
          </label>

          {/* Quotations & SO */}
          <div 
            onClick={() => setClearQuotations(!clearQuotations)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              clearQuotations 
                ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={clearQuotations} 
                onChange={(e) => setClearQuotations(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer" 
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Semua Penawaran Harga & Sales Order (SO)
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Menghapus semua draf penawaran, quotation terkirim, dan sales order yang telah dibuat
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
              {quotations.length} Dokumen
            </span>
          </div>

          {/* Customers */}
          <div 
            onClick={() => setClearCustomers(!clearCustomers)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              clearCustomers 
                ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={clearCustomers} 
                onChange={(e) => setClearCustomers(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer" 
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  Semua Data Klien & Pelanggan
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Menghapus seluruh daftar klien/toko simulasi beserta catatan plafon kreditnya
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
              {customers.length} Klien
            </span>
          </div>

          {/* Items */}
          <div 
            onClick={() => setClearItems(!clearItems)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              clearItems 
                ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={clearItems} 
                onChange={(e) => setClearItems(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer" 
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Semua Katalog Pricelist Barang / Produk
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Menghapus pricelist produk demo (bisa diimpor ulang via Excel kapan saja)
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
              {items.length} Barang
            </span>
          </div>

          {/* Audit Logs */}
          <div 
            onClick={() => setClearLogs(!clearLogs)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              clearLogs 
                ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={clearLogs} 
                onChange={(e) => setClearLogs(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer" 
              />
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  Log Riwayat Aktivitas (Audit Trail)
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Kosongkan catatan riwayat perubahan dan aktivitas masa lalu
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
              {activityLogs.length} Log
            </span>
          </div>
        </div>

        {/* Confirmation Text Input */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-100/90 border border-slate-200">
          <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
            Ketik <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">HAPUS DATA</span> di bawah untuk verifikasi konfirmasi:
          </label>
          <input 
            type="text" 
            placeholder='Ketik "HAPUS DATA"'
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full p-2.5 clay-input text-xs font-mono font-bold uppercase tracking-wider"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            Total {selectedCount} entri terpilih untuk dihapus
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={confirmationInput.trim().toUpperCase() !== 'HAPUS DATA' || isProcessing || selectedCount === 0}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                confirmationInput.trim().toUpperCase() === 'HAPUS DATA' && !isProcessing && selectedCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                  : 'bg-rose-300 cursor-not-allowed opacity-70'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Sedang Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Hapus Data Terpilih Permanen
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

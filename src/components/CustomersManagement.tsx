import React, { useState } from 'react';
import { 
  Download, UserPlus, Search, Edit, Trash2, Mail, 
  Phone, FileSpreadsheet, Upload, Plus, FileText, 
  Building, MapPin, CreditCard, Eye, X, History, ArrowRight, Store,
  AlertTriangle, ShieldCheck, DollarSign, Lock, Unlock, AlertCircle
} from 'lucide-react';
import { Customer, Quotation } from '../types';
import { CustomersImportModal } from './CustomersImportModal';
import { downloadCustomerExcelTemplate, exportCustomersToExcel } from '../utils/excelHelpers';
import { formatIDR, getCustomerCreditStatus } from '../utils/helpers';

interface CustomersManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  quotations?: Quotation[];
  onNewQuotationForCustomer?: (customer: Customer) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  logActivity: (action: string, details: string) => void;
  syncToCloud: (action: string, payloadKey: string, payloadData: any) => void;
}

export function CustomersManagement({ 
  customers, 
  setCustomers, 
  quotations = [], 
  onNewQuotationForCustomer, 
  showConfirm, 
  showToast, 
  logActivity, 
  syncToCloud 
}: CustomersManagementProps) {
  const [editingItem, setEditingItem] = useState<Customer | 'NEW' | null>(null); 
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({ 
    name: '', 
    storeName: '', 
    attnName: '', 
    email: '', 
    phone: '', 
    address: '', 
    npwp: '',
    creditLimit: 50000000,
    warningThresholdPct: 10,
    allowOverlimit: false,
    creditNotes: ''
  }); 
  const [search, setSearch] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  
  const handleSave = () => {
    if (!formData.name.trim()) return showToast("Nama Pelanggan / Perusahaan wajib diisi!", "error");
    const parsedLimit = Number(formData.creditLimit) || 0;
    const parsedWarning = Number(formData.warningThresholdPct) || 10;
    
    const customerPayload = {
      ...formData,
      creditLimit: parsedLimit,
      warningThresholdPct: parsedWarning
    };

    if (editingItem === 'NEW') {
      const newCust: Customer = { ...customerPayload, id: `CUST-${Date.now().toString().slice(-6)}` };
      setCustomers([newCust, ...customers]); 
      logActivity('CREATE_CUSTOMER', `Tambah klien: ${formData.name}${formData.storeName ? ` (${formData.storeName})` : ''} - Plafon: ${formatIDR(parsedLimit)}`); 
      syncToCloud('saveCustomer', 'customer', newCust);
    } else if (editingItem) {
      const updatedCust: Customer = { ...customerPayload, id: editingItem.id };
      setCustomers(customers.map(c => c.id === editingItem.id ? updatedCust : c)); 
      logActivity('UPDATE_CUSTOMER', `Edit klien: ${formData.name} - Plafon: ${formatIDR(parsedLimit)}`); 
      syncToCloud('saveCustomer', 'customer', updatedCust);
    }
    setEditingItem(null); 
    showToast("Data pelanggan & plafon limit berhasil disimpan");
  };

  const handleExport = () => {
    exportCustomersToExcel(customers);
    showToast("File Excel Pelanggan berhasil diunduh"); 
    logActivity('EXPORT_CUSTOMERS', 'Export data pelanggan ke Excel');
  };

  const handleImportComplete = (importedCustomers: Customer[], mode: 'UPSERT' | 'ADD_ONLY' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setCustomers(importedCustomers);
      logActivity('IMPORT_CUSTOMERS_EXCEL', `Replace ${importedCustomers.length} pelanggan dari Excel`);
      importedCustomers.forEach(c => syncToCloud('saveCustomer', 'customer', c));
      showToast(`Berhasil mengganti seluruh data pelanggan (${importedCustomers.length} klien)`);
    } else if (mode === 'ADD_ONLY') {
      const existingIdSet = new Set(customers.map(c => c.id.toLowerCase().trim()));
      const existingNameSet = new Set(customers.map(c => c.name.toLowerCase().trim()));
      
      const newOnly = importedCustomers.filter(
        c => !existingIdSet.has(c.id.toLowerCase().trim()) && !existingNameSet.has(c.name.toLowerCase().trim())
      );

      setCustomers([...newOnly, ...customers]);
      logActivity('IMPORT_CUSTOMERS_EXCEL', `Tambah ${newOnly.length} pelanggan baru dari Excel`);
      newOnly.forEach(c => syncToCloud('saveCustomer', 'customer', c));
      showToast(`Berhasil menambah ${newOnly.length} pelanggan baru`);
    } else { // UPSERT
      const updatedMap = new Map<string, Customer>();
      customers.forEach(c => updatedMap.set(c.id.toLowerCase().trim(), c));

      importedCustomers.forEach(imp => {
        const key = imp.id.toLowerCase().trim();
        updatedMap.set(key, imp);
      });

      const nextList = Array.from(updatedMap.values());
      setCustomers(nextList);
      logActivity('IMPORT_CUSTOMERS_EXCEL', `Impor/Update ${importedCustomers.length} pelanggan dari Excel`);
      importedCustomers.forEach(c => syncToCloud('saveCustomer', 'customer', c));
      showToast(`Berhasil memperbarui ${importedCustomers.length} pelanggan via Excel`);
    }
  };

  const filteredCustomers = (customers || []).filter(c => {
    if (!c) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.storeName && c.storeName.toLowerCase().includes(q)) ||
      (c.attnName && c.attnName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.npwp && c.npwp.includes(q))
    );
  });

  // Calculate customer quotation stats
  const getCustomerQuoteStats = (customerName: string) => {
    const target = (customerName || '').toLowerCase().trim();
    const custQuotes = (quotations || []).filter(q => q && q.customerName && q.customerName.toLowerCase().trim() === target);
    const totalVal = custQuotes.reduce((s, q) => s + (Number(q?.total) || 0), 0);
    const acceptedVal = custQuotes.filter(q => q && q.status === 'Accepted').reduce((s, q) => s + (Number(q?.total) || 0), 0);
    return {
      count: custQuotes.length,
      totalVal,
      acceptedVal,
      quotes: custQuotes
    };
  };

  const customersWithNpwp = (customers || []).filter(c => c && c.npwp && c.npwp.trim().length > 3).length;

  // Credit limits statistics
  const totalCreditLimit = customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
  const criticalLimitCount = customers.filter(c => {
    const creditStatus = getCustomerCreditStatus(c, customers, quotations);
    return creditStatus.isExhausted || creditStatus.isNearExhaustion;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-10 font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Pelanggan & Plafon Kredit</h2>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">Kelola direktori klien, kesepakatan limit transaksi (credit limit), dan histori SO/Quotation</p>
        </div>
        {!editingItem && (
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={downloadCustomerExcelTemplate} 
              title="Unduh file format Excel untuk input masif pelanggan"
              className="px-4 py-2.5 clay-button-secondary text-emerald-900 font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Template Excel
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="px-4 py-2.5 clay-button-primary text-white font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button 
              onClick={handleExport} 
              className="px-4 py-2.5 clay-button-secondary text-slate-800 font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Export Excel
            </button>
            <button 
              onClick={() => { 
                setFormData({ 
                  name: '', 
                  storeName: '', 
                  attnName: '', 
                  email: '', 
                  phone: '', 
                  address: '', 
                  npwp: '',
                  creditLimit: 50000000,
                  warningThresholdPct: 10,
                  allowOverlimit: false,
                  creditNotes: ''
                }); 
                setEditingItem('NEW'); 
              }} 
              className="px-5 py-2.5 clay-button-primary text-white font-black text-xs sm:text-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Tambah Klien
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Widget */}
      {!editingItem && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500">Total Klien Terdaftar</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{customers.length} Perusahaan</p>
            </div>
          </div>

          <div className="clay-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500">Total Plafon Kredit Klien</p>
              <p className="text-lg font-black text-indigo-900 leading-tight tabular-nums">{formatIDR(totalCreditLimit)}</p>
            </div>
          </div>

          <div className="clay-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500">Limit Kritis (≤10% / Habis)</p>
              <p className="text-lg font-black text-amber-900 leading-tight">{criticalLimitCount} Klien</p>
            </div>
          </div>

          <div className="clay-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500">Kelengkapan NPWP</p>
              <p className="text-lg font-black text-slate-900 leading-tight">
                {customersWithNpwp} <span className="text-xs font-bold text-slate-500">/ {customers.length} ({customers.length > 0 ? Math.round((customersWithNpwp / customers.length) * 100) : 0}%)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit or Add Customer Form */}
      {editingItem && (
        <div className="clay-card p-7 mb-6 animate-in zoom-in-95 duration-200">
          <h3 className="text-base font-black mb-5 text-slate-900 border-b border-slate-200/80 pb-3 flex items-center justify-between">
            <span>{editingItem === 'NEW' ? 'Tambah Pelanggan Baru' : 'Edit Data Pelanggan'}</span>
            <span className="text-xs font-bold text-slate-500">Plafon kredit membatasi transaksi SO otomatis</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Nama Perusahaan / Instansi *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold"
                placeholder="PT Sumber Makmur Retail"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Nama Toko / Supermarket / Outlet
              </label>
              <input 
                type="text" 
                value={formData.storeName || ''} 
                onChange={e => setFormData({...formData, storeName: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold" 
                placeholder="Contoh: Superindo Duren Sawit / Hypermart Puri"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Up / Contact Person (Attn)</label>
              <input 
                type="text" 
                value={formData.attnName || ''} 
                onChange={e => setFormData({...formData, attnName: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold" 
                placeholder="e.g. Bp. Andi (Purchasing Head)"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Perusahaan / Kontak</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold"
                placeholder="purchasing@perusahaan.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Nomor Telepon / WhatsApp</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold"
                placeholder="08123456789 / 021-5551234"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">NPWP Perusahaan</label>
              <input 
                type="text" 
                value={formData.npwp || ''} 
                onChange={e => setFormData({...formData, npwp: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold"
                placeholder="01.234.567.8-901.000"
              />
            </div>

            {/* Credit Limit & Transaction Threshold Box */}
            <div className="md:col-span-2 p-5 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border border-amber-200/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
                <h4 className="text-sm font-black text-slate-900">Pengaturan Plafon Kredit & Batasan Transaksi Sales Order (SO)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-700" /> Plafon Limit Transaksi (IDR)
                  </label>
                  <input 
                    type="number" 
                    value={formData.creditLimit ?? 50000000} 
                    onChange={e => setFormData({...formData, creditLimit: Number(e.target.value) || 0})} 
                    className="w-full p-2.5 clay-input text-sm font-black text-indigo-950 tabular-nums"
                    placeholder="50000000"
                  />
                  <p className="text-[11px] text-slate-500 font-bold mt-1">
                    Format: {formatIDR(Number(formData.creditLimit) || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Ambang Peringatan Alert Sisa Limit (%)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={formData.warningThresholdPct ?? 10} 
                    onChange={e => setFormData({...formData, warningThresholdPct: Number(e.target.value) || 10})} 
                    className="w-full p-2.5 clay-input text-sm font-black text-amber-950 tabular-nums"
                    placeholder="10"
                  />
                  <p className="text-[11px] text-slate-500 font-bold mt-1">
                    Alert muncul jika sisa limit ≤ {formData.warningThresholdPct ?? 10}% ({formatIDR((Number(formData.creditLimit) || 0) * ((formData.warningThresholdPct ?? 10) / 100))})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" /> Izin Override Manager Khusus
                  </label>
                  <div className="pt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="allowOverlimitCheck"
                      checked={formData.allowOverlimit === true} 
                      onChange={e => setFormData({...formData, allowOverlimit: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="allowOverlimitCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Bypass / Selalu Izinkan Order (Tanpa blokir)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Kesepakatan Plafon Kredit / Ketentuan Sales</label>
                <input 
                  type="text" 
                  value={formData.creditNotes || ''} 
                  onChange={e => setFormData({...formData, creditNotes: e.target.value})} 
                  className="w-full p-2.5 clay-input text-xs font-semibold text-slate-800"
                  placeholder="Contoh: Kesepakatan termin Net 14 Hari dengan maksimal 2 invoice berjalan bersamaan."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Alamat Lengkap Kantor / Toko / Gudang</label>
              <textarea 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                className="w-full p-3 clay-input text-sm font-semibold" 
                rows={2}
                placeholder="Jl. Raya Industri No. 45, Kawasan Industri, Jakarta"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 clay-button-secondary text-slate-700 font-bold text-sm">
              Batal
            </button>
            <button onClick={handleSave} className="px-6 py-2.5 clay-button-primary text-white font-bold text-sm">
              Simpan Data
            </button>
          </div>
        </div>
      )}

      {/* Customer Directory Cards */}
      {!editingItem && (
        <>
          <div className="relative max-w-sm mb-4">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input 
              type="text" 
              placeholder="Cari nama perusahaan, toko, kontak, email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 clay-input text-xs font-semibold" 
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const stats = getCustomerQuoteStats(customer.name);
              const creditStatus = getCustomerCreditStatus(customer, customers, quotations);

              return (
                <div key={customer.id} className="clay-card clay-card-hover p-6 group flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="px-3 py-1 clay-badge bg-white text-slate-800 text-[10px] font-black uppercase tracking-wider">
                        {customer.id}
                      </div>
                      <div className="flex gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedCustomerForHistory(customer)}
                          className="p-2 clay-button-secondary text-indigo-700" 
                          title="Lihat Histori Penawaran & SO"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => { 
                            setFormData({
                              name: customer.name,
                              storeName: customer.storeName || '',
                              attnName: customer.attnName || '',
                              email: customer.email || '',
                              phone: customer.phone || '',
                              address: customer.address || '',
                              npwp: customer.npwp || '',
                              creditLimit: customer.creditLimit ?? 50000000,
                              warningThresholdPct: customer.warningThresholdPct ?? 10,
                              allowOverlimit: customer.allowOverlimit ?? false,
                              creditNotes: customer.creditNotes || ''
                            }); 
                            setEditingItem(customer); 
                          }} 
                          className="p-2 clay-button-secondary text-blue-700" 
                          title="Edit Pelanggan & Plafon"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => showConfirm("Hapus Klien?", `Data klien ${customer.name} akan dihapus secara permanen.`, () => { 
                            setCustomers(customers.filter(c => c.id !== customer.id));
                            localStorage.setItem('sra_cust', JSON.stringify(customers.filter(c => c.id !== customer.id)));
                            showToast("Data klien dihapus"); 
                            logActivity('DELETE_CUSTOMER', `Hapus ${customer.name}`); 
                            syncToCloud('deleteCustomer', 'customer', { id: customer.id }); 
                          })} 
                          className="p-2 clay-button-secondary text-rose-700" 
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">{customer.name}</h3>

                    {customer.storeName && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold mb-2">
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{customer.storeName}</span>
                      </div>
                    )}

                    {customer.attnName && (
                      <p className="text-xs text-slate-600 font-bold mb-2 flex items-center gap-1">
                        <span className="text-slate-400">Up:</span> {customer.attnName}
                      </p>
                    )}

                    {/* Credit Limit & Status Bar Widget */}
                    <div className="p-3 my-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Plafon Kredit:
                        </span>
                        <span className="font-black text-slate-900 tabular-nums">
                          {formatIDR(creditStatus.creditLimit)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-black mb-1">
                          <span className="text-slate-500">Terpakai ({creditStatus.activeSoCount} SO Aktif)</span>
                          <span className={`${creditStatus.isExhausted ? 'text-rose-600' : creditStatus.isNearExhaustion ? 'text-amber-600' : 'text-emerald-700'}`}>
                            Sisa: {formatIDR(creditStatus.remainingCredit)} ({Math.round(creditStatus.remainingPercentage)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              creditStatus.isExhausted 
                                ? 'bg-rose-500' 
                                : creditStatus.isNearExhaustion 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, creditStatus.usedPercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Alert banner on customer card */}
                      {creditStatus.isExhausted ? (
                        <div className="p-1.5 rounded-lg bg-rose-100 text-rose-900 text-[10px] font-black flex items-center gap-1 border border-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Plafon Habis! SO baru memerlukan persetujuan Manager</span>
                        </div>
                      ) : creditStatus.isNearExhaustion ? (
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-950 text-[10px] font-black flex items-center gap-1 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Peringatan: Sisa limit ≤ {creditStatus.warningThresholdPct}%!</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-medium my-2">
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.npwp && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{customer.npwp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Quick Action */}
                  <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-bold">{stats.count} Transaksi Dokumen</span>
                      <span className="font-black text-emerald-800 tabular-nums">
                        {stats.totalVal > 0 ? formatIDR(stats.totalVal) : 'Belum ada'}
                      </span>
                    </div>

                    {onNewQuotationForCustomer && (
                      <button 
                        onClick={() => onNewQuotationForCustomer(customer)}
                        className="w-full py-2 clay-button-primary text-white text-xs font-black flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Buat Penawaran / SO Baru
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Customer Quotation History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="clay-modal w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/80 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" /> Histori Transaksi & Plafon Kredit Pelanggan
                </h3>
                <p className="text-xs text-slate-300 font-bold mt-0.5">{selectedCustomerForHistory.name}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomerForHistory(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {(() => {
                const hist = getCustomerQuoteStats(selectedCustomerForHistory.name);
                const creditStatus = getCustomerCreditStatus(selectedCustomerForHistory, customers, quotations);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#e9eff6] rounded-2xl border border-slate-200">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-500">Plafon Batas Kredit</p>
                        <p className="text-lg font-black text-indigo-900 tabular-nums">{formatIDR(creditStatus.creditLimit)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-500">Kredit Terpakai (SO Aktif)</p>
                        <p className="text-lg font-black text-rose-700 tabular-nums">{formatIDR(creditStatus.usedCredit)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-emerald-700">Sisa Plafon Tersedia</p>
                        <p className="text-lg font-black text-emerald-700 tabular-nums">{formatIDR(creditStatus.remainingCredit)}</p>
                      </div>
                    </div>

                    <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                      Daftar Dokumen Transaksi ({hist.quotes.length})
                    </h4>

                    {hist.quotes.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500">Belum ada penawaran atau Sales Order untuk klien ini.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {hist.quotes.map(q => (
                          <div key={q.id} className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/80">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">{q.id}</span>
                                {q.isSO && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300">
                                    SO #{q.soNumber || q.id}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  q.status === 'Accepted' || q.status === 'SO_Confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : q.status === 'Draft'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {q.status}
                                </span>
                                {q.isSO && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    q.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {q.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-semibold mt-1">
                                {q.date} • {q.issuingCompany} • {q.items?.length || 0} Barang • {q.paymentTerm || 'Net 14 Hari'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-slate-900 tabular-nums">
                                {formatIDR(q.total)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <CustomersImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={handleImportComplete}
          existingCustomers={customers}
          showToast={showToast}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Download, Plus, Search, Edit, Trash2, PlusCircle, FileSpreadsheet, Upload, LayoutGrid, Table, List, Tag, Filter, Calculator } from 'lucide-react';
import { Item, User } from '../types';
import { formatIDR } from '../utils/helpers';
import { InlinePriceEditor } from './InlinePriceEditor';
import { ItemsImportModal } from './ItemsImportModal';
import { downloadItemExcelTemplate, exportItemsToExcel } from '../utils/excelHelpers';

interface ItemsManagementProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  currentUser: User;
  onOpenCalculator?: (item?: Item) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  logActivity: (action: string, details: string) => void;
  syncToCloud: (action: string, payloadKey: string, payloadData: any) => void;
}

export function ItemsManagement({ 
  items, 
  setItems, 
  currentUser, 
  onOpenCalculator,
  showConfirm, 
  showToast, 
  logActivity, 
  syncToCloud 
}: ItemsManagementProps) {
  const isSales = currentUser?.role === 'sales';
  const [search, setSearch] = useState(''); 
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compact'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<Item | 'NEW' | null>(null);
  const [formData, setFormData] = useState<Omit<Item, 'id'>>({ sku: '', name: '', category: '', unit: 'Pcs', description: '', tiers: [{ min: 1, max: 999999, price: 0 }] });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Extract unique categories
  const safeItemsList = Array.isArray(items) ? items : [];
  const categories = Array.from(new Set(safeItemsList.filter(Boolean).map(i => i.category).filter(Boolean))) as string[];

  const filteredItems = safeItemsList.filter(item => {
    if (!item) return false;
    const query = search.toLowerCase();
    const matchesSearch = (item.name || '').toLowerCase().includes(query) || 
                          (item.sku || '').toLowerCase().includes(query) ||
                          (item.category && item.category.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = () => {
    if (!formData.sku || !formData.name) return showToast('SKU dan Nama Barang wajib diisi!', 'error');
    const sortedTiers = [...formData.tiers].sort((a, b) => a.min - b.min);
    if (editingItem === 'NEW') {
      const newItem: Item = { ...formData, id: Date.now().toString(), tiers: sortedTiers };
      setItems([newItem, ...items]); 
      logActivity('CREATE_ITEM', `Tambah barang: ${formData.name}`); 
      syncToCloud('saveItem', 'item', newItem);
    } else if (editingItem) {
      const updatedItem: Item = { ...formData, id: editingItem.id, tiers: sortedTiers };
      setItems(items.map(i => i.id === editingItem.id ? updatedItem : i)); 
      logActivity('UPDATE_ITEM', `Edit barang: ${formData.name}`); 
      syncToCloud('saveItem', 'item', updatedItem);
    }
    setEditingItem(null); 
    showToast("Data barang disimpan");
  };

  const handleQuickPriceUpdate = (itemId: string, tierIndex: number, newPrice: number) => {
    const targetItem = safeItemsList.find(i => i?.id === itemId); 
    if (!targetItem || !Array.isArray(targetItem.tiers) || !targetItem.tiers[tierIndex]) return;
    const updatedTiers = [...targetItem.tiers]; 
    updatedTiers[tierIndex] = { ...updatedTiers[tierIndex], price: newPrice };
    const updatedItem = { ...targetItem, tiers: updatedTiers };
    setItems((items || []).map(i => i?.id === itemId ? updatedItem : i)); 
    logActivity('UPDATE_ITEM_PRICE', `Ubah harga: ${targetItem.name || 'Produk'} -> ${formatIDR(newPrice)}`); 
    syncToCloud('saveItem', 'item', updatedItem); 
    showToast("Harga diperbarui");
  };

  const handleExportExcel = () => {
    exportItemsToExcel(items);
    showToast("File Excel Pricelist diunduh"); 
    logActivity('EXPORT_ITEMS', 'Export pricelist ke Excel');
  };

  const handleImportComplete = (importedItems: Item[], mode: 'UPSERT' | 'ADD_ONLY' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setItems(importedItems);
      logActivity('IMPORT_ITEMS_EXCEL', `Replace ${importedItems.length} barang dari Excel`);
      importedItems.forEach(i => syncToCloud('saveItem', 'item', i));
      showToast(`Berhasil mengganti seluruh pricelist (${importedItems.length} barang)`);
    } else if (mode === 'ADD_ONLY') {
      const existingSkuSet = new Set(items.map(i => i.sku.toLowerCase().trim()));
      const newOnly = importedItems.filter(i => !existingSkuSet.has(i.sku.toLowerCase().trim()));
      setItems([...newOnly, ...items]);
      logActivity('IMPORT_ITEMS_EXCEL', `Tambah ${newOnly.length} barang baru dari Excel`);
      newOnly.forEach(i => syncToCloud('saveItem', 'item', i));
      showToast(`Berhasil menambah ${newOnly.length} barang baru`);
    } else { // UPSERT
      const updatedMap = new Map<string, Item>();
      items.forEach(i => updatedMap.set(i.sku.toLowerCase().trim(), i));
      
      importedItems.forEach(imp => {
        const key = imp.sku.toLowerCase().trim();
        if (updatedMap.has(key)) {
          const old = updatedMap.get(key)!;
          updatedMap.set(key, { ...imp, id: old.id });
        } else {
          updatedMap.set(key, imp);
        }
      });

      const nextList = Array.from(updatedMap.values());
      setItems(nextList);
      logActivity('IMPORT_ITEMS_EXCEL', `Impor/Update ${importedItems.length} barang dari Excel`);
      importedItems.forEach(i => syncToCloud('saveItem', 'item', i));
      showToast(`Berhasil memperbarui ${importedItems.length} barang via Excel`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pricelist Barang & Produk</h2>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">{isSales ? 'Lihat daftar harga tier' : 'Kelola katalog barang, unit, dan harga bertingkat (tiered pricing)'}</p>
        </div>
        {!editingItem && (
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={downloadItemExcelTemplate} 
              title="Unduh file format Excel untuk input masif"
              className="px-4 py-2.5 clay-button-secondary text-blue-900 font-bold text-xs sm:text-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Template Excel
            </button>
            {!isSales && (
              <button 
                onClick={() => setIsImportModalOpen(true)} 
                className="px-4 py-2.5 clay-button-primary text-white font-bold text-xs sm:text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Import Excel
              </button>
            )}
            <button 
              onClick={handleExportExcel} 
              className="px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            {!isSales && (
              <button 
                onClick={() => { setFormData({ sku: `SKU-${Date.now().toString().slice(-4)}`, name: '', category: '', unit: 'Pcs', description: '', tiers: [{ min: 1, max: 999999, price: 0 }] }); setEditingItem('NEW'); }} 
                className="px-5 py-2.5 clay-button-primary text-white font-bold text-xs sm:text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            )}
          </div>
        )}
      </div>

      {editingItem && !isSales && (
        <div className="clay-card p-7 mb-6 animate-in zoom-in-95 duration-200">
          <h3 className="text-base font-extrabold mb-5 text-slate-900 border-b border-slate-200/60 pb-3">{editingItem === 'NEW' ? 'Tambah Barang Baru' : 'Edit Data Barang'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div><label className="block text-xs font-bold text-slate-700 mb-2">SKU *</label><input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 mb-2">Nama Barang *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Satuan</label><input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold" placeholder="Pcs"/></div>
            <div className="md:col-span-4"><label className="block text-xs font-bold text-slate-700 mb-2">Deskripsi / Spesifikasi</label><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 clay-input text-sm font-semibold"/></div>
          </div>
          <div className="mb-6 bg-[#eaf0f7] p-5 rounded-2xl border border-slate-200/70">
            <div className="flex justify-between items-center mb-3"><label className="block text-xs font-extrabold text-slate-800">Skema Harga Bertingkat (Tier Price)</label><button onClick={() => setFormData({...formData, tiers: [...formData.tiers, { min: formData.tiers[formData.tiers.length-1].max + 1, max: 999999, price: 0 }]})} className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"><PlusCircle className="w-4 h-4"/> Tambah Tier</button></div>
            <div className="space-y-2.5">
              {formData.tiers.map((tier, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input type="number" min="1" value={tier.min} onChange={e => { const nt = [...formData.tiers]; nt[idx].min = Number(e.target.value); setFormData({...formData, tiers: nt}); }} className="w-20 p-2.5 clay-input text-xs font-bold tabular-nums text-center" placeholder="Min"/>
                  <span className="text-slate-400 font-bold">-</span>
                  <input type="number" min="1" value={tier.max} onChange={e => { const nt = [...formData.tiers]; nt[idx].max = Number(e.target.value); setFormData({...formData, tiers: nt}); }} className="w-20 p-2.5 clay-input text-xs font-bold tabular-nums text-center" placeholder="Max"/>
                  <input type="number" min="0" value={tier.price} onChange={e => { const nt = [...formData.tiers]; nt[idx].price = Number(e.target.value); setFormData({...formData, tiers: nt}); }} className="flex-1 p-2.5 clay-input text-xs tabular-nums font-extrabold" placeholder="Harga per unit (Rp)"/>
                  {formData.tiers.length > 1 && <button onClick={() => setFormData({...formData, tiers: formData.tiers.filter((_, i) => i !== idx)})} className="p-2.5 clay-button-secondary text-rose-600"><Trash2 className="w-4 h-4"/></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 clay-button-secondary text-slate-700 font-bold text-sm">Batal</button>
            <button onClick={handleSave} className="px-6 py-2.5 clay-button-primary text-white font-bold text-sm">Simpan</button>
          </div>
        </div>
      )}

      {!editingItem && (
        <>
          {/* Quick Stats Summary Widgets (3D Claymorphism) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            <div className="clay-card p-4.5 flex items-center gap-3.5">
              <div className="w-11 h-11 clay-badge bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0 text-lg shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Total Produk</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{items.length} <span className="text-xs font-bold text-slate-500">Items</span></p>
              </div>
            </div>

            <div className="clay-card p-4.5 flex items-center gap-3.5">
              <div className="w-11 h-11 clay-badge bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 text-lg shadow-xs">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Kategori Terdaftar</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{categories.length} <span className="text-xs font-bold text-slate-500">Kategori</span></p>
              </div>
            </div>

            <div className="clay-card p-4.5 col-span-2 md:col-span-1 flex items-center gap-3.5">
              <div className="w-11 h-11 clay-badge bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 text-lg shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Metode Harga</p>
                <p className="text-base font-black text-slate-900 leading-tight">Tier Price <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md ml-1">Bertingkat</span></p>
              </div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-[#eaf0f7] p-4 rounded-2xl border border-slate-200/80 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <input 
                  type="text" 
                  placeholder="Cari SKU, Nama, atau Kategori..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 clay-input text-xs font-semibold" 
                />
              </div>
              <span className="text-xs font-extrabold text-slate-600 bg-white px-3 py-2 clay-badge">
                {filteredItems.length} dari {items.length} Barang
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 self-end lg:self-auto bg-white/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'clay-button-primary text-white scale-105 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                title="Tampilan Kartu (Grid 3D)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Kartu 3D</span>
              </button>

              <button 
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${viewMode === 'table' ? 'clay-button-primary text-white scale-105 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                title="Tampilan Tabel Detail"
              >
                <Table className="w-4 h-4" />
                <span>Tabel</span>
              </button>

              <button 
                onClick={() => setViewMode('compact')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${viewMode === 'compact' ? 'clay-button-primary text-white scale-105 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                title="Tampilan Ringkas (List Cepat)"
              >
                <List className="w-4 h-4" />
                <span>Ringkas</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              <span className="text-xs font-extrabold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
              </span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-md scale-105'
                    : 'clay-badge bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Semua ({items.length})
              </button>
              {categories.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                      selectedCategory === cat
                        ? 'clay-button-primary text-white shadow-md scale-105'
                        : 'clay-badge bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="clay-card p-12 text-center my-6">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800 mb-1">Barang tidak ditemukan</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                Coba ubah kata kunci pencarian atau sesuaikan filter kategori produk.
              </p>
            </div>
          )}

          {/* MODE 1: GRID VIEW (3D Claymations) */}
          {viewMode === 'grid' && filteredItems.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map(item => (
                <div key={item.id} className="clay-card clay-card-hover p-6 group flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.sku);
                        showToast(`SKU ${item.sku} tersalin ke clipboard`);
                      }}
                      title="Klik untuk salin SKU"
                      className="px-3 py-1 clay-badge bg-white text-slate-900 text-[11px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-emerald-600" />
                      {item.sku}
                    </button>
                    <div className="flex items-center gap-1.5">
                      {onOpenCalculator && (
                        <button 
                          onClick={() => onOpenCalculator(item)} 
                          className="p-2 clay-button-secondary text-emerald-800" 
                          title="Simulasi Tier Price"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isSales && (
                        <div className="flex gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setFormData(item); setEditingItem(item); }} className="p-2 clay-button-secondary text-blue-700" title="Edit"><Edit className="w-3.5 h-3.5"/></button>
                          <button onClick={() => showConfirm("Hapus Barang?", "Data hilang permanen.", () => { 
                            const next = items.filter(i => i.id !== item.id);
                            setItems(next); 
                            localStorage.setItem('sra_itm', JSON.stringify(next));
                            showToast("Dihapus"); 
                            logActivity('DELETE_ITEM', `Hapus ${item.name}`); 
                            syncToCloud('deleteItem', 'item', { id: item.id }); 
                          })} className="p-2 clay-button-secondary text-rose-700" title="Hapus"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-1 leading-snug group-hover:text-emerald-800 transition-colors">{item.name}</h3>
                  {item.description && <p className="text-xs text-slate-500 line-clamp-2 font-medium mb-3">{item.description}</p>}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200/80 shadow-2xs">
                      {item.category || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">• Satuan: {item.unit || 'Pcs'}</span>
                  </div>
                  
                  <div className="mt-auto bg-[#e4ecf4] rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="text-[10px] uppercase font-black text-slate-600 tracking-wider flex items-center gap-1">
                        Skema Harga Tier (Qty)
                      </p>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {item.tiers.length} Tier
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.tiers.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs hover:bg-white transition-colors text-xs">
                          <span className="text-slate-800 font-extrabold tabular-nums">
                            {t.min} - {t.max > 99999 ? '∞' : t.max} <span className="text-[10px] text-slate-500 font-bold">{item.unit}</span>
                          </span>
                          <InlinePriceEditor initialPrice={t.price} onSave={(newPrice) => handleQuickPriceUpdate(item.id, idx, newPrice)} disabled={isSales} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODE 2: TABLE VIEW */}
          {viewMode === 'table' && filteredItems.length > 0 && (
            <div className="clay-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eaf0f7] border-b border-slate-200/80 text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                      <th className="p-4">SKU</th>
                      <th className="p-4">Nama Barang & Deskripsi</th>
                      <th className="p-4">Kategori / Unit</th>
                      <th className="p-4">Tier Prices (Rentang Qty)</th>
                      {!isSales && <th className="p-4 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs font-semibold text-slate-800">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-4 font-extrabold whitespace-nowrap">
                          <span className="px-2.5 py-1 clay-badge bg-white text-slate-800 text-[10px] font-extrabold uppercase">{item.sku}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{item.name}</div>
                          {item.description && <div className="text-[11px] text-slate-500 line-clamp-1 font-medium mt-0.5">{item.description}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-100/80 text-emerald-800 border border-emerald-200 mr-2">{item.category || 'General'}</span>
                          <span className="text-slate-500 text-xs font-bold">{item.unit || 'Pcs'}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            {item.tiers.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                                <span className="text-[10px] text-slate-500 font-bold tabular-nums">
                                  {t.min}-{t.max > 99999 ? '∞' : t.max}:
                                </span>
                                <InlinePriceEditor initialPrice={t.price} onSave={(newPrice) => handleQuickPriceUpdate(item.id, idx, newPrice)} disabled={isSales} />
                              </div>
                            ))}
                          </div>
                        </td>
                        {!isSales && (
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => { setFormData(item); setEditingItem(item); }} className="p-2 clay-button-secondary text-blue-700" title="Edit"><Edit className="w-3.5 h-3.5"/></button>
                              <button onClick={() => showConfirm("Hapus Barang?", "Data hilang permanen.", () => { setItems(items.filter(i => i.id !== item.id)); showToast("Dihapus"); logActivity('DELETE_ITEM', `Hapus ${item.name}`); syncToCloud('deleteItem', 'item', { id: item.id }); })} className="p-2 clay-button-secondary text-rose-700" title="Hapus"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODE 3: COMPACT LIST VIEW */}
          {viewMode === 'compact' && filteredItems.length > 0 && (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div key={item.id} className="clay-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 clay-badge bg-white text-slate-800 text-[10px] font-extrabold uppercase">{item.sku}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800">{item.category || 'Umum'}</span>
                      <span className="text-xs text-slate-400 font-semibold">• {item.unit || 'Pcs'}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">{item.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.tiers.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eaf0f7] border border-slate-200/90 rounded-xl text-xs font-bold">
                        <span className="text-[10px] text-slate-500 font-bold tabular-nums">
                          Qty {t.min}{t.max > 99999 ? '+' : `-${t.max}`}:
                        </span>
                        <InlinePriceEditor initialPrice={t.price} onSave={(newPrice) => handleQuickPriceUpdate(item.id, idx, newPrice)} disabled={isSales} />
                      </div>
                    ))}
                  </div>

                  {!isSales && (
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <button onClick={() => { setFormData(item); setEditingItem(item); }} className="p-2 clay-button-secondary text-blue-700" title="Edit"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={() => showConfirm("Hapus Barang?", "Data hilang permanen.", () => { 
                        const next = items.filter(i => i.id !== item.id);
                        setItems(next); 
                        localStorage.setItem('sra_itm', JSON.stringify(next));
                        showToast("Dihapus"); 
                        logActivity('DELETE_ITEM', `Hapus ${item.name}`); 
                        syncToCloud('deleteItem', 'item', { id: item.id }); 
                      })} className="p-2 clay-button-secondary text-rose-700" title="Hapus"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ItemsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingItems={items}
        onImportComplete={handleImportComplete}
        showToast={showToast}
      />
    </div>
  );
}

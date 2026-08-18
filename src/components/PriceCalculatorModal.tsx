import React, { useState } from 'react';
import { X, Calculator, ArrowRight, Copy, Check, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { Item } from '../types';
import { formatIDR } from '../utils/helpers';
import { ItemSelect } from './ItemSelect';

interface PriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  initialItemId?: string;
  onApplyToQuotation?: (item: Item, qty: number, unitPrice: number, discount: number, discountType: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function PriceCalculatorModal({
  isOpen,
  onClose,
  items,
  initialItemId,
  onApplyToQuotation,
  showToast
}: PriceCalculatorModalProps) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || safeItems[0]?.id || '');
  const [qty, setQty] = useState<number>(10);
  const [discountType, setDiscountType] = useState<'nominal' | 'percentage'>('nominal');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Sync initialItemId if changed
  React.useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    } else if (!selectedItemId && safeItems.length > 0) {
      setSelectedItemId(safeItems[0].id);
    }
  }, [initialItemId, safeItems]);

  if (!isOpen) return null;

  const selectedItem = safeItems.find(i => i.id === selectedItemId) || safeItems[0] || null;

  const getTierPrice = (item: Item, quantity: number) => {
    if (!item || !item.tiers || item.tiers.length === 0) return 0;
    const matched = item.tiers.find(t => quantity >= t.min && quantity <= t.max);
    return matched ? matched.price : (item.tiers[item.tiers.length - 1]?.price || 0);
  };

  const unitPrice = selectedItem ? getTierPrice(selectedItem, qty) : 0;
  const grossSubtotal = unitPrice * (qty || 0);
  
  const discountAmount = discountType === 'percentage' 
    ? (grossSubtotal * (Number(discountVal) || 0)) / 100 
    : (Number(discountVal) || 0);
    
  const netSubtotal = Math.max(0, grossSubtotal - Math.min(discountAmount, grossSubtotal));
  const effectiveUnitPrice = qty > 0 ? netSubtotal / qty : 0;

  // Base tier 1 price for comparison
  const baseTierPrice = selectedItem?.tiers?.[0]?.price || unitPrice;
  const totalSavingsVsBase = Math.max(0, (baseTierPrice * qty) - netSubtotal);

  const handleCopySummary = () => {
    if (!selectedItem) return;
    const text = `*ESTIMASI HARGA PRODUK*\nProduk: ${selectedItem.name} (${selectedItem.sku})\nJumlah: ${qty} ${selectedItem.unit || 'Pcs'}\nHarga Satuan: ${formatIDR(unitPrice)}\n${discountAmount > 0 ? `Diskon: ${formatIDR(discountAmount)}\n` : ''}*Total Estimasi:* ${formatIDR(netSubtotal)}\n\n_Dibuat via SRA Quotify_`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Ringkasan simulasi harga tersalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-200/80 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Kalkulator Simulasi Tier Price</h3>
              <p className="text-xs text-emerald-100 font-medium">Hitung harga bertingkat, diskon kuantiti, dan margin seketika</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Pilih Produk / Barang
            </label>
            <ItemSelect items={items} value={selectedItemId} onChange={setSelectedItemId} />
          </div>

          {selectedItem && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-slate-900">{selectedItem.name}</span>
                <span className="text-slate-500 font-bold ml-2">({selectedItem.sku})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg font-bold border border-emerald-200">
                  {selectedItem.category || 'General'}
                </span>
                <span className="text-slate-600 font-bold">Satuan: {selectedItem.unit || 'Pcs'}</span>
              </div>
            </div>
          )}

          {/* Tier breakdown preview */}
          {selectedItem && selectedItem.tiers && (
            <div className="bg-[#e9eff6] p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Skema Tier Harga Produk Ini
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {selectedItem.tiers.map((t, idx) => {
                  const isActive = qty >= t.min && qty <= t.max;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setQty(t.min)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-102' 
                          : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-extrabold ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                          Tier {idx + 1}
                        </span>
                        {isActive && <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded">Aktif</span>}
                      </div>
                      <p className="font-extrabold">{t.min} - {t.max > 99999 ? '∞' : t.max} {selectedItem.unit}</p>
                      <p className={`font-black text-sm mt-1 tabular-nums ${isActive ? 'text-white' : 'text-emerald-700'}`}>
                        {formatIDR(t.price)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inputs for Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                Jumlah Pesanan (Quantity)
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="1" 
                  value={qty} 
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="w-full p-3.5 clay-input text-base font-black text-slate-900 tabular-nums"
                />
                <span className="p-3.5 clay-badge bg-white font-black text-slate-700 text-sm flex items-center">
                  {selectedItem?.unit || 'Pcs'}
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[5, 10, 25, 50, 100, 500].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setQty(val)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                Diskon Khusus (Opsional)
              </label>
              <div className="flex gap-2">
                <select 
                  value={discountType} 
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="p-3.5 clay-input font-bold text-sm"
                >
                  <option value="nominal">Rp</option>
                  <option value="percentage">%</option>
                </select>
                <input 
                  type="number" 
                  min="0" 
                  value={discountVal || ''} 
                  onChange={e => setDiscountVal(parseFloat(e.target.value) || 0)} 
                  placeholder="0"
                  className="w-full p-3.5 clay-input text-base font-black text-slate-900 tabular-nums"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-1.5">
                {discountType === 'percentage' ? `Diskon ${discountVal}% dari subtotal` : `Potongan nominal Rp`}
              </p>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="clay-card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs font-medium text-slate-300">
              <span>Harga Satuan Tier Terpilih:</span>
              <span className="font-extrabold text-white text-sm tabular-nums">{formatIDR(unitPrice)}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-medium text-slate-300">
              <span>Gross Subtotal ({qty} {selectedItem?.unit}):</span>
              <span className="font-extrabold text-white text-sm tabular-nums">{formatIDR(grossSubtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-medium text-rose-300">
                <span>Potongan Diskon:</span>
                <span className="font-extrabold tabular-nums">-{formatIDR(discountAmount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Grand Total Estimasi</p>
                <p className="text-2xl font-black text-emerald-400 tabular-nums leading-none mt-1">
                  {formatIDR(netSubtotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold">Harga Bersih / Unit:</p>
                <p className="text-sm font-black text-slate-200 tabular-nums">
                  {formatIDR(Math.round(effectiveUnitPrice))} <span className="text-[10px] text-slate-400">/{selectedItem?.unit}</span>
                </p>
              </div>
            </div>

            {totalSavingsVsBase > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Hemat kuantiti dibanding tier terendah:</span>
                <span className="font-extrabold">{formatIDR(totalSavingsVsBase)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200/80 bg-[#eaf0f7] flex flex-wrap justify-between items-center gap-3">
          <button 
            onClick={handleCopySummary}
            className="px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Salin Teks Ringkasan'}
          </button>

          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs"
            >
              Tutup
            </button>
            {onApplyToQuotation && selectedItem && (
              <button 
                onClick={() => {
                  onApplyToQuotation(selectedItem, qty, unitPrice, discountVal, discountType);
                  onClose();
                }}
                className="px-5 py-2.5 clay-button-primary text-white font-bold text-xs flex items-center gap-1.5"
              >
                Terapkan ke Quotation <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

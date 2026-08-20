import React, { useState } from 'react';
import { X, Calculator, ArrowRight, Copy, Check, Sparkles, Tag, ShieldCheck, DollarSign, TrendingUp } from 'lucide-react';
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
  const [calcMode, setCalcMode] = useState<'CATALOG' | 'SPOT'>('CATALOG');

  // CATALOG MODE STATES
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || safeItems[0]?.id || '');
  const [qty, setQty] = useState<number>(10);
  const [discountType, setDiscountType] = useState<'nominal' | 'percentage'>('nominal');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // SPOT / NON-PRICE LIST STATES
  const [spotName, setSpotName] = useState('Bawang Merah Brebes Super');
  const [spotUnit, setSpotUnit] = useState('Kg');
  const [spotCostPrice, setSpotCostPrice] = useState<number>(28000);
  const [spotMarginPct, setSpotMarginPct] = useState<number>(20);
  const [spotSellingPrice, setSpotSellingPrice] = useState<number>(33600);
  const [spotQty, setSpotQty] = useState<number>(50);
  const [spotDiscountVal, setSpotDiscountVal] = useState<number>(0);

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

  // SPOT MODE CALCULATIONS
  const handleSpotCostOrMarginChange = (newCost: number, newMarginPct: number) => {
    setSpotCostPrice(newCost);
    setSpotMarginPct(newMarginPct);
    const calculated = Math.round(newCost * (1 + newMarginPct / 100));
    setSpotSellingPrice(calculated);
  };

  const handleSpotSellingPriceChange = (newPrice: number) => {
    setSpotSellingPrice(newPrice);
    if (spotCostPrice > 0) {
      const margin = Math.round(((newPrice - spotCostPrice) / spotCostPrice) * 100);
      setSpotMarginPct(margin);
    }
  };

  const spotGross = spotSellingPrice * spotQty;
  const spotNet = Math.max(0, spotGross - spotDiscountVal);
  const spotTotalCost = spotCostPrice * spotQty;
  const spotTotalProfit = spotNet - spotTotalCost;
  const spotProfitPerUnit = spotQty > 0 ? spotTotalProfit / spotQty : 0;

  const handleCopySummary = () => {
    if (calcMode === 'CATALOG') {
      if (!selectedItem) return;
      const text = `*ESTIMASI HARGA PRODUK*\nProduk: ${selectedItem.name} (${selectedItem.sku})\nJumlah: ${qty} ${selectedItem.unit || 'Pcs'}\nHarga Satuan: ${formatIDR(unitPrice)}\n${discountAmount > 0 ? `Diskon: ${formatIDR(discountAmount)}\n` : ''}*Total Estimasi:* ${formatIDR(netSubtotal)}\n\n_Dibuat via SRA Quotify_`;
      navigator.clipboard.writeText(text);
    } else {
      const text = `*ESTIMASI HARGA BARANG SPOT / NON-PRICE LIST*\nBarang: ${spotName}\nJumlah: ${spotQty} ${spotUnit}\nModal (HPP): ${formatIDR(spotCostPrice)}\nHarga Jual: ${formatIDR(spotSellingPrice)} (Margin ${spotMarginPct}%)\n${spotDiscountVal > 0 ? `Diskon: ${formatIDR(spotDiscountVal)}\n` : ''}*Total Nilai:* ${formatIDR(spotNet)}\nEstimasi Keuntungan: ${formatIDR(spotTotalProfit)}\n\n_Dibuat via SRA Quotify_`;
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    if (showToast) showToast("Ringkasan simulasi harga tersalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-200/80 bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Kalkulator Simulasi Harga Fleksibel</h3>
              <p className="text-xs text-emerald-100 font-medium">Katalog Price List & Simulasi Barang Spot / Custom Non-Price List</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE TOGGLE TABS */}
        <div className="p-3 bg-[#e4ecf4] border-b border-slate-200 flex justify-center">
          <div className="p-1 bg-slate-200/80 rounded-xl border border-slate-300 flex w-full max-w-md">
            <button
              type="button"
              onClick={() => setCalcMode('CATALOG')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'CATALOG'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Katalog Price List
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('SPOT')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'SPOT'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Barang Spot / Non-Price List
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {calcMode === 'CATALOG' ? (
            /* CATALOG MODE */
            <>
              {/* Item Selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Produk dari Katalog
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
            </>
          ) : (
            /* SPOT / NON-PRICE LIST MODE */
            <div className="space-y-5">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  Simulasi Margin & Harga Jual Barang Spot / Pasar Bebas
                </h4>
                <p className="text-[11px] text-purple-800 font-medium">
                  Gunakan simulator ini ketika membeli barang dengan harga fluktuatif atau belum ada di daftar harga resmi untuk menentukan margin dan harga penawaran yang tepat.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Nama Barang Spot / Khusus
                  </label>
                  <input 
                    type="text" 
                    value={spotName} 
                    onChange={e => setSpotName(e.target.value)} 
                    placeholder="Wortel Berastagi Super Jumbo"
                    className="w-full p-3 clay-input text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input 
                    type="text" 
                    value={spotUnit} 
                    onChange={e => setSpotUnit(e.target.value)} 
                    placeholder="Kg / Dus / Ton"
                    className="w-full p-3 clay-input text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Harga Modal / HPP Satuan (Rp)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={spotCostPrice || ''} 
                    onChange={e => handleSpotCostOrMarginChange(Number(e.target.value) || 0, spotMarginPct)} 
                    placeholder="25000"
                    className="w-full p-3 clay-input text-sm font-black text-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-purple-950 mb-1">
                    Target Margin Keuntungan (%)
                  </label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      value={spotMarginPct || ''} 
                      onChange={e => handleSpotCostOrMarginChange(spotCostPrice, Number(e.target.value) || 0)} 
                      placeholder="20"
                      className="w-full p-3 clay-input text-sm font-black text-purple-950 tabular-nums"
                    />
                    <span className="p-3 clay-badge bg-white font-black text-slate-700 text-xs flex items-center">
                      %
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {[10, 15, 20, 25, 30].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSpotCostOrMarginChange(spotCostPrice, m)}
                        className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded text-[10px] font-black"
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-950 mb-1">
                    Harga Jual Satuan Terhitung (Rp)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={spotSellingPrice || ''} 
                    onChange={e => handleSpotSellingPriceChange(Number(e.target.value) || 0)} 
                    placeholder="30000"
                    className="w-full p-3 clay-input text-sm font-black text-emerald-950 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Kuantitas Pesanan (Qty)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={spotQty} 
                    onChange={e => setSpotQty(Math.max(1, Number(e.target.value) || 1))} 
                    className="w-full p-3 clay-input text-sm font-black tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Potongan Diskon Negosiasi (Rp)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={spotDiscountVal || ''} 
                    onChange={e => setSpotDiscountVal(Number(e.target.value) || 0)} 
                    placeholder="0"
                    className="w-full p-3 clay-input text-sm font-bold tabular-nums"
                  />
                </div>
              </div>

              {/* Profit & Margin Results */}
              <div className="clay-card p-5 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs text-purple-200">
                  <span>Total Nilai Modal HPP ({spotQty} {spotUnit}):</span>
                  <span className="font-extrabold text-slate-200 tabular-nums">{formatIDR(spotTotalCost)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-purple-200">
                  <span>Gross Nilai Penjualan:</span>
                  <span className="font-extrabold text-white tabular-nums">{formatIDR(spotGross)}</span>
                </div>

                {spotDiscountVal > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-300">
                    <span>Diskon Negosiasi:</span>
                    <span className="font-extrabold tabular-nums">-{formatIDR(spotDiscountVal)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-purple-800 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-black text-purple-300 tracking-wider">Total Penawaran Harga</p>
                    <p className="text-2xl font-black text-purple-300 tabular-nums leading-none mt-1">
                      {formatIDR(spotNet)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase flex items-center justify-end gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Estimasi Profit Bersih:
                    </p>
                    <p className="text-base font-black text-emerald-400 tabular-nums">
                      +{formatIDR(spotTotalProfit)} <span className="text-[10px] font-bold">({spotMarginPct}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200/80 bg-[#eaf0f7] flex flex-wrap justify-between items-center gap-3">
          <button 
            onClick={handleCopySummary}
            className="px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Salin Ringkasan Teks'}
          </button>

          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 clay-button-secondary text-slate-700 font-bold text-xs"
            >
              Tutup
            </button>
            {onApplyToQuotation && (
              <button 
                onClick={() => {
                  if (calcMode === 'CATALOG' && selectedItem) {
                    onApplyToQuotation(selectedItem, qty, unitPrice, discountVal, discountType);
                  } else {
                    const tempItem: Item = {
                      id: `SPOT-${Date.now().toString().slice(-4)}`,
                      sku: `SPOT-${Math.floor(100 + Math.random() * 900)}`,
                      name: spotName,
                      category: 'Spot Market',
                      unit: spotUnit,
                      description: `Spot item dengan HPP ${formatIDR(spotCostPrice)}`,
                      tiers: [{ min: 1, max: 999999, price: spotSellingPrice }]
                    };
                    onApplyToQuotation(tempItem, spotQty, spotSellingPrice, spotDiscountVal, 'nominal');
                  }
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

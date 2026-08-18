import React, { useState } from 'react';
import { 
  Printer, Download, MessageCircle, ChevronLeft, Building2, 
  Palette, FileSpreadsheet, Check, Copy, Edit3, RefreshCw
} from 'lucide-react';
import { Quotation, Item, Settings, User } from '../types';
import { getSraGroupEntities, formatIDR } from '../utils/helpers';
import * as XLSX from 'xlsx';

interface PrintableSalesOrderProps {
  quote: Quotation;
  items: Item[];
  onBack: () => void;
  settings: Settings;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
}

export function PrintableSalesOrder({
  quote,
  items,
  onBack,
  settings,
  showToast,
  currentUser
}: PrintableSalesOrderProps) {
  const entities = getSraGroupEntities(settings);
  
  // State for customizing SO on the fly
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(() => {
    // Default to PT Exindokarsa Agung if matching image, or quote's issuing company
    if (quote.issuingCompany && entities[quote.issuingCompany]) {
      return quote.issuingCompany;
    }
    return entities['PT Exindokarsa Agung'] ? 'PT Exindokarsa Agung' : Object.keys(entities)[0];
  });

  const [customCompanyName, setCustomCompanyName] = useState<string>('');
  const [useCustomCompany, setUseCustomCompany] = useState<boolean>(false);

  // SO Number format (can use numeric extract or full ID)
  const defaultSoNum = quote.id ? quote.id.replace(/[^0-9]/g, '').slice(-5) || quote.id : '27795';
  const [soNumber, setSoNumber] = useState<string>(defaultSoNum);
  
  const [soDate, setSoDate] = useState<string>(() => {
    if (quote.date) return quote.date;
    return new Date().toISOString().split('T')[0];
  });

  // Buyer Info
  const initialBuyerName = [quote.customerName, quote.storeName].filter(Boolean).join(' - ') || quote.customerName || '';
  const [buyerName, setBuyerName] = useState<string>(initialBuyerName);
  const [buyerAddress, setBuyerAddress] = useState<string>(quote.customerAddress || '');
  const [buyerPhone, setBuyerPhone] = useState<string>(quote.customerEmail ? `${quote.customerEmail}` : '');
  
  // Payment & Notes
  const [paymentTerms, setPaymentTerms] = useState<string>(quote.paymentTerm || 'Net 14 Hari');
  const [soNotes, setSoNotes] = useState<string>(quote.notes || '');
  const [salesmanName, setSalesmanName] = useState<string>(currentUser?.name || quote.createdBy || 'SALESMAN');

  // Paper Theme Style: 'YELLOW_NCR' (authentic yellow carbon form) vs 'WHITE_PRINT'
  const [paperTheme, setPaperTheme] = useState<'YELLOW_NCR' | 'WHITE_PRINT'>('YELLOW_NCR');
  const [copiedWa, setCopiedWa] = useState(false);

  if (!quote) return null;

  const currentEntity = entities[selectedEntityKey] || Object.values(entities)[0];
  const activeCompanyName = useCustomCompany && customCompanyName.trim() 
    ? customCompanyName.trim().toUpperCase() 
    : (currentEntity?.companyName || 'PT. EXINDOKARSA AGUNG').toUpperCase();

  const safeQuoteItems = Array.isArray(quote?.items) ? quote.items : [];

  // Minimum 10 rows for authentic SO grid look
  const totalGridRows = Math.max(10, safeQuoteItems.length + 2);
  const emptyRowsCount = Math.max(0, totalGridRows - safeQuoteItems.length);

  const formatDateDisplay = (d: string) => {
    if (!d) return '-';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(d).toLocaleDateString('id-ID');
    } catch {
      return d;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = safeQuoteItems.map((qi, idx) => {
      const itm = items.find(i => i.id === qi.itemId);
      let keterangan = '';
      if (qi.itemDiscount && qi.itemDiscount > 0) {
        keterangan += `Disc: ${qi.itemDiscountType === 'percentage' ? `${qi.itemDiscount}%` : formatIDR(qi.itemDiscount)} `;
      }
      return {
        'NO': idx + 1,
        'BANYAKNYA': `${qi.qty} ${itm?.unit || 'Dus'}`,
        'NAMA BARANG': itm?.name || qi.itemId || 'Barang',
        'HARGA': qi.unitPrice,
        'KETERANGAN': keterangan.trim() || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: ['NO', 'BANYAKNYA', 'NAMA BARANG', 'HARGA', 'KETERANGAN'] });
    ws['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 40 }, { wch: 18 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Order');
    XLSX.writeFile(wb, `SO_${soNumber}_${buyerName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    showToast('Sales Order berhasil diekspor ke Excel!');
  };

  const waText = `*SALES - ORDER (SO)*\n*${activeCompanyName}*\n\n*Nomor SO:* ${soNumber}\n*Tanggal:* ${formatDateDisplay(soDate)}\n*Nama Pembeli:* ${buyerName}\n*Alamat:* ${buyerAddress || '-'}\n*Telepon:* ${buyerPhone || '-'}\n\n*Daftar Barang:*\n${safeQuoteItems.map((qi, idx) => {
    const itm = items.find(i => i.id === qi.itemId);
    return `${idx + 1}. ${itm?.name || 'Item'} (${qi.qty} ${itm?.unit || 'Dus'}) @ ${formatIDR(qi.unitPrice)}`;
  }).join('\n')}\n\n*Pembayaran:* ${paymentTerms}\n*Catatan:* ${soNotes || '-'}\n*Salesman:* ${salesmanName}\n\n_Dokumen Sales Order tercetak siap diproses._`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(waText);
    setCopiedWa(true);
    showToast("Teks Sales Order berhasil disalin!");
    setTimeout(() => setCopiedWa(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      {/* Control Bar (Hidden when printing) */}
      <div className="clay-card p-5 no-print space-y-4">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2.5 clay-button-secondary text-slate-700 hover:text-slate-900 rounded-xl"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300 uppercase tracking-wider">
                  Format Sales Order (SO)
                </span>
                <span className="text-xs text-slate-500 font-bold">Ref: #{quote.id}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">Formulir Cetak Sales Order</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Theme selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPaperTheme('YELLOW_NCR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  paperTheme === 'YELLOW_NCR' 
                    ? 'bg-amber-300 text-amber-950 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kertas Karbon NCR Kuning sesuai format cetak"
              >
                <Palette className="w-3.5 h-3.5 text-amber-800" /> Kertas Kuning (NCR)
              </button>
              <button
                type="button"
                onClick={() => setPaperTheme('WHITE_PRINT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  paperTheme === 'WHITE_PRINT' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kertas Putih Standar"
              >
                Kertas Putih
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 clay-button-secondary text-slate-800 font-bold text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 clay-button-secondary text-emerald-800 font-bold text-xs flex items-center gap-1.5"
            >
              {copiedWa ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-700" />}
              {copiedWa ? 'Disalin' : 'Salin WA'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 clay-button-secondary text-emerald-800 font-bold text-xs flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" /> Kirim WA
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 clay-button-primary text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF SO
            </button>
          </div>
        </div>

        {/* Customization Parameters */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Pilih Nama PT Penerbit SO
            </label>
            <select
              value={useCustomCompany ? '__CUSTOM__' : selectedEntityKey}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setUseCustomCompany(true);
                } else {
                  setUseCustomCompany(false);
                  setSelectedEntityKey(e.target.value);
                }
              }}
              className="w-full p-2 clay-input font-bold text-slate-900 text-xs"
            >
              {Object.keys(entities).map(k => (
                <option key={k} value={k}>{entities[k].companyName}</option>
              ))}
              <option value="__CUSTOM__">+ Input Manual Nama PT...</option>
            </select>
            {useCustomCompany && (
              <input 
                type="text" 
                placeholder="Tuliskan Nama PT disini..." 
                value={customCompanyName} 
                onChange={e => setCustomCompanyName(e.target.value)} 
                className="w-full mt-1.5 p-2 clay-input text-xs font-bold text-indigo-900"
              />
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor SO</label>
            <input 
              type="text" 
              value={soNumber} 
              onChange={e => setSoNumber(e.target.value)} 
              className="w-full p-2 clay-input font-bold text-slate-900 text-xs"
              placeholder="Contoh: 27795"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal SO</label>
            <input 
              type="date" 
              value={soDate} 
              onChange={e => setSoDate(e.target.value)} 
              className="w-full p-2 clay-input font-bold text-slate-900 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Salesman</label>
            <input 
              type="text" 
              value={salesmanName} 
              onChange={e => setSalesmanName(e.target.value)} 
              className="w-full p-2 clay-input font-bold text-slate-900 text-xs"
              placeholder="Nama Sales"
            />
          </div>
        </div>
      </div>

      {/* Printable SO Sheet Container */}
      <div className="flex justify-center w-full overflow-x-auto p-2">
        <div 
          id="so-printable-form"
          className={`w-full max-w-[840px] shadow-xl transition-all print:shadow-none print:w-full print:max-w-none ${
            paperTheme === 'YELLOW_NCR' 
              ? 'bg-[#fff59d] text-black border-2 border-black' 
              : 'bg-white text-slate-950 border-2 border-slate-900'
          }`}
          style={{
            fontFamily: '"Arial", "Helvetica", sans-serif',
            minHeight: '600px',
            backgroundColor: paperTheme === 'YELLOW_NCR' ? '#fff59d' : '#ffffff'
          }}
        >
          {/* Form Content - Exactly mimicking the Carbon NCR Sales Order Layout */}
          <div className="p-6 md:p-8 space-y-0 text-black">
            
            {/* Top Header Box with Border */}
            <div className="border-2 border-black divide-x-2 divide-black grid grid-cols-12 mb-0">
              
              {/* Left Header: Title, PT Name, Nomor SO, Tanggal */}
              <div className="col-span-6 p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase text-black">
                    SALES - ORDER
                  </h1>
                  <h2 className="text-base md:text-lg font-black uppercase text-black mt-1">
                    {activeCompanyName}
                  </h2>
                </div>

                <div className="space-y-1.5 pt-2 text-xs md:text-sm font-bold">
                  <div className="flex items-center">
                    <span className="w-24 md:w-28 uppercase font-bold tracking-tight">NOMOR SO</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold text-sm md:text-base">{soNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 md:w-28 uppercase font-bold tracking-tight">TANGGAL</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold">{formatDateDisplay(soDate)}</span>
                  </div>
                </div>
              </div>

              {/* Right Header: Nama Pembeli, Alamat, Telepon */}
              <div className="col-span-6 p-4 space-y-2 text-xs md:text-sm font-bold flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="w-28 md:w-32 uppercase font-bold shrink-0">NAMA PEMBELI</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold uppercase leading-tight">{buyerName || '-'}</span>
                  </div>

                  <div className="flex items-start border-b border-black/40 pb-1">
                    <span className="w-28 md:w-32 uppercase font-bold shrink-0">ALAMAT</span>
                    <span className="mr-2">:</span>
                    <span className="font-semibold text-xs leading-normal">{buyerAddress || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <span className="w-28 md:w-32 uppercase font-bold shrink-0">TELEPON</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold">{buyerPhone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Main Items Table */}
            <div className="border-x-2 border-b-2 border-black">
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b-2 border-black font-black uppercase text-center divide-x-2 divide-black bg-black/5">
                    <th style={{ width: '6%' }} className="py-2 px-1 text-center">NO</th>
                    <th style={{ width: '16%' }} className="py-2 px-2 text-center">BANYAKNYA</th>
                    <th style={{ width: '46%' }} className="py-2 px-3 text-left">NAMA BARANG</th>
                    <th style={{ width: '16%' }} className="py-2 px-2 text-right">HARGA</th>
                    <th style={{ width: '16%' }} className="py-2 px-2 text-center">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-semibold">
                  {safeQuoteItems.map((qi, index) => {
                    const itemData = items.find(i => i.id === qi.itemId);
                    let ket = '';
                    if (qi.itemDiscount && qi.itemDiscount > 0) {
                      ket = qi.itemDiscountType === 'percentage' ? `Disc ${qi.itemDiscount}%` : `Disc ${formatIDR(qi.itemDiscount)}`;
                    }

                    return (
                      <tr key={index} className="divide-x-2 divide-black h-8 md:h-9">
                        <td className="py-1.5 px-1 text-center font-bold">{index + 1}</td>
                        <td className="py-1.5 px-2 text-center font-bold">
                          {qi.qty} {itemData?.unit || 'Dus'}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-left">
                          {itemData?.name || qi.itemId}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold tabular-nums">
                          {formatIDR(qi.unitPrice)}
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs font-medium">
                          {ket || '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows to replicate authentic printed carbon form height */}
                  {Array.from({ length: emptyRowsCount }).map((_, eIdx) => (
                    <tr key={`empty-${eIdx}`} className="divide-x-2 divide-black h-8 md:h-9">
                      <td className="py-1 px-1 text-center text-transparent">-</td>
                      <td className="py-1 px-2 text-center text-transparent">-</td>
                      <td className="py-1 px-3 text-left text-transparent">-</td>
                      <td className="py-1 px-2 text-right text-transparent">-</td>
                      <td className="py-1 px-2 text-center text-transparent">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Section: Signatures (Left) and Payment & Notes (Right) */}
            <div className="border-x-2 border-b-2 border-black divide-x-2 divide-black grid grid-cols-12">
              
              {/* Left Footer: SALESMAN & MENYETUJUI signatures */}
              <div className="col-span-5 p-3 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-2 text-center text-xs md:text-sm font-black uppercase">
                  <div className="underline underline-offset-4 tracking-wider">
                    SALESMAN
                  </div>
                  <div className="underline underline-offset-4 tracking-wider">
                    MENYETUJUI
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-14 pb-2 text-[11px] font-bold">
                  <div className="px-1 truncate">
                    <span>...........................</span>
                    {salesmanName && (
                      <div className="text-[10px] uppercase font-extrabold text-black/80 mt-0.5">
                        ({salesmanName})
                      </div>
                    )}
                  </div>
                  <div className="px-1">
                    <span>...........................</span>
                  </div>
                </div>
              </div>

              {/* Right Footer: PEMBAYARAN and CATATAN */}
              <div className="col-span-7 p-3 space-y-2 text-xs md:text-sm font-bold flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <span className="w-28 uppercase font-bold shrink-0">PEMBAYARAN</span>
                    <span className="mr-2">:</span>
                    <span className="font-black text-sm uppercase">{paymentTerms}</span>
                  </div>

                  <div className="flex items-start">
                    <span className="w-28 uppercase font-bold shrink-0">CATATAN</span>
                    <span className="mr-2">:</span>
                    <span className="font-semibold text-xs leading-relaxed">
                      {soNotes || '-'}
                    </span>
                  </div>
                </div>

                {/* Ruled lines for handwriting notes */}
                <div className="space-y-2 pt-2">
                  <div className="w-full border-b border-black"></div>
                  <div className="w-full border-b border-black"></div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #so-printable-form, #so-printable-form * {
            visibility: visible;
          }
          #so-printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 2px solid black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

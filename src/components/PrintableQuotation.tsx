import React, { useState } from 'react';
import { 
  ChevronLeft, Mail, MessageCircle, FileText, Download, 
  Printer, CreditCard, Check, Copy, Sliders, ShieldCheck, 
  Building2, Eye, EyeOff, ClipboardList
} from 'lucide-react';
import { Quotation, Item, Settings, User } from '../types';
import { getSraGroupEntities, formatIDR } from '../utils/helpers';
import { PrintableSalesOrder } from './PrintableSalesOrder';

interface PrintableQuotationProps {
  quote: Quotation;
  items: Item[];
  onBack: () => void;
  settings: Settings;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
  initialFormat?: 'QUOTATION' | 'SALES_ORDER';
}

export function PrintableQuotation({ 
  quote, 
  items, 
  onBack, 
  settings, 
  showToast, 
  currentUser,
  initialFormat = 'QUOTATION'
}: PrintableQuotationProps) {
  const [docFormat, setDocFormat] = useState<'QUOTATION' | 'SALES_ORDER'>(initialFormat);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [watermark, setWatermark] = useState<'NONE' | 'OFFICIAL' | 'DRAFT' | 'APPROVED' | 'CONFIDENTIAL'>('OFFICIAL');
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showNpwp, setShowNpwp] = useState(true);
  const [copiedWa, setCopiedWa] = useState(false);

  if (!quote) return null;

  if (docFormat === 'SALES_ORDER') {
    return (
      <div className="space-y-4">
        {/* Top Format Selector Switcher */}
        <div className="flex justify-center no-print">
          <div className="inline-flex p-1.5 bg-slate-200/90 rounded-2xl border border-slate-300 shadow-inner gap-1">
            <button
              onClick={() => setDocFormat('QUOTATION')}
              className="px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>📄 Format Quotation Resmi</span>
            </button>
            <button
              onClick={() => setDocFormat('SALES_ORDER')}
              className="px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 bg-amber-400 text-amber-950 shadow-sm"
            >
              <ClipboardList className="w-4 h-4 text-amber-900" />
              <span>📋 Format Sales Order (SO - NCR)</span>
            </button>
          </div>
        </div>

        <PrintableSalesOrder
          quote={quote}
          items={items}
          onBack={onBack}
          settings={settings}
          showToast={showToast}
          currentUser={currentUser}
        />
      </div>
    );
  }
  
  const entities = getSraGroupEntities(settings);
  const issuerName = quote.issuingCompany || Object.keys(entities)[0] || 'PT Sumber Roso Agromakmur';
  const entityInfo = entities[issuerName] || entities['PT Sumber Roso Agromakmur'] || Object.values(entities)[0] || {
    companyName: 'PT Sumber Roso Agromakmur',
    companyNpwp: '01.234.567.8-123.000',
    companyAddress: 'Jl. Raya Bekasi Timur No. 136, Jakarta 13410',
    companyPhone: '+62 21 819 1908',
    companyEmail: 'info@sra-group.com',
    bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4967 959 595\nAtas Nama: PT Sumber Roso Agromakmur',
    themeColor: '#0ea5e9'
  };

  const formatDate = (dateString?: string) => 
    dateString 
      ? new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '-';

  const themeColor = entityInfo?.themeColor || settings?.themeColor || '#059669'; 
  const safeQuoteItems = Array.isArray(quote?.items) ? quote.items : [];
  const hasItemDiscount = safeQuoteItems.some(item => item && item.itemDiscount > 0);

  const waText = `Halo tim *${quote.customerName}*${quote.storeName ? ` (${quote.storeName})` : ''},\n\nBerikut ringkasan penawaran resmi dari *${entityInfo.companyName} (SRA Group)*:\n*No Quotation:* ${quote.id}\n*Tanggal:* ${formatDate(quote.date)}\n*Up / Kontak:* ${quote.attnName || '-'}\n*Grand Total:* ${formatIDR(quote.total)}\n*Termin:* ${quote.paymentTerm || 'Net 14 Hari'}\n\nDokumen penawaran resmi dapat kami lampirkan dalam format PDF.\n\nTerima kasih,\n*${currentUser?.name || 'Tim Penjualan SRA Group'}*`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(waText);
    setCopiedWa(true);
    showToast("Teks pesan WhatsApp berhasil disalin!");
    setTimeout(() => setCopiedWa(false), 2000);
  };
  
  const buildExportHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #000; padding: 20px;">
        <table width="100%" style="border-bottom: 2px solid ${themeColor}; margin-bottom: 20px; padding-bottom: 15px;">
          <tr>
            <td valign="top" width="60%">
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" height="55"/><br/><br/>` : `<h2 style="color:${themeColor}; margin:0;">${entityInfo.companyName}</h2><br/>`}
              <table style="font-size: 10pt; color: #000; border-collapse: collapse;">
                <tr><td width="70" style="padding: 2px 0;">Tanggal</td><td width="15" style="padding: 2px 0;">:</td><td style="padding: 2px 0;">${formatDate(quote.date)}</td></tr>
                <tr><td style="padding: 2px 0;">Kepada</td><td style="padding: 2px 0;">:</td><td style="padding: 2px 0;"><b>${quote.customerName || '-'}</b></td></tr>
                ${quote.storeName ? `<tr><td style="padding: 2px 0;">Toko / Outlet</td><td style="padding: 2px 0;">:</td><td style="padding: 2px 0;"><b>${quote.storeName}</b></td></tr>` : ''}
                ${showNpwp && quote.customerNpwp ? `<tr><td style="padding: 2px 0;">NPWP</td><td style="padding: 2px 0;">:</td><td style="padding: 2px 0;">${quote.customerNpwp}</td></tr>` : ''}
                <tr><td style="padding: 2px 0;">Perihal</td><td style="padding: 2px 0;">:</td><td style="padding: 2px 0;">Penawaran Harga ${quote.id ? `No. ${quote.id}` : ''}</td></tr>
                <tr><td style="padding: 2px 0;">Up</td><td style="padding: 2px 0;">:</td><td style="padding: 2px 0;">${quote.attnName || '-'}</td></tr>
              </table>
            </td>
            <td align="right" valign="top" width="40%" style="font-size: 10pt; font-weight: bold; padding-top: 10px;">
              Jakarta, ${formatDate(quote.date)}<br/>
              <span style="font-size:9pt; font-weight:normal; color:#555;">${entityInfo.companyAddress || ''}</span>
            </td>
          </tr>
        </table>

        <table width="100%" border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; margin-bottom: 20px; font-size: 10pt;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th width="5%">No</th>
              <th width="40%">Deskripsi Barang</th>
              <th width="10%">Qty</th>
              <th width="15%">Harga Satuan</th>
              ${hasItemDiscount ? '<th width="15%">Diskon</th>' : ''}
              <th width="15%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${safeQuoteItems.map((qi, idx) => {
              const itemInfo = (items || []).find(i => i?.id === qi?.itemId);
              let discountDisplay = '-';
              if (qi?.itemDiscount && qi.itemDiscount > 0) discountDisplay = qi.itemDiscountType === 'percentage' ? `${qi.itemDiscount}%` : formatIDR(qi.itemDiscount);
              return `
                <tr>
                  <td align="center">${idx + 1}</td>
                  <td><b>${itemInfo?.name || 'Item'}</b><br/><small style="font-size: 9pt; color: #555;">${itemInfo?.sku || ''}</small></td>
                  <td align="center">${qi?.qty || 0} ${itemInfo?.unit || ''}</td>
                  <td align="right">${formatIDR(Number(qi?.unitPrice) || 0)}</td>
                  ${hasItemDiscount ? `<td align="right">${discountDisplay}</td>` : ''}
                  <td align="right">${formatIDR(Number(qi?.subtotal) || 0)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table width="100%" style="font-size: 10pt;">
          <tr>
            <td width="60%" valign="top">
              ${showNotes && quote.notes ? `<b>Syarat & Ketentuan:</b><br/>${String(quote.notes).replace(/\n/g, '<br/>')}<br/><br/>` : ''}
              ${showBankDetails && entityInfo?.bankDetails ? `<b>Informasi Rekening Pembayaran:</b><br/>${String(entityInfo.bankDetails).replace(/\n/g, '<br/>')}` : ''}
            </td>
            <td width="40%" align="right" valign="top">
              <table width="100%" cellspacing="0" cellpadding="4" style="font-size: 10pt;">
                <tr><td>Subtotal:</td><td align="right">${formatIDR(Number(quote.subtotal || quote.total) || 0)}</td></tr>
                ${quote.discountValue > 0 ? `<tr><td>Diskon Tambahan:</td><td align="right">-${formatIDR(Number(quote.discountValue) || 0)}</td></tr>` : ''}
                ${quote.taxRate > 0 ? `<tr><td>PPN (${quote.taxRate}%):</td><td align="right">${formatIDR(Number(quote.taxValue) || 0)}</td></tr>` : ''}
                <tr style="font-size: 11pt; border-top: 1px solid #333;"><td><b>GRAND TOTAL:</b></td><td align="right"><b>${formatIDR(Number(quote.total) || 0)}</b></td></tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${showSignature ? `
        <table width="100%" style="font-size: 10pt; margin-top: 30px;">
           <tr>
             <td width="100%" valign="top" style="text-align: left;">
               Hormat Kami,<br/><br/><br/><br/>
               <b>${currentUser?.name || 'Manajer Penjualan'}</b><br/>
               ${entityInfo.companyName}
             </td>
           </tr>
        </table>
        ` : ''}
      </div>
    `;
  };

  const handleExportWord = () => {
    const htmlContent = buildExportHTML();
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Quotation_${quote.id}</title></head><body>${htmlContent}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quotation_${quote.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download dokumen Word berhasil dimulai");
  };

  const handleExportExcel = () => {
    const htmlContent = buildExportHTML();
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>${htmlContent}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quotation_${quote.id}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download file Excel berhasil dimulai");
  };

  const handleSendEmail = async () => {
    if (!quote.customerEmail) return showToast("Klien ini belum memiliki email!", "error");
    setIsSendingEmail(true);
    try {
      if (settings.apiUrl) {
        const response = await fetch(settings.apiUrl, {
          method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "sendQuotationEmail", quotation: quote, companySettings: entityInfo })
        });
        const result = await response.json();
        if (result.status === 'success') showToast("Email penawaran berhasil dikirim ke " + quote.customerEmail); 
        else showToast("Gagal mengirim email: " + result.message, "error");
      } else {
        setTimeout(() => { 
          showToast(`Simulasi: Email penawaran resmi terkirim ke ${quote.customerEmail}!`); 
          setIsSendingEmail(false); 
        }, 1000);
        return;
      }
      setIsSendingEmail(false);
    } catch (err) { 
      showToast("Terjadi kesalahan jaringan.", "error"); 
      setIsSendingEmail(false); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-16 font-sans">
      {/* Document Format Selector Switcher */}
      <div className="flex justify-center no-print">
        <div className="inline-flex p-1.5 bg-slate-200/90 rounded-2xl border border-slate-300 shadow-inner gap-1">
          <button
            onClick={() => setDocFormat('QUOTATION')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              docFormat === 'QUOTATION'
                ? 'clay-button-primary text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📄 Format Quotation Resmi</span>
          </button>
          <button
            onClick={() => setDocFormat('SALES_ORDER')}
            className="px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <ClipboardList className="w-4 h-4 text-amber-800" />
            <span>📋 Format Sales Order (SO - NCR)</span>
          </button>
        </div>
      </div>

      {/* Top Action & Control Bar */}
      <div className="flex flex-col gap-4 no-print bg-[#e8f0f8] border border-slate-300/80 p-4 md:p-5 rounded-3xl shadow-lg sticky top-3 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <button 
            onClick={onBack} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 clay-button-secondary text-slate-800 font-black text-xs transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar
          </button>

          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleCopyWhatsApp} 
              className="flex items-center gap-1.5 px-3 py-2.5 clay-button-secondary text-slate-800 font-bold text-xs"
              title="Salin pesan WA"
            >
              {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWa ? 'Tersalin!' : 'Salin WA'}
            </button>

            <button 
              onClick={handleShareWhatsApp} 
              className="flex items-center gap-1.5 px-3.5 py-2.5 clay-button-secondary text-emerald-800 font-black text-xs hover:bg-emerald-50"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" /> Kirim WA
            </button>

            <button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail} 
              className="flex items-center gap-1.5 px-3.5 py-2.5 clay-button-secondary text-blue-800 font-black text-xs hover:bg-blue-50 disabled:opacity-50"
            >
              <Mail className="w-4 h-4 text-blue-600" /> {isSendingEmail ? 'Mengirim...' : 'Email'}
            </button>

            <button 
              onClick={handleExportWord} 
              className="flex items-center gap-1.5 px-3 py-2.5 clay-button-secondary text-indigo-800 font-bold text-xs"
              title="Download format Word"
            >
              <FileText className="w-3.5 h-3.5" /> Word
            </button>

            <button 
              onClick={handleExportExcel} 
              className="flex items-center gap-1.5 px-3 py-2.5 clay-button-secondary text-teal-800 font-bold text-xs"
              title="Download format Excel"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>

            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-5 py-2.5 clay-button-primary text-white font-black text-xs shadow-md"
            >
              <Printer className="w-4 h-4" /> Cetak PDF Resmi
            </button>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-300/70 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-extrabold text-slate-700">Watermark:</span>
              <select 
                value={watermark} 
                onChange={e => setWatermark(e.target.value as any)}
                className="p-1.5 clay-input font-bold text-xs"
              >
                <option value="OFFICIAL">Official / Asli</option>
                <option value="DRAFT">Draft Estimasi</option>
                <option value="APPROVED">Approved / Won</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="NONE">Tanpa Watermark</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNpwp(!showNpwp)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  showNpwp ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-200 text-slate-500 line-through'
                }`}
              >
                NPWP Klien
              </button>

              <button 
                onClick={() => setShowBankDetails(!showBankDetails)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  showBankDetails ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-200 text-slate-500 line-through'
                }`}
              >
                Rekening Bank
              </button>

              <button 
                onClick={() => setShowNotes(!showNotes)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  showNotes ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-200 text-slate-500 line-through'
                }`}
              >
                Syarat & Ketentuan
              </button>

              <button 
                onClick={() => setShowSignature(!showSignature)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  showSignature ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-200 text-slate-500 line-through'
                }`}
              >
                Tanda Tangan
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 font-bold">
            Entitas: <strong className="text-slate-900">{issuerName}</strong>
          </div>
        </div>
      </div>

      {/* WHITE PAPER FOR PRINTING */}
      <div 
        className="bg-white p-10 md:p-14 text-slate-900 relative min-h-[1056px] flex flex-col justify-between shadow-2xl rounded-2xl mx-auto text-[10pt] border border-slate-200 overflow-hidden" 
        style={{ backgroundColor: '#ffffff !important', fontSize: '10pt' }}
      >
        <style>{`
          @media print { 
            html, body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 10pt !important; } 
            .no-print, nav, header, aside, .sticky { display: none !important; } 
            @page { margin: 1.2cm; size: A4 portrait; } 
            .page-break { page-break-after: always; break-after: page; }
            tr, td, th { page-break-inside: avoid; break-inside: avoid; }
          }
        `}</style>

        {/* Watermark Overlay */}
        {watermark !== 'NONE' && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ opacity: 0.045, transform: 'rotate(-30deg)' }}
          >
            <span className="text-[110pt] font-black uppercase tracking-widest text-slate-900 border-8 border-slate-900 px-12 py-4 rounded-3xl">
              {watermark}
            </span>
          </div>
        )}

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: themeColor }}>
            <div className="space-y-4">
              <div className="flex items-center min-h-[64px]">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo Perusahaan" className="h-16 w-auto object-contain" />
                ) : (
                  <div>
                    <h2 className="text-xl font-black tracking-tight" style={{ color: themeColor }}>
                      {entityInfo.companyName}
                    </h2>
                    <p className="text-[9pt] font-extrabold text-slate-500 tracking-wider uppercase">SRA Group</p>
                  </div>
                )}
              </div>

              <table className="text-[10pt] text-slate-800">
                <tbody>
                  <tr>
                    <td className="pr-3 py-0.5 font-semibold text-slate-600 w-20">Tanggal</td>
                    <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                    <td className="py-0.5 text-slate-900 font-bold">{formatDate(quote.date)}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 py-0.5 font-semibold text-slate-600">Kepada</td>
                    <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                    <td className="py-0.5 text-slate-900 font-extrabold">{quote.customerName || '-'}</td>
                  </tr>
                  {quote.storeName && (
                    <tr>
                      <td className="pr-3 py-0.5 font-semibold text-slate-600">Toko / Outlet</td>
                      <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                      <td className="py-0.5 text-slate-900 font-bold">{quote.storeName}</td>
                    </tr>
                  )}
                  {showNpwp && quote.customerNpwp && (
                    <tr>
                      <td className="pr-3 py-0.5 font-semibold text-slate-600">NPWP</td>
                      <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                      <td className="py-0.5 text-slate-900 font-medium">{quote.customerNpwp}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="pr-3 py-0.5 font-semibold text-slate-600">Perihal</td>
                    <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                    <td className="py-0.5 text-slate-900 font-semibold">
                      Penawaran Harga Resmi {quote.id ? `No. ${quote.id}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="pr-3 py-0.5 font-semibold text-slate-600">Up / Kontak</td>
                    <td className="pr-2 py-0.5 font-semibold text-slate-600">:</td>
                    <td className="py-0.5 text-slate-900 font-semibold">{quote.attnName || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-right pt-2 text-[10pt] font-semibold text-slate-800 max-w-[280px]">
              <div className="font-bold text-slate-900 mb-1">Jakarta, {formatDate(quote.date)}</div>
              <div className="text-[9pt] font-normal text-slate-600 leading-tight">
                {entityInfo.companyAddress || 'Gedung SRA Group, Jakarta, Indonesia'}
              </div>
              {entityInfo.companyPhone && (
                <div className="text-[8.5pt] text-slate-500 mt-1">
                  Tel: {entityInfo.companyPhone}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left mb-8 border-collapse text-[10pt]">
            <thead>
              <tr className="text-white text-[10pt]" style={{ backgroundColor: themeColor }}>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider w-12 text-center">No</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Deskripsi Barang</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-center w-20">Qty</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-28">Harga</th>
                {hasItemDiscount && <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-24">Diskon</th>}
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[10pt]">
              {safeQuoteItems.map((qi, idx) => {
                const itemInfo = (items || []).find(i => i?.id === qi?.itemId);
                let discountDisplay = '-';
                if (qi?.itemDiscount && qi.itemDiscount > 0) {
                  discountDisplay = qi.itemDiscountType === 'percentage' 
                    ? `${qi.itemDiscount}%` 
                    : formatIDR(qi.itemDiscount);
                }
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{itemInfo?.name || 'Item Terhapus'}</p>
                      <p className="text-[8.5pt] text-slate-500 font-mono mt-0.5">{itemInfo?.sku || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                      {qi?.qty || 0} <span className="text-[8.5pt] text-slate-500 ml-0.5">{itemInfo?.unit || 'Pcs'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 font-semibold">{formatIDR(Number(qi?.unitPrice) || 0)}</td>
                    {hasItemDiscount && (
                      <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-semibold">
                        {discountDisplay !== '-' ? `-${discountDisplay}` : '-'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-slate-900">{formatIDR(Number(qi?.subtotal) || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Terms, Payment Info & Totals Breakdown */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-8 text-[10pt]">
            <div className="w-full md:w-3/5 space-y-4">
              {showNotes && quote.notes && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 text-[9.5pt] uppercase tracking-wider">
                    Syarat & Ketentuan:
                  </h4>
                  <p className="text-slate-600 text-[9.5pt] whitespace-pre-wrap leading-relaxed">
                    {quote.notes}
                  </p>
                </div>
              )}

              {showBankDetails && entityInfo.bankDetails && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 text-[9.5pt] uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500"/> Informasi Rekening Pembayaran:
                  </h4>
                  <p className="text-slate-600 text-[9.5pt] whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
                    {entityInfo.bankDetails}
                  </p>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-72 shrink-0 bg-slate-50 p-4 border border-slate-300 rounded-xl">
              <table className="w-full text-right text-[10pt]">
                <tbody>
                  <tr>
                    <td className="py-1.5 text-slate-600">Subtotal:</td>
                    <td className="py-1.5 font-bold text-slate-900 pl-4 tabular-nums">{formatIDR(quote.subtotal || quote.total)}</td>
                  </tr>
                  {quote.discountValue > 0 && (
                    <tr>
                      <td className="py-1.5 text-slate-600">Diskon Tambahan:</td>
                      <td className="py-1.5 font-bold text-rose-600 pl-4 tabular-nums">-{formatIDR(quote.discountValue)}</td>
                    </tr>
                  )}
                  {quote.taxRate > 0 && (
                    <tr>
                      <td className="py-1.5 text-slate-600">PPN ({quote.taxRate}%):</td>
                      <td className="py-1.5 font-bold text-slate-900 pl-4 tabular-nums">{formatIDR(quote.taxValue)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-400 text-[11pt]">
                    <td className="py-2.5 font-black text-slate-900">GRAND TOTAL:</td>
                    <td className="py-2.5 font-black pl-4 tabular-nums" style={{ color: themeColor }}>
                      {formatIDR(quote.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Block */}
          {showSignature && (
            <div className="mt-8 pt-4 text-[10pt] border-t border-slate-200">
              <div className="text-center flex flex-col items-center min-w-[200px] w-fit">
                <p className="text-slate-600 mb-2 font-semibold">Hormat Kami,</p>
                {settings.signatureUrl ? (
                  <img 
                    src={settings.signatureUrl} 
                    alt="Tanda Tangan" 
                    className="h-16 w-auto object-contain mb-2 mix-blend-multiply" 
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <div className="h-16 mb-2"></div>
                )}
                <div className="border-t border-slate-400 w-full text-center pt-1.5">
                  <p className="font-extrabold text-slate-900">{currentUser?.name || 'Manajer Penjualan'}</p>
                  <p className="text-slate-500 text-[9pt] uppercase tracking-wider font-semibold">{entityInfo.companyName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden print:block text-center text-[8.5pt] text-slate-400 fixed bottom-2 left-0 right-0">
          SRA Quotify Enterprise • Dicetak pada {formatDate(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}

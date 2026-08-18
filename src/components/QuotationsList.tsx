import React, { useState, useMemo } from 'react';
import { 
  Plus, CheckCircle, Clock, TrendingUp, Search, FileText, 
  AlertTriangle, Info, Printer, Edit, Copy, Trash2, Download, 
  MessageCircle, Building2, Filter, Eye, Layers, Calendar,
  ClipboardList, Bell, DollarSign, ArrowRightCircle, ShieldAlert,
  Check, Store, UserCheck, Users, ShieldCheck, Shield
} from 'lucide-react';
import { Quotation, User, Item } from '../types';
import { formatIDR, getDueReminderInfo, calculateDueDate } from '../utils/helpers';
import { exportQuotationsToExcel } from '../utils/excelHelpers';

interface QuotationsListProps {
  quotations: Quotation[];
  items?: Item[];
  users?: User[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  currentUser: User;
  onNew: () => void;
  onView: (quote: Quotation) => void;
  onViewSO?: (quote: Quotation) => void;
  onEdit: (quote: Quotation) => void;
  onDuplicate: (quote: Quotation) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  logActivity: (action: string, details: string) => void;
  syncToCloud: (action: string, payloadKey: string, payloadData: any) => void;
}

export function QuotationsList({ 
  quotations, 
  items = [], 
  users = [],
  setQuotations, 
  currentUser, 
  onNew, 
  onView, 
  onViewSO, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  showToast, 
  logActivity, 
  syncToCloud 
}: QuotationsListProps) {
  const [search, setSearch] = useState(''); 
  const [docTypeFilter, setDocTypeFilter] = useState<'ALL' | 'QUOTATION' | 'SALES_ORDER' | 'DUE_SOON'>('ALL');
  const [statusFilter, setStatusFilter] = useState('Semua'); 
  const [entityFilter, setEntityFilter] = useState('Semua');
  const [salesFilter, setSalesFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Quotation; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Extract comprehensive list of all registered sales users + anyone who created quotations
  const availableSalesReps = useMemo(() => {
    const map = new Map<string, { id: string; username: string; name: string; count: number }>();
    
    // 1. Populate all registered users who have role 'sales'
    (users || []).forEach(u => {
      if (u && u.role === 'sales') {
        const usernameKey = (u.username || '').trim().toLowerCase();
        if (usernameKey) {
          map.set(usernameKey, {
            id: u.id || usernameKey,
            username: u.username,
            name: u.name || u.username,
            count: 0
          });
        }
      }
    });

    // 2. Scan all quotations to count documents and include any sales not yet in map
    (quotations || []).forEach(q => {
      if (!q) return;
      const rawUser = (q.createdBy || '').trim();
      const rawKey = rawUser.toLowerCase();
      const rawName = (q.salesName || q.createdBy || 'Sales').trim();

      if (rawKey && map.has(rawKey)) {
        map.get(rawKey)!.count++;
        // Update display name if quote has explicit salesName and user map has generic name
        if (q.salesName && map.get(rawKey)!.name === map.get(rawKey)!.username) {
          map.get(rawKey)!.name = q.salesName;
        }
      } else if (rawKey) {
        // Also check if matches by name
        let matched = false;
        for (const entry of map.values()) {
          if (entry.name.toLowerCase() === rawName.toLowerCase() || entry.username.toLowerCase() === rawKey) {
            entry.count++;
            matched = true;
            break;
          }
        }
        if (!matched && rawUser !== 'admin') {
          map.set(rawKey, {
            id: rawKey,
            username: rawUser,
            name: rawName,
            count: 1
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, quotations]);

  // Calculate Due Date Reminders across all SOs
  const reminderStats = useMemo(() => {
    const safeList = Array.isArray(quotations) ? quotations : [];
    const activeSos = safeList.filter(q => q && (q.isSO === true || q.status === 'SO_Confirmed') && q.paymentStatus !== 'PAID');
    
    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueSoonCount = 0; // H-1 s/d H-3
    let totalUnpaidSoValue = 0;

    activeSos.forEach(so => {
      totalUnpaidSoValue += (so.total || 0);
      const reminder = getDueReminderInfo(so.dueDate, so.paymentStatus, so.paymentTerm);
      if (reminder.type === 'OVERDUE') overdueCount++;
      else if (reminder.type === 'DUE_TODAY') dueTodayCount++;
      else if (reminder.type === 'DUE_SOON') dueSoonCount++;
    });

    return {
      activeSoCount: activeSos.length,
      overdueCount,
      dueTodayCount,
      dueSoonCount,
      totalUrgent: overdueCount + dueTodayCount + dueSoonCount,
      totalUnpaidSoValue
    };
  }, [quotations]);

  // Get distinct list of entities
  const availableEntities = useMemo(() => {
    const set = new Set<string>();
    (quotations || []).forEach(q => {
      if (q && q.issuingCompany) set.add(q.issuingCompany);
    });
    return Array.from(set);
  }, [quotations]);

  const visibleQuotations = useMemo(() => {
    let filtered = Array.isArray(quotations) ? [...quotations] : [];
    
    if (!isManager) {
      filtered = filtered.filter(q => q && (q.createdBy === currentUser?.username || q.salesName === currentUser?.name));
    } else if (salesFilter !== 'Semua') {
      const targetRep = availableSalesReps.find(r => r.username === salesFilter || r.name === salesFilter || r.id === salesFilter);
      filtered = filtered.filter(q => {
        if (!q) return false;
        if (targetRep) {
          const qCreated = (q.createdBy || '').trim().toLowerCase();
          const qName = (q.salesName || '').trim().toLowerCase();
          const repUsername = (targetRep.username || '').trim().toLowerCase();
          const repName = (targetRep.name || '').trim().toLowerCase();
          return qCreated === repUsername || qCreated === repName || qName === repName || qName === repUsername;
        }
        return q.createdBy === salesFilter || q.salesName === salesFilter;
      });
    }

    // Document Type Filter
    if (docTypeFilter === 'QUOTATION') {
      filtered = filtered.filter(q => !q.isSO && q.status !== 'SO_Confirmed');
    } else if (docTypeFilter === 'SALES_ORDER') {
      filtered = filtered.filter(q => q.isSO || q.status === 'SO_Confirmed');
    } else if (docTypeFilter === 'DUE_SOON') {
      filtered = filtered.filter(q => {
        if (!q.isSO && q.status !== 'SO_Confirmed') return false;
        if (q.paymentStatus === 'PAID') return false;
        const reminder = getDueReminderInfo(q.dueDate, q.paymentStatus, q.paymentTerm);
        return reminder.isAlert;
      });
    }
    
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(q => q && q.status === statusFilter);
    }

    if (entityFilter !== 'Semua') {
      filtered = filtered.filter(q => q && q.issuingCompany === entityFilter);
    }

    if (dateFilter !== 'ALL') {
      const now = new Date();
      filtered = filtered.filter(q => {
        if (!q || !q.date) return true;
        const d = new Date(q.date);
        if (isNaN(d.getTime())) return true;
        if (dateFilter === 'THIS_MONTH') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'LAST_30') {
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 30;
        }
        return true;
      });
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(q => 
        q && (
          (q?.id || '').toLowerCase().includes(query) || 
          (q?.soNumber || '').toLowerCase().includes(query) || 
          (q?.customerName || '').toLowerCase().includes(query) ||
          (q?.storeName && q.storeName.toLowerCase().includes(query)) ||
          (q?.customerEmail && q.customerEmail.toLowerCase().includes(query)) ||
          (q?.attnName && q.attnName.toLowerCase().includes(query)) ||
          (q?.salesName && q.salesName.toLowerCase().includes(query)) ||
          (q?.createdBy && q.createdBy.toLowerCase().includes(query))
        )
      );
    }

    filtered.sort((a, b) => {
      const valA = a?.[sortConfig.key] ?? '';
      const valB = b?.[sortConfig.key] ?? '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [quotations, currentUser, isManager, docTypeFilter, statusFilter, entityFilter, dateFilter, search, sortConfig]);

  const handleSort = (key: keyof Quotation) => {
    setSortConfig({ 
      key, 
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
    });
  };
  
  const getStatusStyle = (s: string) => { 
    if (s === 'Draft') return 'bg-[#f0f4f9] text-slate-700 border-slate-300 shadow-xs'; 
    if (s === 'Sent') return 'bg-blue-50 text-blue-800 border-blue-300 shadow-xs'; 
    if (s === 'Accepted' || s === 'SO_Confirmed') return 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'; 
    return 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'; 
  };
  
  const checkExpired = (validUntil?: string, status?: string) => { 
    if (!validUntil || status === 'Accepted' || status === 'SO_Confirmed' || status === 'Rejected') return false; 
    const today = new Date(); 
    today.setHours(0,0,0,0); 
    return new Date(validUntil) < today; 
  };

  const handleExportExcel = () => {
    exportQuotationsToExcel(visibleQuotations, items);
    showToast("Laporan Excel berhasil diunduh");
    logActivity('EXPORT_QUOTATIONS_EXCEL', `Unduh ${visibleQuotations.length} penawaran ke Excel`);
  };

  // 1-Click Toggle Payment Status for Sales Order (Lunas / Belum Lunas)
  const handleTogglePaymentStatus = (quote: Quotation) => {
    const isCurrentlyPaid = quote.paymentStatus === 'PAID';
    const nextStatus = isCurrentlyPaid ? 'UNPAID' : 'PAID';
    const updatedQuote: Quotation = {
      ...quote,
      paymentStatus: nextStatus,
      paidAt: nextStatus === 'PAID' ? new Date().toISOString() : undefined
    };

    setQuotations(quotations.map(q => q.id === quote.id ? updatedQuote : q));
    showToast(`Status pembayaran SO #${quote.soNumber || quote.id} diubah menjadi: ${nextStatus === 'PAID' ? 'LUNAS (Plafon Kredit Kembali)' : 'BELUM LUNAS'}`);
    logActivity('UPDATE_PAYMENT_STATUS', `Ubah status bayar #${quote.id} -> ${nextStatus}`);
    syncToCloud('saveQuotation', 'quotation', updatedQuote);
  };

  // 1-Click Convert Quotation to Sales Order (SO)
  const handleConvertToSO = (quote: Quotation) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const calculatedDue = calculateDueDate(todayStr, quote.paymentTerm || 'Net 14 Hari');
    const soNum = `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedQuote: Quotation = {
      ...quote,
      isSO: true,
      soNumber: quote.soNumber || soNum,
      orderDate: todayStr,
      soDate: todayStr,
      dueDate: calculatedDue,
      paymentStatus: quote.paymentStatus || 'UNPAID',
      status: 'SO_Confirmed'
    };

    setQuotations(quotations.map(q => q.id === quote.id ? updatedQuote : q));
    showToast(`Penawaran #${quote.id} resmi dikonfirmasi menjadi Sales Order #${updatedQuote.soNumber}!`);
    logActivity('CONVERT_TO_SO', `Konfirmasi Quotation #${quote.id} jadi Sales Order #${updatedQuote.soNumber}`);
    syncToCloud('saveQuotation', 'quotation', updatedQuote);
  };

  // Manager 1-Click Approval for Overlimit SO
  const handleManagerApproveOverlimit = (quote: Quotation) => {
    const updatedQuote: Quotation = {
      ...quote,
      isApprovedByManager: true,
      managerApprovedBy: currentUser.name || currentUser.username,
      managerApprovalNotes: `Disetujui langsung oleh Manager (${currentUser.name}) pada ${new Date().toLocaleDateString('id-ID')}`
    };
    setQuotations(quotations.map(q => q.id === quote.id ? updatedQuote : q));
    showToast(`Otorisasi persetujuan Sales Order #${quote.soNumber || quote.id} berhasil disahkan oleh Manager.`);
    logActivity('MANAGER_APPROVE_OVERLIMIT', `Manager setujui overlimit SO #${quote.soNumber || quote.id}`);
    syncToCloud('saveQuotation', 'quotation', updatedQuote);
  };

  const handleShareWhatsApp = (q: Quotation) => {
    if (q.isSO || q.status === 'SO_Confirmed') {
      const isPaid = q.paymentStatus === 'PAID';
      const text = isPaid 
        ? `Halo tim *${q.customerName}*${q.storeName ? ` (${q.storeName})` : ''},\n\nTerima kasih, pembayaran untuk *Sales Order #${q.soNumber || q.id}* sebesar *${formatIDR(q.total)}* telah kami terima dan berstatus *LUNAS*.\n\nSalam,\n*${q.issuingCompany || 'SRA Group'}*`
        : `*PENGINGAT TAGIHAN / JATUH TEMPO*\n\nHalo tim *${q.customerName}*${q.storeName ? ` (${q.storeName})` : ''},\n\nBerikut pengingat pesanan resmi dari *${q.issuingCompany || 'SRA Group'}*:\n*No. Sales Order:* ${q.soNumber || q.id}\n*Tgl Order:* ${q.date || '-'}\n*Nilai Tagihan:* ${formatIDR(q.total)}\n*Termin:* ${q.paymentTerm || 'Net 14 Hari'}\n*Tgl Jatuh Tempo:* ${q.dueDate || '-'}\n\nMohon konfirmasi kesiapan pembayaran sebelum tanggal jatuh tempo ke rekening resmi *${q.issuingCompany}*.\n\nTerima kasih atas kerja samanya.`;
      
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      logActivity('SHARE_WA_SO', `Kirim pengingat SO #${q.soNumber || q.id} via WhatsApp`);
    } else {
      const text = `Halo tim *${q.customerName}*${q.storeName ? ` (${q.storeName})` : ''},\n\nBerikut ringkasan penawaran resmi dari *${q.issuingCompany}*:\n*No Quotation:* ${q.id}\n*Tanggal:* ${q.date}\n*Grand Total:* ${formatIDR(q.total)}\n*Termin Bayar:* ${q.paymentTerm || 'Net 14 Hari'}\n\nDokumen penawaran lengkap dapat kami kirimkan via PDF.\n\nTerima kasih,\n*SRA Group*`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      logActivity('SHARE_WA_QUO', `Kirim info WA Quotation #${q.id}`);
    }
  };

  // Status totals
  const safeQuoteList = Array.isArray(quotations) ? quotations : [];
  const totalAcceptedValue = safeQuoteList.filter(q => q?.status === 'Accepted' || q?.status === 'SO_Confirmed').reduce((sum, q) => sum + (q?.total || 0), 0);
  const totalPipelineValue = safeQuoteList.filter(q => q?.status === 'Draft' || q?.status === 'Sent').reduce((sum, q) => sum + (q?.total || 0), 0);
  const winRatePercent = safeQuoteList.length > 0 ? Math.round((safeQuoteList.filter(q => q?.status === 'Accepted' || q?.status === 'SO_Confirmed').length / safeQuoteList.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-10 font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daftar Penawaran & Sales Order (SO)</span>
          </h2>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">
            Pantau status penawaran, validasi Sales Order, peringatan jatuh tempo (H-3), dan kelola limit transaksi customer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 px-4 py-2.5 clay-button-secondary text-slate-800 font-extrabold text-xs sm:text-sm"
          >
            <Download className="w-4 h-4 text-emerald-700" /> Export Excel
          </button>
          <button 
            onClick={onNew} 
            className="flex items-center gap-2 px-6 py-2.5 clay-button-primary text-white font-extrabold text-xs sm:text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Buat Dokumen Baru
          </button>
        </div>
      </div>

      {/* ALERT BANNER: PENGINGAT JATUH TEMPO (H-3 & OVERDUE) */}
      {reminderStats.totalUrgent > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-900 text-[10px] font-black uppercase tracking-wider">
                  🚨 Pengingat Jatuh Tempo (H-3)
                </span>
                <span className="text-xs font-bold text-white/90">
                  Total Piutang Berjalan: <strong>{formatIDR(reminderStats.totalUnpaidSoValue)}</strong>
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Ada {reminderStats.totalUrgent} Sales Order Membutuhkan Perhatian Tagihan Segera!
              </h3>
              <p className="text-xs text-white/90 font-medium">
                {reminderStats.overdueCount > 0 && `• ${reminderStats.overdueCount} Lewat Tempo `}
                {reminderStats.dueTodayCount > 0 && `• ${reminderStats.dueTodayCount} Jatuh Tempo Hari Ini `}
                {reminderStats.dueSoonCount > 0 && `• ${reminderStats.dueSoonCount} Segera Jatuh Tempo (≤ 3 Hari)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => { setDocTypeFilter('DUE_SOON'); setStatusFilter('Semua'); }}
              className="w-full md:w-auto px-4 py-2.5 bg-white text-rose-950 hover:bg-slate-100 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Tampilkan SO Jatuh Tempo Segera
            </button>
          </div>
        </div>
      )}

      {/* MANAGER CONTROL & AUDIT BANNER */}
      {isManager && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 font-black shadow-sm">
              <ShieldCheck className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                  👑 Akses Supervisi Manager Aktif
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Monitoring & Kontrol Seluruh Penawaran / SO Sales
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Anda melihat seluruh data transaksi dari <strong>{availableSalesReps.length} Anggota Tim Sales</strong>. Seluruh penawaran, SO, riwayat limit, & approval tersinkronisasi otomatis.
              </p>
            </div>
          </div>

          {availableSalesReps.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/60 w-full md:w-auto">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">Filter Sales:</span>
              <select
                value={salesFilter}
                onChange={e => setSalesFilter(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer hover:border-amber-400 transition-colors"
              >
                <option value="Semua">Semua Tim Sales ({quotations.length} Dokumen)</option>
                {availableSalesReps.map(rep => (
                  <option key={rep.username} value={rep.username}>
                    {rep.name !== rep.username ? `${rep.name} (@${rep.username})` : rep.name} • {rep.count} Dok
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Highlights */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="clay-card clay-card-hover p-5 flex items-center gap-4">
            <div className="w-13 h-13 bg-emerald-100/80 border border-emerald-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Total Won & Sales Order</p>
              <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">{formatIDR(totalAcceptedValue)}</p>
              <p className="text-[10px] text-slate-500 font-bold">{safeQuoteList.filter(q => q && (q.status === 'Accepted' || q.status === 'SO_Confirmed')).length} Dokumen Terkonfirmasi</p>
            </div>
          </div>

          <div className="clay-card clay-card-hover p-5 flex items-center gap-4">
            <div className="w-13 h-13 bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Potensi Pipeline (Draft/Sent)</p>
              <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">{formatIDR(totalPipelineValue)}</p>
              <p className="text-[10px] text-slate-500 font-bold">{safeQuoteList.filter(q => q && (q.status === 'Draft' || q.status === 'Sent')).length} Dokumen Berjalan</p>
            </div>
          </div>

          <div className="clay-card clay-card-hover p-5 flex items-center gap-4">
            <div className="w-13 h-13 bg-indigo-100/80 border border-indigo-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">Win Rate Rasio</p>
              <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">{winRatePercent}%</p>
              <p className="text-[10px] text-slate-500 font-bold">{safeQuoteList.length} Total Penawaran Diterbitkan</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Area */}
      <div className="clay-card p-4 space-y-4">
        {/* Document Type Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDocTypeFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                docTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Semua Dokumen ({safeQuoteList.length})
            </button>

            <button
              onClick={() => setDocTypeFilter('QUOTATION')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                docTypeFilter === 'QUOTATION'
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Penawaran Harga ({safeQuoteList.filter(q => !q.isSO && q.status !== 'SO_Confirmed').length})
            </button>

            <button
              onClick={() => setDocTypeFilter('SALES_ORDER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                docTypeFilter === 'SALES_ORDER'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-800" />
              Sales Order (SO) ({safeQuoteList.filter(q => q.isSO || q.status === 'SO_Confirmed').length})
            </button>

            <button
              onClick={() => setDocTypeFilter('DUE_SOON')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                docTypeFilter === 'DUE_SOON'
                  ? 'bg-rose-600 text-white font-black shadow-xs'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-rose-600" />
              ⚠️ Reminder Jatuh Tempo ({reminderStats.totalUrgent})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input 
              type="text" 
              placeholder="Cari No SO, Klien, Toko, Email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-3.5 py-2.5 text-xs clay-input font-semibold"
            />
          </div>
        </div>

        {/* Secondary Filter Bar: Status, Entity & Date */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-600">Status:</span>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="p-1.5 clay-input font-bold text-xs"
              >
                <option value="Semua">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="SO_Confirmed">SO Confirmed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-bold text-slate-600">PT:</span>
              <select 
                value={entityFilter} 
                onChange={e => setEntityFilter(e.target.value)}
                className="p-1.5 clay-input font-bold text-xs"
              >
                <option value="Semua">Semua PT Penerbit</option>
                {availableEntities.map(ent => (
                  <option key={ent} value={ent}>{ent}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              <span className="font-bold text-slate-600">Rentang:</span>
              <select 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value as any)}
                className="p-1.5 clay-input font-bold text-xs"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="LAST_30">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          <div className="text-slate-500 font-bold text-xs">
            Menampilkan <span className="text-slate-900 font-extrabold">{visibleQuotations.length}</span> dari {quotations.length} dokumen
          </div>
        </div>
      </div>

      {/* Main Quotation / Sales Order Table */}
      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#e9eff6] text-[10px] font-black uppercase text-slate-600 tracking-wider rounded-xl border border-slate-200/60">
                <th className="p-4 cursor-pointer hover:text-slate-900 rounded-l-xl" onClick={() => handleSort('id')}>
                  Dokumen / No. SO {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4">PT Penerbit</th>
                <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('date')}>
                  Tanggal & Jatuh Tempo {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('customerName')}>
                  Pelanggan & Toko {sortConfig.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:text-slate-900 text-right" onClick={() => handleSort('total')}>
                  Grand Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center">Status / Bayar</th>
                <th className="p-4 text-center rounded-r-xl">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs font-semibold">
              {visibleQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-700" />
                    <p className="text-sm font-black text-slate-600">Tidak ada data dokumen yang sesuai.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau buat quotation / SO baru.</p>
                  </td>
                </tr>
              ) : (
                visibleQuotations.map(quote => {
                  const isSO = quote.isSO === true || quote.status === 'SO_Confirmed';
                  const isExpired = checkExpired(quote.validUntil, quote.status);
                  const itemCount = Array.isArray(quote.items) ? quote.items.length : 0;
                  const reminderInfo = isSO ? getDueReminderInfo(quote.dueDate, quote.paymentStatus, quote.paymentTerm) : null;

                  return (
                    <tr key={quote.id} className="hover:bg-white/90 transition-all group">
                      {/* Document Type & Number */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {isSO ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                              <ClipboardList className="w-3 h-3 text-amber-800" /> SO #{quote.soNumber || quote.id}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-600" /> QUOTATION
                            </span>
                          )}
                        </div>

                        <div className="font-black text-slate-900 text-sm mt-1">{quote.id}</div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[9px] font-extrabold" title={`Dibuat oleh Sales: ${quote.salesName || quote.createdBy}`}>
                            <UserCheck className="w-2.5 h-2.5 text-blue-700" />
                            {quote.salesName || quote.createdBy || 'Sales'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                            {itemCount} Produk
                          </span>
                        </div>
                      </td>

                      {/* Issuing PT */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 clay-badge bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider">
                          {quote.issuingCompany ? quote.issuingCompany.replace('PT ', '') : 'SRA'}
                        </span>
                      </td>

                      {/* Dates & Due Reminder */}
                      <td className="p-4 text-slate-600 font-medium">
                        <div className="font-bold text-slate-800">
                          {isSO ? `Order: ${quote.orderDate || quote.date}` : `Tgl: ${quote.date}`}
                        </div>

                        {isSO && (
                          <div className="mt-1 space-y-1">
                            <div className="text-[10px] text-slate-600 font-bold">
                              Tempo: {quote.paymentTerm || 'Net 14 Hari'}
                            </div>
                            {reminderInfo && (
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border ${reminderInfo.badgeBg} ${reminderInfo.badgeColor} ${reminderInfo.badgeBorder}`}>
                                {reminderInfo.badgeLabel}
                              </div>
                            )}
                          </div>
                        )}

                        {!isSO && quote.validUntil && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            s/d {quote.validUntil}
                          </div>
                        )}
                        {!isSO && isExpired && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-orange-600 font-extrabold mt-0.5 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            <AlertTriangle className="w-3 h-3"/> Expired
                          </span>
                        )}
                      </td>

                      {/* Customer & Store Details */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          {quote.customerName}
                          {quote.internalNotes && (
                            <span title={`Catatan Internal: ${quote.internalNotes}`}>
                              <Info className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                            </span>
                          )}
                        </div>
                        {quote.storeName && (
                          <div className="text-[11px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                            <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                            {quote.storeName}
                          </div>
                        )}
                        {quote.attnName && (
                          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            Up: {quote.attnName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {quote.customerEmail || '-'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-4 text-right tabular-nums font-black text-slate-900 text-sm">
                        {formatIDR(quote.total)}
                        {quote.discountValue > 0 && (
                          <div className="text-[9px] text-rose-600 font-bold">
                            Diskon: -{formatIDR(quote.discountValue)}
                          </div>
                        )}
                      </td>

                      {/* Status / Payment Toggle */}
                      <td className="p-4 text-center">
                        <div className="space-y-1.5">
                          <select 
                            value={quote.status} 
                            onChange={(e) => {
                              const newStatus = e.target.value; 
                              const nextQ: Quotation = { 
                                ...quote, 
                                status: newStatus,
                                isSO: newStatus === 'SO_Confirmed' ? true : quote.isSO
                              };
                              setQuotations(quotations.map(q => q.id === quote.id ? nextQ : q)); 
                              showToast(`Status #${quote.id} diubah -> ${newStatus}`); 
                              logActivity('UPDATE_STATUS', `Ubah status #${quote.id} -> ${newStatus}`); 
                              syncToCloud('saveQuotation', 'quotation', nextQ);
                            }} 
                            className={`px-3 py-1.5 clay-badge text-[10px] font-black border outline-none cursor-pointer appearance-none text-center w-full ${getStatusStyle(quote.status)}`} 
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="Draft" className="bg-white text-slate-800">Draft</option>
                            <option value="Sent" className="bg-white text-blue-800">Sent</option>
                            <option value="Accepted" className="bg-white text-emerald-800">Accepted</option>
                            <option value="SO_Confirmed" className="bg-white text-amber-900 font-bold">SO Confirmed</option>
                            <option value="Rejected" className="bg-white text-red-800">Rejected</option>
                          </select>

                          {/* If SO, show 1-click Payment Status Button */}
                          {isSO && (
                            <button
                              onClick={() => handleTogglePaymentStatus(quote)}
                              className={`w-full px-2 py-1 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 ${
                                quote.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                              }`}
                              title="Klik untuk mengubah status pembayaran (Lunas membebaskan limit kredit)"
                            >
                              <DollarSign className="w-3 h-3" />
                              {quote.paymentStatus === 'PAID' ? 'LUNAS (Klik Belum)' : 'BELUM LUNAS (Klik Lunas)'}
                            </button>
                          )}

                          {/* Manager Overlimit Approval Indicator & Action */}
                          {isSO && quote.isApprovedByManager === false && (
                            <div className="pt-1">
                              {isManager ? (
                                <button
                                  onClick={() => handleManagerApproveOverlimit(quote)}
                                  className="w-full px-2 py-1 rounded-lg bg-amber-400 text-amber-950 border border-amber-500 font-black text-[9px] hover:bg-amber-300 transition-all flex items-center justify-center gap-1 shadow-xs"
                                  title="Otorisasi dan sahkan Sales Order yang melebihi limit kredit"
                                >
                                  <ShieldCheck className="w-3 h-3 text-amber-950" /> Setujui Overlimit
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                                  <ShieldAlert className="w-2.5 h-2.5 text-amber-700" /> Butuh Acc Manager
                                </span>
                              )}
                            </div>
                          )}

                          {isSO && quote.isApprovedByManager === true && quote.managerApprovedBy && (
                            <div className="text-[9px] text-emerald-800 font-bold flex items-center justify-center gap-0.5" title={quote.managerApprovalNotes || 'Disetujui Manager'}>
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Acc: {quote.managerApprovedBy}
                            </div>
                          )}

                          {/* If Quotation is Accepted but not yet SO, offer 1-click conversion */}
                          {!isSO && quote.status === 'Accepted' && (
                            <button
                              onClick={() => handleConvertToSO(quote)}
                              className="w-full px-2 py-1 rounded-lg bg-amber-200 text-amber-950 border border-amber-400 text-[9px] font-black hover:bg-amber-300 transition-all flex items-center justify-center gap-1"
                              title="Konfirmasi penawaran ini menjadi Sales Order resmi"
                            >
                              <ArrowRightCircle className="w-3 h-3" /> Jadi Sales Order
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Fast Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => onView(quote)} 
                            className="p-2 clay-button-secondary text-slate-800 hover:text-emerald-700" 
                            title="Preview & Cetak Format Quotation"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => onViewSO ? onViewSO(quote) : onView(quote)} 
                            className="p-2 clay-button-secondary text-amber-800 hover:bg-amber-100 hover:text-amber-950" 
                            title="Cetak Format Sales Order (SO - NCR)"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => handleShareWhatsApp(quote)} 
                            className={`p-2 clay-button-secondary ${isSO ? 'text-amber-800 hover:bg-amber-100' : 'text-emerald-700 hover:bg-emerald-50'}`}
                            title={isSO ? "Kirim Pengingat Tagihan SO via WhatsApp" : "Kirim Ringkasan Penawaran via WhatsApp"}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => onEdit(quote)} 
                            className="p-2 clay-button-secondary text-blue-700 hover:bg-blue-50" 
                            title="Edit Dokumen"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => onDuplicate(quote)} 
                            className="p-2 clay-button-secondary text-slate-700 hover:bg-slate-50" 
                            title="Duplikat Dokumen"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => onDelete(quote.id)} 
                            className="p-2 clay-button-secondary text-rose-700 hover:bg-rose-50" 
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

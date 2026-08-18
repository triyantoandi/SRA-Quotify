import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, CheckCircle, Clock, XCircle, FileText, 
  Users, Package, Building2, ArrowUpRight, Calculator, Plus, 
  Download, Eye, Sparkles, Filter, ChevronRight, PieChart, BarChart3,
  ShieldCheck, UserCheck, ClipboardList, ShieldAlert, Check
} from 'lucide-react';
import { Quotation, Item, Customer, User, Settings } from '../types';
import { 
  formatIDR, getSraGroupEntities, defaultSettings, 
  isSupervisoryRole, checkDocumentOwnership 
} from '../utils/helpers';
import { exportQuotationsToExcel } from '../utils/excelHelpers';

interface DashboardAnalyticsProps {
  quotations: Quotation[];
  items: Item[];
  customers: Customer[];
  users?: User[];
  currentUser: User;
  settings: Settings;
  onNewQuotation: () => void;
  onViewQuotation: (quote: Quotation) => void;
  onOpenCalculator: () => void;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function DashboardAnalytics({
  quotations,
  items,
  customers,
  users = [],
  currentUser,
  settings,
  onNewQuotation,
  onViewQuotation,
  onOpenCalculator,
  onNavigateTab,
  showToast
}: DashboardAnalyticsProps) {
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [salesFilter, setSalesFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30'>('ALL');

  const entities = getSraGroupEntities(settings || defaultSettings);
  const isManager = isSupervisoryRole(currentUser?.role);

  const safeQuotations = Array.isArray(quotations) ? quotations : [];
  const safeItems = Array.isArray(items) ? items : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  // Filter based on user role & active filters
  const filteredQuotations = safeQuotations.filter(q => {
    if (!q) return false;
    if (!isManager && !checkDocumentOwnership(q, currentUser)) return false;
    if (isManager && salesFilter !== 'ALL') {
      const qCreated = (q.createdBy || '').toLowerCase();
      const qSales = (q.salesName || '').toLowerCase();
      const qCreatedByName = (q.createdByName || '').toLowerCase();
      const qSalesId = (q.salesId || '').toLowerCase();
      const sTarget = salesFilter.toLowerCase();
      if (
        qCreated !== sTarget && 
        qSales !== sTarget && 
        qCreatedByName !== sTarget && 
        qSalesId !== sTarget
      ) {
        return false;
      }
    }
    if (entityFilter !== 'ALL' && q.issuingCompany !== entityFilter) return false;
    
    if (timeFilter !== 'ALL' && q.date) {
      try {
        const qDate = new Date(q.date);
        const now = new Date();
        if (!isNaN(qDate.getTime())) {
          if (timeFilter === 'THIS_MONTH') {
            if (qDate.getMonth() !== now.getMonth() || qDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
          } else if (timeFilter === 'LAST_30') {
            const diffDays = (now.getTime() - qDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 30) return false;
          }
        }
      } catch {
        return true;
      }
    }
    return true;
  });

  // Calculate Metrics
  const totalCount = filteredQuotations.length;
  const acceptedList = filteredQuotations.filter(q => q?.status === 'Accepted');
  const sentList = filteredQuotations.filter(q => q?.status === 'Sent');
  const draftList = filteredQuotations.filter(q => q?.status === 'Draft');
  const rejectedList = filteredQuotations.filter(q => q?.status === 'Rejected');

  const totalWonRevenue = acceptedList.reduce((sum, q) => sum + (q?.total || 0), 0);
  const totalPipelineRevenue = [...draftList, ...sentList].reduce((sum, q) => sum + (q?.total || 0), 0);
  const totalPotentialAll = filteredQuotations.reduce((sum, q) => sum + (q?.total || 0), 0);

  const winRate = totalCount > 0 ? Math.round((acceptedList.length / totalCount) * 100) : 0;
  const averageQuotationValue = totalCount > 0 ? Math.round(totalPotentialAll / totalCount) : 0;

  // Breakdown per Entity (PT)
  const entityBreakdown = Object.keys(entities).map(ptName => {
    const ptQuotes = safeQuotations.filter(q => q?.issuingCompany === ptName);
    const ptTotal = ptQuotes.reduce((s, q) => s + (q?.total || 0), 0);
    const ptAccepted = ptQuotes.filter(q => q?.status === 'Accepted').reduce((s, q) => s + (q?.total || 0), 0);
    return {
      name: ptName,
      shortName: ptName.replace('PT ', ''),
      count: ptQuotes.length,
      total: ptTotal,
      accepted: ptAccepted,
      color: entities[ptName]?.themeColor || '#059669'
    };
  });

  // Top Quoted Products Calculation
  const itemQuotedCount = new Map<string, { count: number; totalQty: number; revenue: number; item: Item }>();
  safeItems.forEach(i => {
    if (i && i.id) {
      itemQuotedCount.set(i.id, { count: 0, totalQty: 0, revenue: 0, item: i });
    }
  });

  safeQuotations.forEach(q => {
    if (q && Array.isArray(q.items)) {
      q.items.forEach(qi => {
        if (qi && qi.itemId && itemQuotedCount.has(qi.itemId)) {
          const entry = itemQuotedCount.get(qi.itemId)!;
          entry.count += 1;
          entry.totalQty += qi.qty || 0;
          entry.revenue += qi.subtotal || 0;
        }
      });
    }
  });

  const topProducts = Array.from(itemQuotedCount.values())
    .filter(p => p.count > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Clients by Quotation Volume
  const clientQuotedMap = new Map<string, { name: string; count: number; totalValue: number; acceptedValue: number }>();
  safeQuotations.forEach(q => {
    if (!q || !q.customerName) return;
    const key = String(q.customerName).trim();
    if (!key) return;
    if (!clientQuotedMap.has(key)) {
      clientQuotedMap.set(key, { name: key, count: 0, totalValue: 0, acceptedValue: 0 });
    }
    const c = clientQuotedMap.get(key)!;
    c.count += 1;
    c.totalValue += q.total || 0;
    if (q.status === 'Accepted') c.acceptedValue += q.total || 0;
  });

  const topClients = Array.from(clientQuotedMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  // Sales Team Monitoring & Control Breakdown for Manager
  const salesPerformanceBreakdown = useMemo(() => {
    if (!isManager) return [];
    const map = new Map<string, {
      username: string;
      displayName: string;
      totalQuotes: number;
      totalSos: number;
      totalValue: number;
      wonValue: number;
      unpaidSoValue: number;
      acceptedCount: number;
      overlimitCount: number;
    }>();

    // 1. Initialize all registered users with role 'sales'
    (users || []).forEach(u => {
      if (u && u.role === 'sales') {
        const uKey = (u.username || '').trim().toLowerCase();
        if (uKey) {
          map.set(uKey, {
            username: u.username,
            displayName: u.name || u.username,
            totalQuotes: 0,
            totalSos: 0,
            totalValue: 0,
            wonValue: 0,
            unpaidSoValue: 0,
            acceptedCount: 0,
            overlimitCount: 0,
          });
        }
      }
    });

    // 2. Aggregate quotations across all sales
    safeQuotations.forEach(q => {
      if (!q) return;
      const rawUser = (q.createdBy || 'sales').trim();
      const rawKey = rawUser.toLowerCase();
      const name = q.salesName || q.createdBy || 'Tim Sales';

      if (!map.has(rawKey)) {
        // Check if matches by displayName
        let matchedKey: string | null = null;
        for (const [k, v] of map.entries()) {
          if (v.displayName.toLowerCase() === name.toLowerCase() || v.username.toLowerCase() === rawKey) {
            matchedKey = k;
            break;
          }
        }
        if (matchedKey) {
          // matched existing user
        } else if (rawUser !== 'admin') {
          map.set(rawKey, {
            username: rawUser,
            displayName: name,
            totalQuotes: 0,
            totalSos: 0,
            totalValue: 0,
            wonValue: 0,
            unpaidSoValue: 0,
            acceptedCount: 0,
            overlimitCount: 0,
          });
        }
      }

      // Find the entry in map
      let targetItem = map.get(rawKey);
      if (!targetItem) {
        for (const entry of map.values()) {
          if (entry.displayName.toLowerCase() === name.toLowerCase() || entry.username.toLowerCase() === rawKey) {
            targetItem = entry;
            break;
          }
        }
      }

      if (targetItem) {
        const isSO = q.isSO || q.status === 'SO_Confirmed';
        if (isSO) {
          targetItem.totalSos++;
          if (q.paymentStatus !== 'PAID') {
            targetItem.unpaidSoValue += (q.total || 0);
          }
        } else {
          targetItem.totalQuotes++;
        }
        targetItem.totalValue += (q.total || 0);
        if (q.status === 'Accepted' || q.status === 'SO_Confirmed') {
          targetItem.wonValue += (q.total || 0);
          targetItem.acceptedCount++;
        }
        if (q.isApprovedByManager === false) {
          targetItem.overlimitCount++;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.wonValue - a.wonValue || b.totalValue - a.totalValue);
  }, [safeQuotations, users, isManager]);

  // Recent 5 Quotations
  const recentQuotations = [...filteredQuotations]
    .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Accepted</span>;
      case 'Sent':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">Sent</span>;
      case 'Draft':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300">Draft</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300 relative z-10 font-sans pb-10">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              SRA Group Enterprise Dashboard
            </span>
            <span className="text-xs text-slate-400 font-bold">• {currentUser?.name || currentUser?.username || 'User'} ({currentUser?.role || 'sales'})</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Pusat Analitik & Performa Penawaran
          </h2>
          <p className="text-xs md:text-sm text-slate-300 font-medium mt-1 max-w-2xl">
            Pantau pertumbuhan omzet penawaran, tingkat konversi win rate, serta distribusi transaksi multi-entitas SRA Group.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button 
            onClick={onOpenCalculator}
            className="px-4 py-3 clay-button-secondary text-slate-900 font-black text-xs flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            Simulasi Tier
          </button>

          <button 
            onClick={onNewQuotation}
            className="px-5 py-3 clay-button-primary text-white font-black text-xs flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Buat Quotation
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#e4ecf4] p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-600 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Entitas:
          </span>
          <button 
            onClick={() => setEntityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              entityFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Semua PT
          </button>
          {Object.keys(entities).map(pt => (
            <button 
              key={pt}
              onClick={() => setEntityFilter(pt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                entityFilter === pt ? 'clay-button-primary text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {pt.replace('PT ', '')}
            </button>
          ))}

          {isManager && (
            <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-2 border-l border-slate-300">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-xs font-bold text-slate-600">Sales PIC:</span>
              <select
                value={salesFilter}
                onChange={e => setSalesFilter(e.target.value)}
                className="p-1.5 clay-input font-bold text-xs bg-white text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Tim Sales</option>
                {users.filter(u => u.role === 'sales').map(u => (
                  <option key={u.username} value={u.username}>
                    {u.name || u.username} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/80 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button 
              onClick={() => setTimeFilter('ALL')} 
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Semua Waktu
            </button>
            <button 
              onClick={() => setTimeFilter('THIS_MONTH')} 
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'THIS_MONTH' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Bulan Ini
            </button>
            <button 
              onClick={() => setTimeFilter('LAST_30')} 
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'LAST_30' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              30 Hari
            </button>
          </div>

          <button 
            onClick={() => {
              exportQuotationsToExcel(filteredQuotations, items);
              showToast("Laporan Excel berhasil diunduh");
            }}
            title="Download Laporan Excel Komplit"
            className="px-3 py-1.5 clay-button-secondary text-slate-800 text-xs font-extrabold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance Metrics (3D Clay Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Realized Revenue */}
        <div className="clay-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              {acceptedList.length} Diterima
            </span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Omzet Dimenangkan (Accepted)</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {formatIDR(totalWonRevenue)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-bold flex justify-between">
            <span>Win Rate: <strong className="text-emerald-700">{winRate}%</strong></span>
            <span>Rata-rata: <strong>{formatIDR(averageQuotationValue)}</strong></span>
          </div>
        </div>

        {/* Metric 2: Pipeline Potential */}
        <div className="clay-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
              {draftList.length + sentList.length} Pending
            </span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Potensi Pipeline (Sent & Draft)</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {formatIDR(totalPipelineRevenue)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-bold flex justify-between">
            <span>Sent: {sentList.length}</span>
            <span>Draft: {draftList.length}</span>
            <span>Rejected: {rejectedList.length}</span>
          </div>
        </div>

        {/* Metric 3: Master Products */}
        <div className="clay-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <button 
              onClick={() => onNavigateTab('items')}
              className="text-[10px] font-black text-amber-800 hover:underline flex items-center gap-0.5"
            >
              Lihat Pricelist <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Katalog Master Barang</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
              {safeItems.length} <span className="text-xs font-bold text-slate-500">Items Aktif</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-bold flex justify-between">
            <span>Tiered Pricing Otomatis</span>
            <span className="text-emerald-700">Multi Satuan</span>
          </div>
        </div>

        {/* Metric 4: Master Customers */}
        <div className="clay-card p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <button 
              onClick={() => onNavigateTab('customers')}
              className="text-[10px] font-black text-indigo-800 hover:underline flex items-center gap-0.5"
            >
              Direktori Klien <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Basis Data Pelanggan</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
              {safeCustomers.length} <span className="text-xs font-bold text-slate-500">Klien Terdaftar</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-bold flex justify-between">
            <span>{topClients.length} Klien Reguler</span>
            <span className="text-indigo-700">NPWP & Up</span>
          </div>
        </div>
      </div>

      {/* Grid Section: Multi-PT Breakdown & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Entity Distribution */}
        <div className="clay-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Distribusi Nilai Penawaran per Entitas SRA Group
              </h3>
              <p className="text-xs text-slate-500 font-medium">Rekapitulasi transaksi berdasarkan PT Penerbit</p>
            </div>
            <span className="text-xs font-extrabold text-slate-500">
              Total: {formatIDR(totalPotentialAll)}
            </span>
          </div>

          <div className="space-y-4">
            {entityBreakdown.map((ent, idx) => {
              const sharePercent = totalPotentialAll > 0 ? Math.round((ent.total / totalPotentialAll) * 100) : 0;
              return (
                <div key={idx} className="bg-[#e9eff6] p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ent.color }}></span>
                      <span className="font-extrabold text-slate-900 text-sm">{ent.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-[10px] font-bold border border-slate-200">
                        {ent.count} Quo
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-bold mr-2">Total Nilai:</span>
                      <span className="font-black text-slate-900 text-sm tabular-nums">{formatIDR(ent.total)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(4, sharePercent)}%`, backgroundColor: ent.color }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-600 font-medium">
                    <span>Porsi Portofolio: <strong>{sharePercent}%</strong></span>
                    <span>Omzet Gol (Accepted): <strong className="text-emerald-700">{formatIDR(ent.accepted)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Pipeline Breakdown */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                Pipeline Status
              </h3>
              <span className="text-xs font-bold text-slate-500">{totalCount} Dokumen</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-900">Accepted</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-900">{acceptedList.length} Quo</p>
                  <p className="text-[10px] font-bold text-emerald-700">{formatIDR(totalWonRevenue)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-extrabold text-blue-900">Sent (Menunggu)</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-blue-900">{sentList.length} Quo</p>
                  <p className="text-[10px] font-bold text-blue-700">
                    {formatIDR(sentList.reduce((s, q) => s + (q?.total || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-extrabold text-slate-800">Draft</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800">{draftList.length} Quo</p>
                  <p className="text-[10px] font-bold text-slate-600">
                    {formatIDR(draftList.reduce((s, q) => s + (q?.total || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-extrabold text-rose-900">Rejected</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-rose-900">{rejectedList.length} Quo</p>
                  <p className="text-[10px] font-bold text-rose-700">
                    {formatIDR(rejectedList.reduce((s, q) => s + (q?.total || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <button 
              onClick={() => onNavigateTab('quotations')}
              className="w-full py-2.5 clay-button-secondary text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              Buka Semua Daftar Quotation <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section: Top Products & Top Clients & Recent Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products by Revenue */}
        <div className="clay-card p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                5 Produk Paling Sering Ditawarkan
              </h3>
              <p className="text-xs text-slate-500 font-medium">Berdasarkan total estimasi nilai & kuantitas penawaran</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">Belum ada transaksi produk penawaran.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((tp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#e9eff6] border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">{tp.item?.name || 'Produk'}</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {tp.item?.sku || '-'} • {tp.count}x ditawarkan ({tp.totalQty} {tp.item?.unit || 'Pcs'})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 tabular-nums">{formatIDR(tp.revenue)}</p>
                    <p className="text-[9px] text-emerald-700 font-extrabold">Omzet Estimasi</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clients Ranking */}
        <div className="clay-card p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                5 Klien / Pelanggan Potensial Teratas
              </h3>
              <p className="text-xs text-slate-500 font-medium">Berdasarkan akumulasi nilai quotation</p>
            </div>
          </div>

          {topClients.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">Belum ada data pelanggan tercatat.</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#e9eff6] border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">{client.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {client.count} Transaksi Quotation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 tabular-nums">{formatIDR(client.totalValue)}</p>
                    <p className="text-[9px] text-emerald-700 font-extrabold">
                      Won: {formatIDR(client.acceptedValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MANAGER ONLY: TABEL KONTROL & REKAP PERFORMA TIM SALES */}
      {isManager && salesPerformanceBreakdown.length > 0 && (
        <div className="clay-card p-6 border-2 border-slate-800/10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider">
                  Supervisi Manager
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {salesPerformanceBreakdown.length} Tim Sales Aktif
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Matriks Kontrol & Rekapitulasi Penjualan Tim Sales
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pantau langsung volume penawaran, realisasi Sales Order (SO), omzet won, dan status piutang setiap anggota tim sales.
              </p>
            </div>

            <button 
              onClick={() => onNavigateTab('quotations')}
              className="text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto border border-amber-300"
            >
              <ClipboardList className="w-4 h-4 text-amber-800" />
              Kontrol Semua Dokumen Sales <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#e9eff6] text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="p-3 rounded-l-xl">Nama Sales PIC</th>
                  <th className="p-3 text-center">Penawaran</th>
                  <th className="p-3 text-center">Sales Order (SO)</th>
                  <th className="p-3 text-right">Total Pipeline</th>
                  <th className="p-3 text-right text-emerald-800">Realisasi Omzet (Won)</th>
                  <th className="p-3 text-right text-rose-800">Piutang SO Belum Lunas</th>
                  <th className="p-3 text-center">Status Approval</th>
                  <th className="p-3 text-center rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-semibold">
                {salesPerformanceBreakdown.map((s, idx) => {
                  return (
                    <tr key={s.username} className="hover:bg-white/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-blue-700" />
                              {s.displayName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">@{s.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {s.totalQuotes} Penawaran
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-amber-900">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 font-black">
                          {s.totalSos} SO
                        </span>
                      </td>

                      <td className="p-3 text-right font-black text-slate-800 tabular-nums">
                        {formatIDR(s.totalValue)}
                      </td>

                      <td className="p-3 text-right font-black text-emerald-700 tabular-nums">
                        {formatIDR(s.wonValue)}
                      </td>

                      <td className="p-3 text-right font-black text-rose-700 tabular-nums">
                        {formatIDR(s.unpaidSoValue)}
                      </td>

                      <td className="p-3 text-center">
                        {s.overlimitCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                            <ShieldAlert className="w-3 h-3 text-amber-700" /> {s.overlimitCount} Overlimit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Normal
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <button 
                          onClick={() => onNavigateTab('quotations')}
                          className="px-3 py-1.5 clay-button-secondary text-slate-800 hover:text-emerald-700 text-[10px] font-extrabold flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3" /> Audit Data
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Quotations Feed */}
      <div className="clay-card p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 pb-3 border-b border-slate-200/80">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Penawaran Terbaru Diterbitkan
            </h3>
            <p className="text-xs text-slate-500 font-medium">Daftar aktivitas quotation mutakhir</p>
          </div>
          <button 
            onClick={() => onNavigateTab('quotations')}
            className="text-xs font-black text-emerald-800 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Lihat Semua Penawaran <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentQuotations.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">Belum ada quotation yang dibuat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#e9eff6] text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="p-3 rounded-l-xl">No. Quotation</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Klien</th>
                  <th className="p-3">PT Penerbit</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-semibold">
                {recentQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-white/80 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900">{q.id}</td>
                    <td className="p-3 text-slate-600">{q.date}</td>
                    <td className="p-3 font-bold text-slate-900">{q.customerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700">
                        {q.issuingCompany ? q.issuingCompany.replace('PT ', '') : '-'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 tabular-nums">{formatIDR(q.total)}</td>
                    <td className="p-3 text-center">{getStatusBadge(q.status)}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => onViewQuotation(q)}
                        className="px-3 py-1.5 clay-button-secondary text-slate-800 text-[10px] font-extrabold flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

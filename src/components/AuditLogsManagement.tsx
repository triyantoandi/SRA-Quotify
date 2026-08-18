import React, { useState, useMemo } from 'react';
import { Trash2, Search, Download, ShieldCheck, Filter, Activity, FileText } from 'lucide-react';
import { ActivityLog } from '../types';
import { exportAuditLogsToExcel } from '../utils/excelHelpers';

interface AuditLogsManagementProps {
  logs: ActivityLog[];
  setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AuditLogsManagement({ logs, setLogs, showConfirm, showToast }: AuditLogsManagementProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  
  const safeLogs = Array.isArray(logs) ? logs : [];

  const distinctActions = useMemo(() => {
    const set = new Set<string>();
    safeLogs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [safeLogs]);

  const filteredLogs = useMemo(() => {
    return safeLogs.filter(l => {
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (l.name && l.name.toLowerCase().includes(q)) || 
        (l.username && l.username.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) || 
        (l.details && l.details.toLowerCase().includes(q))
      );
    });
  }, [safeLogs, actionFilter, search]);

  const handleExport = () => {
    exportAuditLogsToExcel(filteredLogs);
    showToast("Log audit berhasil diexport ke Excel");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-10 font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Log Audit & Keamanan Sistem</h2>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">
            Rekam jejak aktivitas operasional, modifikasi data penawaran, dan riwayat otentikasi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {safeLogs.length > 0 && (
            <button 
              onClick={handleExport}
              className="px-4 py-2.5 clay-button-secondary text-emerald-900 font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Export Log Excel
            </button>
          )}
          {safeLogs.length > 0 && (
            <button 
              onClick={() => showConfirm("Kosongkan Log Audit?", "Seluruh riwayat jejak aktivitas akan dihapus permanen.", () => { setLogs([]); showToast("Log audit berhasil dikosongkan"); })} 
              className="px-4 py-2.5 clay-button-secondary text-rose-700 font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-600" /> Kosongkan Log
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Area */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black text-slate-700">Kategori Event:</span>
            <select 
              value={actionFilter} 
              onChange={e => setActionFilter(e.target.value)}
              className="p-2 clay-input font-bold text-xs"
            >
              <option value="ALL">Semua Aktivitas ({safeLogs.length})</option>
              {distinctActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input 
              type="text" 
              placeholder="Cari user, aksi, atau detail keterangan..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 text-xs clay-input font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#e9eff6] text-[10px] font-black uppercase text-slate-600 tracking-wider rounded-xl border border-slate-200/60">
                <th className="p-4 rounded-l-xl w-44">Waktu (WIB)</th>
                <th className="p-4 w-48">Pengguna (User)</th>
                <th className="p-4 w-40">Aktivitas / Event</th>
                <th className="p-4 rounded-r-xl">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs font-semibold text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-700" />
                    <p className="font-extrabold text-slate-600">Tidak ada riwayat aktivitas ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-white/80 transition-colors">
                    <td className="p-4 text-slate-500 tabular-nums font-bold whitespace-nowrap">
                      {log.timestamp || '-'}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900">{log.name || log.username}</div>
                      <div className="text-[10px] text-slate-400 font-bold">@{log.username || 'system'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 clay-badge bg-white text-emerald-800 font-black text-[9px] uppercase tracking-wider">
                        {log.action || 'INFO'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium leading-relaxed">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

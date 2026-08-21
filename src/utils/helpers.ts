import { Item, Customer, User, Settings, SraEntity, Quotation } from '../types';

export const injectGlobalStyles = (): void => {
  if (typeof document === 'undefined') return;
  const styleId = 'sra-claymorphism-styles';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --clay-bg: #eef2f7;
      --clay-surface: #f6f9fc;
      --clay-surface-elevated: #ffffff;
      --clay-text-primary: #0f172a;
      --clay-text-secondary: #475569;
      --clay-text-muted: #94a3b8;
      
      --clay-shadow-light: rgba(255, 255, 255, 0.95);
      --clay-shadow-dark: rgba(160, 175, 198, 0.45);
      --clay-shadow-deep: rgba(140, 155, 180, 0.55);
    }

    body, html {
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      background-color: var(--clay-bg);
      color: var(--clay-text-primary);
      min-height: 100vh;
    }

    /* 3D Clay Card */
    .clay-card, .glass-panel {
      background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 
        7px 11px 22px -3px var(--clay-shadow-dark),
        -6px -6px 15px 0px var(--clay-shadow-light),
        inset 1.5px 1.5px 2px 0px rgba(255, 255, 255, 0.95);
    }
    
    .clay-card-hover, .glass-panel-hover {
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .clay-card-hover:hover, .glass-panel-hover:hover {
      background: linear-gradient(145deg, #ffffff 0%, #f4f8fc 100%);
      transform: translateY(-4px) scale(1.006);
      box-shadow: 
        11px 17px 30px -3px var(--clay-shadow-deep),
        -8px -8px 20px 0px var(--clay-shadow-light),
        inset 1.5px 1.5px 2.5px 0px rgba(255, 255, 255, 0.95);
    }

    /* Recessed Inset Clay Input & Select */
    .clay-input, .glass-input {
      background: #e9eff6;
      border-radius: 16px;
      border: 1px solid rgba(200, 212, 228, 0.7);
      box-shadow: 
        inset 3px 3px 6px rgba(155, 172, 198, 0.35),
        inset -3px -3px 6px rgba(255, 255, 255, 0.9);
      color: #0f172a;
      transition: all 0.2s ease;
    }
    .clay-input::placeholder, .glass-input::placeholder {
      color: #94a3b8;
    }
    .clay-input:focus, .glass-input:focus {
      background: #f3f7fd;
      border-color: #059669;
      box-shadow: 
        inset 2px 2px 4px rgba(155, 172, 198, 0.25),
        inset -2px -2px 4px rgba(255, 255, 255, 0.95),
        0 0 0 3.5px rgba(5, 150, 105, 0.2);
      outline: none;
    }

    /* 3D Primary Button */
    .clay-button-primary, .primary-button {
      background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
      color: #ffffff;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 
        5px 7px 16px -2px rgba(2, 132, 199, 0.4),
        -3px -3px 8px 0px rgba(255, 255, 255, 0.6),
        inset 1.5px 1.5px 2px 0px rgba(255, 255, 255, 0.4);
      font-weight: 700;
      transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .clay-button-primary:hover, .primary-button:hover {
      background: linear-gradient(135deg, #047857 0%, #0369a1 100%);
      transform: translateY(-2.5px) scale(1.02);
      box-shadow: 
        8px 11px 22px -2px rgba(2, 132, 199, 0.55),
        -4px -4px 10px 0px rgba(255, 255, 255, 0.7),
        inset 2px 2px 3px 0px rgba(255, 255, 255, 0.5);
    }
    .clay-button-primary:active, .primary-button:active {
      transform: translateY(1px) scale(0.98);
      box-shadow: 
        inset 3px 3px 6px rgba(0, 0, 0, 0.3),
        inset -2px -2px 4px rgba(255, 255, 255, 0.2);
    }

    /* 3D Secondary Clay Button */
    .clay-button-secondary {
      background: linear-gradient(145deg, #ffffff 0%, #e6ecf5 100%);
      color: #334155;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 
        5px 7px 16px -3px rgba(155, 172, 198, 0.45),
        -4px -4px 10px 0px rgba(255, 255, 255, 0.95),
        inset 1px 1px 2px 0px rgba(255, 255, 255, 0.9);
      font-weight: 600;
      transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .clay-button-secondary:hover {
      transform: translateY(-2px);
      background: linear-gradient(145deg, #ffffff 0%, #edf2f9 100%);
      color: #0f172a;
      box-shadow: 
        7px 10px 20px -3px rgba(145, 162, 188, 0.55),
        -5px -5px 12px 0px rgba(255, 255, 255, 0.95);
    }
    .clay-button-secondary:active {
      transform: translateY(1px) scale(0.98);
      box-shadow: 
        inset 3px 3px 6px rgba(150, 165, 188, 0.4),
        inset -3px -3px 6px rgba(255, 255, 255, 0.8);
    }

    /* 3D Clay Badge */
    .clay-badge {
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 
        3px 4px 8px rgba(155, 172, 198, 0.35),
        -2px -2px 5px rgba(255, 255, 255, 0.85),
        inset 1px 1px 2px rgba(255, 255, 255, 0.6);
    }

    /* Clay Modal Floating Container */
    .clay-modal {
      background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%);
      border-radius: 28px;
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow: 
        16px 24px 48px -6px rgba(120, 140, 170, 0.5),
        -10px -10px 28px 0px rgba(255, 255, 255, 0.95),
        inset 2px 2px 3px 0px rgba(255, 255, 255, 0.9);
    }

    /* 3D Sidebar Container */
    .clay-sidebar {
      background: linear-gradient(160deg, #111827 0%, #0f172a 100%);
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        10px 16px 32px -4px rgba(15, 23, 42, 0.4),
        inset 1px 1px 2px rgba(255, 255, 255, 0.15);
    }

    /* 3D Nav Pill Active */
    .clay-nav-active {
      background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        4px 6px 14px -2px rgba(2, 132, 199, 0.45),
        -2px -2px 6px 0px rgba(255, 255, 255, 0.2),
        inset 1px 1px 2px 0px rgba(255, 255, 255, 0.4);
      color: #ffffff !important;
    }

    .clay-nav-inactive {
      border-radius: 18px;
      transition: all 0.2s ease;
    }
    .clay-nav-inactive:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }

    .aurora-header {
      background: linear-gradient(145deg, #ffffff 0%, #f4f8fc 100%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 
        4px 6px 14px -2px rgba(160, 175, 198, 0.25),
        -4px -4px 10px 0px rgba(255, 255, 255, 0.9);
    }

    .tabular-nums { font-variant-numeric: tabular-nums; }
    
    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-track { background: #ebf0f7; border-radius: 8px; }
    ::-webkit-scrollbar-thumb { 
      background: linear-gradient(180deg, #cbd5e1, #94a3b8); 
      border-radius: 10px; 
      border: 2px solid #ebf0f7;
    }
    ::-webkit-scrollbar-thumb:hover { background: #64748b; }
  `;
  document.head.appendChild(style);
};

export const getSraGroupEntities = (settings?: Partial<Settings>): Record<string, SraEntity> => {
  const s: Settings = { ...defaultSettings, ...(settings || {}) };
  return {
    'PT Sumber Roso Agromakmur': {
      companyName: 'PT Sumber Roso Agromakmur',
      companyNpwp: '01.234.567.8-123.000',
      companyAddress: 'Jl. Raya Bekasi Timur No. 136\nCipinang Besar Utara, Jatinegara\nJakarta 13410, Indonesia',
      companyPhone: '+62 21 819 1908 / +62 21 856 1033',
      companyFax: '+62 21 856 0010',
      companyEmail: s.companyEmail || defaultSettings.companyEmail,
      bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4967 959 595\nAtas Nama: PT Sumber Roso Agromakmur',
      themeColor: '#0ea5e9'
    },
    'PT Exindokarsa Agung': {
      companyName: 'PT Exindokarsa Agung',
      companyNpwp: '02.345.678.9-234.000',
      companyAddress: s.companyAddress || defaultSettings.companyAddress,
      companyPhone: s.companyPhone || defaultSettings.companyPhone,
      companyEmail: s.companyEmail || defaultSettings.companyEmail,
      bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4960 496 022\nAtas Nama: PT Exindokarsa Agung',
      themeColor: s.themeColor || '#6366f1'
    },
    'PT Indo Megah Raya': {
      companyName: 'PT Indo Megah Raya',
      companyNpwp: '03.456.789.0-345.000',
      companyAddress: s.companyAddress || defaultSettings.companyAddress,
      companyPhone: s.companyPhone || defaultSettings.companyPhone,
      companyEmail: s.companyEmail || defaultSettings.companyEmail,
      bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4966 510 510\nAtas Nama: PT Indo Megah Raya',
      themeColor: '#10b981'
    },
    'PT Pelangi Agro Sejahtera': {
      companyName: 'PT Pelangi Agro Sejahtera',
      companyNpwp: '04.567.890.1-456.000',
      companyAddress: s.companyAddress || defaultSettings.companyAddress,
      companyPhone: s.companyPhone || defaultSettings.companyPhone,
      companyEmail: s.companyEmail || defaultSettings.companyEmail,
      bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4963 123 321\nAtas Nama: PT Pelangi Agro Sejahtera',
      themeColor: '#f97316'
    }
  };
};

export const initialItems: Item[] = [];

export const initialCustomers: Customer[] = [];

export type NormalizedRole = 'admin' | 'manager' | 'sales';

export const normalizeRole = (role?: string): NormalizedRole => {
  const clean = String(role || '').trim().toLowerCase();
  if (clean === 'admin' || clean === 'administrator' || clean === 'superadmin') return 'admin';
  if (clean === 'manager' || clean === 'supervisor') return 'manager';
  return 'sales';
};

export const isSupervisoryRole = (role?: string): boolean => {
  const norm = normalizeRole(role);
  return norm === 'admin' || norm === 'manager';
};

export const isSalesRole = (role?: string): boolean => {
  return normalizeRole(role) === 'sales';
};

export const getDisplayRole = (role?: string): string => {
  const norm = normalizeRole(role);
  if (norm === 'admin') return 'Administrator';
  if (norm === 'manager') return 'Manager';
  return 'Sales Rep';
};

export const checkDocumentOwnership = (
  quote: Partial<Quotation> | null | undefined, 
  user: User | null | undefined
): boolean => {
  if (!quote || !user) return false;
  if (isSupervisoryRole(user.role)) return true; // Supervisory roles have full global access
  
  const userUsername = (user.username || '').trim().toLowerCase();
  const userId = (user.id || '').trim().toLowerCase();
  const userName = (user.name || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();

  const qCreatedBy = (quote.createdBy || '').trim().toLowerCase();
  const qSalesId = (quote.salesId || '').trim().toLowerCase();
  const qSalesName = (quote.salesName || '').trim().toLowerCase();
  const qCreatedByName = (quote.createdByName || '').trim().toLowerCase();
  const qSalesEmail = (quote.salesEmail || quote.createdByEmail || '').trim().toLowerCase();

  return (
    qCreatedBy === userUsername ||
    qCreatedBy === userId ||
    qSalesId === userId ||
    qSalesId === userUsername ||
    (Boolean(qSalesName) && (qSalesName === userName || qSalesName.includes(userUsername))) ||
    (Boolean(qCreatedByName) && qCreatedByName === userName) ||
    (Boolean(userEmail) && qSalesEmail === userEmail)
  );
};

export const initialUsers: User[] = [
  { id: 'U-001', username: 'admin', password: '123', name: 'Andi Triyanto (Administrator / Manager)', role: 'administrator', email: 'admin@sra.co.id', salesId: 'U-001' },
  { id: 'U-002', username: 'sales', password: '123', name: 'Siti Rahma (Sales)', role: 'sales', email: 'sales@sra.co.id', salesId: 'U-002' },
  { id: 'U-003', username: 'budi', password: '123', name: 'Budi Santoso (Sales)', role: 'sales', email: 'budi@sra.co.id', salesId: 'U-003' },
  { id: 'U-004', username: 'hendra', password: '123', name: 'Hendra Pratama (Sales)', role: 'sales', email: 'hendra@sra.co.id', salesId: 'U-004' }
];

export const initialQuotations: Quotation[] = [];

export const defaultSettings: Settings = {
  companyName: 'PT Sumber Roso Agromakmur',
  companyNpwp: '01.234.567.8-123.000',
  companyAddress: 'Jl Raya Bekasi Timur No. 136\nCipinang Besar Utara Jatinegara\nJakarta 13410, Indonesia',
  companyPhone: '+62 21 819 1908',
  companyEmail: 'contact@sra-agromakmur.com',
  defaultNotes: '1. Penawaran ini berlaku selama 14 hari kerja.\n2. Pembayaran dilakukan melalui transfer bank.\n3. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan.',
  defaultTaxRate: 11,
  bankDetails: 'Bank Central Asia (BCA)\nNo. Rekening: 4967 959 595\nAtas Nama: PT Sumber Roso Agromakmur',
  logoUrl: '',
  signatureUrl: '',
  themeColor: '#0ea5e9',
  quotePrefix: 'QUO',
  apiUrl: ''
};

export const formatIDR = (number: number): string => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);

export const generateID = (prefix: string): string => {
  const d = new Date();
  return `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

export const downloadCSVFile = (content: string, filename: string): void => {
  const uri = encodeURI(content);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// BUSINESS LOGIC: PAYMENT DUE DATE & REMINDER
// ==========================================

export const parsePaymentTermDays = (term?: string): number => {
  if (!term) return 0;
  const lower = term.toLowerCase().trim();
  if (lower.includes('cash') || lower.includes('cod') || lower.includes('cbd') || lower.includes('tunai') || lower.includes('lunas')) {
    return 0;
  }
  const match = lower.match(/(\d+)\s*(hari|day|hr)?/i);
  if (match && match[1]) {
    return parseInt(match[1], 10) || 0;
  }
  return 14; // Default fallback if unspecified
};

export const calculateDueDate = (baseDateStr: string, paymentTermStr?: string): string => {
  const tenorDays = parsePaymentTermDays(paymentTermStr);
  if (!baseDateStr) {
    const d = new Date();
    d.setDate(d.getDate() + tenorDays);
    return d.toISOString().split('T')[0];
  }
  try {
    const parts = baseDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + tenorDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) {
    console.warn('Error calculating due date:', e);
  }
  return baseDateStr;
};

export interface DueReminderInfo {
  type: 'PAID' | 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING' | 'CASH';
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeLabel: string;
  daysRemaining: number; // Positive = future, 0 = today, Negative = overdue
  isAlert: boolean; // True if <= 3 days or overdue
  alertLevel: 'none' | 'warning' | 'danger' | 'success';
}

export const getDueReminderInfo = (
  dueDateStr?: string, 
  paymentStatus: string = 'UNPAID',
  paymentTermStr?: string
): DueReminderInfo => {
  if (paymentStatus === 'PAID') {
    return {
      type: 'PAID',
      badgeColor: 'text-emerald-900',
      badgeBg: 'bg-emerald-100',
      badgeBorder: 'border-emerald-300',
      badgeLabel: '✅ LUNAS',
      daysRemaining: 0,
      isAlert: false,
      alertLevel: 'success'
    };
  }

  const tenorDays = parsePaymentTermDays(paymentTermStr);
  if (tenorDays === 0) {
    return {
      type: 'CASH',
      badgeColor: 'text-slate-800',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-300',
      badgeLabel: 'CASH / COD',
      daysRemaining: 0,
      isAlert: false,
      alertLevel: 'none'
    };
  }

  if (!dueDateStr) {
    return {
      type: 'UPCOMING',
      badgeColor: 'text-slate-700',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-200',
      badgeLabel: 'Belum Ditentukan',
      daysRemaining: 999,
      isAlert: false,
      alertLevel: 'none'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, (m || 1) - 1, d || 1);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueCount = Math.abs(diffDays);
    return {
      type: 'OVERDUE',
      badgeColor: 'text-rose-900 animate-pulse',
      badgeBg: 'bg-rose-100',
      badgeBorder: 'border-rose-400',
      badgeLabel: `🚨 LEWAT TEMPO (${overdueCount} HARI)`,
      daysRemaining: diffDays,
      isAlert: true,
      alertLevel: 'danger'
    };
  } else if (diffDays === 0) {
    return {
      type: 'DUE_TODAY',
      badgeColor: 'text-rose-950 font-black',
      badgeBg: 'bg-rose-200',
      badgeBorder: 'border-rose-400',
      badgeLabel: '⏰ JATUH TEMPO HARI INI',
      daysRemaining: 0,
      isAlert: true,
      alertLevel: 'danger'
    };
  } else if (diffDays <= 3) {
    return {
      type: 'DUE_SOON',
      badgeColor: 'text-amber-950 font-black',
      badgeBg: 'bg-amber-200',
      badgeBorder: 'border-amber-400',
      badgeLabel: `⚠️ REMINDER H-${diffDays} JATUH TEMPO`,
      daysRemaining: diffDays,
      isAlert: true,
      alertLevel: 'warning'
    };
  } else {
    return {
      type: 'UPCOMING',
      badgeColor: 'text-blue-900',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeLabel: `${diffDays} Hari Menuju Tempo`,
      daysRemaining: diffDays,
      isAlert: false,
      alertLevel: 'none'
    };
  }
};

// ==========================================
// BUSINESS LOGIC: CUSTOMER CREDIT LIMIT
// ==========================================

export interface CustomerCreditStatus {
  customerName: string;
  creditLimit: number;
  usedCredit: number;
  remainingCredit: number;
  usedPercentage: number;
  remainingPercentage: number;
  isExhausted: boolean; // Sisa limit <= 0
  isNearExhaustion: boolean; // Sisa limit <= warningThreshold (misal <= 10%)
  warningThresholdPct: number;
  activeSoCount: number;
  activeUnpaidSos: Quotation[];
  canMakeOrder: (newAmount: number) => { allowed: boolean; deficit: number; reason?: string };
}

export const getCustomerCreditStatus = (
  customer: Customer | string | null | undefined,
  customersList: Customer[],
  quotationsList: Quotation[]
): CustomerCreditStatus => {
  let custObj: Customer | undefined;
  if (typeof customer === 'string') {
    const query = customer.toLowerCase().trim();
    custObj = customersList.find(c => c.name?.toLowerCase().trim() === query || c.id?.toLowerCase().trim() === query);
  } else if (customer) {
    custObj = customer;
  }

  const customerName = custObj?.name || (typeof customer === 'string' ? customer : 'Pelanggan');
  // Default credit limit if not explicitly defined (e.g. 50,000,000 IDR)
  const creditLimit = typeof custObj?.creditLimit === 'number' ? custObj.creditLimit : 50000000;
  const warningThresholdPct = custObj?.warningThresholdPct ?? 10;

  // Active unpaid SOs reduce the available limit
  const activeUnpaidSos = (quotationsList || []).filter(q => {
    if (!q || !q.customerName) return false;
    const matchName = q.customerName.toLowerCase().trim() === customerName.toLowerCase().trim();
    const isSoActive = (q.isSO === true || q.status === 'SO_Confirmed' || q.status === 'Accepted');
    const isUnpaid = q.paymentStatus !== 'PAID';
    const notRejected = q.status !== 'Rejected';
    return matchName && isSoActive && isUnpaid && notRejected;
  });

  const usedCredit = activeUnpaidSos.reduce((sum, q) => sum + (Number(q.total) || 0), 0);
  const remainingCredit = Math.max(0, creditLimit - usedCredit);
  const usedPercentage = creditLimit > 0 ? Math.min(100, (usedCredit / creditLimit) * 100) : 0;
  const remainingPercentage = creditLimit > 0 ? Math.max(0, 100 - usedPercentage) : 100;

  const isExhausted = remainingCredit <= 0;
  const isNearExhaustion = remainingCredit > 0 && remainingPercentage <= warningThresholdPct;

  const canMakeOrder = (newAmount: number) => {
    if (custObj?.allowOverlimit === true) {
      return { allowed: true, deficit: 0 };
    }
    if (creditLimit <= 0) {
      // If credit limit set to 0 and not override, cash only
      return { allowed: false, deficit: newAmount, reason: 'Plafon kredit customer bernilai Rp 0 (Hanya transaksi Cash/Persetujuan Manager)' };
    }
    if (newAmount <= remainingCredit) {
      return { allowed: true, deficit: 0 };
    } else {
      const deficit = newAmount - remainingCredit;
      return { 
        allowed: false, 
        deficit, 
        reason: `Nilai order (${formatIDR(newAmount)}) melebihi sisa plafon kredit customer (${formatIDR(remainingCredit)}). Defisit limit: ${formatIDR(deficit)}` 
      };
    }
  };

  return {
    customerName,
    creditLimit,
    usedCredit,
    remainingCredit,
    usedPercentage,
    remainingPercentage,
    isExhausted,
    isNearExhaustion,
    warningThresholdPct,
    activeSoCount: activeUnpaidSos.length,
    activeUnpaidSos,
    canMakeOrder
  };
};

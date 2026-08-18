export interface ItemTier {
  min: number;
  max: number;
  price: number;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  description?: string;
  tiers: ItemTier[];
}

export interface Customer {
  id: string;
  name: string;
  storeName?: string;
  email: string;
  phone: string;
  address: string;
  npwp?: string;
  attnName?: string;
  creditLimit?: number; // Plafon batas limit transaksi (IDR)
  warningThresholdPct?: number; // Persentase sisa limit untuk alert (default: 10%)
  allowOverlimit?: boolean; // Otorisasi override limit khusus
  managerApprovedBy?: string;
  creditNotes?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'manager' | 'sales' | string;
}

export interface QuotationItem {
  id?: number;
  itemId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  itemDiscount: number;
  itemDiscountType: 'nominal' | 'percentage' | string;
}

export interface Quotation {
  id: string;
  issuingCompany: string;
  companyNpwp?: string;
  companyAddress?: string;
  bankDetails?: string;
  createdBy: string;
  createdByRole?: string;
  salesName?: string;
  date: string; // Tanggal pembuatan dokumen
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'SO_Confirmed' | string;
  customerName: string;
  storeName?: string;
  attnName?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNpwp?: string;
  items: QuotationItem[];
  subtotal: number;
  discountType?: 'nominal' | 'percentage' | string;
  discountInput?: number;
  discountValue: number;
  taxRate: number;
  taxValue: number;
  total: number;
  paymentTerm?: string;
  notes?: string;
  internalNotes?: string;
  validUntil?: string;
  
  // Sales Order (SO) Specific Fields
  isSO?: boolean; // True jika sudah dikonfirmasi / diterbitkan sebagai Sales Order
  soNumber?: string; // Nomor SO resmi (misal: 27795 atau SO-202608-001)
  soDate?: string; // Tanggal resmi pesanan (Order Date)
  orderDate?: string; // Alias tanggal order
  dueDate?: string; // Tanggal Jatuh Tempo Pembayaran berdasarkan paymentTerm
  paymentStatus?: 'UNPAID' | 'PAID' | 'PARTIAL' | 'OVERDUE'; // Status Piutang
  paidAt?: string; // Tanggal Pelunasan
  paidAmount?: number;
  isApprovedByManager?: boolean; // True jika disetujui manager saat melebihi batas limit
  managerApprovedBy?: string;
  managerApprovalNotes?: string;
}

export interface Settings {
  companyName: string;
  companyNpwp: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultNotes: string;
  defaultTaxRate: number;
  bankDetails: string;
  logoUrl: string;
  signatureUrl: string;
  themeColor: string;
  quotePrefix: string;
  apiUrl: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  name: string;
  action: string;
  details: string;
}

export interface SraEntity {
  companyName: string;
  companyNpwp: string;
  companyAddress: string;
  companyPhone: string;
  companyFax?: string;
  companyEmail: string;
  bankDetails: string;
  themeColor: string;
}

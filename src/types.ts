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
  hasCreditLimit?: boolean; // True jika ada plafon kredit tempo (Net days), False jika tanpa plafon (Cash Before Delivery / CBD)
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
  email?: string;
  role: 'administrator' | 'admin' | 'manager' | 'sales' | string;
  salesId?: string;
}

export interface QuotationItem {
  id?: number;
  itemId: string;
  itemName?: string; // Custom Item Name (untuk barang non-price list / spot market)
  itemSku?: string; // Custom SKU / Ref
  itemUnit?: string; // Custom Unit (Kg, Dus, Pcs, Ton, Box, Karung, Pack, dll)
  itemCategory?: string; // Kategori barang
  itemDescription?: string; // Catatan spesifikasi khusus
  isCustomItem?: boolean; // True jika barang khusus non-price list
  costPrice?: number; // Estimasi HPP / Modal (opsional untuk kalkulasi profit internal)
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
  
  // Ownership & RBAC Creator Attribution
  createdBy: string;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
  salesId?: string;
  salesName?: string;
  salesEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;

  date: string; // Tanggal pembuatan dokumen
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'SO_Confirmed' | string;
  customerName: string;
  storeName?: string;
  attnName?: string;
  customerEmail?: string;
  customerPhone?: string; // Kontak Telepon / WhatsApp
  customerAddress?: string;
  customerNpwp?: string;
  isCustomCustomer?: boolean; // True jika pelanggan baru / non-master ad-hoc
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
  userId?: string;
  userName?: string;
  userEmail?: string;
  username?: string; // Backward compatibility
  name?: string; // Backward compatibility
  role?: string;
  action: string;
  module?: string;
  documentType?: 'QUOTATION' | 'SALES_ORDER' | 'CUSTOMER' | 'ITEM' | 'USER' | 'SETTINGS' | 'AUTH' | string;
  documentId?: string;
  documentNumber?: string;
  description?: string;
  details?: string;
  metadata?: Record<string, any>;
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

import * as XLSX from 'xlsx';
import { Item, ItemTier, Customer } from '../types';

// ==========================================
// PRICELIST ITEM EXCEL HELPERS
// ==========================================

export interface ParsedItemRow {
  sku: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  minQty: number;
  maxQty: number;
  price: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface ItemImportPreview {
  itemsToSave: Item[];
  totalRowsParsed: number;
  newCount: number;
  updateCount: number;
  invalidCount: number;
  details: {
    sku: string;
    name: string;
    category: string;
    unit: string;
    description: string;
    tiers: ItemTier[];
    status: 'NEW' | 'UPDATE' | 'INVALID';
    errorMessage?: string;
  }[];
}

/**
 * Downloads a pre-formatted Excel template for Pricelist Items
 */
export const downloadItemExcelTemplate = (): void => {
  const templateData = [
    {
      'SKU': 'SKU-1001',
      'Nama Barang': 'Kurma Ajwa Super (1 Kg)',
      'Kategori': 'Kurma',
      'Satuan': 'Dus',
      'Deskripsi': 'Kurma Ajwa kualitas terbaik dari Madinah',
      'Tier Min Qty': 1,
      'Tier Max Qty': 10,
      'Harga Satuan (Rp)': 250000
    },
    {
      'SKU': 'SKU-1001',
      'Nama Barang': 'Kurma Ajwa Super (1 Kg)',
      'Kategori': 'Kurma',
      'Satuan': 'Dus',
      'Deskripsi': 'Kurma Ajwa kualitas terbaik dari Madinah',
      'Tier Min Qty': 11,
      'Tier Max Qty': 50,
      'Harga Satuan (Rp)': 240000
    },
    {
      'SKU': 'SKU-1001',
      'Nama Barang': 'Kurma Ajwa Super (1 Kg)',
      'Kategori': 'Kurma',
      'Satuan': 'Dus',
      'Deskripsi': 'Kurma Ajwa kualitas terbaik dari Madinah',
      'Tier Min Qty': 51,
      'Tier Max Qty': 999999,
      'Harga Satuan (Rp)': 230000
    },
    {
      'SKU': 'SKU-1002',
      'Nama Barang': 'Madu Murni SRA (500ml)',
      'Kategori': 'Madu',
      'Satuan': 'Botol',
      'Deskripsi': 'Madu murni alami 100%',
      'Tier Min Qty': 1,
      'Tier Max Qty': 999999,
      'Harga Satuan (Rp)': 95000
    }
  ];

  const guideData = [
    {
      'Kolom': 'SKU',
      'Wajib': 'Ya',
      'Penjelasan': 'Kode unik barang (contoh: SKU-001). SKU yang sama dalam beberapa baris akan digabung menjadi tier harga barang tersebut.'
    },
    {
      'Kolom': 'Nama Barang',
      'Wajib': 'Ya',
      'Penjelasan': 'Nama produk atau barang yang dijual.'
    },
    {
      'Kolom': 'Kategori',
      'Wajib': 'Tidak',
      'Penjelasan': 'Kategori produk (misal: Kurma, Madu, Sirup, Sembako).'
    },
    {
      'Kolom': 'Satuan',
      'Wajib': 'Tidak',
      'Penjelasan': 'Satuan kuantitas (misal: Dus, Pcs, Botol, Sak, Kg). Default: Pcs.'
    },
    {
      'Kolom': 'Deskripsi',
      'Wajib': 'Tidak',
      'Penjelasan': 'Keterangan detail spesifikasi produk.'
    },
    {
      'Kolom': 'Tier Min Qty',
      'Wajib': 'Ya',
      'Penjelasan': 'Batas minimal kuantitas untuk tier harga ini (misal: 1).'
    },
    {
      'Kolom': 'Tier Max Qty',
      'Wajib': 'Ya',
      'Penjelasan': 'Batas maksimal kuantitas tier ini (isi 999999 untuk tak terhingga).'
    },
    {
      'Kolom': 'Harga Satuan (Rp)',
      'Wajib': 'Ya',
      'Penjelasan': 'Harga per unit dalam mata uang Rupiah tanpa titik/koma (misal: 250000).'
    }
  ];

  const wb = XLSX.utils.book_new();
  const wsTemplate = XLSX.utils.json_to_sheet(templateData);
  const wsGuide = XLSX.utils.json_to_sheet(guideData);

  // Set column widths
  wsTemplate['!cols'] = [
    { wch: 14 }, // SKU
    { wch: 32 }, // Nama Barang
    { wch: 16 }, // Kategori
    { wch: 10 }, // Satuan
    { wch: 40 }, // Deskripsi
    { wch: 14 }, // Min Qty
    { wch: 14 }, // Max Qty
    { wch: 18 }  // Harga
  ];

  wsGuide['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 80 }
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Pricelist');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  XLSX.writeFile(wb, 'Template_Pricelist_Barang_SRA.xlsx');
};

/**
 * Export current items to formatted Excel file
 */
export const exportItemsToExcel = (items: Item[], filename = `Pricelist_SRA_${new Date().toISOString().split('T')[0]}.xlsx`): void => {
  const exportRows: any[] = [];

  items.forEach((item) => {
    if (!item.tiers || item.tiers.length === 0) {
      exportRows.push({
        'SKU': item.sku,
        'Nama Barang': item.name,
        'Kategori': item.category || '',
        'Satuan': item.unit || 'Pcs',
        'Deskripsi': item.description || '',
        'Tier Min Qty': 1,
        'Tier Max Qty': 999999,
        'Harga Satuan (Rp)': 0
      });
    } else {
      item.tiers.forEach((tier) => {
        exportRows.push({
          'SKU': item.sku,
          'Nama Barang': item.name,
          'Kategori': item.category || '',
          'Satuan': item.unit || 'Pcs',
          'Deskripsi': item.description || '',
          'Tier Min Qty': tier.min,
          'Tier Max Qty': tier.max,
          'Harga Satuan (Rp)': tier.price
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 18 },
    { wch: 10 },
    { wch: 40 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pricelist Barang');
  XLSX.writeFile(wb, filename);
};

/**
 * Parse uploaded Excel file for Pricelist Items
 */
export const parseItemsExcelFile = async (file: File, existingItems: Item[]): Promise<ItemImportPreview> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak dikenali.');
        }

        // Helper to find key case-insensitively
        const getVal = (row: any, keys: string[]): any => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
              return row[foundKey];
            }
          }
          return '';
        };

        const existingSkuMap = new Map<string, Item>();
        existingItems.forEach(i => existingSkuMap.set(i.sku.trim().toLowerCase(), i));

        // Group rows by SKU
        const groupedBySku = new Map<string, {
          sku: string;
          name: string;
          category: string;
          unit: string;
          description: string;
          tiers: ItemTier[];
          hasError: boolean;
          errorMsg?: string;
        }>();

        let invalidRowsCount = 0;

        rawJson.forEach((row, index) => {
          const sku = String(getVal(row, ['sku', 'kode', 'kode barang', 'item sku'])).trim();
          const name = String(getVal(row, ['nama barang', 'nama', 'product name', 'item name', 'produk'])).trim();
          const category = String(getVal(row, ['kategori', 'category'])).trim();
          const unit = String(getVal(row, ['satuan', 'unit', 'uom'])).trim() || 'Pcs';
          const description = String(getVal(row, ['deskripsi', 'description', 'keterangan'])).trim();

          const minQtyRaw = getVal(row, ['tier min qty', 'min qty', 'min', 'tier min']);
          const maxQtyRaw = getVal(row, ['tier max qty', 'max qty', 'max', 'tier max']);
          const priceRaw = getVal(row, ['harga satuan (rp)', 'harga satuan', 'harga', 'price', 'unit price']);

          const minQty = Math.max(1, parseInt(String(minQtyRaw)) || 1);
          const maxQty = parseInt(String(maxQtyRaw)) || 999999;
          const price = Math.max(0, parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) || 0);

          if (!sku || !name) {
            invalidRowsCount++;
            return;
          }

          const skuKey = sku.toLowerCase();

          if (!groupedBySku.has(skuKey)) {
            groupedBySku.set(skuKey, {
              sku,
              name,
              category,
              unit,
              description,
              tiers: [{ min: minQty, max: maxQty, price }],
              hasError: false
            });
          } else {
            const existingGroup = groupedBySku.get(skuKey)!;
            // Update item attributes if richer info present
            if (!existingGroup.category && category) existingGroup.category = category;
            if (description && !existingGroup.description) existingGroup.description = description;

            existingGroup.tiers.push({ min: minQty, max: maxQty, price });
          }
        });

        const details: ItemImportPreview['details'] = [];
        const itemsToSave: Item[] = [];

        let newCount = 0;
        let updateCount = 0;

        groupedBySku.forEach((group) => {
          // Sort tiers by min Qty ascending
          group.tiers.sort((a, b) => a.min - b.min);

          const isExisting = existingSkuMap.has(group.sku.toLowerCase());
          const status = isExisting ? 'UPDATE' : 'NEW';

          if (isExisting) updateCount++;
          else newCount++;

          const existingItem = existingSkuMap.get(group.sku.toLowerCase());
          const id = existingItem ? existingItem.id : `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          const itemObj: Item = {
            id,
            sku: group.sku,
            name: group.name,
            category: group.category,
            unit: group.unit,
            description: group.description,
            tiers: group.tiers
          };

          itemsToSave.push(itemObj);

          details.push({
            sku: group.sku,
            name: group.name,
            category: group.category,
            unit: group.unit,
            description: group.description,
            tiers: group.tiers,
            status
          });
        });

        resolve({
          itemsToSave,
          totalRowsParsed: rawJson.length,
          newCount,
          updateCount,
          invalidCount: invalidRowsCount,
          details
        });
      } catch (err: any) {
        reject(err?.message || 'Gagal membaca file Excel.');
      }
    };

    reader.onerror = () => reject('Gagal membaca file.');
    reader.readAsArrayBuffer(file);
  });
};


// ==========================================
// CUSTOMER / PELANGGAN EXCEL HELPERS
// ==========================================

export interface CustomerImportPreview {
  customersToSave: Customer[];
  totalRowsParsed: number;
  newCount: number;
  updateCount: number;
  invalidCount: number;
  details: {
    id: string;
    name: string;
    storeName?: string;
    email: string;
    phone: string;
    address: string;
    npwp: string;
    status: 'NEW' | 'UPDATE' | 'INVALID';
    errorMessage?: string;
  }[];
}

/**
 * Downloads a pre-formatted Excel template for Customers
 */
export const downloadCustomerExcelTemplate = (): void => {
  const templateData = [
    {
      'ID Pelanggan': 'CUST-001',
      'Nama Perusahaan': 'PT Agromakmur Sejahtera',
      'Nama Toko / Supermarket / Outlet': 'Superindo Duren Sawit',
      'Email': 'procurement@agromakmur.co.id',
      'Telepon': '081234567890',
      'Alamat': 'Jl. Industri Raya No. 45, Jakarta Barat',
      'NPWP': '01.234.567.8-012.000'
    },
    {
      'ID Pelanggan': '',
      'Nama Perusahaan': 'CV Berkah Sentosa',
      'Nama Toko / Supermarket / Outlet': 'Toko Berkah Mart Cabang 1',
      'Email': 'info@berkahsentosa.com',
      'Telepon': '089876543210',
      'Alamat': 'Jl. Ahmad Yani No. 12, Bandung',
      'NPWP': '02.345.678.9-123.000'
    }
  ];

  const guideData = [
    {
      'Kolom': 'ID Pelanggan',
      'Wajib': 'Tidak',
      'Penjelasan': 'Kode unik pelanggan (misal: CUST-001). Kosongkan jika ingin sistem membuatkan ID baru secara otomatis.'
    },
    {
      'Kolom': 'Nama Perusahaan',
      'Wajib': 'Ya',
      'Penjelasan': 'Nama lengkap PT/CV/Institusi atau entitas hukum pelanggan.'
    },
    {
      'Kolom': 'Nama Toko / Supermarket / Outlet',
      'Wajib': 'Tidak',
      'Penjelasan': 'Nama Toko, Supermarket, Swalayan, Minimarket, Outlet, atau Cabang spesifik pelanggan.'
    },
    {
      'Kolom': 'Email',
      'Wajib': 'Tidak',
      'Penjelasan': 'Alamat email korespondensi.'
    },
    {
      'Kolom': 'Telepon',
      'Wajib': 'Tidak',
      'Penjelasan': 'Nomor kontak telepon / WhatsApp.'
    },
    {
      'Kolom': 'Alamat',
      'Wajib': 'Tidak',
      'Penjelasan': 'Alamat pengiriman / penagihan / lokasi toko.'
    },
    {
      'Kolom': 'NPWP',
      'Wajib': 'Tidak',
      'Penjelasan': 'Nomor Pokok Wajib Pajak perusahaan.'
    }
  ];

  const wb = XLSX.utils.book_new();
  const wsTemplate = XLSX.utils.json_to_sheet(templateData);
  const wsGuide = XLSX.utils.json_to_sheet(guideData);

  wsTemplate['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 30 },
    { wch: 28 },
    { wch: 16 },
    { wch: 45 },
    { wch: 22 }
  ];

  wsGuide['!cols'] = [
    { wch: 24 },
    { wch: 10 },
    { wch: 80 }
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Pelanggan');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  XLSX.writeFile(wb, 'Template_Pelanggan_SRA.xlsx');
};

/**
 * Export current customers to formatted Excel file
 */
export const exportCustomersToExcel = (customers: Customer[], filename = `Master_Pelanggan_SRA_${new Date().toISOString().split('T')[0]}.xlsx`): void => {
  const exportRows = customers.map(c => ({
    'ID Pelanggan': c.id,
    'Nama Perusahaan': c.name,
    'Nama Toko / Supermarket / Outlet': c.storeName || '',
    'Email': c.email || '',
    'Telepon': c.phone || '',
    'Alamat': c.address || '',
    'NPWP': c.npwp || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws['!cols'] = [
    { wch: 16 },
    { wch: 35 },
    { wch: 30 },
    { wch: 28 },
    { wch: 16 },
    { wch: 50 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Pelanggan');
  XLSX.writeFile(wb, filename);
};

/**
 * Parse uploaded Excel file for Customers
 */
export const parseCustomersExcelFile = async (file: File, existingCustomers: Customer[]): Promise<CustomerImportPreview> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak dikenali.');
        }

        const getVal = (row: any, keys: string[]): any => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
              return row[foundKey];
            }
          }
          return '';
        };

        const existingIdMap = new Map<string, Customer>();
        const existingNameMap = new Map<string, Customer>();

        existingCustomers.forEach(c => {
          if (c.id) existingIdMap.set(c.id.trim().toLowerCase(), c);
          if (c.name) existingNameMap.set(c.name.trim().toLowerCase(), c);
        });

        const details: CustomerImportPreview['details'] = [];
        const customersToSave: Customer[] = [];

        let newCount = 0;
        let updateCount = 0;
        let invalidCount = 0;

        rawJson.forEach((row, index) => {
          let id = String(getVal(row, ['id pelanggan', 'id', 'kode pelanggan', 'cust id'])).trim();
          const name = String(getVal(row, ['nama perusahaan', 'nama pelanggan', 'nama', 'company name', 'customer'])).trim();
          const storeName = String(getVal(row, [
            'nama toko / supermarket / outlet',
            'nama toko / supermarket',
            'nama toko',
            'nama supermarket',
            'nama outlet',
            'toko / supermarket / outlet',
            'toko / supermarket',
            'toko',
            'supermarket',
            'outlet',
            'outler',
            'store',
            'store name',
            'cabang',
            'nama cabang'
          ])).trim();
          const email = String(getVal(row, ['email', 'alamat email'])).trim();
          const phone = String(getVal(row, ['telepon', 'phone', 'hp', 'whatsapp', 'no telp'])).trim();
          const address = String(getVal(row, ['alamat', 'address'])).trim();
          const npwp = String(getVal(row, ['npwp', 'no npwp'])).trim();

          if (!name) {
            invalidCount++;
            details.push({
              id: id || `ROW-${index + 1}`,
              name: '(Kosong)',
              storeName,
              email,
              phone,
              address,
              npwp,
              status: 'INVALID',
              errorMessage: 'Nama perusahaan wajib diisi'
            });
            return;
          }

          // Check if matches existing customer by ID or Name
          let existing: Customer | undefined = undefined;
          if (id) existing = existingIdMap.get(id.toLowerCase());
          if (!existing) existing = existingNameMap.get(name.toLowerCase());

          let status: 'NEW' | 'UPDATE' = 'NEW';
          if (existing) {
            status = 'UPDATE';
            updateCount++;
            if (!id) id = existing.id;
          } else {
            newCount++;
            if (!id) id = `CUST-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
          }

          const custObj: Customer = {
            id,
            name,
            storeName: storeName || existing?.storeName || '',
            email,
            phone,
            address,
            npwp
          };

          customersToSave.push(custObj);

          details.push({
            id,
            name,
            storeName,
            email,
            phone,
            address,
            npwp,
            status
          });
        });

        resolve({
          customersToSave,
          totalRowsParsed: rawJson.length,
          newCount,
          updateCount,
          invalidCount,
          details
        });
      } catch (err: any) {
        reject(err?.message || 'Gagal membaca file Excel.');
      }
    };

    reader.onerror = () => reject('Gagal membaca file.');
    reader.readAsArrayBuffer(file);
  });
};

// ==========================================
// QUOTATIONS & SALES ORDER REPORT EXCEL EXPORT
// ==========================================

export const exportQuotationsToExcel = (
  quotations: any[], 
  items: Item[] = [],
  filename = `Laporan_Transaksi_SRA_${new Date().toISOString().split('T')[0]}.xlsx`
): void => {
  const itemMap = new Map<string, Item>();
  items.forEach(i => itemMap.set(i.id, i));

  // Sheet 1: Quotations & SO Summary
  const summaryRows = quotations.map((q, idx) => {
    const isSO = q.isSO === true || q.status === 'SO_Confirmed';
    return {
      'No': idx + 1,
      'Tipe Dokumen': isSO ? 'Sales Order (SO)' : 'Quotation (Penawaran)',
      'No Dokumen': q.id,
      'No Sales Order': q.soNumber || (isSO ? q.id : '-'),
      'PT Penerbit': q.issuingCompany || '-',
      'Tanggal Dokumen': q.date || '-',
      'Tanggal Order (SO)': q.orderDate || (isSO ? q.date : '-'),
      'Jatuh Tempo': q.dueDate || (q.validUntil ? `Valid s/d ${q.validUntil}` : '-'),
      'Status Pembayaran': isSO ? (q.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS') : '-',
      'Nama Pelanggan / Perusahaan': q.customerName || '-',
      'Nama Toko / Supermarket / Outlet': q.storeName || '-',
      'Up / PIC': q.attnName || '-',
      'Email Klien': q.customerEmail || '-',
      'NPWP Klien': q.customerNpwp || '-',
      'Status Dokumen': q.status || 'Draft',
      'Approval Overlimit Manager': q.isApprovedByManager ? `Disetujui (${q.approvedByManagerName || 'Manager'})` : 'Normal / Standar',
      'Dibuat Oleh': q.createdBy || '-',
      'Jml Item': Array.isArray(q.items) ? q.items.length : 0,
      'Subtotal (Rp)': q.subtotal || 0,
      'Diskon (Rp)': q.discountValue || 0,
      'PPN Rate (%)': q.taxRate || 0,
      'PPN (Rp)': q.taxValue || 0,
      'Grand Total (Rp)': q.total || 0,
      'Termin Bayar': q.paymentTerm || '-',
      'Catatan Khusus': q.notes || '',
      'Catatan Internal': q.internalNotes || ''
    };
  });

  // Sheet 2: Line Items Detail
  const detailRows: any[] = [];
  quotations.forEach((q) => {
    const isSO = q.isSO === true || q.status === 'SO_Confirmed';
    if (Array.isArray(q.items)) {
      q.items.forEach((qi: any, itemIdx: number) => {
        const product = itemMap.get(qi.itemId);
        detailRows.push({
          'Tipe': isSO ? 'SO' : 'Quotation',
          'No Dokumen': q.id,
          'No SO': q.soNumber || (isSO ? q.id : '-'),
          'Tanggal': q.date,
          'Jatuh Tempo': q.dueDate || '-',
          'Status Bayar': isSO ? (q.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS') : '-',
          'Nama Pelanggan': q.customerName,
          'Nama Toko / Supermarket / Outlet': q.storeName || '-',
          'No Item': itemIdx + 1,
          'SKU': product?.sku || '-',
          'Nama Barang': product?.name || qi.itemId || 'Item',
          'Kategori': product?.category || '-',
          'Qty': qi.qty,
          'Satuan': product?.unit || 'Pcs',
          'Harga Tier (Rp)': qi.unitPrice,
          'Diskon Tipe': qi.itemDiscountType === 'percentage' ? '%' : 'Nominal',
          'Diskon Item': qi.itemDiscount || 0,
          'Subtotal (Rp)': qi.subtotal
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetails = XLSX.utils.json_to_sheet(detailRows);

  wsSummary['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // Tipe Dokumen
    { wch: 18 }, // No Dokumen
    { wch: 18 }, // No SO
    { wch: 28 }, // PT Penerbit
    { wch: 15 }, // Tanggal
    { wch: 16 }, // Tanggal Order
    { wch: 16 }, // Jatuh Tempo
    { wch: 18 }, // Status Bayar
    { wch: 32 }, // Nama Pelanggan
    { wch: 30 }, // Toko / Supermarket / Outlet
    { wch: 20 }, // Up / PIC
    { wch: 24 }, // Email
    { wch: 20 }, // NPWP
    { wch: 14 }, // Status Dokumen
    { wch: 26 }, // Approval Overlimit
    { wch: 15 }, // Dibuat Oleh
    { wch: 10 }, // Jml Item
    { wch: 16 }, // Subtotal
    { wch: 14 }, // Diskon
    { wch: 12 }, // PPN %
    { wch: 14 }, // PPN Rp
    { wch: 18 }, // Total
    { wch: 16 }, // Termin
    { wch: 35 }, // Catatan
    { wch: 35 }  // Internal Notes
  ];

  wsDetails['!cols'] = [
    { wch: 12 }, // Tipe
    { wch: 16 }, // No Dokumen
    { wch: 16 }, // No SO
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Jatuh Tempo
    { wch: 14 }, // Status Bayar
    { wch: 28 }, // Pelanggan
    { wch: 28 }, // Toko / Outlet
    { wch: 8 },  // No Item
    { wch: 14 }, // SKU
    { wch: 35 }, // Nama Barang
    { wch: 16 }, // Kategori
    { wch: 10 }, // Qty
    { wch: 10 }, // Satuan
    { wch: 16 }, // Harga
    { wch: 12 }, // Diskon Tipe
    { wch: 12 }, // Diskon Item
    { wch: 16 }  // Subtotal
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Transaksi');
  if (detailRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Rincian Item Produk');
  }

  XLSX.writeFile(wb, filename);
};

// ==========================================
// AUDIT LOGS EXCEL EXPORT
// ==========================================

export const exportAuditLogsToExcel = (
  logs: any[],
  filename = `Log_Audit_SRA_${new Date().toISOString().split('T')[0]}.xlsx`
): void => {
  const exportRows = logs.map((l, idx) => ({
    'No': idx + 1,
    'Waktu': l.timestamp || '-',
    'User': l.name || l.username || '-',
    'Username': l.username || '-',
    'Aktivitas / Event': l.action || 'INFO',
    'Detail Keterangan': l.details || '-'
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 55 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Log Audit Sistem');
  XLSX.writeFile(wb, filename);
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronUp, ChevronDown, Building2, Users, Package, 
  PlusCircle, XCircle, Save, AlertCircle, AlertTriangle, ShieldCheck, 
  ClipboardList, FileText, Calendar, DollarSign, Clock, Store, Check
} from 'lucide-react';
import { Quotation, Item, Customer, Settings, User, QuotationItem } from '../types';
import { 
  getSraGroupEntities, formatIDR, generateID, calculateDueDate, 
  getCustomerCreditStatus, parsePaymentTermDays, defaultSettings,
  isSupervisoryRole
} from '../utils/helpers';
import { ItemSelect } from './ItemSelect';

interface CreateQuotationProps {
  items: Item[];
  customers: Customer[];
  quotations?: Quotation[];
  users?: User[];
  onSave: (quote: Quotation) => void;
  onCancel: () => void;
  initialData?: Quotation | null;
  settings: Settings;
  currentUser: User;
}

export function CreateQuotation({ 
  items, 
  customers, 
  quotations = [], 
  users = [],
  onSave, 
  onCancel, 
  initialData, 
  settings, 
  currentUser 
}: CreateQuotationProps) {
  const entities = getSraGroupEntities(settings || defaultSettings);
  const isManager = isSupervisoryRole(currentUser?.role);

  // Sales PIC Attribution (Manager can reassign/assign to any sales rep)
  const [assignedSalesUsername, setAssignedSalesUsername] = useState<string>(() => {
    return initialData?.createdBy || currentUser?.username || 'user';
  });
  const [assignedSalesName, setAssignedSalesName] = useState<string>(() => {
    return initialData?.salesName || currentUser?.name || currentUser?.username || 'Sales Rep';
  });

  // Document Type: Quotation vs Sales Order (SO)
  const [docType, setDocType] = useState<'QUOTATION' | 'SALES_ORDER'>(() => {
    if (initialData?.isSO || initialData?.status === 'SO_Confirmed') return 'SALES_ORDER';
    return 'QUOTATION';
  });

  const [issuingCompany, setIssuingCompany] = useState<string>(() => initialData?.issuingCompany || Object.keys(entities)[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customer, setCustomer] = useState({ 
    name: '', 
    storeName: '', 
    attnName: '', 
    email: '', 
    address: '', 
    npwp: '' 
  });
  
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([
    { id: Date.now(), itemId: '', qty: 1, unitPrice: 0, subtotal: 0, itemDiscount: 0, itemDiscountType: 'nominal' }
  ]);
  const [discountType, setDiscountType] = useState<'nominal' | 'percentage' | string>('nominal'); 
  const [discountInput, setDiscountInput] = useState<number | string>(0);
  const [taxRate, setTaxRate] = useState<number | string>(0);
  const [paymentTerm, setPaymentTerm] = useState('Net 14 Hari');
  const [notes, setNotes] = useState(settings?.defaultNotes || '');
  const [internalNotes, setInternalNotes] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  
  // SO Specific States
  const [soNumber, setSoNumber] = useState(() => {
    if (initialData?.soNumber) return initialData.soNumber;
    return `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [orderDate, setOrderDate] = useState(() => {
    return initialData?.orderDate || initialData?.soDate || new Date().toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    if (initialData?.dueDate) return initialData.dueDate;
    return calculateDueDate(new Date().toISOString().split('T')[0], 'Net 14 Hari');
  });
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID'>(() => {
    return (initialData?.paymentStatus as any) || 'UNPAID';
  });
  
  // Manager Overlimit Approval States
  const [isApprovedByManager, setIsApprovedByManager] = useState<boolean>(() => {
    return initialData?.isApprovedByManager || false;
  });
  const [managerApprovalNotes, setManagerApprovalNotes] = useState<string>(() => {
    return initialData?.managerApprovalNotes || '';
  });
  const [managerPinInput, setManagerPinInput] = useState('');

  const [error, setError] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.issuingCompany) setIssuingCompany(initialData.issuingCompany);
      const foundCust = (customers || []).find(c => c && c.name === initialData.customerName);
      if (foundCust) setSelectedCustomerId(foundCust.id);
      setCustomer({ 
        name: initialData.customerName || '', 
        storeName: initialData.storeName || foundCust?.storeName || '',
        attnName: initialData.attnName || '', 
        email: initialData.customerEmail || '', 
        address: initialData.customerAddress || '', 
        npwp: initialData.customerNpwp || '' 
      });
      const initialItemsList = Array.isArray(initialData.items) ? initialData.items : [];
      setQuoteItems(
        initialItemsList.length > 0 
          ? initialItemsList.map((i, idx) => ({ ...i, id: Date.now() + idx, itemDiscount: i?.itemDiscount || 0, itemDiscountType: i?.itemDiscountType || 'nominal' }))
          : [{ id: Date.now(), itemId: '', qty: 1, unitPrice: 0, subtotal: 0, itemDiscount: 0, itemDiscountType: 'nominal' }]
      );
      setDiscountType(initialData.discountType || 'nominal'); 
      setDiscountInput(initialData.discountInput ?? initialData.discountValue ?? 0);
      setTaxRate(initialData.taxRate ?? settings?.defaultTaxRate ?? 0); 
      setPaymentTerm(initialData.paymentTerm || 'Net 14 Hari');
      setNotes(initialData.notes || settings?.defaultNotes || ''); 
      setInternalNotes(initialData.internalNotes || '');
      setQuoteDate(initialData.date || new Date().toISOString().split('T')[0]); 
      setValidUntil(initialData.validUntil || '');
      
      if (initialData.isSO) {
        setDocType('SALES_ORDER');
        if (initialData.soNumber) setSoNumber(initialData.soNumber);
        if (initialData.orderDate || initialData.soDate) setOrderDate(initialData.orderDate || initialData.soDate || '');
        if (initialData.dueDate) setDueDate(initialData.dueDate);
        if (initialData.paymentStatus) setPaymentStatus(initialData.paymentStatus as any);
        if (initialData.isApprovedByManager) setIsApprovedByManager(true);
        if (initialData.managerApprovalNotes) setManagerApprovalNotes(initialData.managerApprovalNotes);
      }
    } else {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setQuoteDate(todayStr);
      setOrderDate(todayStr);
      
      const valDate = new Date();
      valDate.setDate(valDate.getDate() + 14); 
      setValidUntil(valDate.toISOString().split('T')[0]);
      
      setDueDate(calculateDueDate(todayStr, 'Net 14 Hari'));
      setTaxRate(settings?.defaultTaxRate ?? 0);
    }
  }, [initialData, customers, settings]);

  // Recalculate Due Date whenever Order Date or Payment Term changes
  const handlePaymentTermChange = (newTerm: string) => {
    setPaymentTerm(newTerm);
    const calculated = calculateDueDate(orderDate || quoteDate || new Date().toISOString().split('T')[0], newTerm);
    setDueDate(calculated);
  };

  const handleOrderDateChange = (newOrderDate: string) => {
    setOrderDate(newOrderDate);
    const calculated = calculateDueDate(newOrderDate, paymentTerm);
    setDueDate(calculated);
  };

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id) { 
      const selected = customers.find(c => c.id === id); 
      if (selected) {
        setCustomer({ 
          name: selected.name, 
          storeName: selected.storeName || '', 
          attnName: selected.attnName || '', 
          email: selected.email || '', 
          address: selected.address || '', 
          npwp: selected.npwp || '' 
        }); 
      }
    } else { 
      setCustomer({ name: '', storeName: '', attnName: '', email: '', address: '', npwp: '' }); 
    }
  };

  const calculateTierPrice = (itemId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.tiers || item.tiers.length === 0) return 0;
    const matchingTier = item.tiers.find(t => qty >= t.min && qty <= t.max);
    return matchingTier ? matchingTier.price : (item.tiers[item.tiers.length-1]?.price || 0);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...quoteItems]; 
    const item = { ...newItems[index] }; 
    (item as any)[field] = value;
    if (field === 'itemId' || field === 'qty') item.unitPrice = calculateTierPrice(item.itemId, Number(item.qty));
    const currentQty = Number(item.qty) || 0; 
    const grossTotal = item.unitPrice * currentQty;
    let discountValue = item.itemDiscountType === 'percentage' ? (grossTotal * (Number(item.itemDiscount || 0) / 100)) : Number(item.itemDiscount || 0);
    item.subtotal = Math.max(0, grossTotal - discountValue);
    newItems[index] = item;
    setQuoteItems(newItems); 
    setError('');
  };

  const moveQuoteItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...quoteItems];
    if (direction === 'up' && index > 0) [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    else if (direction === 'down' && index < quoteItems.length - 1) [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setQuoteItems(newItems);
  };

  const rawSubtotal = quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedDiscount = discountType === 'percentage' ? (rawSubtotal * (Number(discountInput) / 100)) : Number(discountInput);
  const finalDiscount = Math.min(calculatedDiscount, rawSubtotal); 
  const afterDiscount = rawSubtotal - finalDiscount;
  const taxValue = afterDiscount * (Number(taxRate) / 100);
  const grandTotal = afterDiscount + taxValue;

  // Selected customer object & credit status
  const currentCustomerObj = useMemo(() => {
    if (selectedCustomerId) return customers.find(c => c.id === selectedCustomerId);
    if (customer.name) return customers.find(c => c.name.toLowerCase().trim() === customer.name.toLowerCase().trim());
    return null;
  }, [selectedCustomerId, customer.name, customers]);

  // Exclude current editing quotation from used credit calculation so it doesn't double count itself
  const filteredQuotationsForCredit = useMemo(() => {
    if (!initialData?.id) return quotations;
    return quotations.filter(q => q.id !== initialData.id);
  }, [quotations, initialData]);

  const creditStatus = useMemo(() => {
    return getCustomerCreditStatus(
      currentCustomerObj || customer.name, 
      customers, 
      filteredQuotationsForCredit
    );
  }, [currentCustomerObj, customer.name, customers, filteredQuotationsForCredit]);

  // Validation logic for credit limit
  const orderCheck = useMemo(() => {
    if (docType !== 'SALES_ORDER') return { allowed: true, deficit: 0 };
    return creditStatus.canMakeOrder(grandTotal);
  }, [docType, creditStatus, grandTotal]);

  const remainingAfterOrder = Math.max(0, creditStatus.remainingCredit - grandTotal);
  const remainingPctAfterOrder = creditStatus.creditLimit > 0 
    ? (remainingAfterOrder / creditStatus.creditLimit) * 100 
    : 0;
  const willTriggerWarning = docType === 'SALES_ORDER' && 
    orderCheck.allowed && 
    creditStatus.creditLimit > 0 && 
    remainingPctAfterOrder <= (creditStatus.warningThresholdPct || 10);

  const handleSave = () => {
    setError('');
    setWarningMsg('');

    if (!customer.name.trim()) return setError("Nama Perusahaan / Klien wajib diisi.");
    if (quoteItems.length === 0 || quoteItems.some(i => !i.itemId)) return setError("Pastikan semua baris sudah terisi barang.");

    // ENFORCE CREDIT LIMIT FOR SALES ORDER
    if (docType === 'SALES_ORDER') {
      if (!soNumber.trim()) return setError("Nomor Sales Order (SO) wajib diisi.");

      if (!orderCheck.allowed) {
        // Exceeded limit: Check if authorized
        const isAuthorized = isApprovedByManager || isManager || currentCustomerObj?.allowOverlimit;
        
        if (!isAuthorized) {
          // If sales inputted manager PIN '123' or 'admin'
          if (managerPinInput === '123' || managerPinInput === 'admin' || managerPinInput === '8888') {
            // Authorized via PIN
            setIsApprovedByManager(true);
          } else {
            return setError(
              `🚫 GAGAL SIMPAN SO: Nilai pesanan (${formatIDR(grandTotal)}) melebihi sisa limit kredit pelanggan (${formatIDR(creditStatus.remainingCredit)}). Defisit limit: ${formatIDR(orderCheck.deficit)}. Orderan tidak dapat dibuat kecuali nilai limit disesuaikan atau disetujui oleh Manager.`
            );
          }
        }
      }
    }

    const currentEntity = entities[issuingCompany] || Object.values(entities)[0];
    const isSoMode = docType === 'SALES_ORDER';

    const finalCreatedBy = isManager ? (assignedSalesUsername || currentUser?.username || 'user') : (initialData?.createdBy || currentUser?.username || 'user');
    const finalSalesName = isManager ? (assignedSalesName || currentUser?.name || currentUser?.username || 'Sales Rep') : (initialData?.salesName || currentUser?.name || currentUser?.username || 'Sales Rep');
    const assignedUserObj = users.find(u => u.username === finalCreatedBy);
    const finalCreatedByRole = assignedUserObj?.role || initialData?.createdByRole || currentUser?.role || 'sales';

    const newQuote: Quotation = {
      id: initialData?.id || generateID(isSoMode ? 'SO' : (settings?.quotePrefix || 'QUO')),
      issuingCompany, 
      companyNpwp: currentEntity?.companyNpwp || '', 
      companyAddress: currentEntity?.companyAddress || '', 
      bankDetails: currentEntity?.bankDetails || '',
      createdBy: finalCreatedBy, 
      createdByName: finalSalesName,
      createdByEmail: assignedUserObj?.email || currentUser?.email || '',
      createdByRole: finalCreatedByRole,
      salesId: assignedUserObj?.salesId || assignedUserObj?.id || finalCreatedBy,
      salesName: finalSalesName,
      salesEmail: assignedUserObj?.email || currentUser?.email || '',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'user',
      updatedByName: currentUser?.name || currentUser?.username || 'User',
      date: isSoMode ? (orderDate || quoteDate) : quoteDate, 
      status: isSoMode 
        ? (initialData?.status === 'Accepted' || initialData?.status === 'SO_Confirmed' ? initialData.status : 'SO_Confirmed') 
        : (initialData?.status || 'Draft'),
      customerName: customer.name, 
      storeName: customer.storeName, 
      attnName: customer.attnName, 
      customerEmail: customer.email, 
      customerAddress: customer.address, 
      customerNpwp: customer.npwp,
      items: quoteItems.map(qi => ({ 
        itemId: qi.itemId, 
        qty: Number(qi.qty), 
        unitPrice: qi.unitPrice, 
        subtotal: qi.subtotal, 
        itemDiscount: Number(qi.itemDiscount || 0), 
        itemDiscountType: qi.itemDiscountType || 'nominal' 
      })),
      subtotal: rawSubtotal, 
      discountType, 
      discountInput: Number(discountInput), 
      discountValue: finalDiscount, 
      taxRate: Number(taxRate), 
      taxValue, 
      total: grandTotal, 
      paymentTerm, 
      notes, 
      internalNotes, 
      validUntil,
      
      // SO Fields
      isSO: isSoMode,
      soNumber: isSoMode ? soNumber : undefined,
      soDate: isSoMode ? orderDate : undefined,
      orderDate: isSoMode ? orderDate : undefined,
      dueDate: isSoMode ? dueDate : undefined,
      paymentStatus: isSoMode ? paymentStatus : undefined,
      isApprovedByManager: isSoMode ? (isApprovedByManager || isManager) : undefined,
      managerApprovedBy: (isApprovedByManager || isManager) ? (currentUser?.name || currentUser?.username) : undefined,
      managerApprovalNotes: managerApprovalNotes || undefined
    };

    onSave(newQuote);
  };

  const activeEntityDetails = entities[issuingCompany] || Object.values(entities)[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 relative z-10 font-sans pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 clay-button-secondary text-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {docType === 'SALES_ORDER' ? (
                <>
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  {initialData ? 'Edit Sales Order (SO)' : 'Buat Sales Order Baru (SO)'}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-emerald-600" />
                  {initialData ? 'Edit Penawaran Harga' : 'Buat Penawaran Baru (Quotation)'}
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {docType === 'SALES_ORDER' 
                ? 'Pesanan pasti dari customer — memotong plafon kredit & menetapkan jatuh tempo.'
                : 'Estimasi penawaran harga — belum memotong plafon kredit hingga dikonfirmasi SO.'}
            </p>
          </div>
        </div>

        {/* Document Type Switcher Buttons */}
        <div className="p-1 bg-[#e0e8f2] rounded-2xl border border-slate-300 flex shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => { setDocType('QUOTATION'); setError(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              docType === 'QUOTATION'
                ? 'clay-button-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 font-bold'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Penawaran (Quotation)
          </button>
          <button
            type="button"
            onClick={() => { setDocType('SALES_ORDER'); setError(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              docType === 'SALES_ORDER'
                ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                : 'text-slate-700 hover:text-slate-900 font-bold'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-900" />
            Sales Order (SO)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 clay-card bg-rose-50 text-rose-900 border border-rose-300 flex items-start gap-3 font-bold text-sm animate-in zoom-in-95">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-black">Perhatian / Transaksi Ditolak:</p>
            <p className="text-xs mt-0.5 text-rose-800">{error}</p>
          </div>
        </div>
      )}

      {willTriggerWarning && (
        <div className="p-4 clay-card bg-amber-50 text-amber-950 border border-amber-300 flex items-start gap-3 text-sm animate-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-black text-amber-900">Peringatan Limit Kredit:</p>
            <p className="text-xs mt-0.5 text-amber-900 font-semibold">
              Sisa plafon kredit pelanggan setelah order ini tersisa <strong className="tabular-nums">{formatIDR(remainingAfterOrder)} ({Math.round(remainingPctAfterOrder)}%)</strong>, berada di bawah batas waspada ({creditStatus.warningThresholdPct}%).
            </p>
          </div>
        </div>
      )}

      {/* PT Penerbit & Sales PIC Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600"/> PT Penerbit (SRA Group)
          </h3>
          <select 
            value={issuingCompany} 
            onChange={e => setIssuingCompany(e.target.value)} 
            className="w-full p-3.5 clay-input font-bold text-sm cursor-pointer outline-none"
          >
            {Object.keys(entities).map(ptName => (
              <option key={ptName} value={ptName} className="bg-white text-slate-900">{ptName}</option>
            ))}
          </select>
          <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
            <div><span className="text-slate-500 font-medium">NPWP:</span> <span className="font-bold text-slate-900">{activeEntityDetails?.companyNpwp || '-'}</span></div>
            <div><span className="text-slate-500 font-medium">Rekening:</span> <span className="font-mono font-bold text-slate-900">{activeEntityDetails?.bankDetails ? (activeEntityDetails.bankDetails.split('\n')[1] || activeEntityDetails.bankDetails.split('\n')[0]) : '-'}</span></div>
          </div>
        </div>

        {/* Sales PIC Assignment Card (Supervisi Manager) */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700"/> Sales Rep PIC (Penanggung Jawab)
              </h3>
              {isManager ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                  Manager Override
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                  Sales PIC
                </span>
              )}
            </div>

            {isManager ? (
              <div className="space-y-2">
                <select
                  value={assignedSalesUsername}
                  onChange={e => {
                    const uVal = e.target.value;
                    setAssignedSalesUsername(uVal);
                    const found = users.find(u => u.username === uVal);
                    if (found) {
                      setAssignedSalesName(found.name || found.username);
                    }
                  }}
                  className="w-full p-3.5 clay-input font-bold text-sm cursor-pointer outline-none text-slate-900"
                >
                  <option value={currentUser.username}>
                    Saya Sendiri ({currentUser.name || currentUser.username}) • Manager
                  </option>
                  {users.filter(u => u.username !== currentUser.username).map(u => (
                    <option key={u.id || u.username} value={u.username}>
                      {u.name || u.username} (@{u.username}) • {u.role.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
                  <span>Nama Display: <strong className="text-slate-900">{assignedSalesName}</strong></span>
                  <span className="text-[10px] text-slate-500 font-mono">@{assignedSalesUsername}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm shrink-0">
                  {(currentUser.name || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{currentUser.name || currentUser.username}</p>
                  <p className="text-[10px] text-slate-500 font-bold">Username: @{currentUser.username} • Sales Rep</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
            {isManager 
              ? '👑 Manager dapat menetapkan atau mengubah sales PIC untuk penawaran ini.' 
              : 'Dokumen ini akan otomatis tercatat atas nama akun sales Anda.'}
          </p>
        </div>
      </div>

      {/* Data Klien & Real-time Credit Limit Widget */}
      <div className="clay-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600"/> Data Pelanggan / Klien
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            {currentCustomerObj ? `ID: ${currentCustomerObj.id}` : 'Customer Baru / Manual'}
          </span>
        </div>

        {/* Master Customer Selection */}
        <div className="p-4 bg-[#eaf0f7] rounded-2xl border border-slate-200/60">
          <label className="block text-xs font-bold text-slate-700 mb-2">Pilih dari Master Pelanggan</label>
          <select 
            value={selectedCustomerId} 
            onChange={e => handleCustomerSelect(e.target.value)} 
            className="w-full p-3.5 clay-input font-bold text-slate-900 text-sm outline-none"
          >
            <option value="" className="text-slate-400">-- Input Manual Pelanggan --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.storeName ? ` (${c.storeName})` : ''} • Plafon: {formatIDR(c.creditLimit ?? 50000000)}
              </option>
            ))}
          </select>
        </div>

        {/* Real-time Customer Credit Status Widget */}
        {customer.name.trim() && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Status Plafon Kredit: <span className="text-indigo-900">{customer.name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {creditStatus.activeSoCount} Transaksi SO Aktif Belum Lunas
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                  creditStatus.isExhausted
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : creditStatus.isNearExhaustion
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {creditStatus.isExhausted 
                    ? '⛔ Plafon Habis' 
                    : creditStatus.isNearExhaustion 
                    ? `⚠️ Sisa ≤ ${creditStatus.warningThresholdPct}%` 
                    : '✅ Plafon Tersedia'}
                </span>
              </div>
            </div>

            {/* Credit Numbers Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">Plafon Disepakati</p>
                <p className="text-sm font-black text-slate-900 tabular-nums">{formatIDR(creditStatus.creditLimit)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">Terpakai Saat Ini</p>
                <p className="text-sm font-black text-rose-700 tabular-nums">{formatIDR(creditStatus.usedCredit)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-emerald-700">Sisa Plafon Tersedia</p>
                <p className="text-sm font-black text-emerald-700 tabular-nums">{formatIDR(creditStatus.remainingCredit)}</p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Terpakai: {Math.round(creditStatus.usedPercentage)}%</span>
                <span>Sisa: {Math.round(creditStatus.remainingPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    creditStatus.isExhausted 
                      ? 'bg-rose-500' 
                      : creditStatus.isNearExhaustion 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, creditStatus.usedPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Kepada (PT / Perusahaan) *</label>
            <input 
              type="text" 
              value={customer.name} 
              onChange={e => { setCustomer({...customer, name: e.target.value}); setError(''); }} 
              className="w-full p-3.5 clay-input text-sm font-semibold" 
              placeholder="PT Maju Bersama"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              Nama Toko / Supermarket / Outlet
            </label>
            <input 
              type="text" 
              value={customer.storeName || ''} 
              onChange={e => setCustomer({...customer, storeName: e.target.value})} 
              className="w-full p-3.5 clay-input text-sm font-semibold" 
              placeholder="Superindo Duren Sawit / Hypermart Puri"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Up : (Nama Customer / Kontak)</label>
            <input 
              type="text" 
              value={customer.attnName || ''} 
              onChange={e => setCustomer({...customer, attnName: e.target.value})} 
              className="w-full p-3.5 clay-input text-sm font-semibold" 
              placeholder="Bp. Andi / Purchasing Head"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email</label>
              <input 
                type="email" 
                value={customer.email} 
                onChange={e => setCustomer({...customer, email: e.target.value})} 
                className="w-full p-3.5 clay-input text-sm font-semibold"
                placeholder="purchasing@client.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">NPWP</label>
              <input 
                type="text" 
                value={customer.npwp || ''} 
                onChange={e => setCustomer({...customer, npwp: e.target.value})} 
                className="w-full p-3.5 clay-input text-sm font-semibold"
                placeholder="01.234.567.8-012.000"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Alamat Lengkap Pengiriman / Kantor</label>
            <textarea 
              value={customer.address} 
              onChange={e => setCustomer({...customer, address: e.target.value})} 
              className="w-full p-3.5 clay-input text-sm font-semibold" 
              rows={2}
              placeholder="Jl. Raya Industri No. 45, Kawasan Industri, Jakarta"
            />
          </div>
        </div>
      </div>

      {/* SALES ORDER SPECIFIC CONFIGURATION PANEL */}
      {docType === 'SALES_ORDER' && (
        <div className="clay-card p-6 bg-gradient-to-br from-amber-50/90 via-white to-slate-50 border border-amber-300 space-y-5 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-700" />
              Parameter Sales Order & Termin Jatuh Tempo
            </h3>
            <span className="px-2.5 py-1 rounded-md bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider">
              SO Aktif Memotong Limit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">No. Sales Order (SO) *</label>
              <input 
                type="text" 
                value={soNumber} 
                onChange={e => setSoNumber(e.target.value)} 
                className="w-full p-3.5 clay-input text-sm font-black text-amber-950" 
                placeholder="27795 atau SO-2026-001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Tanggal Order Berlaku
              </label>
              <input 
                type="date" 
                value={orderDate} 
                onChange={e => handleOrderDateChange(e.target.value)} 
                className="w-full p-3.5 clay-input text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Termin Pembayaran (Tenor)</label>
              <select 
                value={paymentTerm} 
                onChange={e => handlePaymentTermChange(e.target.value)} 
                className="w-full p-3.5 clay-input text-sm font-bold cursor-pointer"
              >
                <option value="Cash / COD">Cash / COD (Tunai Saat Terima)</option>
                <option value="CBD (Cash Before Delivery)">CBD (Bayar Sebelum Kirim)</option>
                <option value="Net 7 Hari">Net 7 Hari (Tempo 1 Minggu)</option>
                <option value="Net 14 Hari">Net 14 Hari (Tempo 2 Minggu)</option>
                <option value="Net 21 Hari">Net 21 Hari (Tempo 3 Minggu)</option>
                <option value="Net 30 Hari">Net 30 Hari (Tempo 1 Bulan)</option>
                <option value="Net 45 Hari">Net 45 Hari (Tempo 45 Hari)</option>
                <option value="Net 60 Hari">Net 60 Hari (Tempo 2 Bulan)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300">
              <label className="block text-[10px] font-black uppercase text-amber-900 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-800" /> Estimasi Tgl Jatuh Tempo
              </label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="w-full p-2 clay-input text-xs font-black text-rose-900"
              />
              <p className="text-[10px] text-amber-800 font-bold mt-1">
                Tenor: {parsePaymentTermDays(paymentTerm)} Hari dari tanggal order
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300">
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Status Pembayaran Awal
              </label>
              <select 
                value={paymentStatus} 
                onChange={e => setPaymentStatus(e.target.value as any)} 
                className="w-full p-2 clay-input text-xs font-bold"
              >
                <option value="UNPAID">🔴 Belum Lunas (Piutang Berjalan)</option>
                <option value="PAID">🟢 Sudah Lunas (Langsung Lunas)</option>
              </select>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                {paymentStatus === 'PAID' ? 'Tidak memotong limit kredit' : 'Akan memotong sisa limit transaksi customer'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-900">Pemberitahuan Alert H-3</p>
                <p className="text-[11px] font-bold text-indigo-950 mt-1">
                  Sistem otomatis memberikan notifikasi pengingat 3 hari sebelum jatuh tempo di daftar SO & dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* MANAGER OVERLIMIT APPROVAL SECTION (If order exceeds limit) */}
          {!orderCheck.allowed && (
            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-400 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-rose-950">
                    Batas Plafon Kredit Terlampaui!
                  </h4>
                  <p className="text-xs text-rose-900 font-semibold mt-0.5">
                    Total order <strong className="tabular-nums">{formatIDR(grandTotal)}</strong> melebihi sisa limit kredit <strong className="tabular-nums">{formatIDR(creditStatus.remainingCredit)}</strong>. 
                    Defisit overlimit: <strong className="text-rose-700 tabular-nums">{formatIDR(orderCheck.deficit)}</strong>.
                  </p>
                </div>
              </div>

              {isManager ? (
                <div className="pt-3 border-t border-rose-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="manager_approval_check" 
                      checked={isApprovedByManager} 
                      onChange={e => setIsApprovedByManager(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="manager_approval_check" className="text-xs font-black text-rose-950 cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Setujui Transaksi Overlimit Ini (Otorisasi Khusus Manager: {currentUser?.name})
                    </label>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={managerApprovalNotes} 
                      onChange={e => setManagerApprovalNotes(e.target.value)} 
                      placeholder="Tuliskan catatan persetujuan overlimit (misal: Disetujui khusus karena PO resmi terlampir)..." 
                      className="w-full p-2.5 clay-input text-xs font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-rose-200 space-y-2">
                  <p className="text-xs text-slate-700 font-bold">
                    Orderan tidak dapat disimpan oleh sales kecuali disetujui Manager. Masukkan PIN / Otorisasi Manager jika didampingi:
                  </p>
                  <div className="flex items-center gap-2 max-w-sm">
                    <input 
                      type="password" 
                      placeholder="Masukkan PIN Otorisasi Manager (123)" 
                      value={managerPinInput} 
                      onChange={e => setManagerPinInput(e.target.value)} 
                      className="flex-1 p-2.5 clay-input text-xs font-bold"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (managerPinInput === '123' || managerPinInput === 'admin' || managerPinInput === '8888') {
                          setIsApprovedByManager(true);
                          setError('');
                        } else {
                          setError("PIN Otorisasi Manager salah!");
                        }
                      }}
                      className="px-4 py-2.5 clay-button-primary text-white text-xs font-black"
                    >
                      Verifikasi
                    </button>
                  </div>
                  {isApprovedByManager && (
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black flex items-center gap-1.5 border border-emerald-300">
                      <Check className="w-4 h-4 text-emerald-600" /> Otorisasi Manager Berhasil Diberikan!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rincian Barang & Produk */}
      <div className="clay-card p-6">
        <h3 className="text-sm font-extrabold text-slate-900 mb-5 border-b border-slate-200/60 pb-2.5 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600"/> Rincian Barang / Produk
        </h3>
        <div className="space-y-3.5">
          {quoteItems.map((qi, index) => (
            <div key={qi.id || index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-[#eaf0f7] p-4 rounded-2xl border border-slate-200/70 relative group">
              <div className="flex flex-col gap-1 pr-2 border-r border-slate-300/60">
                <button onClick={() => moveQuoteItem(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20"><ChevronUp className="w-4 h-4"/></button>
                <button onClick={() => moveQuoteItem(index, 'down')} disabled={index === quoteItems.length - 1} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20"><ChevronDown className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[9px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Barang</label>
                <ItemSelect items={items} value={qi.itemId} onChange={(val) => updateItem(index, 'itemId', val)} />
              </div>
              <div className="w-20">
                <label className="block text-[9px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Qty</label>
                <input type="number" min="1" value={qi.qty} onChange={e => updateItem(index, 'qty', e.target.value)} className="w-full p-3 clay-input text-center font-extrabold text-sm tabular-nums"/>
              </div>
              <div className="w-32">
                <label className="block text-[9px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Harga Tier</label>
                <div className="p-3 clay-badge bg-white text-slate-800 font-extrabold text-right text-sm tabular-nums truncate">{formatIDR(qi.unitPrice)}</div>
              </div>
              <div className="w-36">
                 <label className="block text-[9px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Diskon Item</label>
                 <div className="flex gap-1.5">
                  <select value={qi.itemDiscountType} onChange={e => {updateItem(index, 'itemDiscountType', e.target.value); updateItem(index, 'itemDiscount', 0);}} className="w-12 p-2.5 clay-input text-center font-bold text-xs appearance-none">
                    <option value="nominal">Rp</option>
                    <option value="percentage">%</option>
                  </select>
                  <input type="number" min="0" value={qi.itemDiscount || ''} onChange={e => updateItem(index, 'itemDiscount', e.target.value)} placeholder="0" className="w-full p-2.5 clay-input text-right font-bold text-sm tabular-nums"/>
                 </div>
              </div>
              <div className="w-36">
                <label className="block text-[9px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Subtotal</label>
                <div className="p-3 clay-badge bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold text-right text-sm tabular-nums truncate">{formatIDR(qi.subtotal)}</div>
              </div>
              {quoteItems.length > 1 && (
                <button onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))} className="absolute -right-2 -top-2 clay-button-secondary text-rose-600 p-1.5 rounded-full opacity-90 md:opacity-0 group-hover:opacity-100">
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setQuoteItems([...quoteItems, { id: Date.now(), itemId: '', qty: 1, unitPrice: 0, subtotal: 0, itemDiscount: 0, itemDiscountType: 'nominal' }])} className="mt-5 flex items-center gap-2 px-5 py-3 clay-button-secondary text-blue-700 font-bold text-xs">
          <PlusCircle className="w-4 h-4" /> Tambah Baris Barang
        </button>

        <div className="mt-8 border-t border-slate-200/60 pt-6 flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Syarat & Ketentuan (Tampil di Dokumen):</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3.5 clay-input text-xs font-medium text-slate-800" rows={3}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-2">Catatan Internal (Rahasia Admin/Sales):</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full p-3.5 clay-input bg-amber-50/80 border-amber-300 text-amber-950 text-xs font-medium placeholder:text-amber-500" rows={2} placeholder="Tulis catatan rahasia internal..."/>
            </div>
          </div>

          <div className="w-full lg:w-[350px] space-y-3.5 text-sm bg-[#eaf0f7] p-6 rounded-2xl border border-slate-200/70 text-slate-700">
            <div className="flex justify-between items-center font-semibold">
              <span>Subtotal Barang:</span>
              <span className="text-slate-900 font-extrabold tabular-nums">{formatIDR(rawSubtotal)}</span>
            </div>
            <div className="flex justify-between items-center font-semibold">
              <span>Diskon Keseluruhan:</span>
              <div className="flex gap-1.5 w-40">
                <select value={discountType} onChange={(e) => {setDiscountType(e.target.value); setDiscountInput(0);}} className="w-12 p-2 clay-input text-center font-bold text-xs appearance-none">
                  <option value="nominal">Rp</option>
                  <option value="percentage">%</option>
                </select>
                <input type="number" min="0" value={discountInput || ''} onChange={(e) => setDiscountInput(e.target.value)} placeholder="0" className="flex-1 p-2 clay-input text-right font-bold text-xs tabular-nums"/>
              </div>
            </div>
            <div className="flex justify-between items-center font-semibold">
              <span>PPN (%):</span>
              <select value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-24 p-2 clay-input text-right font-bold text-xs appearance-none">
                <option value={0}>0%</option>
                <option value={11}>11%</option>
                <option value={12}>12%</option>
              </select>
            </div>
            <div className="border-t border-slate-300/80 pt-3.5 mt-3.5 flex justify-between items-center text-lg font-extrabold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-emerald-700 tabular-nums">{formatIDR(grandTotal)}</span>
            </div>

            {docType === 'SALES_ORDER' && (
              <div className="pt-3 border-t border-slate-300 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Sisa Limit Saat Ini:</span>
                  <span className="tabular-nums">{formatIDR(creditStatus.remainingCredit)}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>Sisa Setelah Order:</span>
                  <span className={`tabular-nums ${orderCheck.allowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {orderCheck.allowed ? formatIDR(remainingAfterOrder) : `Defisit ${formatIDR(orderCheck.deficit)}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Actions */}
      <div className="flex justify-end gap-3 sticky bottom-4 clay-modal p-4 z-20">
        <button onClick={onCancel} className="px-6 py-3 clay-button-secondary text-slate-700 font-bold text-sm">
          Batal
        </button>
        <button 
          onClick={handleSave} 
          className={`px-7 py-3 font-black flex items-center gap-2 text-sm text-white ${
            docType === 'SALES_ORDER'
              ? 'bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-lg'
              : 'clay-button-primary'
          }`}
        >
          <Save className="w-4 h-4" /> 
          {docType === 'SALES_ORDER' ? 'Simpan Sales Order (SO)' : 'Simpan Penawaran'}
        </button>
      </div>
    </div>
  );
}


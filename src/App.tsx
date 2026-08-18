import React, { useState, useEffect } from 'react';
import { 
  Package, FileText, Users, Activity, Shield, Settings as SettingsIcon, 
  RefreshCw, LogOut, LayoutDashboard, Calculator 
} from 'lucide-react';
import { User, Item, Customer, Quotation, Settings, ActivityLog } from './types';
import { 
  injectGlobalStyles, initialItems, initialCustomers, initialUsers, initialQuotations, defaultSettings,
  isSupervisoryRole, normalizeRole
} from './utils/helpers';
import { 
  subscribeCollection, subscribeDoc, saveFirestoreDoc, deleteFirestoreDoc 
} from './lib/firestoreService';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { PrintableQuotation } from './components/PrintableQuotation';
import { CreateQuotation } from './components/CreateQuotation';
import { QuotationsList } from './components/QuotationsList';
import { CustomersManagement } from './components/CustomersManagement';
import { ItemsManagement } from './components/ItemsManagement';
import { AuditLogsManagement } from './components/AuditLogsManagement';
import { UsersManagement } from './components/UsersManagement';
import { SettingsManagement } from './components/SettingsManagement';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { PriceCalculatorModal } from './components/PriceCalculatorModal';
import { ProductionDiagnosticModal } from './components/ProductionDiagnosticModal';
import { ProductionDiagnosticView } from './components/ProductionDiagnosticView';
import { Terminal } from 'lucide-react';

injectGlobalStyles();

const safeJsonParse = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    const parsed = JSON.parse(saved);
    return (parsed !== null && parsed !== undefined) ? parsed : fallback;
  } catch (e) {
    console.warn(`Failed to parse localStorage key: ${key}`, e);
    return fallback;
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return safeJsonParse<User | null>('sra_usr', null);
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = safeJsonParse<User[]>('sra_usrs', initialUsers);
    return (Array.isArray(saved) && saved.length > 0) ? saved : initialUsers;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard'); 
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);
  const [quoteViewFormat, setQuoteViewFormat] = useState<'QUOTATION' | 'SALES_ORDER'>('QUOTATION');
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [items, setItems] = useState<Item[]>(() => {
    const saved = safeJsonParse<Item[]>('sra_itm', initialItems);
    return (Array.isArray(saved) && saved.length > 0) ? saved : initialItems;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = safeJsonParse<Customer[]>('sra_cust', initialCustomers);
    return (Array.isArray(saved) && saved.length > 0) ? saved : initialCustomers;
  });
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = safeJsonParse<Quotation[]>('sra_quo', initialQuotations);
    return (Array.isArray(saved) && saved.length > 0) ? saved : initialQuotations;
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = safeJsonParse<Partial<Settings>>('sra_cfg', defaultSettings);
    return { ...defaultSettings, ...(saved || {}) };
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return safeJsonParse<ActivityLog[]>('sra_log', []);
  });
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null }>({
    isOpen: false, title: '', message: '', onConfirm: null
  });
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({
    isVisible: false, message: '', type: 'success'
  });
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isDiagnosticViewActive, setIsDiagnosticViewActive] = useState(false);
  const [calculatorItem, setCalculatorItem] = useState<Item | undefined>(undefined);

  useEffect(() => { localStorage.setItem('sra_usr', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('sra_usrs', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sra_itm', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('sra_cust', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('sra_quo', JSON.stringify(quotations)); }, [quotations]);
  useEffect(() => { localStorage.setItem('sra_cfg', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('sra_log', JSON.stringify(activityLogs)); }, [activityLogs]);

  // Subscribe to real-time updates from Firebase Firestore
  useEffect(() => {
    const unsubItems = subscribeCollection<Item>('items', setItems, initialItems);
    const unsubCustomers = subscribeCollection<Customer>('customers', setCustomers, initialCustomers);
    const unsubQuotations = subscribeCollection<Quotation>('quotations', setQuotations, initialQuotations);
    const unsubUsers = subscribeCollection<User>('users', setUsers, initialUsers);
    const unsubSettings = subscribeDoc<Settings>('settings', 'appSettings', setSettings, defaultSettings);
    const unsubLogs = subscribeCollection<ActivityLog>('activityLogs', setActivityLogs, []);

    return () => {
      unsubItems();
      unsubCustomers();
      unsubQuotations();
      unsubUsers();
      unsubSettings();
      unsubLogs();
    };
  }, []);

  const syncToCloud = async (action: string, payloadKey: string, payloadData: any) => {
    // Pure Firestore database persistence (no external API conflicts)
    try {
      if (action === 'saveQuotation' && payloadData?.id) {
        await saveFirestoreDoc('quotations', payloadData.id, payloadData);
      } else if (action === 'deleteQuotation' && payloadData?.id) {
        await deleteFirestoreDoc('quotations', payloadData.id);
      } else if (action === 'saveItem' && payloadData?.id) {
        await saveFirestoreDoc('items', payloadData.id, payloadData);
      } else if (action === 'deleteItem' && payloadData?.id) {
        await deleteFirestoreDoc('items', payloadData.id);
      } else if (action === 'saveCustomer' && payloadData?.id) {
        await saveFirestoreDoc('customers', payloadData.id, payloadData);
      } else if (action === 'deleteCustomer' && payloadData?.id) {
        await deleteFirestoreDoc('customers', payloadData.id);
      } else if (action === 'saveUser' && payloadData?.id) {
        await saveFirestoreDoc('users', payloadData.id, payloadData);
      } else if (action === 'deleteUser' && payloadData?.id) {
        await deleteFirestoreDoc('users', payloadData.id);
      } else if (action === 'saveLog' && payloadData?.id) {
        await saveFirestoreDoc('activityLogs', payloadData.id, payloadData);
      } else if (action === 'saveSettings') {
        await saveFirestoreDoc('settings', 'appSettings', payloadData);
      }
    } catch (e) {
      console.error('Firestore persistence error:', e);
    }
  };

  const logActivity = (
    action: string, 
    details: string,
    docMeta?: {
      module?: string;
      documentType?: string;
      documentId?: string;
      documentNumber?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!currentUser) return;
    const log: ActivityLog = { 
      id: `L-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 
      timestamp: new Date().toLocaleString('id-ID'), 
      userId: currentUser.id || currentUser.username,
      userName: currentUser.name || currentUser.username,
      userEmail: currentUser.email || `${currentUser.username}@sra.co.id`,
      username: currentUser.username, 
      name: currentUser.name, 
      role: currentUser.role,
      action, 
      details: docMeta?.description || details,
      module: docMeta?.module || 'SYSTEM',
      description: details,
      ...(docMeta?.documentType ? { documentType: docMeta.documentType } : {}),
      ...(docMeta?.documentId ? { documentId: docMeta.documentId } : {}),
      ...(docMeta?.documentNumber ? { documentNumber: docMeta.documentNumber } : {}),
      ...(docMeta?.metadata ? { metadata: docMeta.metadata } : {})
    };
    setActivityLogs(p => [log, ...(Array.isArray(p) ? p : [])]); 
    syncToCloud('saveLog', 'log', log);
  };

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => { 
    setToast({ isVisible: true, message: msg, type }); 
    setTimeout(() => setToast(p => ({ ...p, isVisible: false })), 3000); 
  };

  const showConfirm = (title: string, msg: string, onConfirm: () => void) => { 
    setModalState({ 
      isOpen: true, title, message: msg, 
      onConfirm: () => { onConfirm(); setModalState(p => ({ ...p, isOpen: false })); } 
    }); 
  };

  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={(u, p) => { 
          const cleanU = (u || '').trim().toLowerCase();
          const cleanP = (p || '').trim();
          const candidateUsers = [...(Array.isArray(users) ? users : []), ...initialUsers];
          const usr = candidateUsers.find(x => x && (x.username || '').trim().toLowerCase() === cleanU && String(x.password || '').trim() === cleanP); 
          if (usr) { 
            const rawRole = usr.role || 'sales';
            const safeUser: User = {
              id: usr.id || `U-${Date.now()}`,
              username: usr.username,
              name: usr.name || usr.username,
              email: usr.email || `${usr.username}@sra.co.id`,
              role: rawRole,
              salesId: usr.salesId || usr.id || usr.username,
              password: usr.password
            };
            setCurrentUser(safeUser);
            setActiveTab('dashboard');
            setViewingQuote(null);
            setEditingQuote(null);
            showToastMsg(`Selamat datang, ${safeUser.name}`); 
            logActivity('LOGIN', `Login sukses sebagai ${safeUser.role.toUpperCase()}`); 
          } else {
            showToastMsg('Username atau password tidak sesuai! Gunakan admin / 123', 'error'); 
          }
        }} 
      />
    );
  }

  // Intermediate Production Diagnostic Screen when active
  if (isDiagnosticViewActive) {
    return (
      <ProductionDiagnosticView 
        currentUser={currentUser}
        settings={settings}
        onProceedToDashboard={() => setIsDiagnosticViewActive(false)}
        onLogout={() => {
          setIsDiagnosticViewActive(false);
          handleLogout();
        }}
      />
    );
  }

  const handleLogout = () => { 
    logActivity('LOGOUT', 'User logout'); 
    setCurrentUser(null); 
    setActiveTab('quotations'); 
    setViewingQuote(null); 
    setEditingQuote(null); 
  };

  const handleOpenCalculator = (item?: Item) => {
    setCalculatorItem(item || items[0]);
    setIsCalculatorOpen(true);
  };

  const handleCreateQuotationForCustomer = (cust: Customer) => {
    setEditingQuote({
      id: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      customerName: cust.name,
      customerAttn: cust.attnName || '',
      customerEmail: cust.email || '',
      customerPhone: cust.phone || '',
      customerAddress: cust.address || '',
      issuingCompany: 'PT. Sarana Rimba Abadi',
      ppnPercent: 11,
      includePpn: true,
      status: 'Draft',
      items: [],
      notes: defaultSettings.defaultNotes || ''
    } as any);
    setActiveTab('create_quotation');
    showToastMsg(`Membuat penawaran untuk ${cust.name}`);
  };

  const renderContent = () => {
    if (viewingQuote) {
      return (
        <PrintableQuotation 
          quote={viewingQuote} 
          items={items} 
          onBack={() => setViewingQuote(null)} 
          settings={settings} 
          showToast={showToastMsg} 
          currentUser={currentUser} 
          initialFormat={quoteViewFormat}
        />
      );
    }
    if (activeTab === 'dashboard') {
      return (
        <DashboardAnalytics 
          quotations={quotations}
          items={items}
          customers={customers}
          currentUser={currentUser}
          settings={settings}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setViewingQuote(null);
            setEditingQuote(null);
          }}
          onViewQuotation={(q) => {
            setQuoteViewFormat('QUOTATION');
            setViewingQuote(q);
          }}
          onNewQuotation={() => {
            setEditingQuote(null);
            setActiveTab('create_quotation');
          }}
          onOpenCalculator={() => handleOpenCalculator()}
          showToast={showToastMsg}
        />
      );
    }
    if (activeTab === 'create_quotation') {
      return (
        <CreateQuotation 
          items={items} 
          customers={customers} 
          quotations={quotations}
          users={users}
          settings={settings} 
          currentUser={currentUser} 
          initialData={editingQuote} 
          onSave={(quote) => { 
            const isEdit = !!editingQuote && !!editingQuote.id; 
            setQuotations(isEdit ? quotations.map(q => q.id === quote.id ? quote : q) : [quote, ...quotations]); 
            setActiveTab('quotations'); 
            setEditingQuote(null); 
            showToastMsg(isEdit ? "Update sukses" : "Dibuat"); 
            logActivity(isEdit ? 'UPDATE_QUOTATION' : 'CREATE_QUOTATION', `${quote.id}`); 
            syncToCloud('saveQuotation', 'quotation', quote);
          }} 
          onCancel={() => { 
            setActiveTab('quotations'); 
            setEditingQuote(null); 
          }} 
        />
      );
    }
    if (activeTab === 'quotations') {
      return (
        <QuotationsList 
          quotations={quotations} 
          items={items}
          users={users}
          setQuotations={setQuotations} 
          currentUser={currentUser} 
          onNew={() => { setEditingQuote(null); setActiveTab('create_quotation'); }} 
          onView={(q) => {
            setQuoteViewFormat('QUOTATION');
            setViewingQuote(q);
          }}
          onViewSO={(q) => {
            setQuoteViewFormat('SALES_ORDER');
            setViewingQuote(q);
          }}
          onEdit={(q) => { setEditingQuote(q); setActiveTab('create_quotation'); }} 
          onDuplicate={(q) => { 
            setEditingQuote({ ...q, id: '', status: 'Draft', date: new Date().toISOString().split('T')[0] }); 
            setActiveTab('create_quotation'); 
            showToastMsg("Diduplikat."); 
          }} 
          onDelete={(id) => showConfirm("Hapus?", "Permanen.", () => { 
            setQuotations(quotations.filter(q => q.id !== id)); 
            showToastMsg("Dihapus"); 
            logActivity('DEL_QUOTE', id); 
          })} 
          showToast={showToastMsg} 
          logActivity={logActivity} 
          syncToCloud={syncToCloud} 
        />
      );
    }
    if (activeTab === 'customers') {
      return (
        <CustomersManagement 
          customers={customers} 
          setCustomers={setCustomers} 
          quotations={quotations}
          onNewQuotationForCustomer={handleCreateQuotationForCustomer}
          showConfirm={showConfirm} 
          showToast={showToastMsg} 
          logActivity={logActivity} 
          syncToCloud={syncToCloud} 
        />
      );
    }
    if (activeTab === 'items') {
      return (
        <ItemsManagement 
          items={items} 
          setItems={setItems} 
          currentUser={currentUser} 
          onOpenCalculator={handleOpenCalculator}
          showConfirm={showConfirm} 
          showToast={showToastMsg} 
          logActivity={logActivity} 
          syncToCloud={syncToCloud} 
        />
      );
    }
    const isManagerRole = isSupervisoryRole(currentUser?.role);

    if (activeTab === 'audit_logs' && isManagerRole) {
      return (
        <AuditLogsManagement 
          logs={activityLogs} 
          setLogs={setActivityLogs} 
          showConfirm={showConfirm} 
          showToast={showToastMsg} 
        />
      );
    }
    if (activeTab === 'users' && isManagerRole) {
      return (
        <UsersManagement 
          users={users} 
          setUsers={setUsers} 
          showConfirm={showConfirm} 
          showToast={showToastMsg} 
          logActivity={logActivity} 
          syncToCloud={syncToCloud} 
        />
      );
    }
    if (activeTab === 'settings' && isManagerRole) {
      return (
        <SettingsManagement 
          settings={settings} 
          setSettings={setSettings} 
          showToast={showToastMsg} 
          logActivity={logActivity} 
          syncToCloud={syncToCloud}
        />
      );
    }
    // Default fallback to Dashboard to prevent blank screen
    return (
      <DashboardAnalytics 
        quotations={quotations}
        items={items}
        customers={customers}
        users={users}
        currentUser={currentUser}
        settings={settings}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setViewingQuote(null);
          setEditingQuote(null);
        }}
        onViewQuotation={(q) => setViewingQuote(q)}
        onNewQuotation={() => {
          setEditingQuote(null);
          setActiveTab('create_quotation');
        }}
        onOpenCalculator={() => handleOpenCalculator()}
        showToast={showToastMsg}
      />
    );
  };

  const isManager = isSupervisoryRole(currentUser?.role);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'quotations', label: 'Quotations', icon: FileText, show: true },
    { id: 'customers', label: 'Pelanggan', icon: Users, show: true },
    { id: 'items', label: 'Pricelist', icon: Package, show: true },
    { id: 'audit_logs', label: 'Audit Log', icon: Activity, show: isManager },
    { id: 'users', label: 'Users', icon: Shield, show: isManager },
    { id: 'settings', label: 'Setting', icon: SettingsIcon, show: isManager }
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-emerald-500/20 relative overflow-hidden">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      <ConfirmModal 
        isOpen={modalState.isOpen} 
        title={modalState.title} 
        message={modalState.message} 
        onConfirm={modalState.onConfirm || (() => {})} 
        onCancel={() => setModalState(p => ({ ...p, isOpen: false }))} 
      />

      {/* Mobile Top Nav */}
      <div className="md:hidden bg-[#e0e8f0] text-slate-900 flex justify-between items-center p-4 z-20 no-print border-b border-slate-300/80 shadow-md">
        <div className="flex items-center gap-2 font-extrabold text-lg"><Package className="w-5 h-5 text-emerald-600" /> SRA Quotify</div>
        <button onClick={handleLogout} className="p-2.5 clay-button-secondary text-slate-700"><LogOut className="w-4 h-4" /></button>
      </div>

      {/* Desktop Claymorphism Sidebar */}
      <div className="hidden md:flex w-68 bg-[#e4ecf4] text-slate-800 flex-col z-20 no-print border-r border-slate-300/60 shrink-0 p-4 space-y-4">
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 clay-badge rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="tracking-tight text-slate-900 font-extrabold text-lg block leading-none">SRA Quotify</span>
            <span className="text-[9px] font-extrabold tracking-widest text-emerald-700 uppercase mt-1 block">Enterprise Suite</span>
          </div>
        </div>

        <div className="flex-1 py-2 space-y-2 overflow-y-auto">
          {navItems.filter(n => n.show).map(item => {
            const isActive = activeTab === item.id || (activeTab === 'create_quotation' && item.id === 'quotations');
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setViewingQuote(null); setEditingQuote(null); }} 
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-sm font-extrabold ${
                  isActive 
                    ? 'clay-button-primary text-white' 
                    : 'clay-button-secondary text-slate-700'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} /> {item.label}
              </button>
            );
          })}
        </div>

        <div className="clay-card p-4 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/90 text-emerald-900 rounded-xl border border-emerald-200/80 text-[11px] font-extrabold shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firestore Connected</span>
            </div>
            <span className="text-[9px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded-md font-black">CLOUD</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-[#e8f0f8] rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              {(currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 text-xs truncate">{currentUser?.name || currentUser?.username || 'User'}</p>
              <p className="text-[9px] font-extrabold tracking-wider text-emerald-700 uppercase">{currentUser?.role || 'sales'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex justify-center items-center gap-2 py-2 text-rose-600 hover:text-rose-700 transition-colors text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 bg-[#f0f4f8]">
        <div className="hidden md:flex h-16 items-center justify-between px-8 z-10 shrink-0 no-print pt-4">
          <div className="flex items-center gap-3 bg-[#e4ecf4] px-5 py-2.5 rounded-2xl border border-slate-300/60 shadow-xs">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></div>
            <div>
              <h1 className="text-base font-black text-slate-900 capitalize tracking-tight leading-none">
                {viewingQuote ? 'Preview & Cetak Quotation' : activeTab === 'create_quotation' ? 'Buat / Edit Quotation' : activeTab.replace('_', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDiagnosticOpen(true)}
              className="px-3.5 py-2.5 clay-button-secondary text-slate-800 font-extrabold text-xs flex items-center gap-1.5"
              title="Audit Status Environment & Firebase"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Diagnostic</span>
            </button>

            <button 
              onClick={() => handleOpenCalculator()}
              className="px-4 py-2.5 clay-button-secondary text-emerald-900 font-extrabold text-xs flex items-center gap-2"
              title="Kalkulator & Simulator Tier Price"
            >
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>Simulasi Harga</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0">
          <div className="max-w-6xl mx-auto pb-20 md:pb-0">
            {renderContent()}
          </div>
        </div>

        {/* Price Calculator Modal */}
        <PriceCalculatorModal 
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
          items={items}
          initialItemId={calculatorItem?.id}
          showToast={showToastMsg}
        />

        {/* Production Diagnostic Auditor Modal */}
        <ProductionDiagnosticModal 
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          currentUser={currentUser}
          settings={settings}
          itemsCount={items.length}
          customersCount={customers.length}
          quotationsCount={quotations.length}
        />

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#e4ecf4] border-t border-slate-300 flex justify-around p-2 pb-safe z-30 no-print shadow-lg">
          {navItems.filter(n => n.show).map(item => {
            const isActive = activeTab === item.id || (activeTab === 'create_quotation' && item.id === 'quotations');
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setViewingQuote(null); setEditingQuote(null); }} 
                className={`flex flex-col items-center p-2 min-w-[60px] rounded-xl transition-all ${
                  isActive ? 'text-emerald-800 bg-white font-extrabold clay-badge' : 'text-slate-600 font-semibold'
                }`}
              >
                <item.icon className="w-4 h-4 mb-1" />
                <span className="text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

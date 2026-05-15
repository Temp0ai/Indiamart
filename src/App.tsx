import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Inbox, 
  MessageSquare, 
  Users, 
  Settings, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Send,
  Loader2,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Bell,
  Download,
  Star,
  Briefcase
} from 'lucide-react';

interface Inquiry {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  requirements: string;
  category: string;
  location: string;
  whatsAppTemplate: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  receivedAt: string;
  reminderDate?: string;
  dealValue?: number;
  notes?: string;
  contactHistory?: { date: string, type: string, note: string }[];
}

const CRM_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const;

const SAMPLE_EMAIL = `
From: Indiamart <no-reply@indiamart.com>
Subject: New Inquiry for Vending Machines

Dear Vendor,
You have received a new inquiry on Indiamart.
Buyer Details:
Name: Rajesh Kumar
Mobile: 9876543210
Email: rajesh.kumar@example.com
Location: Mumbai, Maharashtra

Requirements:
We are looking to set up an office pantry for 50 employees and need a commercial tea/coffee vending machine along with regular supply of Nescafe premix. Please send a quotation.
Regards,
Indiamart
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'leads' | 'crm' | 'prompt' | 'settings'>('leads');
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    try {
      const saved = localStorage.getItem('crm_inquiries');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('crm_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);
  
  const [whatsappLinked, setWhatsappLinked] = useState(() => localStorage.getItem('whatsappLinked') === 'true');
  const [waPhoneInput, setWaPhoneInput] = useState(() => localStorage.getItem('waPhoneInput') || '');
  const [otpSent, setOtpSent] = useState(false);
  const [waOtpInput, setWaOtpInput] = useState('');
  
  const [gmailLinked, setGmailLinked] = useState(() => localStorage.getItem('gmailLinked') === 'true');
  const [gmailAccount, setGmailAccount] = useState(() => localStorage.getItem('gmailAccount') || '');
  const [isLinkingGmail, setIsLinkingGmail] = useState(false);

  const [syncFolder, setSyncFolder] = useState(() => localStorage.getItem('syncFolder') || 'INDIAMART_LEADS');

  // AI Assistant Settings
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || 'Arihant Enterprises');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState(() => localStorage.getItem('googleBusinessUrl') || '');
  const [whatsappCatalogUrl, setWhatsappCatalogUrl] = useState(() => localStorage.getItem('whatsappCatalogUrl') || '');

  const [companyProducts, setCompanyProducts] = useState(() => localStorage.getItem('companyProducts') || 'Mfg / Export tea & coffee premix');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const [selectedLeadsIds, setSelectedLeadsIds] = useState<Set<number>>(new Set());
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [bulkPrompt, setBulkPrompt] = useState('');
  const [bulkMessageResult, setBulkMessageResult] = useState('');
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isGeneratingReviewMsg, setIsGeneratingReviewMsg] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('All');

  const [bulkMode, setBulkMode] = useState<'ai' | 'manual' | 'template'>('ai');
  const [bulkManualText, setBulkManualText] = useState('');
  const [bulkSelectedTemplate, setBulkSelectedTemplate] = useState('t1');
  const [showConfirmBulkDialog, setShowConfirmBulkDialog] = useState(false);

  const BULK_TEMPLATES = [
    { id: 't1', label: 'Intro & Catalog', content: "Hi {{Name}},\n\nThanks for connecting with us regarding {{Requirements}}. Check out our latest products here:\n{{Catalog}}\n\nLet us know if you need any assistance!\n- {{CompanyName}}" },
    { id: 't2', label: 'Follow up & Review', content: "Hi {{Name}},\n\nJust checking in if you had any further questions about your inquiry for {{Requirements}}.\n\nIf you have a moment, we'd appreciate a quick review:\n{{Review}}\n\nBest,\n{{CompanyName}}" },
    { id: 't3', label: 'Promo Offer', content: "Hello {{Name}},\n\nWe have a special 10% discount running this week on {{Requirements}}!\n\nView details: {{Catalog}}\nReply to claim the offer.\n- {{CompanyName}}" }
  ];

  // Persist settings
  useEffect(() => {
    localStorage.setItem('whatsappLinked', whatsappLinked.toString());
    localStorage.setItem('waPhoneInput', waPhoneInput);
    localStorage.setItem('gmailLinked', gmailLinked.toString());
    localStorage.setItem('gmailAccount', gmailAccount);
    localStorage.setItem('syncFolder', syncFolder);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('companyName', companyName);
    localStorage.setItem('googleBusinessUrl', googleBusinessUrl);
    localStorage.setItem('whatsappCatalogUrl', whatsappCatalogUrl);
    localStorage.setItem('companyProducts', companyProducts);
  }, [whatsappLinked, waPhoneInput, gmailLinked, gmailAccount, syncFolder, geminiApiKey, companyName, companyProducts, googleBusinessUrl, whatsappCatalogUrl]);

  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{count: number, time: string} | null>(null);

  const handleSyncGmail = async () => {
    setIsSyncingGmail(true);
    // Simulate API call and syncing delay
    setTimeout(() => {
      setIsSyncingGmail(false);
      setLastSyncResult({
        count: Math.floor(Math.random() * 3) + 1,
        time: new Date().toLocaleTimeString()
      });
      // Process a simulated email as part of the sync
      handleProcessEmail();
    }, 2500);
  };

  useEffect(() => {
    fetch('/api/prompt')
      .then(res => res.json())
      .then(data => setSystemPrompt(data.prompt))
      .catch(err => console.error("Failed to load prompt", err));
  }, []);

  const categorizeByKeywords = (requirements: string): string => {
    const req = requirements.toLowerCase();
    if (req.includes('vending machine') || req.includes('coffee machine')) return 'Vending Machine';
    if (req.includes('premix') || req.includes('powder')) return 'Premix';
    if (req.includes('jaggery') || req.includes('gur')) return 'Jaggery';
    if (req.includes('lemon tea')) return 'Lemon Tea';
    if (req.includes('ice tea') || req.includes('iced tea')) return 'Ice Tea';
    if (req.includes('green tea')) return 'Green Tea';
    return 'Other';
  };

  const handleProcessEmail = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: SAMPLE_EMAIL })
      });
      
      const data = await response.json();
      
      const categoryFromKeywords = categorizeByKeywords(data.requirements || '');

      const newInquiry: Inquiry = {
        id: Math.random().toString(36).substring(7),
        ...data,
        category: categoryFromKeywords !== 'Other' ? categoryFromKeywords : (data.category || 'Other'),
        status: 'new',
        receivedAt: new Date().toLocaleTimeString()
      };
      
      setInquiries(prev => [newInquiry, ...prev]);
      setActiveTab('leads');
    } catch (error) {
      console.error('Failed to process email:', error);
      alert('Simulation failed. Check console.');
    } finally {
      setIsProcessing(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(inquiries.map(i => i.category)));
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      // Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        inquiry.customerName?.toLowerCase().includes(query) || 
        inquiry.requirements?.toLowerCase().includes(query) ||
        inquiry.email?.toLowerCase().includes(query) ||
        inquiry.phoneNumber?.includes(query);

      // Status Filter
      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'reminders' 
          ? !!inquiry.reminderDate 
          : inquiry.status === filterStatus;

      // Category Filter
      const matchesCategory = filterCategory === 'all' || inquiry.category === filterCategory;

      // Date Filter
      // We can just try to see if receivedAt contains the string if needed. We'll simplify.
      let matchesDate = true;
      if (filterDate === 'today') {
        // Not perfect date logic, but receivedAt is `new Date().toLocaleTimeString()` in the sample.
        // It always creates today's time in the mock.
        matchesDate = true; 
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [inquiries, searchQuery, filterStatus, filterCategory, filterDate]);

  const handleExportCSV = () => {
    if (filteredInquiries.length === 0) return;
    
    const headers = ['Customer Name', 'Phone Number', 'Email', 'Requirements', 'Category', 'Status', 'Received At'];
    const rows = filteredInquiries.map(inquiry => [
      `"${inquiry.customerName.replace(/"/g, '""')}"`,
      `"${inquiry.phoneNumber.replace(/"/g, '""')}"`,
      `"${inquiry.email.replace(/"/g, '""')}"`,
      `"${inquiry.requirements.replace(/"/g, '""')}"`,
      `"${inquiry.category.replace(/"/g, '""')}"`,
      `"${inquiry.status.replace(/"/g, '""')}"`,
      `"${inquiry.receivedAt.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestReview = async (lead: Inquiry) => {
    if (!whatsappLinked) {
      alert("Please link your WhatsApp account in the settings first.");
      setActiveTab("settings");
      return;
    }
    if (!googleBusinessUrl) {
      alert("Please set your Google Business Profile URL in the settings first.");
      setActiveTab("settings");
      return;
    }

    setIsGeneratingReviewMsg(true);
    try {
      const res = await fetch('/api/generate-review-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          companyName,
          reviewUrl: googleBusinessUrl,
          customApiKey: geminiApiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(data.message)}`, '_blank');
      
    } catch (err: any) {
      alert(err.message || "Failed to generate review message.");
    } finally {
      setIsGeneratingReviewMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden relative">
      {/* Sidebar */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-fuchsia-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full md:w-[320px] bg-white/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col flex-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 md:p-8 shrink-0 bg-transparent text-slate-900">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-fuchsia-600">
            Automata
          </h1>
          <span className="text-[10px] md:text-xs font-semibold tracking-widest bg-white/20 text-blue-900 px-2.5 py-1 rounded-full mt-2 inline-block border border-blue-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            Lead Integration
          </span>
        </div>
        <nav className="flex-none md:flex-1 p-2 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar">
          <div className="hidden md:block text-xs text-slate-500  tracking-normal font-semibold text-slate-500 mb-2">Systems</div>
          <button 
            onClick={() => setActiveTab('leads')}
            className={`flex-none md:w-full flex items-center justify-between p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${activeTab === 'leads' ? 'border-slate-200 bg-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-white border hover:border-slate-200 hover:shadow-sm rounded-xl'}`}
          >
            <div className="flex items-center gap-2 md:gap-3 text-sm font-medium whitespace-nowrap text-slate-700">
              <Users className="h-4 w-4" />
              Inquiries
            </div>
            {inquiries.length > 0 && (
              <span className={`hidden md:inline-block text-xs text-slate-500 font-sans px-2 py-0.5 ${activeTab === 'leads' ? 'bg-slate-900 text-white rounded-xl text-blue-600' : 'border border-current'}`}>
                {inquiries.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('crm')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${activeTab === 'crm' ? 'border-slate-200 bg-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-white border hover:border-slate-200 hover:shadow-sm rounded-xl'}`}
          >
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap text-slate-700">CRM View</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${activeTab === 'inbox' ? 'border-slate-200 bg-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-white border hover:border-slate-200 hover:shadow-sm rounded-xl'}`}
          >
            <Inbox className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap text-slate-700">Email Sync</span>
          </button>

          <button 
            onClick={() => setActiveTab('prompt')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${activeTab === 'prompt' ? 'border-slate-200 bg-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-white border hover:border-slate-200 hover:shadow-sm rounded-xl'}`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap text-slate-700">Prompt Engine</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${activeTab === 'settings' ? 'border-slate-200 bg-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-white border hover:border-slate-200 hover:shadow-sm rounded-xl'}`}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap text-slate-700">Settings</span>
          </button>
        </nav>
        <div className="hidden md:block p-6 border-t-2 border-slate-200 bg-white">
           <div className="flex flex-col">
             <span className="text-xs font-medium text-slate-500">System Status</span>
             <span className="text-xs font-bold text-emerald-500 tracking-wider">ONLINE / ACTIVE</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-6 md:p-8 flex flex-col justify-center shrink-0">
          <span className="text-sm font-medium text-blue-600 mb-1">
            {activeTab === 'inbox' && 'Synchronization Engine'}
            {activeTab === 'leads' && 'Queue Intelligence'}
            {activeTab === 'crm' && 'Relationship Details'}
            {activeTab === 'prompt' && 'AI Configuration View'}
            {activeTab === 'settings' && 'System Integrations'}
          </span>
          <h2 className="text-2xl md:text-5xl font-semibold tracking-tight leading-none " >
            {activeTab === 'inbox' && 'Process Inquiries'}
            {activeTab === 'leads' && 'Pipeline Management'}
            {activeTab === 'crm' && 'CRM Workspace'}
            {activeTab === 'prompt' && 'Prompt Instructions'}
            {activeTab === 'settings' && 'Integrations'}
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'inbox' && (
            <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
              <div className="p-4 md:p-8 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-500">Mailbox Configuration</h3>
                  <button
                    onClick={handleSyncGmail}
                    disabled={!gmailLinked || isSyncingGmail}
                    className="bg-red-500 text-white px-4 py-2 font-medium rounded-lg text-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-2 shrink-0 self-start md:self-auto"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingGmail ? 'animate-spin' : ''}`} />
                    {isSyncingGmail ? 'Syncing...' : 'Sync Gmail Now'}
                  </button>
                </div>
                
                {lastSyncResult && (
                  <div className="mb-6 text-red-500 text-xs text-slate-500 font-semibold  tracking-normal flex items-center gap-2 bg-[#fdf0ef] border border-slate-200 rounded-lg px-3 py-2 w-fit">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Last sync completed at {lastSyncResult.time}. {lastSyncResult.count} new inquiries pulled.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                     <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-500">Target Account</label>
                     <select 
                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 outline-none transition-all shadow-sm"
                       disabled={!gmailLinked}
                       value={gmailLinked ? gmailAccount : "none"}
                       onChange={() => {}}
                     >
                       {gmailLinked ? (
                         <option value={gmailAccount}>{gmailAccount}</option>
                       ) : (
                         <option value="none">No Accounts Linked</option>
                       )}
                     </select>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-500">Monitored Label / Folder</label>
                     <select 
                       value={syncFolder}
                       onChange={(e) => setSyncFolder(e.target.value)}
                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 outline-none transition-all shadow-sm"
                       disabled={!gmailLinked}
                     >
                       <option value="INBOX">INBOX</option>
                       <option value="INDIAMART_LEADS">Indiamart Leads</option>
                       <option value="IMPORTANT">Important</option>
                       <option value="UNREAD">Unread Emails</option>
                     </select>
                  </div>
                </div>
                {!gmailLinked && (
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="text-xs text-red-500 font-semibold tracking-wide mt-4 hover:underline text-left inline-flex items-center gap-1"
                  >
                     <span className="text-base leading-none">&larr;</span> Go to Settings to link a Gmail Account
                  </button>
                )}
              </div>

              {/* Upcoming Reminders Section */}
              {inquiries.filter(i => i.reminderDate && i.status !== 'contacted').length > 0 && (
                <div className="p-4 md:p-8 border-b border-slate-200 bg-[#fffbed]">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-4 flex items-center gap-2 text-red-500">
                    <Bell className="h-4 w-4" /> Upcoming Reminders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inquiries
                      .filter(i => i.reminderDate && i.status !== 'contacted')
                      .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime())
                      .slice(0, 4)
                      .map(inquiry => (
                        <div key={inquiry.id} className="border border-slate-200 rounded-xl bg-white p-4 flex justify-between items-center text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold cursor-pointer hover:underline" onClick={() => { setActiveTab('leads'); setSelectedInquiry(inquiry); }}>{inquiry.customerName}</span>
                            <span className="font-sans text-slate-600 text-xs">{new Date(inquiry.reminderDate!).toLocaleString()}</span>
                          </div>
                          <button 
                            className="bg-slate-900 text-white px-3 py-1.5 font-medium text-xs rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                            onClick={() => {
                              setActiveTab('leads');
                              setSelectedInquiry(inquiry);
                            }}
                          >
                            View Lead
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="p-4 md:p-8 border-b border-slate-200">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-4 md:mb-6">Simulate Incoming Payload</h3>
                <div className="bg-slate-50 p-4 md:p-6 border border-slate-200 rounded-lg font-sans text-xs md:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed overflow-x-auto relative">
                  {!gmailLinked && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-slate-200 m-2">
                       <span className="font-semibold  tracking-normal text-slate-900 bg-white px-4 py-2 border border-slate-200 rounded-xl">Account Not Linked</span>
                    </div>
                  )}
                  {SAMPLE_EMAIL}
                </div>
              </div>
              <div className="p-4 md:p-8 bg-blue-600 flex justify-end">
                <button
                  onClick={handleProcessEmail}
                  disabled={isProcessing || !gmailLinked}
                  className="w-full md:w-auto bg-slate-900 text-white rounded-xl text-white px-6 md:px-8 py-3 md:py-4 font-semibold  tracking-normal hover:opacity-90 hover:-translate-y-0.5 transition-all transition-all flex items-center justify-center gap-3 disabled:text-slate-500 text-xs md:text-base cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Parsing Data...
                    </>
                  ) : (
                    <>
                      <Inbox className="h-5 w-5" />
                      Execute Processing Loop
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="h-full flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 rounded-xl p-4 shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-sm"
                  />
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap gap-2">
                  <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-slate-500  font-semibold tracking-normal appearance-none h-full"
                    >
                      <option value="all">All Status</option>
                      <option value="new">Unprocessed</option>
                      <option value="contacted">Contacted</option>
                      <option value="reminders">Has Reminders</option>
                    </select>
                  </div>
                  
                  <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-slate-500  font-semibold tracking-normal appearance-none h-full"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative shrink-0">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                    <select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-slate-500  font-semibold tracking-normal appearance-none h-full"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Header */}
              {filteredInquiries.length > 0 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 px-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-black"
                      checked={selectedLeadsIds.size === filteredInquiries.length && filteredInquiries.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadsIds(new Set(filteredInquiries.map(i => i.id)));
                        } else {
                          setSelectedLeadsIds(new Set());
                        }
                      }}
                    />
                    <span className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">
                      {selectedLeadsIds.size} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="bg-slate-900 text-white px-4 py-2 font-medium rounded-lg text-sm  tracking-normal text-xs text-slate-500 hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Export Leads
                    </button>
                    <button
                      onClick={() => setShowBulkAction(true)}
                      disabled={selectedLeadsIds.size === 0}
                      className="bg-emerald-600 text-white px-4 py-2 font-medium rounded-lg text-sm  tracking-normal text-xs text-slate-500 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:text-slate-500 disabled:hover:opacity-90 hover:-translate-y-0.5 transition-all-0 flex items-center gap-2"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Bulk WhatsApp
                    </button>
                  </div>
                </div>
              )}



              {inquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-slate-200">
                  <Users className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-4xl font-semibold  mb-4" >Awaiting Data</h3>
                  <p className="text-xs text-slate-500  font-sans tracking-normal text-slate-500">Run the email simulation to populate the queue.</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-slate-200">
                  <Search className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-4xl font-semibold  mb-4" >No Results</h3>
                  <p className="text-xs text-slate-500  font-sans tracking-normal text-slate-500">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
                  <div className="col-span-1 xl:col-span-2 flex flex-col gap-4">
                    {filteredInquiries.map((inquiry) => (
                      <div 
                        key={inquiry.id} 
                        className={`border-2 p-4 md:p-6 transition-all ${selectedInquiry?.id === inquiry.id ? 'border-slate-200 bg-blue-600 md:shadow-sm' : 'border-slate-200 bg-white group'}`}
                      >
                        <div className="flex justify-between items-start mb-4 border-b border-current pb-4">
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 mt-1 accent-black cursor-pointer object-none border border-slate-200 rounded-xl"
                              checked={selectedLeadsIds.has(inquiry.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLeadsIds);
                                if (e.target.checked) newSet.add(inquiry.id);
                                else newSet.delete(inquiry.id);
                                setSelectedLeadsIds(newSet);
                              }}
                            />
                            <div className="flex flex-col cursor-pointer hover:underline" onClick={() => setSelectedInquiry(inquiry)}>
                              <span className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600 mb-1">
                                {inquiry.category}
                              </span>
                              <h3 className="text-2xl font-semibold leading-none " >
                                {inquiry.customerName}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-slate-500 font-sans border border-current px-2 py-0.5">
                              {inquiry.receivedAt}
                            </span>
                            {inquiry.status === 'new' && (
                              <span className={`text-xs text-slate-500  font-semibold tracking-normal px-2 py-0.5 ${selectedInquiry?.id === inquiry.id ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white group-hover:bg-slate-900 text-white rounded-xl group-hover:text-white'}`}>
                                Unprocessed
                              </span>
                            )}
                            {inquiry.reminderDate && (
                              <span className="text-xs text-slate-500  font-semibold tracking-normal text-red-500 flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-0.5 bg-[#fdf0ef]">
                                <Bell className="h-3 w-3" /> {new Date(inquiry.reminderDate).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="font-sans text-xs mb-6 text-slate-700 leading-relaxed border-l-2 border-current pl-4">
                          {inquiry.requirements}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <a href={`tel:${inquiry.phoneNumber}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-500 font-semibold  tracking-normal border border-current px-4 py-2 hover:bg-white hover:text-slate-900 hover:border-white transition-all">
                            <Phone className="h-4 w-4" /> Call
                          </a>
                          <a href={`sms:${inquiry.phoneNumber}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-500 font-semibold  tracking-normal border border-current px-4 py-2 hover:bg-white hover:text-slate-900 hover:border-white transition-all">
                            <MessageSquare className="h-4 w-4" /> SMS
                          </a>
                          <a href={`mailto:${inquiry.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-500 font-semibold  tracking-normal border border-current px-4 py-2 hover:bg-white hover:text-slate-900 hover:border-white transition-all">
                            <Mail className="h-4 w-4" /> Email
                          </a>
                          <span className="text-xs text-slate-500 font-semibold  tracking-normal ml-auto text-slate-500 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {inquiry.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Detail Panel */}
                  <div className="col-span-1 border-2 border-dashed border-slate-200 p-4 md:p-8 bg-white flex flex-col md:sticky md:top-8 mt-4 md:mt-0">
                    {selectedInquiry ? (
                      <>
                         <div className="flex items-center justify-between mb-6 md:mb-8">
                           <span className="text-xs text-slate-500 font-semibold  tracking-normal bg-slate-900 text-white rounded-xl text-white px-3 py-1">
                             Automation Actions
                           </span>
                           <div className="w-3 h-3 bg-blue-600 border border-slate-200 shadow-[0_0_8px_rgba(212,255,0,0.8)]"></div>
                         </div>
                         
                         <div className="flex flex-col gap-6">
                           <div className="flex flex-col">
                             <span className="text-xs text-slate-500  font-sans text-slate-500 mb-3">AI Compiled Pitch</span>
                             <div className="p-6 border border-slate-200 rounded-lg bg-slate-50">
                               <p className=" text-lg leading-relaxed" >
                                 "{selectedInquiry.whatsAppTemplate}"
                               </p>
                             </div>
                           </div>
                           
                           <button 
                            onClick={() => {
                              const cleanPhone = selectedInquiry.phoneNumber.replace(/[^0-9+]/g, '');
                              window.location.href = `tel:${cleanPhone}`;
                            }}
                            className="w-full bg-slate-900 text-blue-600 border border-slate-200 rounded-xl py-4 md:py-5 text-sm md:text-base font-semibold  tracking-normal flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-slate-900 transition-all mt-4"
                           >
                             <Phone className="h-5 w-5" />
                             Dial / Call Lead
                           </button>
                           
                           <button 
                            onClick={async () => {
                              if (!whatsappLinked) {
                                alert("Please link your WhatsApp number in the Settings tab first.");
                                setActiveTab("settings");
                                return;
                              }
                              try {
                                const cleanPhone = selectedInquiry.phoneNumber.replace(/[^0-9]/g, '');
                                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(selectedInquiry.whatsAppTemplate)}`, '_blank');
                              } catch (err: any) {
                                alert(`Error: ${err.message}.`);
                              }
                            }}
                            className="w-full bg-emerald-600 text-white border border-slate-200 rounded-xl py-4 md:py-5 text-sm md:text-base font-semibold  tracking-normal flex items-center justify-center gap-3 hover:opacity-90 hover:-translate-y-0.5 transition-all transition-all mt-4"
                           >
                             <MessageSquare className="h-5 w-5" />
                             Execute WhatsApp Lead
                           </button>

                           <button 
                            onClick={() => handleRequestReview(selectedInquiry)}
                            disabled={isGeneratingReviewMsg}
                            className="w-full bg-[#fdf0ef] text-red-500 border border-slate-200 rounded-xl py-4 md:py-5 text-sm md:text-base font-semibold  tracking-normal flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all mt-4 disabled:text-slate-500"
                           >
                             {isGeneratingReviewMsg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
                             {isGeneratingReviewMsg ? 'Generating...' : 'Request Review via WhatsApp'}
                           </button>

                           <div className="mt-4 pt-6 border-t-2 border-dashed border-slate-200 flex flex-col gap-2">
                             <span className="text-xs text-slate-500  font-sans bg-slate-900 text-white rounded-xl text-white px-2 py-1 flex items-center gap-2 self-start"><Bell className="h-3 w-3" /> Follow-up Reminder</span>
                             <input 
                                 type="datetime-local"
                                 value={selectedInquiry.reminderDate || ''}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   const updated = { ...selectedInquiry, reminderDate: val };
                                   setSelectedInquiry(updated);
                                   setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                                 }}
                                 className="w-full border border-slate-200 rounded-xl p-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                             />
                           </div>
                         </div>

                         <div className="mt-8 pt-8 border-t-2 border-slate-200">
                           <span className="text-xs text-slate-500  font-sans text-slate-500 mb-4 block">Raw JSON Packet</span>
                           <pre className="bg-slate-900 text-blue-600 p-4 border border-slate-200 rounded-lg text-xs text-slate-500 font-sans overflow-auto max-h-64">
{JSON.stringify(selectedInquiry, null, 2)}
                           </pre>
                         </div>
                      </>
                    ) : (
                      <div className="py-20 flex flex-col justify-center items-center opacity-30">
                        <span className="text-6xl font-semibold " >?</span>
                        <span className="text-xs text-slate-500  font-sans tracking-normal mt-4 text-center">Select target<br/>for actions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div 
              className="flex flex-col h-full bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 pb-2 relative overflow-hidden"
              style={{ backgroundImage: 'none', backgroundSize: '30px 30px' }}
            >
               <div className="absolute top-0 left-0 w-full h-4 bg-white border-b border-slate-200 z-0"></div>
               <div className="flex h-full overflow-x-auto gap-6 md:gap-8 no-scrollbar snap-x relative z-10 pt-4">
                 {CRM_STAGES.map(stage => {
                   const stageLeads = inquiries.filter(i => (i.status === stage));
                   
                   return (
                     <div key={stage} className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] flex flex-col snap-start shrink-0">
                       <h3 className="text-sm font-medium tracking-tight border-b border-slate-200 pb-3 mb-3 flex items-center justify-between group text-slate-700">
                         <span className={`px-2 py-1 border border-slate-300 shadow-sm ${
                           stage === 'won' ? 'bg-emerald-600 text-white' : 
                           stage === 'lost' ? 'bg-rose-500 text-white' : 
                           stage === 'new' ? 'bg-blue-600 text-white' : 
                           stage === 'contacted' ? 'bg-fuchsia-100 text-fuchsia-800' : 
                           stage === 'qualified' ? 'bg-cyan-100 text-cyan-800' : 
                           stage === 'proposal' ? 'bg-amber-100 text-amber-800' : 
                           'bg-white text-slate-900'
                         }`}>
                           {stage}
                         </span>
                         <div className="flex items-center gap-2">
                            {stageLeads.length > 0 && (
                               <button 
                                 onClick={() => {
                                   const newSet = new Set<any>();
                                   stageLeads.forEach(l => newSet.add(l.id));
                                   setSelectedLeadsIds(newSet);
                                   setShowBulkAction(true);
                                 }}
                                 className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-700 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer border border-slate-300 rounded-md shadow-sm"
                                 title="Send bulk WhatsApp message to this stage"
                               >
                                 Bulk Msg
                               </button>
                            )}
                            <span className="text-sm text-slate-600 font-semibold bg-white border border-slate-300 px-2 py-0.5 shadow-sm">{stageLeads.length}</span>
                         </div>
                       </h3>
                       <div className="w-full bg-slate-100 h-1.5 mb-4 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${stage === 'won' ? 'bg-emerald-500' : stage === 'lost' ? 'bg-rose-500' : stage === 'new' ? 'bg-blue-600' : stage === 'contacted' ? 'bg-fuchsia-500' : stage === 'qualified' ? 'bg-cyan-500' : stage === 'proposal' ? 'bg-amber-500' : 'bg-slate-400'}`}
                           style={{ width: `${inquiries.length > 0 ? (stageLeads.length / inquiries.length) * 100 : 0}%` }}
                         />
                       </div>
                       <div className={`flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-4 px-1 bg-gradient-to-b ${stage === 'won' ? 'from-emerald-500/10' : stage === 'lost' ? 'from-rose-500/10' : stage === 'new' ? 'from-blue-600/10' : stage === 'contacted' ? 'from-fuchsia-500/10' : stage === 'qualified' ? 'from-cyan-500/10' : stage === 'proposal' ? 'from-amber-500/10' : 'from-transparent'} to-transparent rounded-b-xl`}>
                         {stageLeads.map(lead => (
                           <div 
                             key={lead.id} 
                             onClick={() => setSelectedInquiry(lead)}
                             className={`border border-slate-200/60 p-5 transition-all cursor-pointer flex flex-col gap-2 group shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 bg-white rounded-xl relative overflow-hidden pl-5`}
                           >
                             <div className={`absolute top-0 left-0 w-1 h-full ${stage === 'won' ? 'bg-emerald-500' : stage === 'lost' ? 'bg-rose-500' : stage === 'new' ? 'bg-blue-500' : stage === 'contacted' ? 'bg-fuchsia-400' : stage === 'qualified' ? 'bg-cyan-400' : stage === 'proposal' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                             <div className="flex justify-between items-start relative z-10">
                               <span className="font-semibold text-base leading-tight text-slate-800">{lead.customerName}</span>
                               <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{lead.dealValue ? `$${lead.dealValue}` : '-'}</span>
                             </div>
                             <div className="flex items-center gap-2 mt-1 relative z-10">
                               <span className="text-[10px] uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium border border-slate-200/50">{lead.category || 'Other'}</span>
                             </div>
                             <span className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed relative z-10">{lead.requirements}</span>
                             {lead.reminderDate && (
                               <div className="text-[10px] font-semibold text-red-500 mt-2 uppercase tracking-wider flex items-center gap-1 relative z-10">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                 {new Date(lead.reminderDate).toLocaleDateString()}
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>

               {/* Right side detail overlay */}
               {selectedInquiry && (
                 <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white border-l border-slate-200/60 shadow-[-12px_0_32px_rgba(0,0,0,0.08)] flex flex-col z-20 transition-transform">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
                      <h2 className="font-semibold text-slate-800 text-sm">Lead Details</h2>
                      <button onClick={() => setSelectedInquiry(null)} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">Close</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                       <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                         <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedInquiry.customerName}</h3>
                         <span className="text-sm font-medium text-slate-500">{selectedInquiry.phoneNumber} • {selectedInquiry.email}</span>
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</label>
                         <select 
                           value={selectedInquiry.status}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, status: e.target.value as any };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                           }}
                           className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                         >
                           {CRM_STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                         </select>
                       </div>

                       <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-blue-50 to-fuchsia-50 border border-slate-200/60 rounded-2xl border border-slate-200 rounded-xl rounded-sm  transition-transform shadow-sm">
                         <label className="text-sm text-slate-600 font-semibold  tracking-normal flex items-center justify-between">
                           ✨ Lead Category
                           <span className="text-[11px] bg-slate-900 text-white rounded-xl text-white px-2 py-0.5 rounded-full">AI Suggested</span>
                         </label>
                         <p className="text-xs text-slate-500 font-sans text-slate-600 leading-tight mb-1">
                           Auto-assigned based on requirements keywords. You can edit or correct it below.
                         </p>
                         <input 
                           type="text"
                           list="category-options"
                           value={selectedInquiry.category}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, category: e.target.value };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                           }}
                           className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-inner"
                           placeholder="Enter or select category"
                         />
                         <datalist id="category-options">
                           {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                         </datalist>
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-xs text-slate-500 font-semibold  tracking-normal">Deal Value ($)</label>
                         <input 
                           type="number"
                           value={selectedInquiry.dealValue || ''}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, dealValue: parseFloat(e.target.value) || 0 };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                           }}
                           className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         />
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-xs text-slate-500 font-semibold  tracking-normal">Requirements</label>
                         <p className="border-2 border-dashed border-slate-200 p-3 text-sm text-slate-700 bg-slate-50">
                           {selectedInquiry.requirements}
                         </p>
                       </div>

                       <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-end">
                           <label className="text-xs text-slate-500 font-semibold  tracking-normal">Lead Notes</label>
                           {isSavingNotes ? (
                             <span className="text-xs text-slate-500 font-sans text-gray-500 ">Saving...</span>
                           ) : (
                             <span className="text-xs text-slate-500 font-sans text-[#25D366]  transition-opacity">Saved</span>
                           )}
                         </div>
                         <textarea 
                           className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                           placeholder="Jot down details, next steps, context..."
                           value={selectedInquiry.notes || ''}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, notes: e.target.value };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));

                             setIsSavingNotes(true);
                             if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
                             savingTimeoutRef.current = setTimeout(() => {
                               setIsSavingNotes(false);
                             }, 1000);
                           }}
                         />
                       </div>

                       <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-1">
                           <span className="text-xs text-slate-500 font-semibold  tracking-normal">Contact History</span>
                           <div className="flex items-center gap-3">
                             <select 
                               className="bg-transparent text-slate-600 text-xs text-slate-500  font-semibold focus:outline-none cursor-pointer"
                               value={historyFilter}
                               onChange={(e) => setHistoryFilter(e.target.value)}
                             >
                               <option value="All" className="bg-slate-900">All</option>
                               <option value="Note" className="bg-slate-900">Notes</option>
                               <option value="Call" className="bg-slate-900">Calls</option>
                               <option value="Email" className="bg-slate-900">Emails</option>
                               <option value="WhatsApp" className="bg-slate-900">WhatsApp</option>
                             </select>
                             <button 
                               className="text-xs text-slate-500 font-semibold  hover:text-blue-600"
                               onClick={() => {
                                 const type = prompt("Type (Note/Call/Email/WhatsApp):", "Note") || "Note";
                                 const note = prompt("Add history note:");
                                 if (note) {
                                    const updatedHistory = [...(selectedInquiry.contactHistory || []), {
                                      date: new Date().toLocaleString(),
                                      type,
                                      note
                                    }];
                                    const updated = { ...selectedInquiry, contactHistory: updatedHistory };
                                    setSelectedInquiry(updated);
                                    setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                                 }
                               }}
                             >
                               + Add Log
                             </button>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2 mt-2">
                           {(!selectedInquiry.contactHistory || selectedInquiry.contactHistory.length === 0) ? (
                             <span className="text-xs  text-slate-500">No history logged yet.</span>
                           ) : (
                             selectedInquiry.contactHistory
                               .filter(log => historyFilter === 'All' || log.type.trim().toLowerCase() === historyFilter.toLowerCase())
                               .map((log, idx) => (
                               <div key={idx} className="border border-slate-200 rounded-lg p-2 text-xs flex flex-col gap-1 bg-slate-50">
                                 <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                                   <span className="font-semibold  text-xs text-slate-500">{log.type}</span>
                                   <span className="font-sans text-xs text-slate-500 text-slate-600">{log.date}</span>
                                 </div>
                                 <span className="mt-1">{log.note}</span>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-12 max-w-5xl md:shadow-sm">
              <div className="mb-8 md:mb-12 border-b border-slate-200 pb-6 md:pb-8">
                <h3 className="text-2xl md:text-5xl font-semibold tracking-tight " >Core Directives</h3>
                <p className="text-xs md:text-sm font-semibold tracking-tight text-slate-500 mt-4 leading-relaxed">
                  Systematic prompt logic dictating AI behavior.<br/>Controls extraction, taxonomy assignment, and tone configuration.
                </p>
              </div>

              <div className="bg-slate-900 text-[#F2F1ED] p-8 relative border border-slate-200 rounded-xl">
                 <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs text-slate-500 font-semibold  tracking-normal px-4 py-2 border-b-2 border-l-2 border-slate-200">
                   Live Configuration
                 </div>
                 <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed mt-4">
{systemPrompt || 'INITIALIZING SECURE PROMPT...'}
                 </pre>
              </div>

              <div className="mt-12">
                <h3 className="text-sm font-semibold  tracking-normal mb-6">Analytical Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                    <CheckCircle2 className="h-6 w-6 text-slate-900 mb-4" />
                    <span className="block text-xs text-slate-500 font-semibold  tracking-normal mb-2">Data Integrity</span>
                    <p className="text-xs font-sans text-slate-600">Enforces structured JSON protocols over freeform text for immediate CRM compatibility.</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                    <CheckCircle2 className="h-6 w-6 text-slate-900 mb-4" />
                    <span className="block text-xs text-slate-500 font-semibold  tracking-normal mb-2">Classification</span>
                    <p className="text-xs font-sans text-slate-600">Strict taxonomy limits map raw intent directly to existing supply chain segments.</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                    <CheckCircle2 className="h-6 w-6 text-slate-900 mb-4" />
                    <span className="block text-xs text-slate-500 font-semibold  tracking-normal mb-2">Generative Pitch</span>
                    <p className="text-xs font-sans text-slate-600">Pre-computes dynamic marketing copy, collapsing the sales feedback loop to zero.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-12 max-w-2xl md:shadow-sm">
              <div className="mb-8 md:mb-12 border-b border-slate-200 pb-6 md:pb-8">
                <h3 className="text-2xl md:text-5xl font-semibold tracking-tight " >Integrations & AI Config</h3>
                <p className="text-xs md:text-sm font-semibold tracking-tight text-slate-500 mt-4 leading-relaxed">
                  Connect your accounts and configure your generative AI settings.
                </p>
              </div>

              {/* AI Config Section (Arihant Enterprises) */}
              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
                    <FileText className="h-4 w-4 text-slate-900" />
                  </div>
                  <h4 className="text-lg font-semibold">AI Assistant Setup</h4>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-sans text-slate-600">Customize Gemini AI generation context and keys.</p>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">Product / Service Offerings</label>
                    <textarea 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-16"
                      value={companyProducts}
                      onChange={(e) => setCompanyProducts(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-slate-200 pt-4">
                    <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">Google Business Profile URL</label>
                    <input 
                      type="url" 
                      placeholder="https://g.page/r/..." 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={googleBusinessUrl}
                      onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                    />
                    <span className="text-xs text-slate-500 text-slate-500 mt-1">Used to request ratings and reviews from customers.</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-slate-200 pt-4">
                    <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">WhatsApp Catalog URL</label>
                    <input 
                      type="url" 
                      placeholder="https://wa.me/c/..." 
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={whatsappCatalogUrl}
                      onChange={(e) => setWhatsappCatalogUrl(e.target.value)}
                    />
                    <span className="text-xs text-slate-500 text-slate-500 mt-1">Include your product catalog link in bulk messages.</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-slate-200 pt-4">
                    <label className="text-xs text-slate-500 font-semibold  tracking-normal text-slate-600">Gemini API Key (Optional)</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to use Applet default"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <span className="text-xs text-slate-500 text-slate-500 mt-1">If provided, this key will be used for Bulk Action AI generation specifically for your browser.</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-[#25D366]" />
                  <h4 className="text-lg font-semibold">WhatsApp Personal / Web</h4>
                </div>
                
                {whatsappLinked ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between border border-slate-200 rounded-xl bg-[#e8fbf0] p-4 text-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#25D366]" />
                      <span className="font-sans text-sm font-semibold truncate">Linked: {waPhoneInput}</span>
                    </div>
                    <button 
                      onClick={() => { setWhatsappLinked(false); setOtpSent(false); setWaPhoneInput(''); setWaOtpInput(''); }}
                      className="text-xs  font-semibold tracking-normal hover:underline whitespace-nowrap text-left md:text-right"
                    >
                      Unlink Account
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-sans text-slate-600">Enter your WhatsApp number to link your account via OTP.</p>
                    
                    {!otpSent ? (
                      <div className="flex flex-col md:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. +91 9876543210" 
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={waPhoneInput}
                          onChange={(e) => setWaPhoneInput(e.target.value)}
                        />
                        <button 
                          onClick={() => { 
                            if (waPhoneInput.length > 5) {
                              setOtpSent(true); 
                              setWaOtpInput('123456'); // Auto-fill for simulation
                            }
                          }}
                          className="bg-slate-900 text-white rounded-xl text-white px-6 py-2 font-semibold  tracking-normal text-xs hover:bg-slate-900 min-h-[44px]"
                        >
                          Send OTP
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-[#25D366] text-xs font-semibold bg-[#e8fbf0] p-2 border border-slate-200 rounded-lg">Test Mode: OTP auto-filled (123456)</p>
                        <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm tracking-normal text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={waOtpInput}
                            onChange={(e) => setWaOtpInput(e.target.value)}
                            maxLength={6}
                          />
                          <button 
                            onClick={() => { if (waOtpInput.length > 4) setWhatsappLinked(true); }}
                            className="bg-emerald-600 text-white border border-slate-200 rounded-xl px-6 py-2 font-semibold  tracking-normal text-xs hover:opacity-90 hover:-translate-y-0.5 transition-all min-h-[44px]"
                          >
                            Verify & Link
                          </button>
                        </div>
                        <button 
                          onClick={() => setOtpSent(false)}
                          className="text-xs  font-semibold tracking-normal hover:underline text-left inline-block"
                        >
                          &larr; Change Number
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-6 w-6 text-red-500" />
                  <h4 className="text-lg font-semibold">Gmail Integration</h4>
                </div>
                
                {gmailLinked ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between border border-slate-200 rounded-xl bg-[#fdf0ef] p-4 text-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-red-500" />
                      <span className="font-sans text-sm font-semibold truncate">Synced: {gmailAccount}</span>
                    </div>
                    <button 
                      onClick={() => { setGmailLinked(false); setGmailAccount(''); }}
                      className="text-xs  font-semibold tracking-normal hover:underline whitespace-nowrap text-left md:text-right"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : isLinkingGmail ? (
                   <div className="flex flex-col gap-4">
                      <p className="text-xs font-sans text-slate-600">Enter your Gmail address to simulate Google OAuth connection.</p>
                      <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            type="email" 
                            placeholder="e.g. yourbusiness@gmail.com" 
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]"
                            value={gmailAccount}
                            onChange={(e) => setGmailAccount(e.target.value)}
                          />
                          <button 
                            onClick={() => { if (gmailAccount.includes('@')) { setGmailLinked(true); setIsLinkingGmail(false); } }}
                            className="bg-red-500 text-white border border-slate-200 rounded-xl px-6 py-2 font-semibold  tracking-normal text-xs hover:opacity-90 hover:-translate-y-0.5 transition-all min-h-[44px]"
                          >
                            Connect Gmail
                          </button>
                      </div>
                      <button 
                          onClick={() => setIsLinkingGmail(false)}
                          className="text-xs  font-semibold tracking-normal hover:underline text-left inline-block"
                      >
                          &larr; Cancel
                      </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-sans text-slate-600">Connect your Gmail account to continuously scan for new inquiries and add them to the queue automatically.</p>
                    
                    <button 
                      onClick={() => setIsLinkingGmail(true)}
                      className="bg-slate-900 text-white rounded-xl text-white py-3 px-6 font-semibold  tracking-normal text-xs hover:bg-slate-900 md:self-start"
                    >
                      Connect Gmail Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showBulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900 text-white rounded-xl/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl flex flex-col shadow-sm overflow-hidden max-h-full">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-blue-600">
              <h4 className="font-semibold  tracking-normal text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Bulk WhatsApp Broadcast
              </h4>
              <button onClick={() => setShowBulkAction(false)} className="hover:text-white  text-xs text-slate-500 tracking-normal font-semibold">Close</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 border-l-4 border-slate-200 pl-4">
                <p className="font-sans text-xs text-slate-600">Target Audience:</p>
                <p className="font-semibold text-lg">{selectedLeadsIds.size} Selected Leads</p>
              </div>

              <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl mb-6">
                <button 
                  onClick={() => setBulkMode('ai')}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wide text-slate-500 transition-colors ${bulkMode === 'ai' ? 'bg-slate-900 text-white rounded-xl text-blue-600' : 'hover:bg-white text-slate-900'}`}
                >AI Generated</button>
                <button 
                  onClick={() => {
                    setBulkMode('template');
                    if (!bulkMessageResult) {
                      setBulkMessageResult(BULK_TEMPLATES.find(t => t.id === bulkSelectedTemplate)?.content || '');
                    }
                  }}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wide text-slate-500 transition-colors ${bulkMode === 'template' ? 'bg-slate-900 text-white rounded-xl text-blue-600' : 'hover:bg-white text-slate-900'}`}
                >Pre-defined</button>
                <button 
                  onClick={() => {
                    setBulkMode('manual');
                    setBulkMessageResult(bulkManualText);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wide text-slate-500 transition-colors ${bulkMode === 'manual' ? 'bg-slate-900 text-white rounded-xl text-blue-600' : 'hover:bg-white text-slate-900'}`}
                >Manual Text</button>
              </div>

              {bulkMode === 'template' && (
                <div className="flex flex-col gap-4">
                  <label className="text-xs text-slate-500 font-semibold  tracking-normal">Select Template</label>
                  <select 
                    value={bulkSelectedTemplate}
                    onChange={(e) => {
                      setBulkSelectedTemplate(e.target.value);
                      const tpl = BULK_TEMPLATES.find(t => t.id === e.target.value);
                      if (tpl) setBulkMessageResult(tpl.content);
                    }}
                    className="border border-slate-200 rounded-xl p-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                  >
                    {BULK_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <div className="border-2 border-dashed border-slate-200 p-4 bg-slate-50 text-sm whitespace-pre-wrap font-sans mt-2">
                    {BULK_TEMPLATES.find(t => t.id === bulkSelectedTemplate)?.content || ''}
                  </div>
                </div>
              )}

              {bulkMode === 'manual' && (
                <div className="flex flex-col gap-4">
                  <label className="text-xs text-slate-500 font-semibold  tracking-normal">Compose Message</label>
                  <textarea 
                    value={bulkManualText}
                    onChange={e => {
                      setBulkManualText(e.target.value);
                      setBulkMessageResult(e.target.value);
                    }}
                    placeholder="Type your message here. Use {{Name}} to insert lead's name."
                    className="w-full h-32 p-3 rounded-lg border border-slate-200 rounded-xl text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {bulkMode === 'ai' && (
                <div className="flex flex-col gap-4">
                  <label className="text-xs text-slate-500 font-semibold  tracking-normal">AI Instructions</label>
                  <textarea 
                    value={bulkPrompt}
                    onChange={e => setBulkPrompt(e.target.value)}
                    placeholder="Enter context or specific instructions (e.g. 'Announce our new premium Assam tea premix with 10% off for bulk orders...')"
                    className="w-full h-24 p-3 rounded-lg border border-slate-200 rounded-xl text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    onClick={async () => {
                      setIsGeneratingBulk(true);
                      setBulkMessageResult('');
                      try {
                        const targetLeads = inquiries.filter(i => selectedLeadsIds.has(i.id));
                        const res = await fetch('/api/generate-bulk-message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            leads: targetLeads,
                            companyName,
                            companyProducts,
                            customPrompt: bulkPrompt,
                            customApiKey: geminiApiKey,
                            catalogUrl: whatsappCatalogUrl,
                            reviewUrl: googleBusinessUrl
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setBulkMessageResult(data.message);
                      } catch (err: any) {
                        alert(err.message);
                      }
                      setIsGeneratingBulk(false);
                    }}
                    disabled={isGeneratingBulk}
                    className="bg-slate-900 text-white rounded-xl text-white px-6 py-3 font-medium rounded-xl text-base  tracking-normal text-xs hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:text-slate-500"
                  >
                    {isGeneratingBulk ? 'Generating...' : 'Generate AI Broadcast'}
                  </button>
                  {bulkMessageResult && (
                    <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4">
                      <div className="text-xs text-slate-500 font-semibold  tracking-normal border-b border-slate-200 pb-2 mb-3 bg-white">
                        Generated Template
                      </div>
                      <div className="font-sans text-sm whitespace-pre-wrap leading-relaxed">
                        {bulkMessageResult}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t-2 border-slate-200 p-4 bg-slate-50 flex justify-end gap-4 shrink-0">
               <button 
                 onClick={() => setShowBulkAction(false)}
                 className="px-6 py-3 font-medium rounded-xl text-base  tracking-normal text-xs hover:underline"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   if (!whatsappLinked) {
                     alert("Please link your WhatsApp account in the settings first.");
                     setActiveTab("settings");
                     setShowBulkAction(false);
                     return;
                   }
                   let initialMessage = bulkMessageResult;
                   if (bulkMode === 'template' && !initialMessage) {
                     initialMessage = BULK_TEMPLATES.find(t => t.id === bulkSelectedTemplate)?.content || '';
                   } else if (bulkMode === 'manual' && !initialMessage) {
                     initialMessage = bulkManualText;
                   }
                   
                   if (!initialMessage.trim()) {
                     alert("Please provide a message to send.");
                     return;
                   }
                   
                   setBulkMessageResult(initialMessage);
                   setShowConfirmBulkDialog(true);
                 }}
                 disabled={isGeneratingBulk || selectedLeadsIds.size === 0}
                 className="bg-emerald-600 text-white border border-slate-200 rounded-xl px-6 py-3 font-medium rounded-xl text-base  tracking-normal text-xs hover:bg-slate-900 hover:text-[#25D366] disabled:text-slate-500 transition-colors"
               >
                 Review & Send &rarr;
               </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmBulkDialog && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900 text-white rounded-xl/80 backdrop-blur-md">
            <div className="bg-blue-600 border border-slate-200 rounded-2xl p-8 max-w-lg w-full flex flex-col shadow-sm">
               <h3 className="text-2xl font-semibold  tracking-tight mb-2">Ready to broadcast?</h3>
               <p className="text-sm border-b border-slate-200 pb-4 mb-4">
                 You are about to send messages to <b>{selectedLeadsIds.size}</b> leads.
                 This process will open a new WhatsApp Web tab for each lead sequentially.
                 Browsers typically block multiple popups, so please click <strong>'Allow popups for this site'</strong> when prompted.
               </p>
               
               <div className="bg-slate-900 text-white rounded-xl text-white p-4 mb-4 border border-slate-200 rounded-lg text-xs font-sans max-h-40 overflow-y-auto whitespace-pre-wrap">
                 {bulkMessageResult}
               </div>

               <div className="flex gap-4 mt-4">
                 <button 
                   onClick={() => setShowConfirmBulkDialog(false)}
                   className="flex-1 border border-slate-200 rounded-xl bg-white py-3 font-semibold  text-xs hover:opacity-90 hover:-translate-y-0.5 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => {
                     setShowConfirmBulkDialog(false);
                     setShowBulkAction(false);
                     
                     let delay = 0;
                     const targetLeads = inquiries.filter(i => selectedLeadsIds.has(i.id));
                     
                     targetLeads.forEach((lead, index) => {
                       setTimeout(() => {
                         let finalMessage = bulkMessageResult
                             .replace(/{{[Nn]ame}}/g, lead.customerName)
                             .replace(/{{[Rr]equirements}}/g, lead.requirements)
                             .replace(/{{[Cc]atalog}}/g, whatsappCatalogUrl || 'our catalog')
                             .replace(/{{[Rr]eview}}/g, googleBusinessUrl || 'our page')
                             .replace(/{{[Cc]ompanyName}}/g, companyName || 'us');
                         
                         const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');
                         window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
                         
                         if (index === targetLeads.length - 1) {
                           setTimeout(() => alert(`Sent requests for ${targetLeads.length} leads. Please check your new tabs/windows.`), 1000);
                         }
                       }, delay);
                       delay += 800;
                     });
                   }}
                   className="flex-1 border border-slate-200 rounded-xl bg-slate-900 text-white rounded-xl text-blue-600 py-3 font-semibold  text-xs hover:bg-slate-900"
                 >
                   Confirm & Send
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

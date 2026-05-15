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

  const handleProcessEmail = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: SAMPLE_EMAIL })
      });
      
      const data = await response.json();
      
      const newInquiry: Inquiry = {
        id: Math.random().toString(36).substring(7),
        ...data,
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
    <div className="min-h-screen bg-[#F2F1ED] text-[#1A1A1A] flex flex-col md:flex-row font-sans border-4 md:border-[12px] border-[#1A1A1A] selection:bg-[#D4FF00] selection:text-black">
      {/* Sidebar */}
      <div className="w-full md:w-[320px] bg-white border-b-2 md:border-b-0 md:border-r-2 border-[#1A1A1A] flex flex-col flex-none">
        <div className="p-4 md:p-6 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] text-white">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter uppercase italic flex items-center gap-3" style={{ fontFamily: "'Georgia', serif" }}>
            Automata
          </h1>
          <span className="text-[8px] md:text-[10px] font-semibold tracking-[0.2em] uppercase border border-white px-2 py-0.5 mt-2 md:mt-4 inline-block">
            Lead Integration
          </span>
        </div>
        <nav className="flex-none md:flex-1 p-2 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar">
          <div className="hidden md:block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-2">Systems</div>
          <button 
            onClick={() => setActiveTab('leads')}
            className={`flex-none md:w-full flex items-center justify-between p-3 md:p-4 border-2 transition-all cursor-pointer ${activeTab === 'leads' ? 'border-[#1A1A1A] bg-[#D4FF00] font-bold text-black' : 'border-transparent hover:border-[#1A1A1A] hover:bg-black hover:text-white'}`}
          >
            <div className="flex items-center gap-2 md:gap-3 font-mono text-xs uppercase whitespace-nowrap">
              <Users className="h-4 w-4" />
              Inquiries
            </div>
            {inquiries.length > 0 && (
              <span className={`hidden md:inline-block text-[10px] font-mono px-2 py-0.5 ${activeTab === 'leads' ? 'bg-black text-[#D4FF00]' : 'border border-current'}`}>
                {inquiries.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('crm')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 transition-all cursor-pointer ${activeTab === 'crm' ? 'border-[#1A1A1A] bg-[#D4FF00] font-bold text-black' : 'border-transparent hover:border-[#1A1A1A] hover:bg-black hover:text-white'}`}
          >
            <Briefcase className="h-4 w-4" />
            <span className="font-mono text-xs uppercase whitespace-nowrap">CRM View</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 transition-all cursor-pointer ${activeTab === 'inbox' ? 'border-[#1A1A1A] bg-[#D4FF00] font-bold text-black' : 'border-transparent hover:border-[#1A1A1A] hover:bg-black hover:text-white'}`}
          >
            <Inbox className="h-4 w-4" />
            <span className="font-mono text-xs uppercase whitespace-nowrap">Email Sync</span>
          </button>

          <button 
            onClick={() => setActiveTab('prompt')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 transition-all cursor-pointer ${activeTab === 'prompt' ? 'border-[#1A1A1A] bg-[#D4FF00] font-bold text-black' : 'border-transparent hover:border-[#1A1A1A] hover:bg-black hover:text-white'}`}
          >
            <FileText className="h-4 w-4" />
            <span className="font-mono text-xs uppercase whitespace-nowrap">Prompt Engine</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-none md:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 transition-all cursor-pointer ${activeTab === 'settings' ? 'border-[#1A1A1A] bg-[#D4FF00] font-bold text-black' : 'border-transparent hover:border-[#1A1A1A] hover:bg-black hover:text-white'}`}
          >
            <Settings className="h-4 w-4" />
            <span className="font-mono text-xs uppercase whitespace-nowrap">Settings</span>
          </button>
        </nav>
        <div className="hidden md:block p-6 border-t-2 border-[#1A1A1A] bg-white">
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold opacity-50">System Status</span>
             <span className="text-xs font-mono font-bold">ONLINE / ACTIVE</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b-2 border-[#1A1A1A] p-6 md:p-8 flex flex-col justify-center shrink-0">
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1 md:mb-2">
            {activeTab === 'inbox' && 'Synchronization Engine'}
            {activeTab === 'leads' && 'Queue Intelligence'}
            {activeTab === 'crm' && 'Relationship Details'}
            {activeTab === 'prompt' && 'AI Configuration View'}
            {activeTab === 'settings' && 'System Integrations'}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-none italic" style={{ fontFamily: "'Georgia', serif" }}>
            {activeTab === 'inbox' && 'Process Inquiries'}
            {activeTab === 'leads' && 'Pipeline Management'}
            {activeTab === 'crm' && 'CRM Workspace'}
            {activeTab === 'prompt' && 'Prompt Instructions'}
            {activeTab === 'settings' && 'Integrations'}
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'inbox' && (
            <div className="max-w-4xl w-full bg-white border-2 border-[#1A1A1A] flex flex-col md:shadow-[8px_8px_0_0_#1A1A1A]">
              <div className="p-4 md:p-8 border-b-2 border-[#1A1A1A] bg-[#F9F9F9]">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Mailbox Configuration</h3>
                  <button
                    onClick={handleSyncGmail}
                    disabled={!gmailLinked || isSyncingGmail}
                    className="bg-[#EA4335] text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:invert transition-all disabled:opacity-50 disabled:hover:invert-0 flex items-center gap-2 shrink-0 self-start md:self-auto"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingGmail ? 'animate-spin' : ''}`} />
                    {isSyncingGmail ? 'Syncing...' : 'Sync Gmail Now'}
                  </button>
                </div>
                
                {lastSyncResult && (
                  <div className="mb-6 text-[#EA4335] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-[#fdf0ef] border border-[#EA4335] px-3 py-2 w-fit">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Last sync completed at {lastSyncResult.time}. {lastSyncResult.count} new inquiries pulled.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Target Account</label>
                     <select 
                       className="border-2 border-[#1A1A1A] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white disabled:opacity-50"
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
                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Monitored Label / Folder</label>
                     <select 
                       value={syncFolder}
                       onChange={(e) => setSyncFolder(e.target.value)}
                       className="border-2 border-[#1A1A1A] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white disabled:opacity-50"
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
                    className="text-[10px] text-[#EA4335] font-bold uppercase tracking-widest mt-4 hover:underline text-left inline-flex items-center gap-1"
                  >
                     <span className="text-base leading-none">&larr;</span> Go to Settings to link a Gmail Account
                  </button>
                )}
              </div>

              {/* Upcoming Reminders Section */}
              {inquiries.filter(i => i.reminderDate && i.status !== 'contacted').length > 0 && (
                <div className="p-4 md:p-8 border-b-2 border-[#1A1A1A] bg-[#fffbed]">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-[#EA4335]">
                    <Bell className="h-4 w-4" /> Upcoming Reminders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inquiries
                      .filter(i => i.reminderDate && i.status !== 'contacted')
                      .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime())
                      .slice(0, 4)
                      .map(inquiry => (
                        <div key={inquiry.id} className="border-2 border-[#1A1A1A] bg-white p-4 flex justify-between items-center text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold cursor-pointer hover:underline" onClick={() => { setActiveTab('leads'); setSelectedInquiry(inquiry); }}>{inquiry.customerName}</span>
                            <span className="font-mono opacity-70 text-xs">{new Date(inquiry.reminderDate!).toLocaleString()}</span>
                          </div>
                          <button 
                            className="bg-[#1A1A1A] text-white px-3 py-1 font-bold uppercase tracking-widest text-[10px] hover:bg-[#D4FF00] hover:text-black border-2 border-[#1A1A1A] transition-all"
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

              <div className="p-4 md:p-8 border-b-2 border-[#1A1A1A]">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">Simulate Incoming Payload</h3>
                <div className="bg-[#F9F9F9] p-4 md:p-6 border border-[#1A1A1A] font-mono text-xs md:text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed overflow-x-auto relative">
                  {!gmailLinked && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-[#1A1A1A] m-2">
                       <span className="font-bold uppercase tracking-widest text-[#1A1A1A] bg-white px-4 py-2 border-2 border-[#1A1A1A]">Account Not Linked</span>
                    </div>
                  )}
                  {SAMPLE_EMAIL}
                </div>
              </div>
              <div className="p-4 md:p-8 bg-[#D4FF00] flex justify-end">
                <button
                  onClick={handleProcessEmail}
                  disabled={isProcessing || !gmailLinked}
                  className="w-full md:w-auto bg-black text-white px-6 md:px-8 py-3 md:py-4 font-bold uppercase tracking-widest hover:invert transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs md:text-base cursor-pointer"
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
              <div className="flex flex-col md:flex-row gap-4 bg-white border-2 border-[#1A1A1A] p-4 shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-[#1A1A1A] bg-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-[#D4FF00] font-mono text-sm"
                  />
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap gap-2">
                  <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-8 pr-8 py-2 border-2 border-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00] text-[10px] uppercase font-bold tracking-widest appearance-none h-full"
                    >
                      <option value="all">All Status</option>
                      <option value="new">Unprocessed</option>
                      <option value="contacted">Contacted</option>
                      <option value="reminders">Has Reminders</option>
                    </select>
                  </div>
                  
                  <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pl-8 pr-8 py-2 border-2 border-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00] text-[10px] uppercase font-bold tracking-widest appearance-none h-full"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative shrink-0">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                    <select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="pl-8 pr-8 py-2 border-2 border-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00] text-[10px] uppercase font-bold tracking-widest appearance-none h-full"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Header */}
              {filteredInquiries.length > 0 && (
                <div className="flex items-center justify-between bg-white border-2 border-[#1A1A1A] p-2 px-4 shrink-0">
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
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      {selectedLeadsIds.size} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="bg-[#1A1A1A] text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:invert flex items-center gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Export Leads
                    </button>
                    <button
                      onClick={() => setShowBulkAction(true)}
                      disabled={selectedLeadsIds.size === 0}
                      className="bg-[#25D366] text-black px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:invert disabled:opacity-50 disabled:hover:invert-0 flex items-center gap-2"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Bulk WhatsApp
                    </button>
                  </div>
                </div>
              )}



              {inquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-[#1A1A1A]">
                  <Users className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-4xl font-bold italic mb-4" style={{ fontFamily: "'Georgia', serif" }}>Awaiting Data</h3>
                  <p className="text-[10px] uppercase font-mono tracking-widest opacity-50">Run the email simulation to populate the queue.</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-[#1A1A1A]">
                  <Search className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-4xl font-bold italic mb-4" style={{ fontFamily: "'Georgia', serif" }}>No Results</h3>
                  <p className="text-[10px] uppercase font-mono tracking-widest opacity-50">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
                  <div className="col-span-1 xl:col-span-2 flex flex-col gap-4">
                    {filteredInquiries.map((inquiry) => (
                      <div 
                        key={inquiry.id} 
                        className={`border-2 p-4 md:p-6 transition-all ${selectedInquiry?.id === inquiry.id ? 'border-[#1A1A1A] bg-[#D4FF00] md:shadow-[6px_6px_0_0_#1A1A1A]' : 'border-[#1A1A1A] bg-white group'}`}
                      >
                        <div className="flex justify-between items-start mb-4 border-b border-current pb-4">
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 mt-1 accent-black cursor-pointer object-none border-2 border-[#1A1A1A]"
                              checked={selectedLeadsIds.has(inquiry.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLeadsIds);
                                if (e.target.checked) newSet.add(inquiry.id);
                                else newSet.delete(inquiry.id);
                                setSelectedLeadsIds(newSet);
                              }}
                            />
                            <div className="flex flex-col cursor-pointer hover:underline" onClick={() => setSelectedInquiry(inquiry)}>
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                                {inquiry.category}
                              </span>
                              <h3 className="text-3xl font-bold leading-none italic" style={{ fontFamily: "'Georgia', serif" }}>
                                {inquiry.customerName}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-mono border border-current px-2 py-0.5">
                              {inquiry.receivedAt}
                            </span>
                            {inquiry.status === 'new' && (
                              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${selectedInquiry?.id === inquiry.id ? 'bg-[#1A1A1A] text-white' : 'bg-[#D4FF00] text-black group-hover:bg-black group-hover:text-white'}`}>
                                Unprocessed
                              </span>
                            )}
                            {inquiry.reminderDate && (
                              <span className="text-[10px] uppercase font-bold tracking-widest text-[#EA4335] flex items-center gap-1 border border-[#EA4335] px-2 py-0.5 bg-[#fdf0ef]">
                                <Bell className="h-3 w-3" /> {new Date(inquiry.reminderDate).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="font-mono text-xs mb-6 opacity-80 leading-relaxed border-l-2 border-current pl-4">
                          {inquiry.requirements}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <a href={`tel:${inquiry.phoneNumber}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-current px-4 py-2 hover:bg-white hover:text-black hover:border-white transition-all">
                            <Phone className="h-4 w-4" /> Call
                          </a>
                          <a href={`sms:${inquiry.phoneNumber}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-current px-4 py-2 hover:bg-white hover:text-black hover:border-white transition-all">
                            <MessageSquare className="h-4 w-4" /> SMS
                          </a>
                          <a href={`mailto:${inquiry.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-current px-4 py-2 hover:bg-white hover:text-black hover:border-white transition-all">
                            <Mail className="h-4 w-4" /> Email
                          </a>
                          <span className="text-[10px] font-bold uppercase tracking-widest ml-auto opacity-50 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {inquiry.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Detail Panel */}
                  <div className="col-span-1 border-2 border-dashed border-[#1A1A1A] p-4 md:p-8 bg-white flex flex-col md:sticky md:top-8 mt-4 md:mt-0">
                    {selectedInquiry ? (
                      <>
                         <div className="flex items-center justify-between mb-6 md:mb-8">
                           <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1">
                             Automation Actions
                           </span>
                           <div className="w-3 h-3 bg-[#D4FF00] border border-black shadow-[0_0_8px_rgba(212,255,0,0.8)]"></div>
                         </div>
                         
                         <div className="flex flex-col gap-6">
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-mono opacity-50 mb-3">AI Compiled Pitch</span>
                             <div className="p-6 border border-[#1A1A1A] bg-[#F9F9F9]">
                               <p className="italic text-lg leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                                 "{selectedInquiry.whatsAppTemplate}"
                               </p>
                             </div>
                           </div>
                           
                           <button 
                            onClick={() => {
                              const cleanPhone = selectedInquiry.phoneNumber.replace(/[^0-9+]/g, '');
                              window.location.href = `tel:${cleanPhone}`;
                            }}
                            className="w-full bg-[#1A1A1A] text-[#D4FF00] border-2 border-[#1A1A1A] py-4 md:py-5 text-sm md:text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#D4FF00] hover:text-[#1A1A1A] transition-all mt-4"
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
                            className="w-full bg-[#25D366] text-black border-2 border-[#1A1A1A] py-4 md:py-5 text-sm md:text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:invert transition-all mt-4"
                           >
                             <MessageSquare className="h-5 w-5" />
                             Execute WhatsApp Lead
                           </button>

                           <button 
                            onClick={() => handleRequestReview(selectedInquiry)}
                            disabled={isGeneratingReviewMsg}
                            className="w-full bg-[#fdf0ef] text-[#EA4335] border-2 border-[#EA4335] py-4 md:py-5 text-sm md:text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#EA4335] hover:text-white transition-all mt-4 disabled:opacity-50"
                           >
                             {isGeneratingReviewMsg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
                             {isGeneratingReviewMsg ? 'Generating...' : 'Request Review via WhatsApp'}
                           </button>

                           <div className="mt-4 pt-6 border-t-2 border-dashed border-[#1A1A1A] flex flex-col gap-2">
                             <span className="text-[10px] uppercase font-mono bg-black text-white px-2 py-1 flex items-center gap-2 self-start"><Bell className="h-3 w-3" /> Follow-up Reminder</span>
                             <input 
                                 type="datetime-local"
                                 value={selectedInquiry.reminderDate || ''}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   const updated = { ...selectedInquiry, reminderDate: val };
                                   setSelectedInquiry(updated);
                                   setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                                 }}
                                 className="w-full border-2 border-[#1A1A1A] p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black bg-[#F9F9F9]"
                             />
                           </div>
                         </div>

                         <div className="mt-8 pt-8 border-t-2 border-[#1A1A1A]">
                           <span className="text-[10px] uppercase font-mono opacity-50 mb-4 block">Raw JSON Packet</span>
                           <pre className="bg-[#1A1A1A] text-[#D4FF00] p-4 border border-[#1A1A1A] text-[10px] font-mono overflow-auto max-h-64">
{JSON.stringify(selectedInquiry, null, 2)}
                           </pre>
                         </div>
                      </>
                    ) : (
                      <div className="py-20 flex flex-col justify-center items-center opacity-30">
                        <span className="text-6xl font-bold italic" style={{ fontFamily: "'Georgia', serif" }}>?</span>
                        <span className="text-[10px] uppercase font-mono tracking-widest mt-4 text-center">Select target<br/>for actions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="flex flex-col h-full bg-white border-2 border-[#1A1A1A] md:shadow-[8px_8px_0_0_#1A1A1A] p-2 md:p-6 pb-2 relative">
               <div className="flex h-full overflow-x-auto gap-4 md:gap-6 no-scrollbar snap-x">
                 {CRM_STAGES.map(stage => {
                   const stageLeads = inquiries.filter(i => (i.status === stage));
                   
                   return (
                     <div key={stage} className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] flex flex-col snap-start shrink-0">
                       <h3 className="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-3 mb-2 flex items-center justify-between group">
                         <span className={
                           stage === 'won' ? 'bg-[#25D366] text-black px-1' : 
                           stage === 'lost' ? 'bg-[#FF6B6B] text-black px-1' : 
                           stage === 'new' ? 'bg-[#D4FF00] text-black px-1' : 
                           stage === 'contacted' ? 'bg-[#FF90E8] text-black px-1' : 
                           stage === 'qualified' ? 'bg-[#00E5FF] text-black px-1' : 
                           stage === 'proposal' ? 'bg-[#FFC900] text-black px-1' : 
                           'text-black'
                         }>
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
                                 className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold hover:invert flex items-center gap-1 cursor-pointer"
                                 title="Send bulk WhatsApp message to this stage"
                               >
                                 Bulk Msg
                               </button>
                            )}
                            <span className="text-[10px] font-mono opacity-50">{stageLeads.length} leads</span>
                         </div>
                       </h3>
                       <div className="w-full bg-[#F2F1ED] h-1.5 mb-2 border border-[#1A1A1A]">
                         <div 
                           className={`h-full ${stage === 'won' ? 'bg-[#25D366]' : stage === 'lost' ? 'bg-[#FF6B6B]' : stage === 'new' ? 'bg-[#D4FF00]' : stage === 'contacted' ? 'bg-[#FF90E8]' : stage === 'qualified' ? 'bg-[#00E5FF]' : stage === 'proposal' ? 'bg-[#FFC900]' : 'bg-[#1A1A1A]'}`}
                           style={{ width: `${inquiries.length > 0 ? (stageLeads.length / inquiries.length) * 100 : 0}%` }}
                         />
                       </div>
                       <div className={`flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-4 p-2 -mx-2 bg-gradient-to-b ${stage === 'won' ? 'from-[#25D366]/20' : stage === 'lost' ? 'from-[#FF6B6B]/20' : stage === 'new' ? 'from-[#D4FF00]/20' : stage === 'contacted' ? 'from-[#FF90E8]/20' : stage === 'qualified' ? 'from-[#00E5FF]/20' : stage === 'proposal' ? 'from-[#FFC900]/20' : 'from-transparent'} to-transparent`}>
                         {stageLeads.map(lead => (
                           <div 
                             key={lead.id} 
                             onClick={() => setSelectedInquiry(lead)}
                             className={`border-2 border-[#1A1A1A] p-4 transition-all cursor-pointer flex flex-col gap-2 group shadow-[3px_3px_0_0_#1A1A1A] hover:shadow-[1px_1px_0_0_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] ${stage === 'won' ? 'bg-[#25D366] hover:brightness-95' : stage === 'lost' ? 'bg-[#FF6B6B] hover:brightness-95' : stage === 'new' ? 'bg-[#D4FF00] hover:brightness-95' : stage === 'contacted' ? 'bg-[#FF90E8] hover:brightness-95' : stage === 'qualified' ? 'bg-[#00E5FF] hover:brightness-95' : stage === 'proposal' ? 'bg-[#FFC900] hover:brightness-95' : 'bg-[#F9F9F9] hover:bg-[#E0E0E0]'}`}
                           >
                             <div className="flex justify-between items-start">
                               <span className="font-bold text-sm" style={{ fontFamily: "'Georgia', serif" }}>{lead.customerName}</span>
                               <span className="text-[10px] uppercase font-mono">{lead.dealValue ? `$${lead.dealValue}` : '-'}</span>
                             </div>
                             <span className="text-xs opacity-70 line-clamp-1">{lead.requirements}</span>
                             {lead.reminderDate && (
                               <div className="text-[10px] uppercase font-bold tracking-widest text-[#EA4335] mt-1">
                                 Reminder: {new Date(lead.reminderDate).toLocaleDateString()}
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
                 <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white border-l-2 border-[#1A1A1A] shadow-[-8px_0_0_0_rgba(0,0,0,0.1)] flex flex-col z-10 transition-transform">
                    <div className="p-4 border-b-2 border-[#1A1A1A] flex justify-between items-center bg-[#D4FF00]">
                      <h2 className="font-bold tracking-widest uppercase text-xs">Lead Details</h2>
                      <button onClick={() => setSelectedInquiry(null)} className="font-bold uppercase text-[10px] hover:underline">Close</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                       <div>
                         <h3 className="text-2xl font-bold italic mb-1" style={{ fontFamily: "'Georgia', serif" }}>{selectedInquiry.customerName}</h3>
                         <span className="text-xs font-mono uppercase opacity-70">{selectedInquiry.phoneNumber} • {selectedInquiry.email}</span>
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest">Stage</label>
                         <select 
                           value={selectedInquiry.status}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, status: e.target.value as any };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                           }}
                           className="border-2 border-[#1A1A1A] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00] bg-white"
                         >
                           {CRM_STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                         </select>
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest">Deal Value ($)</label>
                         <input 
                           type="number"
                           value={selectedInquiry.dealValue || ''}
                           onChange={(e) => {
                             const updated = { ...selectedInquiry, dealValue: parseFloat(e.target.value) || 0 };
                             setSelectedInquiry(updated);
                             setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                           }}
                           className="border-2 border-[#1A1A1A] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                         />
                       </div>

                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest">Requirements</label>
                         <p className="border-2 border-dashed border-[#1A1A1A] p-3 text-sm opacity-80 bg-[#F9F9F9]">
                           {selectedInquiry.requirements}
                         </p>
                       </div>

                       <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-end">
                           <label className="text-[10px] font-bold uppercase tracking-widest">Lead Notes</label>
                           {isSavingNotes ? (
                             <span className="text-[10px] font-mono text-gray-500 italic">Saving...</span>
                           ) : (
                             <span className="text-[10px] font-mono text-[#25D366] italic transition-opacity">Saved</span>
                           )}
                         </div>
                         <textarea 
                           className="border-2 border-[#1A1A1A] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00] h-24 resize-none bg-[#F9F9F9] focus:bg-white transition-colors"
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
                         <div className="flex justify-between items-center bg-[#1A1A1A] text-white px-3 py-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest">Contact History</span>
                           <div className="flex items-center gap-3">
                             <select 
                               className="bg-transparent text-[#D4FF00] text-[10px] uppercase font-bold focus:outline-none cursor-pointer"
                               value={historyFilter}
                               onChange={(e) => setHistoryFilter(e.target.value)}
                             >
                               <option value="All" className="bg-[#1A1A1A]">All</option>
                               <option value="Note" className="bg-[#1A1A1A]">Notes</option>
                               <option value="Call" className="bg-[#1A1A1A]">Calls</option>
                               <option value="Email" className="bg-[#1A1A1A]">Emails</option>
                               <option value="WhatsApp" className="bg-[#1A1A1A]">WhatsApp</option>
                             </select>
                             <button 
                               className="text-[10px] font-bold uppercase hover:text-[#D4FF00]"
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
                             <span className="text-xs italic opacity-50">No history logged yet.</span>
                           ) : (
                             selectedInquiry.contactHistory
                               .filter(log => historyFilter === 'All' || log.type.trim().toLowerCase() === historyFilter.toLowerCase())
                               .map((log, idx) => (
                               <div key={idx} className="border border-[#1A1A1A] p-2 text-xs flex flex-col gap-1 bg-[#F9F9F9]">
                                 <div className="flex justify-between items-center border-b border-dashed border-[#1A1A1A] pb-1">
                                   <span className="font-bold uppercase text-[10px]">{log.type}</span>
                                   <span className="font-mono text-[10px] opacity-70">{log.date}</span>
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
            <div className="bg-white border-2 border-[#1A1A1A] p-6 md:p-12 max-w-5xl md:shadow-[8px_8px_0_0_#1A1A1A]">
              <div className="mb-8 md:mb-12 border-b-2 border-[#1A1A1A] pb-6 md:pb-8">
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight italic" style={{ fontFamily: "'Georgia', serif" }}>Core Directives</h3>
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-50 mt-4 leading-relaxed">
                  Systematic prompt logic dictating AI behavior.<br/>Controls extraction, taxonomy assignment, and tone configuration.
                </p>
              </div>

              <div className="bg-[#1A1A1A] text-[#F2F1ED] p-8 relative border-2 border-[#1A1A1A]">
                 <div className="absolute top-0 right-0 bg-[#D4FF00] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 border-b-2 border-l-2 border-[#1A1A1A]">
                   Live Configuration
                 </div>
                 <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed mt-4">
{systemPrompt || 'INITIALIZING SECURE PROMPT...'}
                 </pre>
              </div>

              <div className="mt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Analytical Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9]">
                    <CheckCircle2 className="h-6 w-6 text-black mb-4" />
                    <span className="block text-[10px] font-bold uppercase tracking-widest mb-2">Data Integrity</span>
                    <p className="text-xs font-mono opacity-70">Enforces structured JSON protocols over freeform text for immediate CRM compatibility.</p>
                  </div>
                  <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9]">
                    <CheckCircle2 className="h-6 w-6 text-black mb-4" />
                    <span className="block text-[10px] font-bold uppercase tracking-widest mb-2">Classification</span>
                    <p className="text-xs font-mono opacity-70">Strict taxonomy limits map raw intent directly to existing supply chain segments.</p>
                  </div>
                  <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9]">
                    <CheckCircle2 className="h-6 w-6 text-black mb-4" />
                    <span className="block text-[10px] font-bold uppercase tracking-widest mb-2">Generative Pitch</span>
                    <p className="text-xs font-mono opacity-70">Pre-computes dynamic marketing copy, collapsing the sales feedback loop to zero.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white border-2 border-[#1A1A1A] p-6 md:p-12 max-w-2xl md:shadow-[8px_8px_0_0_#1A1A1A]">
              <div className="mb-8 md:mb-12 border-b-2 border-[#1A1A1A] pb-6 md:pb-8">
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight italic" style={{ fontFamily: "'Georgia', serif" }}>Integrations & AI Config</h3>
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-50 mt-4 leading-relaxed">
                  Connect your accounts and configure your generative AI settings.
                </p>
              </div>

              {/* AI Config Section (Arihant Enterprises) */}
              <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#D4FF00] border-2 border-[#1A1A1A] p-1 shadow-[2px_2px_0_0_#1A1A1A] shrink-0">
                    <FileText className="h-4 w-4 text-black" />
                  </div>
                  <h4 className="text-lg font-bold">AI Assistant Setup</h4>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-mono opacity-70">Customize Gemini AI generation context and keys.</p>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Product / Service Offerings</label>
                    <textarea 
                      className="w-full border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00] resize-none h-16"
                      value={companyProducts}
                      onChange={(e) => setCompanyProducts(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-[#1A1A1A] pt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Google Business Profile URL</label>
                    <input 
                      type="url" 
                      placeholder="https://g.page/r/..." 
                      className="w-full border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                      value={googleBusinessUrl}
                      onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                    />
                    <span className="text-[10px] opacity-50 mt-1">Used to request ratings and reviews from customers.</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-[#1A1A1A] pt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">WhatsApp Catalog URL</label>
                    <input 
                      type="url" 
                      placeholder="https://wa.me/c/..." 
                      className="w-full border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                      value={whatsappCatalogUrl}
                      onChange={(e) => setWhatsappCatalogUrl(e.target.value)}
                    />
                    <span className="text-[10px] opacity-50 mt-1">Include your product catalog link in bulk messages.</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-[#1A1A1A] pt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Gemini API Key (Optional)</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to use Applet default"
                      className="w-full border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <span className="text-[10px] opacity-50 mt-1">If provided, this key will be used for Bulk Action AI generation specifically for your browser.</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9] mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-[#25D366]" />
                  <h4 className="text-lg font-bold">WhatsApp Personal / Web</h4>
                </div>
                
                {whatsappLinked ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-2 border-[#25D366] bg-[#e8fbf0] p-4 text-[#1A1A1A] gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#25D366]" />
                      <span className="font-mono text-sm font-bold truncate">Linked: {waPhoneInput}</span>
                    </div>
                    <button 
                      onClick={() => { setWhatsappLinked(false); setOtpSent(false); setWaPhoneInput(''); setWaOtpInput(''); }}
                      className="text-xs uppercase font-bold tracking-widest hover:underline whitespace-nowrap text-left md:text-right"
                    >
                      Unlink Account
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-mono opacity-70">Enter your WhatsApp number to link your account via OTP.</p>
                    
                    {!otpSent ? (
                      <div className="flex flex-col md:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. +91 9876543210" 
                          className="flex-1 border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
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
                          className="bg-black text-white px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-[#1A1A1A] min-h-[44px]"
                        >
                          Send OTP
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-[#25D366] text-xs font-bold bg-[#e8fbf0] p-2 border border-[#25D366]">Test Mode: OTP auto-filled (123456)</p>
                        <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            className="flex-1 border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                            value={waOtpInput}
                            onChange={(e) => setWaOtpInput(e.target.value)}
                            maxLength={6}
                          />
                          <button 
                            onClick={() => { if (waOtpInput.length > 4) setWhatsappLinked(true); }}
                            className="bg-[#25D366] text-black border-2 border-[#1A1A1A] px-6 py-2 font-bold uppercase tracking-widest text-xs hover:invert min-h-[44px]"
                          >
                            Verify & Link
                          </button>
                        </div>
                        <button 
                          onClick={() => setOtpSent(false)}
                          className="text-xs uppercase font-bold tracking-widest hover:underline text-left inline-block"
                        >
                          &larr; Change Number
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border border-[#1A1A1A] p-6 bg-[#F9F9F9] mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-6 w-6 text-[#EA4335]" />
                  <h4 className="text-lg font-bold">Gmail Integration</h4>
                </div>
                
                {gmailLinked ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-2 border-[#EA4335] bg-[#fdf0ef] p-4 text-[#1A1A1A] gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#EA4335]" />
                      <span className="font-mono text-sm font-bold truncate">Synced: {gmailAccount}</span>
                    </div>
                    <button 
                      onClick={() => { setGmailLinked(false); setGmailAccount(''); }}
                      className="text-xs uppercase font-bold tracking-widest hover:underline whitespace-nowrap text-left md:text-right"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : isLinkingGmail ? (
                   <div className="flex flex-col gap-4">
                      <p className="text-xs font-mono opacity-70">Enter your Gmail address to simulate Google OAuth connection.</p>
                      <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            type="email" 
                            placeholder="e.g. yourbusiness@gmail.com" 
                            className="flex-1 border-2 border-[#1A1A1A] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]"
                            value={gmailAccount}
                            onChange={(e) => setGmailAccount(e.target.value)}
                          />
                          <button 
                            onClick={() => { if (gmailAccount.includes('@')) { setGmailLinked(true); setIsLinkingGmail(false); } }}
                            className="bg-[#EA4335] text-white border-2 border-[#1A1A1A] px-6 py-2 font-bold uppercase tracking-widest text-xs hover:invert min-h-[44px]"
                          >
                            Connect Gmail
                          </button>
                      </div>
                      <button 
                          onClick={() => setIsLinkingGmail(false)}
                          className="text-xs uppercase font-bold tracking-widest hover:underline text-left inline-block"
                      >
                          &larr; Cancel
                      </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-mono opacity-70">Connect your Gmail account to continuously scan for new inquiries and add them to the queue automatically.</p>
                    
                    <button 
                      onClick={() => setIsLinkingGmail(true)}
                      className="bg-black text-white py-3 px-6 font-bold uppercase tracking-widest text-xs hover:bg-[#1A1A1A] md:self-start"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-[8px] border-[#1A1A1A] w-full max-w-2xl flex flex-col shadow-[16px_16px_0_0_#D4FF00] overflow-hidden max-h-full">
            <div className="bg-[#1A1A1A] p-4 flex justify-between items-center text-[#D4FF00]">
              <h4 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Bulk WhatsApp Broadcast
              </h4>
              <button onClick={() => setShowBulkAction(false)} className="hover:text-white uppercase text-[10px] tracking-widest font-bold">Close</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 border-l-4 border-[#1A1A1A] pl-4">
                <p className="font-mono text-xs opacity-70">Target Audience:</p>
                <p className="font-bold text-lg">{selectedLeadsIds.size} Selected Leads</p>
              </div>

              <div className="flex bg-[#F2F1ED] p-1 border-2 border-[#1A1A1A] mb-6">
                <button 
                  onClick={() => setBulkMode('ai')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${bulkMode === 'ai' ? 'bg-black text-[#D4FF00]' : 'hover:bg-white text-black'}`}
                >AI Generated</button>
                <button 
                  onClick={() => {
                    setBulkMode('template');
                    if (!bulkMessageResult) {
                      setBulkMessageResult(BULK_TEMPLATES.find(t => t.id === bulkSelectedTemplate)?.content || '');
                    }
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${bulkMode === 'template' ? 'bg-black text-[#D4FF00]' : 'hover:bg-white text-black'}`}
                >Pre-defined</button>
                <button 
                  onClick={() => {
                    setBulkMode('manual');
                    setBulkMessageResult(bulkManualText);
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${bulkMode === 'manual' ? 'bg-black text-[#D4FF00]' : 'hover:bg-white text-black'}`}
                >Manual Text</button>
              </div>

              {bulkMode === 'template' && (
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Select Template</label>
                  <select 
                    value={bulkSelectedTemplate}
                    onChange={(e) => {
                      setBulkSelectedTemplate(e.target.value);
                      const tpl = BULK_TEMPLATES.find(t => t.id === e.target.value);
                      if (tpl) setBulkMessageResult(tpl.content);
                    }}
                    className="border-2 border-[#1A1A1A] p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4FF00] bg-white appearance-none cursor-pointer"
                  >
                    {BULK_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <div className="border-2 border-dashed border-[#1A1A1A] p-4 bg-[#F9F9F9] text-sm whitespace-pre-wrap font-mono mt-2">
                    {BULK_TEMPLATES.find(t => t.id === bulkSelectedTemplate)?.content || ''}
                  </div>
                </div>
              )}

              {bulkMode === 'manual' && (
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Compose Message</label>
                  <textarea 
                    value={bulkManualText}
                    onChange={e => {
                      setBulkManualText(e.target.value);
                      setBulkMessageResult(e.target.value);
                    }}
                    placeholder="Type your message here. Use {{Name}} to insert lead's name."
                    className="w-full h-32 p-3 border-2 border-[#1A1A1A] text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                  />
                </div>
              )}

              {bulkMode === 'ai' && (
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest">AI Instructions</label>
                  <textarea 
                    value={bulkPrompt}
                    onChange={e => setBulkPrompt(e.target.value)}
                    placeholder="Enter context or specific instructions (e.g. 'Announce our new premium Assam tea premix with 10% off for bulk orders...')"
                    className="w-full h-24 p-3 border-2 border-[#1A1A1A] text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
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
                    className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:invert disabled:opacity-50"
                  >
                    {isGeneratingBulk ? 'Generating...' : 'Generate AI Broadcast'}
                  </button>
                  {bulkMessageResult && (
                    <div className="mt-4 border-2 border-[#1A1A1A] bg-white p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 mb-3 bg-white">
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

            <div className="border-t-2 border-[#1A1A1A] p-4 bg-[#F9F9F9] flex justify-end gap-4 shrink-0">
               <button 
                 onClick={() => setShowBulkAction(false)}
                 className="px-6 py-3 font-bold uppercase tracking-widest text-xs hover:underline"
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
                 className="bg-[#25D366] text-black border-2 border-[#1A1A1A] px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#1A1A1A] hover:text-[#25D366] disabled:opacity-50 transition-colors"
               >
                 Review & Send &rarr;
               </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmBulkDialog && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#D4FF00] border-4 border-[#1A1A1A] p-8 max-w-lg w-full flex flex-col shadow-[8px_8px_0_0_#1A1A1A]">
               <h3 className="text-2xl font-bold uppercase tracking-tighter mb-2">Ready to broadcast?</h3>
               <p className="text-sm border-b-2 border-[#1A1A1A] pb-4 mb-4">
                 You are about to send messages to <b>{selectedLeadsIds.size}</b> leads.
                 This process will open a new WhatsApp Web tab for each lead sequentially.
                 Browsers typically block multiple popups, so please click <strong>'Allow popups for this site'</strong> when prompted.
               </p>
               
               <div className="bg-black text-white p-4 mb-4 border border-[#1A1A1A] text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                 {bulkMessageResult}
               </div>

               <div className="flex gap-4 mt-4">
                 <button 
                   onClick={() => setShowConfirmBulkDialog(false)}
                   className="flex-1 border-2 border-[#1A1A1A] bg-white py-3 font-bold uppercase text-xs hover:invert"
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
                   className="flex-1 border-2 border-[#1A1A1A] bg-black text-[#D4FF00] py-3 font-bold uppercase text-xs hover:bg-[#1A1A1A]"
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

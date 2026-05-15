import React, { useState, useEffect, useMemo } from 'react';
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
  Bell
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
  status: 'new' | 'contacted';
  receivedAt: string;
  reminderDate?: string;
}

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
  const [activeTab, setActiveTab] = useState<'inbox' | 'leads' | 'prompt' | 'settings'>('leads');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  
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

  // Persist settings
  useEffect(() => {
    localStorage.setItem('whatsappLinked', whatsappLinked.toString());
    localStorage.setItem('waPhoneInput', waPhoneInput);
    localStorage.setItem('gmailLinked', gmailLinked.toString());
    localStorage.setItem('gmailAccount', gmailAccount);
    localStorage.setItem('syncFolder', syncFolder);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('companyName', companyName);
    localStorage.setItem('companyProducts', companyProducts);
  }, [whatsappLinked, waPhoneInput, gmailLinked, gmailAccount, syncFolder, geminiApiKey, companyName, companyProducts]);

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
            {activeTab === 'prompt' && 'AI Configuration View'}
            {activeTab === 'settings' && 'System Integrations'}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-none italic" style={{ fontFamily: "'Georgia', serif" }}>
            {activeTab === 'inbox' && 'Process Inquiries'}
            {activeTab === 'leads' && 'Pipeline Management'}
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
                  <button
                    onClick={() => setShowBulkAction(true)}
                    disabled={selectedLeadsIds.size === 0}
                    className="bg-[#25D366] text-black px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:invert disabled:opacity-50 disabled:hover:invert-0 flex items-center gap-2"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Bulk WhatsApp
                  </button>
                </div>
              )}

              {showBulkAction && (
                <div className="bg-[#D4FF00] border-2 border-[#1A1A1A] p-6 shrink-0 relative">
                  <button onClick={() => setShowBulkAction(false)} className="absolute top-4 right-4 text-xs font-bold uppercase hover:underline">Close</button>
                  <h4 className="text-xl font-bold italic mb-4" style={{ fontFamily: "'Georgia', serif" }}>Bulk WhatsApp AI Assistant</h4>
                  <p className="text-xs font-mono opacity-80 mb-4">Drafting message for {selectedLeadsIds.size} leads as <b>{companyName}</b>.</p>
                  
                  <textarea 
                    value={bulkPrompt}
                    onChange={e => setBulkPrompt(e.target.value)}
                    placeholder="Enter context or specific instructions (e.g. 'Announce our new premium Assam tea premix with 10% off for bulk orders...')"
                    className="w-full h-24 p-3 border-2 border-[#1A1A1A] text-sm font-mono mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                  ></textarea>

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
                            customApiKey: geminiApiKey
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
                    <div className="mt-6 border-2 border-[#1A1A1A] bg-white p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 mb-3 bg-white">
                        Generated Template
                      </div>
                      <div className="font-sans text-sm whitespace-pre-wrap leading-relaxed">
                        {bulkMessageResult}
                      </div>
                      <div className="mt-4 flex gap-3">
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(bulkMessageResult);
                             alert("Copied to clipboard!");
                           }}
                           className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:invert"
                         >
                           Copy to Clipboard
                         </button>
                         <button 
                           onClick={() => {
                             if (!whatsappLinked) {
                               alert("Please link your WhatsApp account in the settings first.");
                               setActiveTab("settings");
                               return;
                             }
                             const confirmSend = window.confirm(`This will attempt to open WhatsApp for ${selectedLeadsIds.size} selected leads one by one.\n\nNote: Browsers typically block multiple popups. You may need to click 'Allow popups for this site' and try again.\n\nProceed?`);
                             if (confirmSend) {
                               let delay = 0;
                               const targetLeads = inquiries.filter(i => selectedLeadsIds.has(i.id));
                               
                               // To avoid aggressive popup blocking, we'll process them in sequence
                               targetLeads.forEach((lead, index) => {
                                 setTimeout(() => {
                                   let finalMessage = bulkMessageResult.replace(/{{[Nn]ame}}/g, lead.customerName);
                                   const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');
                                   window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
                                   
                                   // If it's the last one, show a completion note
                                   if (index === targetLeads.length - 1) {
                                     setTimeout(() => alert(`Sent requests for ${targetLeads.length} leads. Please check your new tabs/windows.`), 1000);
                                   }
                                 }, delay);
                                 delay += 500; // 500ms delay between opens
                               });
                             }
                           }}
                           className="bg-[#25D366] text-black border-2 border-[#1A1A1A] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:invert"
                         >
                           Send via WhatsApp ({selectedLeadsIds.size})
                         </button>
                      </div>
                    </div>
                  )}
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
    </div>
  );
}

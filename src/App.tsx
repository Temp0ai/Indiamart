import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Calendar, Download, MessageSquare, Users } from 'lucide-react';
import type { Inquiry, ActiveTab, CRMStatus } from './types';
import { useLocalStorage, useLocalStorageString } from './hooks/useLocalStorage';
import { Sidebar } from './components/Sidebar';
import { InboxTab } from './components/InboxTab';
import { LeadCard } from './components/LeadCard';
import { DetailPanel } from './components/DetailPanel';
import { CRMTab } from './components/CRMTab';
import { PromptTab } from './components/PromptTab';
import { SettingsTab } from './components/SettingsTab';
import { BulkActionModal } from './components/BulkActionModal';

export default function App() {
  // --- Core State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [inquiries, setInquiries] = useLocalStorage<Inquiry[]>('crm_inquiries', []);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [customTone, setCustomTone] = useLocalStorageString('ai_custom_tone', 'Professional, B2B, welcoming');

  // --- Settings ---
  const [whatsappLinked, setWhatsappLinked] = useLocalStorageString('whatsappLinked', 'false') as [string, (v: string) => void];
  const [waPhoneInput, setWaPhoneInput] = useLocalStorageString('waPhoneInput', '');
  const [gmailLinked, setGmailLinked] = useLocalStorageString('gmailLinked', 'false') as [string, (v: string) => void];
  const [gmailAccount, setGmailAccount] = useLocalStorageString('gmailAccount', '');
  const [syncFolder, setSyncFolder] = useLocalStorageString('syncFolder', 'INDIAMART_LEADS');
  const [geminiApiKey, setGeminiApiKey] = useLocalStorageString('geminiApiKey', '');
  const [companyName, setCompanyName] = useLocalStorageString('companyName', 'Arihant Enterprises');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useLocalStorageString('googleBusinessUrl', '');
  const [whatsappCatalogUrl, setWhatsappCatalogUrl] = useLocalStorageString('whatsappCatalogUrl', '');
  const [companyProducts, setCompanyProducts] = useLocalStorageString('companyProducts', 'Mfg / Export tea & coffee premix');

  // --- Gmail Sync ---
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ count: number; time: string } | null>(null);

  // --- Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // --- Bulk ---
  const [selectedLeadsIds, setSelectedLeadsIds] = useState<Set<string>>(new Set());
  const [showBulkAction, setShowBulkAction] = useState(false);

  // --- Review ---
  const [isGeneratingReviewMsg, setIsGeneratingReviewMsg] = useState(false);

  // --- Load system prompt ---
  useEffect(() => {
    fetch(`/api/prompt?tone=${encodeURIComponent(customTone)}`)
      .then((res) => res.json())
      .then((data) => setSystemPrompt(data.prompt))
      .catch((err) => console.error('Failed to load prompt', err));
  }, [customTone]);

  // --- Derived ---
  const isWaLinked = whatsappLinked === 'true';
  const isGmailLinked = gmailLinked === 'true';

  const uniqueCategories = useMemo(
    () => Array.from(new Set(inquiries.map((i) => i.category).filter(Boolean))),
    [inquiries]
  );

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inquiry.customerName?.toLowerCase().includes(q) ||
        inquiry.requirements?.toLowerCase().includes(q) ||
        inquiry.email?.toLowerCase().includes(q) ||
        inquiry.phoneNumber?.includes(q);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'reminders' ? !!inquiry.reminderDate : inquiry.status === filterStatus);

      const matchesCategory = filterCategory === 'all' || inquiry.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [inquiries, searchQuery, filterStatus, filterCategory]);

  // --- Email Processing ---
  const SAMPLE_EMAIL = `From: Indiamart <no-reply@indiamart.com>
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
Indiamart`;

  const categorizeByKeywords = (req: string): string => {
    const r = req.toLowerCase();
    if (r.includes('vending machine') || r.includes('coffee machine')) return 'Vending Machine';
    if (r.includes('premix') || r.includes('powder')) return 'Premix';
    if (r.includes('jaggery') || r.includes('gur')) return 'Jaggery';
    if (r.includes('lemon tea')) return 'Lemon Tea';
    if (r.includes('ice tea') || r.includes('iced tea')) return 'Ice Tea';
    if (r.includes('green tea')) return 'Green Tea';
    return 'Other';
  };

  const handleProcessEmail = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: SAMPLE_EMAIL, tone: customTone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const category = categorizeByKeywords(data.requirements || '') !== 'Other'
        ? categorizeByKeywords(data.requirements || '')
        : data.category || 'Other';

      const newInquiry: Inquiry = {
        id: Math.random().toString(36).substring(7),
        ...data,
        category,
        status: 'new',
        receivedAt: new Date().toLocaleTimeString(),
      };

      setInquiries((prev) => [newInquiry, ...prev]);
      setActiveTab('leads');
    } catch (error) {
      console.error('Failed to process email:', error);
      alert('Simulation failed. Check console.');
    } finally {
      setIsProcessing(false);
    }
  }, [customTone, setInquiries]);

  const handleSyncGmail = useCallback(() => {
    setIsSyncingGmail(true);
    setTimeout(() => {
      setIsSyncingGmail(false);
      setLastSyncResult({ count: Math.floor(Math.random() * 3) + 1, time: new Date().toLocaleTimeString() });
      handleProcessEmail();
    }, 2500);
  }, [handleProcessEmail]);

  // --- CSV Export ---
  const handleExportCSV = useCallback(() => {
    if (inquiries.length === 0) return;
    const headers = ['id', 'Customer Name', 'Phone Number', 'Email', 'Requirements', 'Category', 'Status', 'Received At', 'Deal Value'];
    const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const rows = inquiries.map((i) =>
      [esc(i.id), esc(i.customerName), esc(i.phoneNumber), esc(i.email), esc(i.requirements), esc(i.category), esc(i.status), esc(i.receivedAt), esc(String(i.dealValue || ''))].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crm_leads_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [inquiries]);

  // --- CSV Import ---
  const handleImportCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
      const idx = (field: string) => headers.findIndex((h) => h === field.toLowerCase());

      const imported: Inquiry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
        const row: string[] = [];
        let match;
        while ((match = regex.exec(lines[i])) !== null) {
          if (match[0] === '' && match.index === regex.lastIndex) regex.lastIndex++;
          row.push(match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2]);
        }

        const get = (field: string) => { const i = idx(field); return i >= 0 ? row[i] || '' : ''; };
        const status = get('Status');
        imported.push({
          id: get('id') || Math.random().toString(36).substring(7),
          customerName: get('Customer Name'),
          phoneNumber: get('Phone Number'),
          email: get('Email'),
          requirements: get('Requirements'),
          category: get('Category'),
          status: (['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].includes(status) ? status : 'new') as CRMStatus,
          receivedAt: get('Received At') || new Date().toLocaleTimeString(),
          dealValue: parseFloat(get('Deal Value')) || undefined,
          location: '',
          whatsAppTemplate: '',
        });
      }

      setInquiries((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        imported.forEach((imp) => {
          if (imp.id && map.has(imp.id)) {
            map.set(imp.id, { ...map.get(imp.id)!, ...imp });
          } else {
            map.set(imp.id, imp);
          }
        });
        return Array.from(map.values());
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setInquiries]);

  // --- Review Request ---
  const handleRequestReview = useCallback(async (lead: Inquiry) => {
    if (!isWaLinked) {
      alert('Please link your WhatsApp account in the settings first.');
      setActiveTab('settings');
      return;
    }
    if (!googleBusinessUrl) {
      alert('Please set your Google Business Profile URL in the settings first.');
      setActiveTab('settings');
      return;
    }
    setIsGeneratingReviewMsg(true);
    try {
      const res = await fetch('/api/generate-review-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, companyName, reviewUrl: googleBusinessUrl, customApiKey: geminiApiKey, tone: customTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(data.message)}`, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to generate review message.');
    } finally {
      setIsGeneratingReviewMsg(false);
    }
  }, [isWaLinked, googleBusinessUrl, companyName, geminiApiKey, customTone]);

  // --- Inquiry Update ---
  const handleUpdateInquiry = useCallback((updated: Inquiry) => {
    setSelectedInquiry(updated);
    setInquiries((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, [setInquiries]);

  // --- Bulk Toggle ---
  const toggleBulkSelect = useCallback((id: string) => {
    setSelectedLeadsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // --- Header Title ---
  const headerInfo: Record<ActiveTab, { subtitle: string; title: string }> = {
    inbox: { subtitle: 'Synchronization Engine', title: 'Process Inquiries' },
    leads: { subtitle: 'Queue Intelligence', title: 'Pipeline Management' },
    crm: { subtitle: 'Relationship Details', title: 'CRM Workspace' },
    prompt: { subtitle: 'AI Configuration View', title: 'Prompt Instructions' },
    settings: { subtitle: 'System Integrations', title: 'Integrations' },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-fuchsia-400/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} inquiryCount={inquiries.length} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-6 md:p-8 flex flex-col justify-center shrink-0">
          <span className="text-sm font-medium text-blue-600 mb-1">{headerInfo[activeTab].subtitle}</span>
          <h2 className="text-2xl md:text-5xl font-semibold tracking-tight leading-none">{headerInfo[activeTab].title}</h2>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {/* Inbox Tab */}
          {activeTab === 'inbox' && (
            <InboxTab
              gmailLinked={isGmailLinked}
              gmailAccount={gmailAccount}
              syncFolder={syncFolder}
              setSyncFolder={setSyncFolder}
              isSyncingGmail={isSyncingGmail}
              lastSyncResult={lastSyncResult}
              onSync={handleSyncGmail}
              onProcessEmail={handleProcessEmail}
              isProcessing={isProcessing}
              inquiries={inquiries}
              onNavigateToSettings={() => setActiveTab('settings')}
              onSelectInquiry={setSelectedInquiry}
              setActiveTab={setActiveTab as (tab: 'leads') => void}
            />
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="h-full flex flex-col gap-6">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 rounded-xl p-4 shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                  />
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-2">
                  {[
                    { value: filterStatus, set: setFilterStatus, icon: <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />, options: [['all', 'All Status'], ['new', 'Unprocessed'], ['contacted', 'Contacted'], ['reminders', 'Has Reminders']] },
                    { value: filterCategory, set: setFilterCategory, icon: <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />, options: [['all', 'All Categories'], ...uniqueCategories.map((c) => [c, c])] },
                  ].map((f, i) => (
                    <div key={i} className="relative shrink-0">
                      {f.icon}
                      <select
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                        className="pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold text-slate-600 appearance-none h-full outline-none"
                      >
                        {f.options.map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {filteredInquiries.length > 0 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 px-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={selectedLeadsIds.size === filteredInquiries.length && filteredInquiries.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadsIds(new Set(filteredInquiries.map((i) => i.id)));
                        } else {
                          setSelectedLeadsIds(new Set());
                        }
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-600">{selectedLeadsIds.size} Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="bg-slate-900 text-white px-4 py-2 font-medium rounded-lg text-xs hover:opacity-90 transition-all flex items-center gap-2">
                      <Download className="h-3 w-3" /> Export Leads
                    </button>
                    <button
                      onClick={() => setShowBulkAction(true)}
                      disabled={selectedLeadsIds.size === 0}
                      className="bg-emerald-600 text-white px-4 py-2 font-medium rounded-lg text-xs hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <MessageSquare className="h-3 w-3" /> Bulk WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Lead Cards */}
              {inquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                  <Users className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-3xl font-semibold mb-4 text-slate-400">Awaiting Data</h3>
                  <p className="text-sm text-slate-500">Run the email simulation to populate the queue.</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                  <Search className="h-16 w-16 opacity-20 mb-6" />
                  <h3 className="text-3xl font-semibold mb-4 text-slate-400">No Results</h3>
                  <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
                  <div className="col-span-1 xl:col-span-2 flex flex-col gap-4">
                    {filteredInquiries.map((inquiry) => (
                      <LeadCard
                        key={inquiry.id}
                        inquiry={inquiry}
                        isSelected={selectedInquiry?.id === inquiry.id}
                        isBulkSelected={selectedLeadsIds.has(inquiry.id)}
                        onToggleBulk={toggleBulkSelect}
                        onSelect={setSelectedInquiry}
                      />
                    ))}
                  </div>

                  {/* Detail Panel */}
                  <div className="col-span-1 border-2 border-dashed border-slate-200 p-4 md:p-8 bg-white flex flex-col md:sticky md:top-8 rounded-xl mt-4 md:mt-0">
                    <DetailPanel
                      inquiry={selectedInquiry}
                      onUpdate={handleUpdateInquiry}
                      onRequestReview={handleRequestReview}
                      isGeneratingReview={isGeneratingReviewMsg}
                      whatsappLinked={isWaLinked}
                      onNavigateToSettings={() => setActiveTab('settings')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CRM Tab */}
          {activeTab === 'crm' && (
            <CRMTab
              inquiries={inquiries}
              selectedInquiry={selectedInquiry}
              onSelectInquiry={setSelectedInquiry}
              onUpdateInquiry={handleUpdateInquiry}
              uniqueCategories={uniqueCategories}
              onImportCSV={handleImportCSV}
              onExportCSV={handleExportCSV}
              onBulkStageSelect={(stage) => {
                const stageLeads = inquiries.filter((i) => i.status === stage);
                setSelectedLeadsIds(new Set(stageLeads.map((l) => l.id)));
                setShowBulkAction(true);
              }}
            />
          )}

          {/* Prompt Tab */}
          {activeTab === 'prompt' && (
            <PromptTab customTone={customTone} setCustomTone={setCustomTone} systemPrompt={systemPrompt} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab
              companyName={companyName} setCompanyName={setCompanyName}
              companyProducts={companyProducts} setCompanyProducts={setCompanyProducts}
              googleBusinessUrl={googleBusinessUrl} setGoogleBusinessUrl={setGoogleBusinessUrl}
              whatsappCatalogUrl={whatsappCatalogUrl} setWhatsappCatalogUrl={setWhatsappCatalogUrl}
              geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey}
              whatsappLinked={isWaLinked} setWhatsappLinked={(v) => setWhatsappLinked(String(v))}
              waPhoneInput={waPhoneInput} setWaPhoneInput={setWaPhoneInput}
              gmailLinked={isGmailLinked} setGmailLinked={(v) => setGmailLinked(String(v))}
              gmailAccount={gmailAccount} setGmailAccount={setGmailAccount}
            />
          )}
        </div>
      </main>

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkAction}
        onClose={() => setShowBulkAction(false)}
        selectedCount={selectedLeadsIds.size}
        inquiries={inquiries}
        selectedIds={selectedLeadsIds}
        companyName={companyName}
        companyProducts={companyProducts}
        geminiApiKey={geminiApiKey}
        customTone={customTone}
        whatsappCatalogUrl={whatsappCatalogUrl}
        googleBusinessUrl={googleBusinessUrl}
        whatsappLinked={isWaLinked}
        onNavigateToSettings={() => setActiveTab('settings')}
      />
    </div>
  );
}

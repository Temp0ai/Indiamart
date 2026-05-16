import React from 'react';
import { Inbox, RefreshCw, CheckCircle2, Bell, Loader2 } from 'lucide-react';
import type { Inquiry } from '../types';

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

interface InboxTabProps {
  gmailLinked: boolean;
  gmailAccount: string;
  syncFolder: string;
  setSyncFolder: (v: string) => void;
  isSyncingGmail: boolean;
  lastSyncResult: { count: number; time: string } | null;
  onSync: () => void;
  onProcessEmail: () => void;
  isProcessing: boolean;
  inquiries: Inquiry[];
  onNavigateToSettings: () => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  setActiveTab: (tab: 'leads') => void;
}

export function InboxTab({
  gmailLinked, gmailAccount, syncFolder, setSyncFolder,
  isSyncingGmail, lastSyncResult, onSync, onProcessEmail,
  isProcessing, inquiries, onNavigateToSettings, onSelectInquiry, setActiveTab,
}: InboxTabProps) {
  const reminders = inquiries.filter(i => i.reminderDate && i.status !== 'contacted');

  return (
    <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
      {/* Mailbox Config */}
      <div className="p-4 md:p-8 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500">Mailbox Configuration</h3>
          <button
            onClick={onSync}
            disabled={!gmailLinked || isSyncingGmail}
            className="bg-red-500 text-white px-4 py-2 font-medium rounded-lg text-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncingGmail ? 'animate-spin' : ''}`} />
            {isSyncingGmail ? 'Syncing...' : 'Sync Gmail Now'}
          </button>
        </div>

        {lastSyncResult && (
          <div className="mb-6 text-xs font-semibold text-slate-600 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-fit">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-red-500" />
            <span>Last sync completed at {lastSyncResult.time}. {lastSyncResult.count} new inquiries pulled.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500">Target Account</label>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50 outline-none shadow-sm"
              disabled={!gmailLinked}
              value={gmailLinked ? gmailAccount : 'none'}
            >
              {gmailLinked ? (
                <option value={gmailAccount}>{gmailAccount}</option>
              ) : (
                <option value="none">No Accounts Linked</option>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500">Monitored Label / Folder</label>
            <select
              value={syncFolder}
              onChange={(e) => setSyncFolder(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50 outline-none shadow-sm"
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
            onClick={onNavigateToSettings}
            className="text-xs text-red-500 font-semibold mt-4 hover:underline text-left inline-flex items-center gap-1"
          >
            <span className="text-base leading-none">&larr;</span> Go to Settings to link a Gmail Account
          </button>
        )}
      </div>

      {/* Upcoming Reminders */}
      {reminders.length > 0 && (
        <div className="p-4 md:p-8 border-b border-slate-200 bg-amber-50">
          <h3 className="text-xs font-semibold tracking-wide text-red-500 mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" /> Upcoming Reminders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders
              .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime())
              .slice(0, 4)
              .map(inquiry => (
                <div key={inquiry.id} className="border border-slate-200 rounded-xl bg-white p-4 flex justify-between items-center text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold cursor-pointer hover:underline" onClick={() => { setActiveTab('leads'); onSelectInquiry(inquiry); }}>
                      {inquiry.customerName}
                    </span>
                    <span className="text-xs text-slate-600">{new Date(inquiry.reminderDate!).toLocaleString()}</span>
                  </div>
                  <button
                    className="bg-slate-900 text-white px-3 py-1.5 font-medium text-xs rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                    onClick={() => { setActiveTab('leads'); onSelectInquiry(inquiry); }}
                  >
                    View Lead
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sample Email */}
      <div className="p-4 md:p-8 border-b border-slate-200">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-4 md:mb-6">Simulate Incoming Payload</h3>
        <div className="bg-slate-50 p-4 md:p-6 border border-slate-200 rounded-lg font-mono text-xs md:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed overflow-x-auto relative">
          {!gmailLinked && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-slate-200 m-2">
              <span className="font-semibold bg-white px-4 py-2 border border-slate-200 rounded-xl">Account Not Linked</span>
            </div>
          )}
          {SAMPLE_EMAIL}
        </div>
      </div>

      {/* Process Button */}
      <div className="p-4 md:p-8 bg-blue-600 flex justify-end">
        <button
          onClick={onProcessEmail}
          disabled={isProcessing || !gmailLinked}
          className="w-full md:w-auto bg-slate-900 text-white rounded-xl px-6 md:px-8 py-3 md:py-4 font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs md:text-base cursor-pointer"
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
  );
}

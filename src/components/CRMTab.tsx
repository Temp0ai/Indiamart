import React, { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import type { Inquiry, CRMStatus } from '../types';
import { CRM_STAGES, STAGE_COLORS } from '../types';

interface CRMTabProps {
  inquiries: Inquiry[];
  selectedInquiry: Inquiry | null;
  onSelectInquiry: (inquiry: Inquiry | null) => void;
  onUpdateInquiry: (inquiry: Inquiry) => void;
  uniqueCategories: string[];
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV: () => void;
  onBulkStageSelect: (stage: CRMStatus) => void;
}

export function CRMTab({
  inquiries, selectedInquiry, onSelectInquiry, onUpdateInquiry,
  uniqueCategories, onImportCSV, onExportCSV, onBulkStageSelect,
}: CRMTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('All');

  const handleAddHistory = () => {
    if (!selectedInquiry) return;
    const type = prompt('Type (Note/Call/Email/WhatsApp):', 'Note') || 'Note';
    const note = prompt('Add history note:');
    if (!note) return;
    const updatedHistory = [...(selectedInquiry.contactHistory || []), { date: new Date().toLocaleString(), type, note }];
    onUpdateInquiry({ ...selectedInquiry, contactHistory: updatedHistory });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex justify-end mb-4 gap-3">
        <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={onImportCSV} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 font-medium rounded-lg text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
        <button
          onClick={onExportCSV}
          className="bg-slate-900 text-white px-4 py-2 font-medium rounded-lg text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 pb-2 relative overflow-hidden">
        <div className="flex h-full overflow-x-auto gap-6 md:gap-8 no-scrollbar snap-x relative z-10 pt-4">
          {CRM_STAGES.map((stage) => {
            const stageLeads = inquiries.filter((i) => i.status === stage);
            const colors = STAGE_COLORS[stage];

            return (
              <div key={stage} className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] flex flex-col snap-start shrink-0">
                {/* Stage Header */}
                <h3 className="text-sm font-medium tracking-tight border-b border-slate-200 pb-3 mb-3 flex items-center justify-between group text-slate-700">
                  <span className={`px-2 py-1 rounded-md ${colors.bg} ${colors.text} text-xs font-semibold`}>
                    {stage}
                  </span>
                  <div className="flex items-center gap-2">
                    {stageLeads.length > 0 && (
                      <button
                        onClick={() => onBulkStageSelect(stage)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-700 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 flex items-center gap-1 cursor-pointer border border-slate-300 rounded-md shadow-sm"
                      >
                        Bulk Msg
                      </button>
                    )}
                    <span className="text-sm text-slate-600 font-semibold bg-white border border-slate-300 px-2 py-0.5 rounded-md shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                </h3>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 mb-4 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} transition-all`}
                    style={{ width: `${inquiries.length > 0 ? (stageLeads.length / inquiries.length) * 100 : 0}%` }}
                  />
                </div>

                {/* Cards */}
                <div className={`flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-4 px-1 bg-gradient-to-b ${colors.accent} to-transparent rounded-b-xl`}>
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => onSelectInquiry(lead)}
                      className={`border border-slate-200/60 p-5 transition-all cursor-pointer flex flex-col gap-2 group shadow-sm hover:shadow-lg hover:-translate-y-1 bg-white rounded-xl relative overflow-hidden pl-5 ${
                        selectedInquiry?.id === lead.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${colors.bar}`} />
                      <div className="flex justify-between items-start relative z-10">
                        <span className="font-semibold text-base leading-tight text-slate-800">{lead.customerName}</span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {lead.dealValue ? `$${lead.dealValue}` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 relative z-10">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium border border-slate-200/50">
                          {lead.category || 'Other'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed relative z-10">
                        {lead.requirements}
                      </span>
                      {lead.reminderDate && (
                        <div className="text-[10px] font-semibold text-red-500 mt-2 uppercase tracking-wider flex items-center gap-1 relative z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
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

        {/* Right Detail Overlay */}
        {selectedInquiry && (
          <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white border-l border-slate-200/60 shadow-[-12px_0_32px_rgba(0,0,0,0.08)] flex flex-col z-20">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
              <h2 className="font-semibold text-slate-800 text-sm">Lead Details</h2>
              <button onClick={() => onSelectInquiry(null)} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {/* Name & Contact */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedInquiry.customerName}</h3>
                <span className="text-sm font-medium text-slate-500">
                  {selectedInquiry.phoneNumber} &bull; {selectedInquiry.email}
                </span>
              </div>

              {/* Stage Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</label>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => onUpdateInquiry({ ...selectedInquiry, status: e.target.value as CRMStatus })}
                  className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {CRM_STAGES.map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-blue-50 to-fuchsia-50 border border-slate-200/60 rounded-xl">
                <label className="text-sm text-slate-600 font-semibold flex items-center justify-between">
                  ✨ Lead Category
                  <span className="text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-full">AI Suggested</span>
                </label>
                <p className="text-xs text-slate-500 leading-tight mb-1">
                  Auto-assigned based on requirements keywords. You can edit or correct it below.
                </p>
                <input
                  type="text"
                  list="category-options"
                  value={selectedInquiry.category}
                  onChange={(e) => onUpdateInquiry({ ...selectedInquiry, category: e.target.value })}
                  className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                  placeholder="Enter or select category"
                />
                <datalist id="category-options">
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Deal Value */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Deal Value ($)</label>
                <input
                  type="number"
                  value={selectedInquiry.dealValue || ''}
                  onChange={(e) => onUpdateInquiry({ ...selectedInquiry, dealValue: parseFloat(e.target.value) || 0 })}
                  className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Requirements */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">Requirements</label>
                <p className="border-2 border-dashed border-slate-200 p-3 text-sm text-slate-700 bg-slate-50 rounded-lg">
                  {selectedInquiry.requirements}
                </p>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-semibold text-slate-500">Lead Notes</label>
                  <span className={`text-xs font-mono ${isSavingNotes ? 'text-gray-500' : 'text-emerald-600'}`}>
                    {isSavingNotes ? 'Saving...' : 'Saved'}
                  </span>
                </div>
                <textarea
                  className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"
                  placeholder="Jot down details, next steps, context..."
                  value={selectedInquiry.notes || ''}
                  onChange={(e) => {
                    onUpdateInquiry({ ...selectedInquiry, notes: e.target.value });
                    setIsSavingNotes(true);
                    if (savingTimeout.current) clearTimeout(savingTimeout.current);
                    savingTimeout.current = setTimeout(() => setIsSavingNotes(false), 1000);
                  }}
                />
              </div>

              {/* Contact History */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-2 rounded-t-lg">
                  <span className="text-xs font-semibold">Contact History</span>
                  <div className="flex items-center gap-3">
                    <select
                      className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
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
                      className="text-xs font-semibold hover:text-blue-400 transition-colors"
                      onClick={handleAddHistory}
                    >
                      + Add Log
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {filteredHistory.length === 0 ? (
                    <span className="text-xs text-slate-400">No history logged yet.</span>
                  ) : (
                    filteredHistory.map((log, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-2 text-xs flex flex-col gap-1 bg-slate-50">
                        <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                          <span className="font-semibold text-slate-600">{log.type}</span>
                          <span className="text-slate-500">{log.date}</span>
                        </div>
                        <span className="mt-1 text-slate-700">{log.note}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


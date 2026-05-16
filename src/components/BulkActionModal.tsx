import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Inquiry } from '../types';
import { BULK_TEMPLATES } from '../types';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  inquiries: Inquiry[];
  selectedIds: Set<string>;
  companyName: string;
  companyProducts: string;
  geminiApiKey: string;
  customTone: string;
  whatsappCatalogUrl: string;
  googleBusinessUrl: string;
  whatsappLinked: boolean;
  onNavigateToSettings: () => void;
}

export function BulkActionModal({
  isOpen, onClose, selectedCount, inquiries, selectedIds,
  companyName, companyProducts, geminiApiKey, customTone,
  whatsappCatalogUrl, googleBusinessUrl, whatsappLinked, onNavigateToSettings,
}: BulkActionModalProps) {
  const [mode, setMode] = useState<'ai' | 'manual' | 'template'>('ai');
  const [prompt, setPrompt] = useState('');
  const [manualText, setManualText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('t1');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const targetLeads = inquiries.filter((i) => selectedIds.has(i.id));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult('');
    try {
      const res = await fetch('/api/generate-bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: targetLeads,
          companyName,
          companyProducts,
          customPrompt: prompt,
          customApiKey: geminiApiKey,
          catalogUrl: whatsappCatalogUrl,
          reviewUrl: googleBusinessUrl,
          tone: customTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.message);
    } catch (err: any) {
      alert(err.message);
    }
    setIsGenerating(false);
  };

  const handleSend = () => {
    if (!whatsappLinked) {
      alert('Please link your WhatsApp account in the settings first.');
      onNavigateToSettings();
      onClose();
      return;
    }

    let message = result;
    if (mode === 'template' && !message) {
      message = BULK_TEMPLATES.find((t) => t.id === selectedTemplate)?.content || '';
    } else if (mode === 'manual' && !message) {
      message = manualText;
    }

    if (!message.trim()) {
      alert('Please provide a message to send.');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSend = () => {
    setShowConfirm(false);
    onClose();

    let delay = 0;
    targetLeads.forEach((lead, index) => {
      setTimeout(() => {
        const finalMessage = result
          .replace(/{{[Nn]ame}}/g, lead.customerName)
          .replace(/{{[Rr]equirements}}/g, lead.requirements)
          .replace(/{{[Cc]atalog}}/g, whatsappCatalogUrl || 'our catalog')
          .replace(/{{[Rr]eview}}/g, googleBusinessUrl || 'our page')
          .replace(/{{[Cc]ompanyName}}/g, companyName || 'us');

        const cleanPhone = lead.phoneNumber.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');

        if (index === targetLeads.length - 1) {
          setTimeout(() => alert(`Sent requests for ${targetLeads.length} leads.`), 1000);
        }
      }, delay);
      delay += 800;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl flex flex-col shadow-xl overflow-hidden max-h-full">
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Bulk WhatsApp Broadcast
          </h4>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white transition-colors">Close</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 border-l-4 border-blue-500 pl-4">
            <p className="text-xs text-slate-600">Target Audience:</p>
            <p className="font-semibold text-lg">{selectedCount} Selected Leads</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl mb-6">
            {(['ai', 'template', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (m === 'template') setResult(BULK_TEMPLATES.find((t) => t.id === selectedTemplate)?.content || '');
                  if (m === 'manual') setResult(manualText);
                  if (m === 'ai') setResult('');
                }}
                className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-colors rounded-lg ${
                  mode === m ? 'bg-slate-900 text-white' : 'hover:bg-white text-slate-600'
                }`}
              >
                {m === 'ai' ? 'AI Generated' : m === 'template' ? 'Pre-defined' : 'Manual Text'}
              </button>
            ))}
          </div>

          {/* Template Mode */}
          {mode === 'template' && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-500">Select Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  const tpl = BULK_TEMPLATES.find((t) => t.id === e.target.value);
                  if (tpl) setResult(tpl.content);
                }}
                className="border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none cursor-pointer"
              >
                {BULK_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <div className="border-2 border-dashed border-slate-200 p-4 bg-slate-50 text-sm whitespace-pre-wrap mt-2 rounded-lg">
                {BULK_TEMPLATES.find((t) => t.id === selectedTemplate)?.content || ''}
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-500">Compose Message</label>
              <textarea
                value={manualText}
                onChange={(e) => { setManualText(e.target.value); setResult(e.target.value); }}
                placeholder="Type your message here. Use {{Name}} to insert lead's name."
                className="w-full h-32 p-3 rounded-xl border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {/* AI Mode */}
          {mode === 'ai' && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-500">AI Instructions</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter context or specific instructions..."
                className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-slate-900 text-white px-6 py-3 font-medium rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate AI Broadcast'}
              </button>
              {result && (
                <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500 border-b border-slate-200 pb-2 mb-3">Generated Template</div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-6 py-3 font-medium text-sm hover:underline text-slate-600">Cancel</button>
          <button
            onClick={handleSend}
            disabled={isGenerating || selectedCount === 0}
            className="bg-emerald-600 text-white px-6 py-3 font-medium rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Review & Send &rarr;
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg w-full flex flex-col shadow-xl">
            <h3 className="text-2xl font-semibold tracking-tight mb-2">Ready to broadcast?</h3>
            <p className="text-sm border-b border-slate-200 pb-4 mb-4">
              You are about to send messages to <b>{selectedCount}</b> leads.
              This will open a new WhatsApp Web tab for each lead.
              Please click <strong>'Allow popups'</strong> when prompted.
            </p>
            <div className="bg-slate-900 text-white p-4 mb-4 rounded-lg text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-slate-200 rounded-xl bg-white py-3 font-semibold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleConfirmSend} className="flex-1 bg-slate-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-slate-800">
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

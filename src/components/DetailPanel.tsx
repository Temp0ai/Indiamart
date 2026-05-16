import React, { useState, useRef } from 'react';
import { Phone, MessageSquare, Star, Bell, Loader2 } from 'lucide-react';
import type { Inquiry } from '../types';

interface DetailPanelProps {
  inquiry: Inquiry | null;
  onUpdate: (inquiry: Inquiry) => void;
  onRequestReview: (inquiry: Inquiry) => void;
  isGeneratingReview: boolean;
  whatsappLinked: boolean;
  onNavigateToSettings: () => void;
}

export function DetailPanel({
  inquiry, onUpdate, onRequestReview, isGeneratingReview, whatsappLinked, onNavigateToSettings,
}: DetailPanelProps) {
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('All');
  const savingTimeout = useRef<NodeJS.Timeout | null>(null);

  if (!inquiry) {
    return (
      <div className="py-20 flex flex-col justify-center items-center opacity-30">
        <span className="text-6xl font-semibold">?</span>
        <span className="text-xs text-slate-500 mt-4 text-center">Select target<br />for actions</span>
      </div>
    );
  }

  const handleNotesChange = (notes: string) => {
    onUpdate({ ...inquiry, notes });
    setIsSavingNotes(true);
    if (savingTimeout.current) clearTimeout(savingTimeout.current);
    savingTimeout.current = setTimeout(() => setIsSavingNotes(false), 1000);
  };

  const handleReminderChange = (val: string) => {
    onUpdate({ ...inquiry, reminderDate: val });
  };

  const handleAddHistory = () => {
    const type = prompt('Type (Note/Call/Email/WhatsApp):', 'Note') || 'Note';
    const note = prompt('Add history note:');
    if (!note) return;
    const updatedHistory = [...(inquiry.contactHistory || []), { date: new Date().toLocaleString(), type, note }];
    onUpdate({ ...inquiry, contactHistory: updatedHistory });
  };

  const filteredHistory = (inquiry.contactHistory || []).filter(
    (log) => historyFilter === 'All' || log.type.trim().toLowerCase() === historyFilter.toLowerCase()
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <span className="text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-lg">Automation Actions</span>
        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      </div>

      {/* WhatsApp Template Preview */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-3">AI Compiled Pitch</span>
          <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
            <p className="text-lg leading-relaxed text-slate-800">
              "{inquiry.whatsAppTemplate}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => {
            const cleanPhone = inquiry.phoneNumber.replace(/[^0-9+]/g, '');
            window.location.href = `tel:${cleanPhone}`;
          }}
          className="w-full bg-slate-900 text-white rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"
        >
          <Phone className="h-5 w-5" />
          Dial / Call Lead
        </button>

        <button
          onClick={() => {
            if (!whatsappLinked) {
              alert('Please link your WhatsApp number in the Settings tab first.');
              onNavigateToSettings();
              return;
            }
            const cleanPhone = inquiry.phoneNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(inquiry.whatsAppTemplate)}`, '_blank');
          }}
          className="w-full bg-emerald-600 text-white rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all"
        >
          <MessageSquare className="h-5 w-5" />
          Execute WhatsApp Lead
        </button>

        <button
          onClick={() => onRequestReview(inquiry)}
          disabled={isGeneratingReview}
          className="w-full bg-red-50 text-red-600 border border-red-200 rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-3 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          {isGeneratingReview ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
          {isGeneratingReview ? 'Generating...' : 'Request Review via WhatsApp'}
        </button>

        {/* Reminder */}
        <div className="mt-4 pt-6 border-t-2 border-dashed border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-semibold bg-slate-900 text-white px-2 py-1 rounded-lg flex items-center gap-2 self-start">
            <Bell className="h-3 w-3" /> Follow-up Reminder
          </span>
          <input
            type="datetime-local"
            value={inquiry.reminderDate || ''}
            onChange={(e) => handleReminderChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 outline-none"
          />
        </div>
      </div>

      {/* Raw JSON */}
      <div className="mt-8 pt-8 border-t-2 border-slate-200">
        <span className="text-xs text-slate-500 mb-4 block">Raw JSON Packet</span>
        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64">
          {JSON.stringify(inquiry, null, 2)}
        </pre>
      </div>
    </>
  );
}

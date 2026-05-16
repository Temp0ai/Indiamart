import React from 'react';
import { Phone, MessageSquare, Mail, Users, Bell } from 'lucide-react';
import type { Inquiry } from '../types';

interface LeadCardProps {
  inquiry: Inquiry;
  isSelected: boolean;
  isBulkSelected: boolean;
  onToggleBulk: (id: string) => void;
  onSelect: (inquiry: Inquiry) => void;
}

export function LeadCard({ inquiry, isSelected, isBulkSelected, onToggleBulk, onSelect }: LeadCardProps) {
  return (
    <div
      className={`border-2 p-4 md:p-6 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={() => onSelect(inquiry)}
    >
      <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="w-5 h-5 mt-1 accent-blue-600 cursor-pointer"
            checked={isBulkSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleBulk(inquiry.id);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 mb-1">{inquiry.category}</span>
            <h3 className="text-2xl font-semibold leading-tight">{inquiry.customerName}</h3>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-500 font-mono">{inquiry.receivedAt}</span>
          {inquiry.status === 'new' && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              Unprocessed
            </span>
          )}
          {inquiry.reminderDate && (
            <span className="text-xs font-semibold text-red-500 flex items-center gap-1 border border-red-200 rounded-lg px-2 py-0.5 bg-red-50">
              <Bell className="h-3 w-3" /> {new Date(inquiry.reminderDate).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm mb-6 text-slate-700 leading-relaxed border-l-2 border-slate-300 pl-4">
        {inquiry.requirements}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`tel:${inquiry.phoneNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-xs font-semibold border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all text-slate-700"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <a
          href={`sms:${inquiry.phoneNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-xs font-semibold border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all text-slate-700"
        >
          <MessageSquare className="h-3.5 w-3.5" /> SMS
        </a>
        <a
          href={`mailto:${inquiry.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-xs font-semibold border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all text-slate-700"
        >
          <Mail className="h-3.5 w-3.5" /> Email
        </a>
        <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
          <Users className="h-3 w-3" /> {inquiry.location}
        </span>
      </div>
    </div>
  );
}

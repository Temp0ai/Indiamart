import React from 'react';
import { Inbox, Users, Briefcase, FileText, Settings } from 'lucide-react';
import type { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  inquiryCount: number;
}

const NAV_ITEMS: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'leads', label: 'Inquiries', icon: <Users className="h-4 w-4" /> },
  { tab: 'crm', label: 'CRM View', icon: <Briefcase className="h-4 w-4" /> },
  { tab: 'inbox', label: 'Email Sync', icon: <Inbox className="h-4 w-4" /> },
  { tab: 'prompt', label: 'Prompt Engine', icon: <FileText className="h-4 w-4" /> },
  { tab: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar({ activeTab, setActiveTab, inquiryCount }: SidebarProps) {
  return (
    <div className="w-full md:w-[320px] bg-white/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col flex-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <div className="p-6 md:p-8 shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-fuchsia-600">
          Automata
        </h1>
        <span className="text-xs font-semibold tracking-widest text-blue-900 px-2.5 py-1 rounded-full mt-2 inline-block border border-blue-500/10">
          Lead Integration
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-none md:flex-1 p-2 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar">
        <div className="hidden md:block text-xs font-semibold text-slate-500 mb-2">Systems</div>
        {NAV_ITEMS.map(({ tab, label, icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-none md:w-full flex items-center justify-between p-3 md:p-4 border transition-all cursor-pointer rounded-xl ${
              activeTab === tab
                ? 'border-slate-200 bg-blue-600 text-white font-semibold'
                : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3 text-sm font-medium whitespace-nowrap">
              {icon}
              {label}
            </div>
            {tab === 'leads' && inquiryCount > 0 && (
              <span className={`hidden md:inline-block text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-white/20 text-white' : 'border border-current'
              }`}>
                {inquiryCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="hidden md:block p-6 border-t border-slate-200 bg-white">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500">System Status</span>
          <span className="text-xs font-bold text-emerald-500 tracking-wider">ONLINE / ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

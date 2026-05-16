import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PromptTabProps {
  customTone: string;
  setCustomTone: (v: string) => void;
  systemPrompt: string;
}

export function PromptTab({ customTone, setCustomTone, systemPrompt }: PromptTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-12 max-w-5xl shadow-sm">
      <div className="mb-8 md:mb-12 border-b border-slate-200 pb-6 md:pb-8">
        <h3 className="text-2xl md:text-5xl font-semibold tracking-tight">Core Directives</h3>
        <p className="text-xs md:text-sm font-semibold tracking-tight text-slate-500 mt-4 leading-relaxed">
          Systematic prompt logic dictating AI behavior.<br />
          Controls extraction, taxonomy assignment, and tone configuration.
        </p>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold tracking-wide text-slate-700 mb-3 block">AI Persona / Tone</h4>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <input
            type="text"
            value={customTone}
            onChange={(e) => setCustomTone(e.target.value)}
            placeholder="e.g. Professional, friendly, succinct"
            className="flex-1 w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
          />
          <p className="text-xs text-slate-500 flex-1">
            Describe the voice and tone the AI should use when generating WhatsApp messages and follow-ups.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-300 p-8 relative rounded-xl">
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-bl-xl rounded-tr-xl">
          Live Configuration
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed mt-4">
          {systemPrompt || 'INITIALIZING SECURE PROMPT...'}
        </pre>
      </div>

      <div className="mt-12">
        <h3 className="text-sm font-semibold mb-6">Analytical Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Data Integrity', desc: 'Enforces structured JSON protocols over freeform text for immediate CRM compatibility.' },
            { title: 'Classification', desc: 'Strict taxonomy limits map raw intent directly to existing supply chain segments.' },
            { title: 'Generative Pitch', desc: 'Pre-computes dynamic marketing copy, collapsing the sales feedback loop to zero.' },
          ].map(({ title, desc }) => (
            <div key={title} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
              <CheckCircle2 className="h-6 w-6 text-slate-900 mb-4" />
              <span className="block text-xs font-semibold text-slate-700 mb-2">{title}</span>
              <p className="text-xs text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

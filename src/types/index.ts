export interface Inquiry {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  requirements: string;
  category: string;
  location: string;
  whatsAppTemplate: string;
  status: CRMStatus;
  receivedAt: string;
  reminderDate?: string;
  dealValue?: number;
  notes?: string;
  contactHistory?: ContactLog[];
}

export interface ContactLog {
  date: string;
  type: string;
  note: string;
}

export type CRMStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export type ActiveTab = 'inbox' | 'leads' | 'crm' | 'prompt' | 'settings';

export const CRM_STAGES: CRMStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const STAGE_COLORS: Record<CRMStatus, { bg: string; text: string; accent: string; bar: string }> = {
  new: { bg: 'bg-blue-600', text: 'text-white', accent: 'from-blue-500/10', bar: 'bg-blue-500' },
  contacted: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', accent: 'from-fuchsia-500/10', bar: 'bg-fuchsia-500' },
  qualified: { bg: 'bg-cyan-100', text: 'text-cyan-800', accent: 'from-cyan-500/10', bar: 'bg-cyan-500' },
  proposal: { bg: 'bg-amber-100', text: 'text-amber-800', accent: 'from-amber-500/10', bar: 'bg-amber-500' },
  won: { bg: 'bg-emerald-600', text: 'text-white', accent: 'from-emerald-500/10', bar: 'bg-emerald-500' },
  lost: { bg: 'bg-rose-500', text: 'text-white', accent: 'from-rose-500/10', bar: 'bg-rose-500' },
};

export const BULK_TEMPLATES = [
  {
    id: 't1',
    label: 'Intro & Catalog',
    content: `Hi {{Name}},\n\nThanks for connecting with us regarding {{Requirements}}. Check out our latest products here:\n{{Catalog}}\n\nLet us know if you need any assistance!\n- {{CompanyName}}`,
  },
  {
    id: 't2',
    label: 'Follow up & Review',
    content: `Hi {{Name}},\n\nJust checking in if you had any further questions about your inquiry for {{Requirements}}.\n\nIf you have a moment, we'd appreciate a quick review:\n{{Review}}\n\nBest,\n{{CompanyName}}`,
  },
  {
    id: 't3',
    label: 'Promo Offer',
    content: `Hello {{Name}},\n\nWe have a special 10% discount running this week on {{Requirements}}!\n\nView details: {{Catalog}}\nReply to claim the offer.\n- {{CompanyName}}`,
  },
];

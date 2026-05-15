const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Shadows
content = content.replace(/shadow-\[\d+px_\d+px_0_0_#[a-fA-F0-9]+\]/g, 'shadow-sm');
content = content.replace(/shadow-\[inset_[^\]]+\]/g, 'shadow-inner');

// 2. Borders and Shapes
content = content.replace(/border-8 border-\[#[a-fA-F0-9]+\]/g, 'border border-slate-200 rounded-3xl');
content = content.replace(/border-\[8px\] border-\[#[a-fA-F0-9]+\]/g, 'border border-slate-200 rounded-3xl');
content = content.replace(/border-4 border-\[#[a-fA-F0-9]+\]/g, 'border border-slate-200 rounded-2xl');
content = content.replace(/border-2 border-\[#[a-fA-F0-9]+\]/g, 'border border-slate-200 rounded-xl');
content = content.replace(/border border-\[#[a-fA-F0-9]+\]/g, 'border border-slate-200 rounded-lg');

content = content.replace(/border-b-4 border-\[#[a-fA-F0-9]+\]/g, 'border-b border-slate-200');
content = content.replace(/border-b-2 border-\[#[a-fA-F0-9]+\]/g, 'border-b border-slate-200');
content = content.replace(/border-b-2 border-black/g, 'border-b border-slate-200');
content = content.replace(/border-b-4 border-black/g, 'border-b border-slate-200');

content = content.replace(/border-\[lrbt\]-2 border-transparent/g, 'border border-transparent');
content = content.replace(/border-2 border-transparent/g, 'border border-transparent rounded-xl');

// 3. Colors
content = content.replace(/bg-\[#1A1A1A\]/g, 'bg-slate-900');
content = content.replace(/text-\[#1A1A1A\]/g, 'text-slate-900');
content = content.replace(/border-\[#1A1A1A\]/g, 'border-slate-200');
content = content.replace(/bg-black/g, 'bg-slate-900 text-white rounded-xl');
content = content.replace(/text-black/g, 'text-slate-900');
content = content.replace(/border-black/g, 'border-slate-200');

content = content.replace(/bg-\[#D4FF00\]/g, 'bg-blue-600');
content = content.replace(/text-\[#D4FF00\]/g, 'text-blue-600');

// Additional fix for the text-color when button background is changed
content = content.replace(/bg-blue-600 text-slate-900/g, 'bg-blue-600 text-white');

content = content.replace(/bg-\[#F9F9F9\]/g, 'bg-slate-50');
content = content.replace(/bg-\[#F2F1ED\]/g, 'bg-slate-100');
content = content.replace(/bg-transparent text-\[#D4FF00\]/g, 'bg-transparent text-blue-600');

content = content.replace(/bg-\[#25D366\] text-black/g, 'bg-emerald-600 text-white');
content = content.replace(/bg-\[#25D366\] text-slate-900/g, 'bg-emerald-600 text-white');
content = content.replace(/bg-\[#25D366\]/g, 'bg-emerald-500');

content = content.replace(/bg-\[#EA4335\]/g, 'bg-red-500');
content = content.replace(/text-\[#EA4335\]/g, 'text-red-500');
content = content.replace(/border-\[#EA4335\]/g, 'border-red-500');
content = content.replace(/bg-\[#FF6B6B\]/g, 'bg-rose-500');

// CRM View specific replacements
content = content.replace(/bg-\[#FF90E8\] text-black/g, 'bg-fuchsia-600 text-white');
content = content.replace(/bg-\[#FF90E8\]/g, 'bg-fuchsia-100 text-fuchsia-800');

content = content.replace(/bg-\[#00E5FF\] text-black/g, 'bg-cyan-600 text-white');
content = content.replace(/bg-\[#00E5FF\]/g, 'bg-cyan-100 text-cyan-800');

content = content.replace(/bg-\[#FFC900\] text-black/g, 'bg-amber-500 text-white');
content = content.replace(/bg-\[#FFC900\]/g, 'bg-amber-100 text-amber-800');

content = content.replace(/text-\[#D4FF00\]/g, 'text-white');

// 4. Typography Extravaganzas (Brutalist -> Sleek)
content = content.replace(/style={{ fontFamily: "'[A-Za-z ]+', serif*" }}/gi, '');
content = content.replace(/style={{ fontFamily: "'[A-Za-z ]+', sans-serif*" }}/gi, '');
content = content.replace(/font-bold/g, 'font-semibold');
content = content.replace(/italic/g, ''); 
content = content.replace(/text-\[10px\] uppercase font-bold tracking-widest/g, 'text-xs font-medium text-slate-500');
content = content.replace(/text-\[8px\] uppercase font-bold tracking-widest/g, 'text-[10px] font-medium text-slate-500');
content = content.replace(/text-xs font-bold uppercase tracking-widest/g, 'text-sm font-medium text-slate-600');
content = content.replace(/font-mono text-xs uppercase whitespace-nowrap/g, 'text-sm font-medium whitespace-nowrap text-slate-700');
content = content.replace(/font-mono/g, 'font-sans'); 
content = content.replace(/uppercase/g, ''); 
content = content.replace(/tracking-widest/g, 'tracking-normal'); 
content = content.replace(/tracking-tighter/g, 'tracking-tight'); 
content = content.replace(/text-4xl md:text-6xl/g, 'text-3xl md:text-5xl');
content = content.replace(/text-3xl/g, 'text-2xl');
content = content.replace(/opacity-50/g, 'text-slate-500');
content = content.replace(/opacity-70/g, 'text-slate-600');
content = content.replace(/opacity-80/g, 'text-slate-700');

// Fix text colors in headers and buttons
content = content.replace(/text-white text-slate-900/g, 'text-white'); 
content = content.replace(/hover:invert/g, 'hover:opacity-90 hover:-translate-y-0.5 transition-all');

// Fix focus rings
content = content.replace(/focus:ring-black/g, 'focus:ring-blue-500 focus:border-blue-500');
content = content.replace(/focus:ring-\[#D4FF00\]/g, 'focus:ring-blue-500 focus:border-blue-500');

// Specific CRM adjustments
content = content.replace(/bg-gradient-to-r from-\[#D4FF00\]\/30 to-\[#FF90E8\]\/30/g, 'bg-slate-50 border border-slate-200 rounded-xl');
content = content.replace(/bg-gradient-to-r from-\[#D4FF00\] via-\[#FF90E8\] to-\[#00E5FF\] border-b border-slate-200/g, 'bg-white border-b border-slate-200');
content = content.replace(/bg-gradient-to-b from-[^\s]+ to-transparent/g, 'bg-transparent');
content = content.replace(/backgroundImage: 'radial-gradient[^']+'/g, "backgroundImage: 'none'");
content = content.replace(/transform rotate-1 hover:rotate-0/g, '');

content = content.replace(/text-\[10px\]/g, 'text-xs text-slate-500');
content = content.replace(/text-\[8px\]/g, 'text-[10px] text-slate-400');
content = content.replace(/text-\[12px\]/g, 'text-sm text-slate-600');
content = content.replace(/text-\[9px\]/g, 'text-[11px]');

// Fix buttons layout
content = content.replace(/px-4 py-2 font-semibold/g, 'px-4 py-2 font-medium rounded-lg text-sm');
content = content.replace(/px-6 py-3 font-semibold/g, 'px-6 py-3 font-medium rounded-xl text-base');
content = content.replace(/p-3 border/g, 'p-3 rounded-lg border');

// Extra specific replacement for the new CRM style
content = content.replace(/bg-\[#FAFAFA\] border border-slate-200 rounded-2xl md:shadow-md p-4 md:p-6 pb-2 relative overflow-hidden rounded-xl/g, 'bg-slate-50 border border-slate-200 shadow-sm p-4 md:p-6 pb-2 relative overflow-hidden rounded-2xl');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx transformed successfully!');

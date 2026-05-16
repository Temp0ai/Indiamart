import React, { useState } from 'react';
import { FileText, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';

interface SettingsTabProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  companyProducts: string;
  setCompanyProducts: (v: string) => void;
  googleBusinessUrl: string;
  setGoogleBusinessUrl: (v: string) => void;
  whatsappCatalogUrl: string;
  setWhatsappCatalogUrl: (v: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (v: string) => void;
  whatsappLinked: boolean;
  setWhatsappLinked: (v: boolean) => void;
  waPhoneInput: string;
  setWaPhoneInput: (v: string) => void;
  gmailLinked: boolean;
  setGmailLinked: (v: boolean) => void;
  gmailAccount: string;
  setGmailAccount: (v: string) => void;
  onGmailConnect?: () => void;
  onGmailDisconnect?: () => void;
}

export function SettingsTab({
  companyName, setCompanyName, companyProducts, setCompanyProducts,
  googleBusinessUrl, setGoogleBusinessUrl, whatsappCatalogUrl, setWhatsappCatalogUrl,
  geminiApiKey, setGeminiApiKey,
  whatsappLinked, setWhatsappLinked, waPhoneInput, setWaPhoneInput,
  gmailLinked, setGmailLinked, gmailAccount, setGmailAccount,
  onGmailConnect, onGmailDisconnect,
}: SettingsTabProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [waOtpInput, setWaOtpInput] = useState('');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-12 max-w-2xl shadow-sm">
      <div className="mb-8 md:mb-12 border-b border-slate-200 pb-6 md:pb-8">
        <h3 className="text-2xl md:text-5xl font-semibold tracking-tight">Integrations & AI Config</h3>
        <p className="text-xs md:text-sm font-semibold tracking-tight text-slate-500 mt-4 leading-relaxed">
          Connect your accounts and configure your generative AI settings.
        </p>
      </div>

      {/* AI Config */}
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 rounded-lg p-1.5 shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-lg font-semibold">AI Assistant Setup</h4>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Company Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Product / Service Offerings</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16" value={companyProducts} onChange={(e) => setCompanyProducts(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1 mt-2 border-t border-dashed border-slate-300 pt-4">
            <label className="text-xs font-semibold text-slate-600">Google Business Profile URL</label>
            <input type="url" placeholder="https://g.page/r/..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={googleBusinessUrl} onChange={(e) => setGoogleBusinessUrl(e.target.value)} />
            <span className="text-xs text-slate-500 mt-1">Used to request ratings and reviews from customers.</span>
          </div>
          <div className="flex flex-col gap-1 mt-2 border-t border-dashed border-slate-300 pt-4">
            <label className="text-xs font-semibold text-slate-600">WhatsApp Catalog URL</label>
            <input type="url" placeholder="https://wa.me/c/..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={whatsappCatalogUrl} onChange={(e) => setWhatsappCatalogUrl(e.target.value)} />
            <span className="text-xs text-slate-500 mt-1">Include your product catalog link in bulk messages.</span>
          </div>
          <div className="flex flex-col gap-1 mt-2 border-t border-dashed border-slate-300 pt-4">
            <label className="text-xs font-semibold text-slate-600">Gemini API Key (Optional)</label>
            <input type="password" placeholder="Leave blank to use Applet default" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} />
            <span className="text-xs text-slate-500 mt-1">If provided, this key will be used for Bulk Action AI generation.</span>
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-6 w-6 text-emerald-500" />
          <h4 className="text-lg font-semibold">WhatsApp Personal / Web</h4>
        </div>
        {whatsappLinked ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between border border-emerald-200 rounded-xl bg-emerald-50 p-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-semibold truncate">Linked: {waPhoneInput}</span>
            </div>
            <button
              onClick={() => { setWhatsappLinked(false); setOtpSent(false); setWaPhoneInput(''); setWaOtpInput(''); }}
              className="text-xs font-semibold hover:underline text-slate-600"
            >
              Unlink Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600">Enter your WhatsApp number to link your account via OTP.</p>
            {!otpSent ? (
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={waPhoneInput}
                  onChange={(e) => setWaPhoneInput(e.target.value)}
                />
                <button
                  onClick={() => { if (waPhoneInput.length > 5) { setOtpSent(true); setWaOtpInput('123456'); } }}
                  className="bg-slate-900 text-white rounded-xl px-6 py-2 font-semibold text-xs hover:bg-slate-800 min-h-[44px]"
                >
                  Send OTP
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-emerald-600 text-xs font-semibold bg-emerald-50 p-2 border border-emerald-200 rounded-lg">
                  Test Mode: OTP auto-filled (123456)
                </p>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={waOtpInput}
                    onChange={(e) => setWaOtpInput(e.target.value)}
                    maxLength={6}
                  />
                  <button
                    onClick={() => { if (waOtpInput.length > 4) setWhatsappLinked(true); }}
                    className="bg-emerald-600 text-white rounded-xl px-6 py-2 font-semibold text-xs hover:bg-emerald-700 min-h-[44px]"
                  >
                    Verify & Link
                  </button>
                </div>
                <button onClick={() => setOtpSent(false)} className="text-xs font-semibold hover:underline text-left text-slate-600">
                  &larr; Change Number
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gmail */}
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-6 w-6 text-red-500" />
          <h4 className="text-lg font-semibold">Gmail Integration</h4>
        </div>
        {gmailLinked ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between border border-red-200 rounded-xl bg-red-50 p-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-red-500" />
              <span className="text-sm font-semibold truncate">Synced: {gmailAccount}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/gmail/disconnect', { method: 'POST' });
                } catch {}
                setGmailLinked(false);
                setGmailAccount('');
                if (onGmailDisconnect) onGmailDisconnect();
              }}
              className="text-xs font-semibold hover:underline text-slate-600"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600">
              Connect your Gmail account via Google OAuth to automatically scan for Indiamart inquiry emails.
            </p>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/gmail/auth-url');
                  const data = await res.json();
                  if (data.error) {
                    alert(data.error);
                    return;
                  }
                  // Open Google OAuth in same window
                  window.location.href = data.url;
                } catch (err: any) {
                  alert('Failed to start Gmail OAuth: ' + err.message);
                }
              }}
              className="bg-slate-900 text-white rounded-xl py-3 px-6 font-semibold text-xs hover:bg-slate-800 md:self-start flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Connect Gmail Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

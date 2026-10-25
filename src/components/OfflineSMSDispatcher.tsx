import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  MessageSquare, 
  MapPin, 
  Send, 
  Copy, 
  Check, 
  X, 
  ShieldAlert, 
  Phone,
  Globe,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';
import { 
  AlertTemplateId, 
  ALERT_TEMPLATES, 
  formatAlertMessage 
} from '../alertTemplates';

interface OfflineSMSDispatcherProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Array<{
    id: string;
    name: string;
    phone?: string;
    email?: string;
    priority?: number;
    relation?: string;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    timestamp?: number;
  } | null;
  userName?: string;
  lang?: Language;
  defaultTemplateId?: AlertTemplateId;
  defaultMessageLang?: Language;
}

export default function OfflineSMSDispatcher({
  isOpen,
  onClose,
  contacts,
  location,
  userName = 'VivoPing-Nutzer',
  lang = 'de',
  defaultTemplateId = 'standard',
  defaultMessageLang = 'de'
}: OfflineSMSDispatcherProps) {
  const t = getTranslation(lang);
  const [copied, setCopied] = useState(false);
  const [sentLog, setSentLog] = useState<Record<string, boolean>>({});

  // Active template and message language state
  const [activeTemplate, setActiveTemplate] = useState<AlertTemplateId>(defaultTemplateId);
  const [activeMsgLang, setActiveMsgLang] = useState<Language>(defaultMessageLang);
  const [showConfig, setShowConfig] = useState(false);

  const lat = location?.latitude ?? 48.7901;
  const lng = location?.longitude ?? 9.1829;
  const timeString = new Date(location?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Dynamically formatted SMS text based on template + language
  const formattedSmsText = formatAlertMessage({
    templateId: activeTemplate,
    targetLang: activeMsgLang,
    userName,
    location: location || {
      latitude: lat,
      longitude: lng,
      timestamp: Date.now()
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSmsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSms = (contactId: string, phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\s+/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(formattedSmsText)}`;
    setSentLog(prev => ({ ...prev, [contactId]: true }));
    window.location.href = smsUrl;
  };

  if (!isOpen) return null;

  // Filter and sort contacts by priority (1 first, then 2, then 3)
  const sortedContacts = [...contacts].sort((a, b) => (a.priority || 1) - (b.priority || 1));

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-sms-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative text-left text-[#2B2D42] max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#8D99AE] hover:text-[#2B2D42] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 text-amber-700">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E63946] text-[11px] font-bold uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>GSM Mobilfunk-Fallback</span>
              </div>
              <h3 id="offline-sms-title" className="text-lg font-heading font-semibold text-[#2B2D42]">
                {t.offlineSmsTitle}
              </h3>
              <p className="text-xs text-[#8D99AE] mt-0.5 leading-relaxed">
                {t.offlineSmsDesc}
              </p>
            </div>
          </div>

          {/* Quick Template & Language Toggle Banner */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 mb-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B2D42] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#E63946]" />
                Vorlage & Zielsprache für den Notruf:
              </span>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-xs text-[#E63946] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showConfig ? 'Kompakt' : 'Anpassen'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#8D99AE] block mb-1">
                  Gewählte Vorlage:
                </label>
                <select
                  value={activeTemplate}
                  onChange={(e) => setActiveTemplate(e.target.value as AlertTemplateId)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-[#2B2D42] focus:ring-2 focus:ring-[#E63946] outline-none"
                >
                  {ALERT_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name[lang] || tmpl.name['de']}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8D99AE] block mb-1">
                  Zielsprache der Nachricht:
                </label>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {SUPPORTED_LANGUAGES.map((langItem) => (
                    <button
                      key={langItem.code}
                      type="button"
                      onClick={() => setActiveMsgLang(langItem.code)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeMsgLang === langItem.code
                          ? 'bg-[#E63946] text-white shadow-xs'
                          : 'text-[#8D99AE] hover:text-[#2B2D42]'
                      }`}
                      title={langItem.name}
                    >
                      {langItem.flag} {langItem.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SMS Content Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#2B2D42] mb-2">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#E63946]" />
                {t.smsFormattedPreview}
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-[#E63946] hover:text-[#9A031E] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>
            <p className="text-xs text-[#2B2D42] bg-white p-3 rounded-xl border border-slate-200/80 font-mono leading-relaxed select-all">
              {formattedSmsText}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#8D99AE]">
              <MapPin className="w-3.5 h-3.5 text-[#E63946]" />
              <span>Letzter GPS-Fix: {lat.toFixed(5)}, {lng.toFixed(5)} ({timeString} Uhr)</span>
            </div>
          </div>

          {/* Recipient list ordered by Escalation Priority */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D99AE] block">
              Empfänger nach Eskalationsstufe:
            </span>

            {sortedContacts.length === 0 ? (
              <p className="text-xs text-[#8D99AE] italic py-2">
                Keine Notfallkontakte mit Telefonnummer hinterlegt.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {sortedContacts.map((c) => {
                  const prio = c.priority || 1;
                  const prioBadge = prio === 1 
                    ? 'bg-rose-100 text-[#E63946] border-rose-200' 
                    : prio === 2 
                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  const prioLabel = prio === 1 ? 'Prio 1 (Sofort)' : prio === 2 ? 'Prio 2 (+3h)' : 'Prio 3 (+12h)';

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2B2D42] truncate">{c.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${prioBadge}`}>
                            {prioLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8D99AE] mt-0.5">
                          <Phone className="w-3 h-3 text-[#8D99AE]" />
                          <span>{c.phone || 'Keine Telefonnummer'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendSms(c.id, c.phone)}
                        disabled={!c.phone}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          sentLog[c.id]
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-xs shadow-[#E63946]/20'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{sentLog[c.id] ? 'Geöffnet' : 'SMS senden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#2B2D42] transition-colors cursor-pointer"
            >
              Schließen
            </button>
            <button
              onClick={() => {
                if (sortedContacts.length > 0 && sortedContacts[0].phone) {
                  handleSendSms(sortedContacts[0].id, sortedContacts[0].phone);
                } else {
                  handleCopy();
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-md shadow-[#E63946]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.sendEmergencySmsBtn}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Settings, Check, X, Info } from 'lucide-react';
import { Language, getTranslation } from '../../i18n';

export interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

interface ConsentBannerProps {
  lang: Language;
  onConsentSaved?: (prefs: ConsentPreferences) => void;
  forceOpen?: boolean;
  onCloseForce?: () => void;
}

const STORAGE_KEY = 'lifeguard_consent_v1';

export default function ConsentBanner({ lang, onConsentSaved, forceOpen, onCloseForce }: ConsentBannerProps) {
  const t = getTranslation(lang);
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: true,
    analytics: false,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsOpen(true);
    } else {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        setIsOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setShowCustomize(true);
    }
  }, [forceOpen]);

  const saveConsent = (prefs: ConsentPreferences) => {
    const finalPrefs = { ...prefs, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    setIsOpen(false);
    setShowCustomize(false);
    if (onConsentSaved) onConsentSaved(finalPrefs);
    if (onCloseForce) onCloseForce();
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString()
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString()
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="region"
        aria-label={t.consentBannerTitle}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 shadow-2xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-5 md:p-6 shadow-2xl text-slate-800 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {t.consentBannerTitle}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  DSGVO / GDPR & ePrivacy konform
                </span>
              </div>
            </div>

            {forceOpen && onCloseForce && (
              <button
                onClick={onCloseForce}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.consentBannerText}
          </p>

          {/* Detailed toggles if customizing */}
          {showCustomize && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2 border-t border-slate-100 text-xs"
            >
              {/* Essential */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-900">{t.consentEssentialLabel}</p>
                  <p className="text-slate-500 text-[11px]">{t.consentEssentialDesc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={true} 
                  disabled 
                  className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-not-allowed opacity-70"
                />
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-900">{t.consentFunctionalLabel}</p>
                  <p className="text-slate-500 text-[11px]">{t.consentFunctionalDesc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-900">{t.consentAnalyticsLabel}</p>
                  <p className="text-slate-500 text-[11px]">{t.consentAnalyticsDesc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            {!showCustomize ? (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all active:scale-95"
                >
                  {t.consentAcceptAll}
                </button>
                <button
                  onClick={handleEssentialOnly}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
                >
                  {t.consentEssentialOnly}
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {t.consentCustomize}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveCustom}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {t.consentSaveCustom}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  {t.consentAcceptAll}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

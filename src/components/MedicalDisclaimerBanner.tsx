import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, PhoneCall, Check, X, Info } from 'lucide-react';
import { Language, getTranslation } from '../i18n';

interface MedicalDisclaimerBannerProps {
  lang?: Language;
  onOpenLegal?: () => void;
}

export default function MedicalDisclaimerBanner({ lang = 'de', onOpenLegal }: MedicalDisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem('vivoping_mdr_disclaimer_accepted');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('vivoping_mdr_disclaimer_accepted', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 text-amber-950 shadow-xs mb-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-amber-900">
                  Rechtlicher Hinweis & Medizinprodukte-Abgrenzung (EU MDR)
                </span>
                <span className="bg-amber-500/20 text-amber-900 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kein Ersatz für Notruf 112
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-3xl">
                <strong>VivoPing ist kein Medizinprodukt</strong> und kein behördlich zugelassener Hausnotrufdienst nach DIN VDE 0825. 
                Die App dient der vorsorglichen Lebenszeichen-Überwachung. 
                <strong> Bei akuter Lebensgefahr oder plötzlichen medizinischen Notfällen wählen Sie bitte unverzüglich den behördlichen Notruf (112 in der EU / 911 in den USA)!</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Notruf 112</span>
            </a>
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verstanden & Bestätigen</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Share, PlusSquare, X, Check } from 'lucide-react';
import { Language } from '../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt({ lang = 'de' }: { lang?: Language }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Check if user previously dismissed
    if (sessionStorage.getItem('vivoping_pwa_dismissed') === 'true') {
      setDismissed(true);
    }

    // Check for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('vivoping_pwa_dismissed', 'true');
  };

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-lg mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Ausblenden"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#E63946] flex items-center justify-center shrink-0 border border-rose-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-[#2B2D42]">
              VivoPing als App auf dem Startbildschirm installieren
            </h4>
            <p className="text-xs text-[#8D99AE] mt-0.5 leading-relaxed">
              {isIOS 
                ? 'Tippen Sie in Safari unten auf "Teilen" und dann auf "Zum Home-Bildschirm", um VivoPing wie eine native Notfall-App zu nutzen.'
                : 'Schnellerer Zugriff, Offline-Bereitschaft und zuverlässige Push-Erinnerungen direkt auf Ihrem Smartphone.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white text-xs font-bold shadow-md shadow-[#E63946]/20 transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Jetzt installieren</span>
            </button>
          )}

          {isIOS && !deferredPrompt && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              <Share className="w-3.5 h-3.5 text-[#E63946]" />
              <span>Teilen ➜ Zum Home-Bildschirm</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

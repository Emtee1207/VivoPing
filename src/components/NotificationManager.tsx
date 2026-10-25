import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, BellOff, CheckCircle2, AlertCircle, Smartphone, Send } from 'lucide-react';
import { Language } from '../i18n';

interface NotificationManagerProps {
  lang?: Language;
  onPermissionChange?: (granted: boolean) => void;
}

export default function NotificationManager({ lang = 'de', onPermissionChange }: NotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (onPermissionChange) {
        onPermissionChange(result === 'granted');
      }
      if (result === 'granted') {
        sendTestNotification();
      }
    } catch (e) {
      console.warn("Notification request error:", e);
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('VivoPing Test-Erinnerung', {
          body: 'Check-in Erinnerung: Bitte bestätigen Sie rechtzeitig Ihr Lebenszeichen!',
          icon: '/vivoping-icon-192.png',
          badge: '/favicon.png',
          vibrate: [100, 50, 100],
        } as NotificationOptions & { vibrate?: number[] });
      });
    } else {
      new Notification('VivoPing Test-Erinnerung', {
        body: 'Check-in Erinnerung: Bitte bestätigen Sie rechtzeitig Ihr Lebenszeichen!',
        icon: '/vivoping-icon-192.png',
      });
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!supported) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            permission === 'granted' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-rose-50 text-[#E63946] border border-rose-100'
          }`}>
            {permission === 'granted' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-base text-[#2B2D42]">
                Push-Erinnerungen vor Fristablauf
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                permission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : permission === 'denied'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {permission === 'granted' ? 'Aktiviert' : permission === 'denied' ? 'Im Browser blockiert' : 'Nicht eingerichtet'}
              </span>
            </div>
            <p className="text-xs text-[#8D99AE] mt-0.5 leading-relaxed">
              Erinnerungen direkt auf das Smartphone (4 Std. und 1 Std. vor Ablauf der 24h Pufferfrist), um Fehlalarme zu vermeiden.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {permission !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="px-4 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white text-xs font-bold shadow-md shadow-[#E63946]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Erinnerungen erlauben</span>
            </button>
          ) : (
            <button
              onClick={sendTestNotification}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#2B2D42] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#E63946]" />
              <span>{testSent ? 'Erinnerung gesendet!' : 'Test-Mitteilung senden'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

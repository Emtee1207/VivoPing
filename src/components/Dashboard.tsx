import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, serverTimestamp, setDoc, collection, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Info, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  BellRing, 
  Users, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Zap,
  Send,
  X,
  History,
  Calendar,
  Fingerprint,
  Radio,
  Layers,
  Wifi,
  WifiOff,
  MessageSquare
} from 'lucide-react';
import StatusIndicator, { AccountStatus, getStatusConfig } from './StatusIndicator';
import { Language, getTranslation } from '../i18n';
import BiometricModal from './BiometricModal';
import OfflineSMSDispatcher from './OfflineSMSDispatcher';
import MedicalDisclaimerBanner from './MedicalDisclaimerBanner';
import PWAInstallPrompt from './PWAInstallPrompt';
import NotificationManager from './NotificationManager';
import { formatAlertMessage, ALERT_TEMPLATES, AlertTemplateId } from '../alertTemplates';

interface DashboardProps {
  user: any;
  userData: any;
  lang?: Language;
}

export interface StatusHistoryRecord {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  note?: string;
  timestamp: any;
}

export default function Dashboard({ user, userData, lang = 'de' }: DashboardProps) {
  const t = getTranslation(lang);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'tracking' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Offline state detection
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [smsDispatcherOpen, setSmsDispatcherOpen] = useState(false);

  // Biometric verification state
  const [biometricModal, setBiometricModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  
  // State for post-override dispatch confirmation modal
  const [overrideModalData, setOverrideModalData] = useState<{
    contacts: Array<{ id: string; name: string; email: string; phone: string; relation: string; priority?: number }>;
    timestamp: Date;
  } | null>(null);

  // Status History records
  const [historyList, setHistoryList] = useState<StatusHistoryRecord[]>([]);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      // If offline and currently triggered, offer immediate SMS dispatcher
      if (userData?.status === 'alert_triggered') {
        setSmsDispatcherOpen(true);
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userData?.status]);

  // Keep a local timer ticker for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to contacts and their escalation priority in real-time
  useEffect(() => {
    if (!user?.uid) return;
    const contactsRef = collection(db, 'users', user.uid, 'contacts');
    const unsub = onSnapshot(contactsRef, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContactsCount(docs.length);
      setAllContacts(docs);
    }, (err) => {
      console.warn("Could not fetch contacts for summary:", err);
    });
    return () => unsub();
  }, [user?.uid]);

  // Listen to status history records in real-time
  useEffect(() => {
    if (!user?.uid) return;
    const historyRef = collection(db, 'users', user.uid, 'statusHistory');
    const unsub = onSnapshot(historyRef, (snap) => {
      const records = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as StatusHistoryRecord[];
      
      // Sort descending by timestamp
      records.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setHistoryList(records);
    }, (err) => {
      console.warn("Could not fetch status history:", err);
    });
    return () => unsub();
  }, [user?.uid]);

  // Helper to persist status change events to Firestore history
  const recordStatusTransition = async (
    fromSt: string, 
    toSt: string, 
    reason: string, 
    note?: string
  ) => {
    if (!user?.uid) return;
    try {
      const historyRef = collection(db, 'users', user.uid, 'statusHistory');
      await addDoc(historyRef, {
        fromStatus: fromSt,
        toStatus: toSt,
        reason: reason,
        note: note || '',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not write status history record:", err);
    }
  };

  // Determine normalized status
  // User status in Firestore is 'active', 'pending_alert', or 'alert_triggered'
  const rawStatus = userData?.status || 'active';
  const currentStatus: AccountStatus = rawStatus === 'pending' ? 'pending_alert' : rawStatus;
  const statusCfg = getStatusConfig(currentStatus);

  // Time calculations
  const lastCheckInDate: Date = userData?.lastCheckIn?.toDate?.() 
    ? userData.lastCheckIn.toDate() 
    : new Date();
  
  // 7 days interval for check-in
  const nextCheckInDate = new Date(lastCheckInDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  // 24 hours deadline after the 7 days
  const emergencyDeadline = new Date(nextCheckInDate.getTime() + 24 * 60 * 60 * 1000);

  // Time diffs
  const msUntilCheckIn = nextCheckInDate.getTime() - currentTime.getTime();
  const msUntilEmergency = emergencyDeadline.getTime() - currentTime.getTime();

  // Helper formatting for countdowns
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Biometric gate: prompts Face ID / Touch ID before executing sensitive security actions
  const requireBiometrics = (action: () => void, title: string, description: string) => {
    setBiometricModal({
      isOpen: true,
      title,
      description,
      action
    });
  };

  const triggerCheckInWithBiometrics = () => {
    requireBiometrics(
      handleCheckIn,
      "Biometrischer Check-in",
      "Um zu verhindern, dass unbefugte Dritte das System bedienen, scannen Sie bitte Ihren Fingerabdruck oder Face ID."
    );
  };

  const triggerOverrideWithBiometrics = () => {
    requireBiometrics(
      handleImmediateOverride,
      "Biometrische Notfall-Freigabe",
      "Sicherheitsabfrage: Bestätigen Sie per Biometrie (Fingerabdruck / Face ID) die sofortige Auslösung des Notfalls."
    );
  };

  const triggerAllClearWithBiometrics = () => {
    requireBiometrics(
      () => setAccountStatus('active'),
      "Biometrische Entwarnung",
      "Bestätigen Sie per Biometrie, dass Sie persönlich wohlauf sind und die Entwarnung erteilen."
    );
  };

  // Check-In handler (resets to active)
  const handleCheckIn = async () => {
    setUpdatingStatus(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastCheckIn: serverTimestamp(),
        status: 'active'
      });
      await recordStatusTransition(
        currentStatus, 
        'active', 
        'check_in', 
        'Wöchentlicher Check-in: Wohlbefinden bestätigt, Schutzsystem aktiv'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Set explicit status (allows testing/simulating or manual triggers)
  const setAccountStatus = async (newStatus: 'active' | 'pending_alert' | 'alert_triggered') => {
    if (newStatus === 'alert_triggered') {
      const confirmed = window.confirm(
        "Möchten Sie wirklich den NOTFALLSTATUS auslösen?\n\nIhre hinterlegten Notfallkontakte werden sofort informiert und Standort sowie Tresordaten freigegeben."
      );
      if (!confirmed) return;
    }

    setUpdatingStatus(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatePayload: any = {
        status: newStatus
      };
      if (newStatus === 'alert_triggered') {
        updatePayload.alertTriggeredAt = serverTimestamp();
      } else if (newStatus === 'active') {
        updatePayload.lastCheckIn = serverTimestamp();
      }
      await updateDoc(userRef, updatePayload);

      let reason = 'simulator';
      let note = 'Statuswechsel';
      if (newStatus === 'alert_triggered') {
        reason = 'manual_panic';
        note = 'Manueller Notfall-Alarm ausgelöst: Kontakte alarmiert & Tresor freigegeben';
      } else if (newStatus === 'active') {
        reason = 'all_clear';
        note = 'Entwarnung gegeben: Status auf Normalbetrieb (Aktiv) zurückgesetzt';
      } else if (newStatus === 'pending_alert') {
        reason = 'pending';
        note = 'Check-in Frist verstrichen: 24h Pufferzeitraum gestartet';
      }
      await recordStatusTransition(currentStatus, newStatus, reason, note);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Immediate Override Handler: Instantly bypasses the 24-hour wait period and notifies designated contacts
  const handleImmediateOverride = async () => {
    const confirmed = window.confirm(t.overrideConfirmPrompt);
    if (!confirmed) return;

    setUpdatingStatus(true);
    try {
      // 1. Fetch designated contacts to prepare immediate notification dispatch
      const contactsSnap = await getDocs(collection(db, 'users', user.uid, 'contacts'));
      const recipientContacts = contactsSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name || 'Notfallkontakt',
        email: d.data().email || '',
        phone: d.data().phone || '',
        relation: d.data().relation || ''
      }));

      // 2. Instantly bypass the 24h wait period and trigger emergency status in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'alert_triggered',
        alertTriggeredAt: serverTimestamp()
      });

      // 3. Record immediate override to status history log
      await recordStatusTransition(
        currentStatus,
        'alert_triggered',
        'immediate_override',
        `Immediate Override: 24h Wartefrist umgangen, ${recipientContacts.length} Notfallkontakte alarmiert`
      );

      // 4. Show dispatch confirmation modal with list of notified contacts
      setOverrideModalData({
        contacts: recipientContacts,
        timestamp: new Date()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Location tracking logic
  useEffect(() => {
    if (navigator.geolocation && (currentStatus === 'active' || currentStatus === 'alert_triggered')) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          setLocationStatus('tracking');
          try {
            const locRef = doc(db, 'users', user.uid, 'locations', 'current');
            await setDoc(locRef, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: serverTimestamp()
            });
          } catch (err) {
            console.error("Location update failed", err);
          }
        },
        (err) => {
          console.error("Geolocation error", err);
          setLocationStatus('error');
          setError("Standortzugriff verweigert oder deaktiviert. Für den Notfall ist die Freigabe empfohlen.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentStatus, user.uid]);

  const renderStatusPill = (statusKey: string) => {
    if (statusKey === 'alert_triggered' || statusKey === 'emergency') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          {t.stateTriggered}
        </span>
      );
    }
    if (statusKey === 'pending_alert' || statusKey === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {t.statePending}
        </span>
      );
    }
    if (statusKey === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          {t.stateActive}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
        {statusKey}
      </span>
    );
  };

  // Escalation Tiers calculation
  const tier1Contacts = allContacts.filter(c => (c.priority || 1) === 1);
  const tier2Contacts = allContacts.filter(c => c.priority === 2);
  const tier3Contacts = allContacts.filter(c => c.priority === 3);

  // Determine active escalation stage
  const alertTriggeredTimestamp = userData?.alertTriggeredAt?.toMillis?.() || (userData?.alertTriggeredAt?.seconds ? userData.alertTriggeredAt.seconds * 1000 : null);
  const hoursSinceTrigger = alertTriggeredTimestamp ? (currentTime.getTime() - alertTriggeredTimestamp) / (1000 * 60 * 60) : 0;
  
  let currentEscalationStage = 1;
  let nextEscalationIn = '';
  if (currentStatus === 'alert_triggered') {
    if (hoursSinceTrigger >= 12) {
      currentEscalationStage = 3;
      nextEscalationIn = 'Maximale Eskalationsstufe erreicht (Alle Kontakte verständigt)';
    } else if (hoursSinceTrigger >= 3) {
      currentEscalationStage = 2;
      const hoursLeft = Math.max(0, 12 - hoursSinceTrigger);
      nextEscalationIn = `Stufe 3 eskaliert in ca. ${hoursLeft.toFixed(1)} Stunden`;
    } else {
      currentEscalationStage = 1;
      const hoursLeft = Math.max(0, 3 - hoursSinceTrigger);
      nextEscalationIn = `Stufe 2 eskaliert in ca. ${hoursLeft.toFixed(1)} Stunden`;
    }
  }

  return (
    <div className="space-y-6">

      {/* 1. EU MDR & Medical Emergency 112 Disclaimer Banner */}
      <MedicalDisclaimerBanner lang={lang} />

      {/* 2. PWA Install Prompt for Mobile and Desktop */}
      <PWAInstallPrompt lang={lang} />

      {/* Offline Mode Banner (GSM SMS Fallback Ready) */}
      {isOffline && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  {t.offlineStatusOffline}
                </span>
                <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  GSM Fallback
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                {t.offlineSmsDesc}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSmsDispatcherOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Notfall-SMS öffnen</span>
          </button>
        </div>
      )}

      {/* TOP: Dedicated Color-Coded Status Light & Overview Card */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 md:p-8 bg-white ${
        currentStatus === 'active' 
          ? 'border-emerald-200/80 shadow-sm shadow-emerald-100/50' 
          : currentStatus === 'pending_alert'
          ? 'border-amber-300 shadow-md shadow-amber-100'
          : 'border-rose-400 shadow-xl shadow-rose-100 bg-rose-50/20'
      }`}>
        
        {/* Ambient background glow according to status */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none -mr-20 -mt-20 ${
          currentStatus === 'active' ? 'bg-emerald-400' : currentStatus === 'pending_alert' ? 'bg-amber-400' : 'bg-rose-500'
        }`} />

        <div className="relative z-10 space-y-6">
          
          {/* Status Header with Primary Color-Coded Status Light */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              {/* The Hero Color-Coded Status Light */}
              <div className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
                <StatusIndicator status={currentStatus} size="hero" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    System-Indikator
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusCfg.badgeBg}`}>
                    {statusCfg.shortName}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Status: <span className={statusCfg.textColor}>{statusCfg.name}</span>
                </h1>
              </div>
            </div>

            {/* Quick status change / Entwarnung action */}
            <div className="flex items-center gap-2">
              {currentStatus !== 'active' ? (
                <button
                  disabled={updatingStatus}
                  onClick={triggerAllClearWithBiometrics}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <Fingerprint className="w-4 h-4" />
                  <span>Entwarnung geben (Aktivieren)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Alle Schutzroutinen normal
                </div>
              )}
            </div>
          </div>

          {/* Status Lifecycle Pipeline Bar */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Dead Man's Switch Lebenszyklus</span>
              <span className="text-[11px] font-normal normal-case text-slate-400">
                Wöchentlicher Zyklus mit 24h Pufferzeit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Step 1: Active */}
              <div 
                onClick={() => setAccountStatus('active')}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  currentStatus === 'active'
                    ? 'bg-white border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="mt-0.5">
                  <StatusIndicator status="active" size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">1. Active (Aktiv)</span>
                    {currentStatus === 'active' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Aktuell</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Regulärer Modus. Wöchentlicher Check-in erforderlich.
                  </p>
                </div>
              </div>

              {/* Step 2: Pending */}
              <div 
                onClick={() => setAccountStatus('pending_alert')}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  currentStatus === 'pending_alert'
                    ? 'bg-white border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="mt-0.5">
                  <StatusIndicator status="pending_alert" size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">2. Pending (Ausstehend)</span>
                    {currentStatus === 'pending_alert' && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">Aktuell</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Keine Rückmeldung. 24-Stunden Frist vor Kontaktalarm läuft.
                  </p>
                </div>
              </div>

              {/* Step 3: Emergency Triggered */}
              <div 
                onClick={() => setAccountStatus('alert_triggered')}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  currentStatus === 'alert_triggered'
                    ? 'bg-white border-rose-500 ring-2 ring-rose-500/30 shadow-sm'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="mt-0.5">
                  <StatusIndicator status="alert_triggered" size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">3. Triggered (Notfall)</span>
                    {currentStatus === 'alert_triggered' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">Aktiv</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Frist verstrichen. Notfallkontakte alarmiert, Tresor freigegeben.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Banner message based on status */}
          <AnimatePresence mode="wait">
            {currentStatus === 'pending_alert' && (
              <motion.div
                key="banner-pending"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-500/10 border-2 border-amber-400 rounded-2xl p-4.5 flex items-start gap-3.5 text-amber-900"
              >
                <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                    Achtung: Ihr wöchentlicher Check-in ist fällig!
                    <span className="bg-amber-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                      24h Pufferzeit
                    </span>
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Sie haben sich seit über 7 Tagen nicht gemeldet. Bitte betätigen Sie den Check-in Button innerhalb von 24 Stunden, sonst werden Ihre {contactsCount} hinterlegten Notfallkontakte automatisch alarmiert.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={triggerCheckInWithBiometrics}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>{t.checkInBtn || 'Ich bin am Leben (Check-in)'}</span>
                    </button>

                    {/* Immediate Override button in Pending Banner */}
                    <button
                      onClick={triggerOverrideWithBiometrics}
                      disabled={updatingStatus}
                      className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white font-bold text-xs shadow-md shadow-[#E63946]/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      title={t.immediateOverrideDesc}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current text-white" />
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Immediate Override: 24h Frist überspringen & sofort alarmieren</span>
                    </button>

                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                      Verbleibende Reaktionszeit: {formatTimeRemaining(msUntilEmergency)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStatus === 'alert_triggered' && (
              <motion.div
                key="banner-triggered"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4.5 flex items-start gap-3.5 text-rose-950 shadow-md shadow-rose-100"
              >
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-rose-900">
                      NOTFALL-ALARM AKTIV GESCHALTET!
                    </h4>
                    <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Freigabe erteilt
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Ihre Notfallkontakte ({contactsCount} Person{contactsCount !== 1 ? 'en' : ''}) haben nun Zugriff auf Ihren letzten bekannten Standort und die Daten Ihres digitalen Tresors.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={triggerAllClearWithBiometrics}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Fehlalarm beenden / Entwarnung senden</span>
                    </button>
                    {isOffline && (
                      <button
                        onClick={() => setSmsDispatcherOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Offline-Notruf per SMS senden</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Welcome & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Last Check-in */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-emerald-100/80 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Letzter Check-in</p>
                <p className="font-bold text-slate-800 text-sm truncate">
                  {lastCheckInDate.toLocaleDateString('de-DE')}
                </p>
                <p className="text-[11px] text-slate-500">
                  um {lastCheckInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr
                </p>
              </div>
            </div>

            {/* Next Check-in */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                currentStatus === 'pending_alert' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nächster Check-in</p>
                <p className="font-bold text-slate-800 text-sm truncate">
                  {nextCheckInDate.toLocaleDateString('de-DE')}
                </p>
                <p className={`text-[11px] font-medium ${msUntilCheckIn < 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                  {msUntilCheckIn > 0 
                    ? `Fällig in ${formatTimeRemaining(msUntilCheckIn)}`
                    : 'Überfällig!'}
                </p>
              </div>
            </div>

            {/* Emergency Contacts Ready */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-blue-100/80 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notfallkontakte</p>
                <p className="font-bold text-slate-800 text-sm">
                  {contactsCount} Vertrauensperson{contactsCount !== 1 ? 'en' : ''}
                </p>
                <p className="text-[11px] text-slate-500">
                  {contactsCount > 0 ? 'Bereit für Alarmierung' : 'Bitte Kontakte eintragen!'}
                </p>
              </div>
            </div>

          </div>

          {/* Primary Action Button (Secured with Biometric Verification) */}
          <div className="pt-2">
            <button
              onClick={triggerCheckInWithBiometrics}
              disabled={updatingStatus}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                currentStatus === 'alert_triggered'
                  ? 'bg-[#2B2D42] hover:bg-[#1f2030] text-white shadow-slate-300'
                  : currentStatus === 'pending_alert'
                  ? 'bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-[#E63946]/30 animate-pulse'
                  : 'bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-lg shadow-[#E63946]/30'
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>{t.checkInConfirmBtn || 'Ich bin am Leben (Check-in bestätigen)'}</span>
              <Fingerprint className="w-5 h-5 text-white/90 shrink-0 ml-1" />
            </button>
            <p className="text-center text-[11px] text-[#8D99AE] mt-2 flex items-center justify-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-[#E63946]" />
              <span>Biometrisch geschützt: Erfordert Fingerabdruck-Scan oder Face-ID zur Freigabe</span>
            </p>
          </div>

        </div>
      </div>

      {/* Feature 1: Stufenweise Eskalationsmatrix (Stage 1, Stage 2, Stage 3) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#E63946]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-[#2B2D42]">
                {t.escalationTitle}
              </h3>
              <p className="text-xs text-[#8D99AE]">
                Staffelung nach Reaktionszeit zur Vermeidung von Fehlalarmen
              </p>
            </div>
          </div>

          {currentStatus === 'alert_triggered' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-[#E63946] text-xs font-bold border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-[#E63946] animate-ping" />
              <span>{t.escalationActiveStage} Stufe {currentEscalationStage}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Stage 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentStatus === 'alert_triggered' && currentEscalationStage >= 1
              ? 'bg-rose-50/60 border-[#E63946] ring-2 ring-[#E63946]/20'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#E63946] uppercase tracking-wider">
                Stufe 1: Engster Kreis
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#E63946]">
                Sofort (0h)
              </span>
            </div>
            <p className="text-xs text-[#2B2D42] mb-3">
              Familie & nächste Angehörige. Werden unmittelbar nach Ablauf der 24h Pufferfrist alarmiert.
            </p>
            <div className="text-[11px] font-semibold text-[#8D99AE] flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span>Hinterlegte Kontakte:</span>
              <span className="font-bold text-[#2B2D42]">{tier1Contacts.length} Person(en)</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentStatus === 'alert_triggered' && currentEscalationStage >= 2
              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Stufe 2: Erweiterter Kreis
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                +3 Stunden
              </span>
            </div>
            <p className="text-xs text-[#2B2D42] mb-3">
              Freunde & Bekannte. Eskaliert automatisch, wenn Stufe 1 nach 3 Stunden nicht reagiert.
            </p>
            <div className="text-[11px] font-semibold text-[#8D99AE] flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span>Hinterlegte Kontakte:</span>
              <span className="font-bold text-[#2B2D42]">{tier2Contacts.length} Person(en)</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentStatus === 'alert_triggered' && currentEscalationStage >= 3
              ? 'bg-slate-100 border-[#2B2D42] ring-2 ring-[#2B2D42]/20'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2B2D42] uppercase tracking-wider">
                Stufe 3: Notdienste / Externe
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                +12 Stunden
              </span>
            </div>
            <p className="text-xs text-[#2B2D42] mb-3">
              Vermieter, Hausarzt, Anwalt. Eskaliert nach 12 Stunden anhaltender Inaktivität.
            </p>
            <div className="text-[11px] font-semibold text-[#8D99AE] flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span>Hinterlegte Kontakte:</span>
              <span className="font-bold text-[#2B2D42]">{tier3Contacts.length} Person(en)</span>
            </div>
          </div>
        </div>

        {currentStatus === 'alert_triggered' && (
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#2B2D42] flex items-center justify-between">
            <span className="font-medium text-[#8D99AE]">Nächster Eskalationsschritt:</span>
            <span className="font-bold text-[#E63946]">{nextEscalationIn}</span>
          </div>
        )}
      </div>

      {/* Web Push Notification Manager */}
      <NotificationManager lang={lang} />

      {/* Simulator / Interactive Status Switcher (Allows testing all 3 states) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Status-Testmodus & Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Wechseln Sie die Zustände interaktiv, um zu überprüfen, wie Indikator, Lichtsignal und Benachrichtigungen reagieren.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAccountStatus('active')}
              disabled={updatingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                currentStatus === 'active'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <StatusIndicator status="active" size="sm" />
              Aktiv
            </button>

            <button
              onClick={() => setAccountStatus('pending_alert')}
              disabled={updatingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                currentStatus === 'pending_alert'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <StatusIndicator status="pending_alert" size="sm" />
              Ausstehend (24h)
            </button>

            <button
              onClick={() => setAccountStatus('alert_triggered')}
              disabled={updatingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                currentStatus === 'alert_triggered'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <StatusIndicator status="alert_triggered" size="sm" />
              Notfall (Triggered)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Location Tracking & Manual Panic Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Real-time Location Tracking Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Echtzeit-Standort-Tracking
              </h3>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  locationStatus === 'tracking' 
                    ? 'bg-emerald-500 animate-ping' 
                    : locationStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-slate-300'
                }`} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  locationStatus === 'tracking' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : locationStatus === 'error'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {locationStatus === 'tracking' ? 'GPS Aktiv' : locationStatus === 'error' ? 'GPS Fehler' : 'Bereit'}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Ihr aktueller Standort wird kontinuierlich im geschützten Profil aktualisiert. Im Notfall erhalten autorisierte Notfallkontakte sofort Zugriff.
            </p>

            {error && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automatische Geokoordinaten-Aktualisierung aktiv</span>
          </div>
        </div>

        {/* Immediate Override Emergency Card */}
        <div className="bg-rose-50/70 rounded-3xl p-6 border-2 border-rose-300 shadow-md shadow-rose-100/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-rose-950 flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-rose-600 fill-current" />
                {t.immediateOverride}
              </h3>
              <span className="text-[10px] font-black text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                24h Bypass
              </span>
            </div>

            <p className="text-xs sm:text-sm text-rose-900 mb-6 leading-relaxed">
              {t.immediateOverrideDesc}
            </p>
          </div>

          <button
            onClick={triggerOverrideWithBiometrics}
            disabled={updatingStatus}
            className="w-full bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#E63946]/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-5 h-5 fill-current text-white animate-pulse" />
            <span>{t.immediateOverrideBtn}</span>
            <Fingerprint className="w-5 h-5 text-white/90" />
          </button>
        </div>

      </div>

      {/* Timestamped Status History & Alert Audit Log Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t.statusHistoryTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              {t.statusHistorySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {historyList.length} {historyList.length === 1 ? 'Eintrag' : 'Einträge'}
            </span>
          </div>
        </div>

        {/* History List Content */}
        {historyList.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">{t.noHistoryYet}</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {t.noHistoryDesc}
            </p>
            <div className="pt-2">
              <button
                onClick={() => recordStatusTransition('initial', currentStatus, 'check_in', 'Erster Status-Initialisierungs-Eintrag')}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
              >
                Initialen Status protokollieren
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {historyList.map((item) => {
              const dateObj = item.timestamp?.toDate ? item.timestamp.toDate() : null;
              const dateStr = dateObj ? dateObj.toLocaleDateString(lang === 'de' ? 'de-DE' : undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Gerade';
              const timeStr = dateObj ? dateObj.toLocaleTimeString(lang === 'de' ? 'de-DE' : undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
              
              // Calculate relative time
              let relativeStr = '';
              if (dateObj) {
                const diffSec = Math.floor((currentTime.getTime() - dateObj.getTime()) / 1000);
                if (diffSec < 60) relativeStr = 'Gerade eben';
                else if (diffSec < 3600) relativeStr = `vor ${Math.floor(diffSec / 60)} Min.`;
                else if (diffSec < 86400) relativeStr = `vor ${Math.floor(diffSec / 3600)} Std.`;
                else relativeStr = `vor ${Math.floor(diffSec / 86400)} d`;
              }

              const isEmergency = item.toStatus === 'alert_triggered';
              const isPending = item.toStatus === 'pending_alert' || item.toStatus === 'pending';
              const isActive = item.toStatus === 'active';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isEmergency 
                      ? 'bg-rose-50/70 border-rose-200' 
                      : isPending 
                      ? 'bg-amber-50/60 border-amber-200' 
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Status Badge Transition: [From] -> [To] */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {t.historyTransition}
                      </span>
                      
                      {renderStatusPill(item.fromStatus || 'active')}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      {renderStatusPill(item.toStatus || 'active')}

                      {item.reason === 'immediate_override' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                          IMMEDIATE OVERRIDE
                        </span>
                      )}
                    </div>

                    {/* Note & Reason */}
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {item.note || item.reason || 'Statuswechsel'}
                    </p>
                  </div>

                  {/* Timestamp & Relative Time */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {dateStr} {timeStr}
                    </span>
                    {relativeStr && (
                      <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {relativeStr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Mechanism explainer footer */}
      <div className="bg-indigo-50/80 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-900 leading-relaxed">
          <p className="font-bold mb-1 text-indigo-950">Funktionsweise des Dead Man's Switch Indikators:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-indigo-800">
            <li><strong className="text-emerald-700">Grüne Statusleuchte (Aktiv):</strong> Sie melden sich wöchentlich mit einem Klick. Alle Daten bleiben privat verschlüsselt.</li>
            <li><strong className="text-amber-700">Gelbe Statusleuchte (Ausstehend):</strong> Sie haben nach 7 Tagen nicht reagiert. Eine 24-stündige Warnfrist beginnt.</li>
            <li><strong className="text-rose-700">Rote Statusleuchte (Notfall):</strong> Nach Ablauf der 24 Stunden oder bei <strong>Immediate Override</strong> werden Ihre Vertrauenspersonen alarmiert und erhalten Zugriff auf Standort & Tresor.</li>
          </ul>
        </div>
      </div>

      {/* Immediate Override Dispatch Confirmation Modal */}
      <AnimatePresence>
        {overrideModalData && (
          <div 
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-200 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {t.overrideSuccessTitle}
                    </h3>
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                      24-Stunden Frist umgangen • Status: Notfall aktiv
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOverrideModalData(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.overrideSuccessDesc}
              </p>

              {/* List of notified contacts */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t.notifiedContactsLabel} ({overrideModalData.contacts.length})
                </span>

                {overrideModalData.contacts.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Achtung: Sie haben noch keine Kontakte hinterlegt. Bitte tragen Sie im Menü 'Kontakte' Vertrauenspersonen ein.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {overrideModalData.contacts.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">
                            {c.name} {c.relation ? `(${c.relation})` : ''}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {c.email} {c.phone ? `• ${c.phone}` : ''}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Alarmiert
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formatted Alert Message that was sent */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E63946]" />
                    Versendete Notfall-Nachricht (Vorlage):
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    {(userData?.alertMessageLanguage || 'de').toUpperCase()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed select-all">
                  {formatAlertMessage({
                    templateId: (userData?.alertMessageTemplate as AlertTemplateId) || 'standard',
                    targetLang: (userData?.alertMessageLanguage as Language) || 'de',
                    userName: user.displayName || user.email?.split('@')[0] || 'VivoPing-Nutzer',
                    location: null
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-tight">
                <strong>Freigabestatus:</strong> Ihr Echtzeit-GPS-Standort und die Einträge Ihres digitalen Tresors sind nun für Ihre Notfallkontakte freigeschaltet.
              </div>

              <button
                onClick={() => setOverrideModalData(null)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Verstanden & Notfall-Dashboard anzeigen
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Biometric Verification Modal */}
      {biometricModal && (
        <BiometricModal
          isOpen={biometricModal.isOpen}
          onClose={() => setBiometricModal(null)}
          onSuccess={() => {
            const actionToRun = biometricModal.action;
            setBiometricModal(null);
            actionToRun();
          }}
          title={biometricModal.title}
          actionDescription={biometricModal.description}
          lang={lang}
        />
      )}

      {/* Offline SMS Dispatcher Modal */}
      <OfflineSMSDispatcher
        isOpen={smsDispatcherOpen}
        onClose={() => setSmsDispatcherOpen(false)}
        contacts={allContacts}
        location={null}
        userName={user.displayName || user.email?.split('@')[0] || 'VivoPing-Nutzer'}
        lang={lang}
        defaultTemplateId={(userData?.alertMessageTemplate as AlertTemplateId) || 'standard'}
        defaultMessageLang={(userData?.alertMessageLanguage as Language) || 'de'}
      />

    </div>
  );
}

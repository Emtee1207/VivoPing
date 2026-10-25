import React, { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Globe, 
  Smartphone, 
  ShieldCheck, 
  Scale, 
  FileText, 
  Accessibility, 
  Cookie, 
  Trash2, 
  UserCheck, 
  Cloud, 
  Check, 
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  Server,
  RefreshCw,
  HeartPulse,
  RotateCcw,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';
import { LegalTab } from './legal/LegalModal';
import AlertMessageConfigurator from './AlertMessageConfigurator';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsViewProps {
  user: any;
  userData: any;
  currentLang: Language;
  onLanguageChange: (newLang: Language) => void;
  theme: ThemeMode;
  onThemeChange: (newTheme: ThemeMode) => void;
  highContrast: boolean;
  onToggleHighContrast: (enabled: boolean) => void;
  largeFont: boolean;
  onToggleLargeFont: (enabled: boolean) => void;
  onOpenLegal: (tab: LegalTab) => void;
  onOpenConsent: () => void;
}

export default function SettingsView({
  user,
  userData,
  currentLang,
  onLanguageChange,
  theme = 'system',
  onThemeChange,
  highContrast,
  onToggleHighContrast,
  largeFont,
  onToggleLargeFont,
  onOpenLegal,
  onOpenConsent
}: SettingsViewProps) {
  const t = getTranslation(currentLang);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [checkingScheduler, setCheckingScheduler] = useState(false);

  React.useEffect(() => {
    fetch('/api/scheduler/status')
      .then(res => res.json())
      .then(data => setSchedulerStatus(data))
      .catch(() => {});
  }, []);

  const triggerSchedulerCheck = async () => {
    setCheckingScheduler(true);
    try {
      const res = await fetch('/api/scheduler/run-check', { method: 'POST' });
      const data = await res.json();
      setSchedulerStatus((prev: any) => ({
        ...prev,
        status: 'active',
        lastManualCheck: new Date().toISOString(),
        manualCheckResult: data
      }));
    } catch (err) {
      console.error('Failed to run scheduler check:', err);
    } finally {
      setCheckingScheduler(false);
    }
  };

  // Handle Account & Data Deletion
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t.deleteAccountConfirmPrompt);
    if (!confirmed) return;

    const secondConfirm = window.prompt(
      "Geben Sie 'LÖSCHEN' ein, um die unwiderrufliche Löschung zu bestätigen:"
    );
    if (secondConfirm !== 'LÖSCHEN' && secondConfirm !== 'DELETE') {
      alert("Löschung abgebrochen.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const uid = user.uid;

      // 1. Delete all contacts subcollection docs
      const contactsSnap = await getDocs(collection(db, 'users', uid, 'contacts'));
      for (const d of contactsSnap.docs) {
        await deleteDoc(doc(db, 'users', uid, 'contacts', d.id));
      }

      // 2. Delete all vault subcollection docs
      const vaultSnap = await getDocs(collection(db, 'users', uid, 'vault'));
      for (const d of vaultSnap.docs) {
        await deleteDoc(doc(db, 'users', uid, 'vault', d.id));
      }

      // 3. Delete all statusHistory subcollection docs
      try {
        const historySnap = await getDocs(collection(db, 'users', uid, 'statusHistory'));
        for (const d of historySnap.docs) {
          await deleteDoc(doc(db, 'users', uid, 'statusHistory', d.id));
        }
      } catch (e) {
        // ignore if empty
      }

      // 4. Delete location current doc
      try {
        await deleteDoc(doc(db, 'users', uid, 'locations', 'current'));
      } catch (e) {
        // ignore if not found
      }

      // 4. Delete user root document
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete Firebase Auth user
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (authErr: any) {
          console.warn("Auth user requires recent login to delete, signing out instead:", authErr);
          await signOut(auth);
        }
      }

      alert("Ihr Konto und alle zugehörigen Daten wurden erfolgreich und vollständig gelöscht.");
      window.location.reload();
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setDeleteError(
        "Fehler beim Löschen des Kontos. Aus Sicherheitsgründen erfordert Firebase einen aktuellen Login. Bitte melden Sie sich erneut an und versuchen Sie es noch einmal."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t.navSettings}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.settingsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {t.settingsSubtitle}
          </p>
        </div>
      </div>

      {/* 1. Account & Multi-Device Sync (Device-übergreifend) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            {t.sectionAccount}
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t.syncActiveBadge}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t.syncDesc}
        </p>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-2xl border" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{user.displayName || 'LifeGuard Nutzer'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user.uid.slice(0, 16)}...</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Authentifizierung</span>
            <span className="text-xs font-semibold text-slate-700">Google OAuth 2.0 (SSO)</span>
          </div>
        </div>

        {/* Required Accounts Guide for Production & Stores */}
        <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{t.accountsNeededTitle}</span>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            {t.accountsNeededDesc}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-indigo-950 font-medium">
            <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-bold">1.</span>
              <span><strong>Firebase / Google Cloud:</strong> Für Datenbank, Auth & Hosting</span>
            </li>
            <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-bold">2.</span>
              <span><strong>Apple Developer ($99/Jahr):</strong> Für die iOS App Store Veröffentlichung</span>
            </li>
            <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-bold">3.</span>
              <span><strong>Google Play Console ($25):</strong> Für die Android Play Store Veröffentlichung</span>
            </li>
            <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-bold">4.</span>
              <span><strong>Domain & E-Mail:</strong> Eigene Domain für Impressum & Support (Anti-Spam geschützt)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. Appearance & Theme (Light / Dark Mode / System) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{t.sectionAppearance}</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              {t.themeModeDesc}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cloud className="w-3.5 h-3.5" />
            {t.themeSavedInAccount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl transition-colors ${
                theme === 'light' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
              }`}>
                <Sun className="w-5 h-5" />
              </div>
              {theme === 'light' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Aktiv
                </span>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">
              {t.themeLight}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.themeLightDesc}
            </p>
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-[#181A2A] border-indigo-500 shadow-md ring-2 ring-indigo-500/20 text-white'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl transition-colors ${
                theme === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
              }`}>
                <Moon className="w-5 h-5" />
              </div>
              {theme === 'dark' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Aktiv
                </span>
              )}
            </div>
            <h4 className={`text-sm font-extrabold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.themeDark}
            </h4>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
              {t.themeDarkDesc}
            </p>
          </button>

          {/* System Default Option */}
          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              theme === 'system'
                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl transition-colors ${
                theme === 'system' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
              }`}>
                <Monitor className="w-5 h-5" />
              </div>
              {theme === 'system' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Aktiv
                </span>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">
              {t.themeSystem}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.themeSystemDesc}
            </p>
          </button>

        </div>
      </div>

      {/* 3. Language Selection (5 Languages) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            {t.sectionLanguage}
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            5 Sprachen verfügbar
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl mb-1">{lang.flag}</span>
                <span className="text-xs font-extrabold">{lang.nativeName}</span>
                <span className="text-[10px] text-slate-400">{lang.name}</span>
                {isSelected && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
                    <Check className="w-3 h-3" /> Ausgewählt
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Notfall-Nachricht & Vorlagenauswahl (5 Vorlagen & 5 Zielsprachen) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <AlertMessageConfigurator 
          user={user}
          userData={userData}
          currentLang={currentLang}
        />
      </div>

      {/* 4. Digital Accessibility (BFSG / Barrierefreiheit) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-indigo-600" />
            {t.sectionAccessibility}
          </h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            BFSG & WCAG 2.1 AA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* High Contrast Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <p className="font-bold text-slate-900 text-sm">{t.contrastModeTitle}</p>
              <p className="text-xs text-slate-500">{t.contrastModeDesc}</p>
            </div>
            <button
              onClick={() => onToggleHighContrast(!highContrast)}
              role="switch"
              aria-checked={highContrast}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                highContrast ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                highContrast ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Large Font Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <p className="font-bold text-slate-900 text-sm">{t.fontSizeTitle}</p>
              <p className="text-xs text-slate-500">{t.fontSizeDesc}</p>
            </div>
            <button
              onClick={() => onToggleLargeFont(!largeFont)}
              role="switch"
              aria-checked={largeFont}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                largeFont ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                largeFont ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>
      </div>

      {/* 5. Autonomer Server-Wächter (Hintergrund-Daemon) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Autonomer Cloud-Monitor (Server-Daemon)
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Aktiv (60s Intervall)
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Selbst wenn Ihr Smartphone ausgeschaltet ist, der Akku leer ist oder kein Netzempfang besteht: Der backendseitige Cloud-Daemon prüft jede Minute, ob Ihr Check-in überfällig ist. Wird das Zeitfenster überschritten, wird der Notfallstatus serverseitig ausgelöst.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <span className="text-slate-400">Daemon-Status:</span>
              <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                {schedulerStatus?.status === 'active' ? 'Online & aktiv' : 'Aktiv (Intervall: 60s)'}
              </span>
            </div>
            {schedulerStatus?.lastCheckTime && (
              <p className="text-[11px] text-slate-500">
                Letzte automatische Server-Prüfung: {new Date(schedulerStatus.lastCheckTime).toLocaleTimeString()} Uhr
              </p>
            )}
            {schedulerStatus?.manualCheckResult && (
              <p className="text-[11px] text-indigo-600 font-medium">
                Manueller Testlauf: {schedulerStatus.manualCheckResult.checkedUsers ?? 0} Benutzerkonten geprüft, {schedulerStatus.manualCheckResult.triggeredAlerts ?? 0} Eskalationen aktiv.
              </p>
            )}
          </div>

          <button
            onClick={triggerSchedulerCheck}
            disabled={checkingScheduler}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingScheduler ? 'animate-spin' : ''}`} />
            {checkingScheduler ? 'Prüft...' : 'Server-Check testen'}
          </button>
        </div>
      </div>

      {/* 6. Legal & Compliance Menu Points */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          {t.sectionLegal}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onOpenLegal('impressum')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">{t.legalImpressumBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('privacy')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">{t.legalPrivacyBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('terms')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">{t.legalTermsBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('disclaimer')}
            className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-900">MDR & 112 Hinweis</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('withdrawal')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">Widerrufsbelehrung</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('appstore')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-800">{t.legalStoreGuidelinesBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onOpenLegal('accessibility')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <Accessibility className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">{t.legalAccessibilityBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onOpenConsent}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <Cookie className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-slate-800">{t.consentManageBtn}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 5. Danger Zone / Account Deletion (Apple 5.1.1v & GDPR Art. 17) */}
      <div className="bg-rose-50/60 rounded-3xl p-6 sm:p-8 border-2 border-rose-200 space-y-4">
        <div className="flex items-center gap-2 text-rose-800 font-extrabold text-lg">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <h3>{t.sectionDanger}</h3>
        </div>

        <p className="text-xs text-rose-900 leading-relaxed">
          {t.deleteAccountDesc}
        </p>

        {deleteError && (
          <div className="bg-rose-100 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{deleteError}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            disabled={isDeleting}
            onClick={handleDeleteAccount}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Konto wird vollständig gelöscht...' : t.deleteAccountBtn}
          </button>
        </div>
      </div>

    </div>
  );
}

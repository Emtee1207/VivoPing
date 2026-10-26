/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Heart, 
  Users, 
  Lock, 
  LogOut, 
  Settings as SettingsIcon,
  Globe,
  Scale,
  FileText,
  Accessibility,
  Check,
  Sun,
  Moon
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import ContactsManager from './components/ContactsManager';
import VaultManager from './components/VaultManager';
import SettingsView, { ThemeMode } from './components/SettingsView';
import AuthScreen from './components/AuthScreen';
import StatusIndicator from './components/StatusIndicator';
import LegalModal, { LegalTab } from './components/legal/LegalModal';
import ConsentBanner from './components/legal/ConsentBanner';
import VivoPingLogo from './components/VivoPingLogo';

// i18n
import { Language, SUPPORTED_LANGUAGES, getTranslation } from './i18n';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'vault' | 'settings'>('dashboard');

  // i18n Language state
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lifeguard_lang') as Language;
    return saved && ['de', 'en', 'fr', 'es', 'ru'].includes(saved) ? saved : 'de';
  });

  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('lifeguard_theme') as ThemeMode;
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('lifeguard_theme', newTheme);
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { theme: newTheme });
      } catch (e) {
        console.warn("Could not save theme to user profile:", e);
      }
    }
  };

  // Accessibility States
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('lifeguard_contrast') === 'true';
  });

  const [largeFont, setLargeFont] = useState<boolean>(() => {
    return localStorage.getItem('lifeguard_large_font') === 'true';
  });

  // Legal Modal States
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('impressum');

  // Consent Banner force open
  const [consentForceOpen, setConsentForceOpen] = useState(false);

  // Gear Button ("Zahnrad") Quick Menu
  const [gearMenuOpen, setGearMenuOpen] = useState(false);

  // Translations
  const t = getTranslation(currentLang);

  const handleLanguageChange = async (newLang: Language) => {
    setCurrentLang(newLang);
    localStorage.setItem('lifeguard_lang', newLang);
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { language: newLang });
      } catch (e) {
        console.warn("Could not save language to profile:", e);
      }
    }
  };

  const handleToggleHighContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    localStorage.setItem('lifeguard_contrast', enabled ? 'true' : 'false');
  };

  const handleToggleLargeFont = (enabled: boolean) => {
    setLargeFont(enabled);
    localStorage.setItem('lifeguard_large_font', enabled ? 'true' : 'false');
  };

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (e) {
          // Silent connection test
        }

        const unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            if (data.language && ['de', 'en', 'fr', 'es', 'ru'].includes(data.language)) {
              setCurrentLang(data.language as Language);
            }
            if (data.theme && ['light', 'dark', 'system'].includes(data.theme)) {
              setTheme(data.theme as ThemeMode);
              localStorage.setItem('lifeguard_theme', data.theme);
            }
          } else {
            // Create initial user data
            const initialData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              status: 'active',
              lastCheckIn: serverTimestamp(),
              checkInFrequency: 'weekly',
              language: currentLang,
              theme: theme
            };
            setDoc(userRef, initialData).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));

        return () => unsubDoc();
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4">
        <motion.div 
          animate={{ scale: [1, 1.06, 1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative p-3 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-rose-100/50">
            <img
              src="/assets/aistudio/Logo_Lifeguard_App_d32e2a0e.png"
              alt="VivoPing"
              className="w-20 h-20 object-contain drop-shadow-[0_4px_12px_rgba(154,3,30,0.25)]"
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-heading text-[#2B2D42]">
              <span className="font-semibold">Vivo</span>
              <span className="font-semibold text-[#9A031E]">Ping</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">Lebenswächter wird initialisiert...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen 
          currentLang={currentLang} 
          onLanguageChange={handleLanguageChange}
          onOpenLegal={handleOpenLegal}
        />
        <LegalModal 
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          initialTab={legalTab}
          lang={currentLang}
        />
        <ConsentBanner lang={currentLang} />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FAFAFC] dark:bg-[#0E1017] text-[#2B2D42] dark:text-[#F1F5F9] font-sans transition-colors duration-200 ${
      highContrast ? 'contrast-125' : ''
    } ${largeFont ? 'text-base' : 'text-sm'}`}>
      
      {/* Navigation */}
      <nav 
        role="navigation"
        aria-label="Hauptnavigation"
        className="bg-white dark:bg-[#161824] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs"
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E63946] rounded-xl p-1 transition-transform hover:scale-[1.02]"
              aria-label="Zurück zum Dashboard"
            >
              <VivoPingLogo size="sm" showText={true} variant={isDarkMode ? 'dark' : 'light'} />
            </button>

            {userData?.status && (
              <StatusIndicator 
                status={userData.status} 
                size="sm" 
                showBadge={true} 
                className="hidden sm:inline-flex cursor-pointer"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-[#1F2233] p-1 rounded-xl">
              <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={<Heart className="w-4 h-4" />}
                label={t.navStatus}
              />
              <NavButton 
                active={activeTab === 'contacts'} 
                onClick={() => setActiveTab('contacts')}
                icon={<Users className="w-4 h-4" />}
                label={t.navContacts}
              />
              <NavButton 
                active={activeTab === 'vault'} 
                onClick={() => setActiveTab('vault')}
                icon={<Lock className="w-4 h-4" />}
                label={t.navVault}
              />
              <NavButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
                icon={<SettingsIcon className="w-4 h-4" />}
                label={t.navSettings}
              />
            </div>

            {/* Quick Theme Toggle Button in Header */}
            <button
              onClick={() => handleThemeChange(isDarkMode ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700'
              }`}
              title={isDarkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
              aria-label="Farbschema wechseln"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Quick Language Selector in Header */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Sprache wechseln"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang.toUpperCase()}</span>
              </button>

              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1E2130] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 hidden group-hover:block z-50">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                      currentLang === l.code ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{l.flag} {l.name}</span>
                    {currentLang === l.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Gear Button ("Zahnrad") Quick Menu */}
            <div className="relative">
              <button
                onClick={() => setGearMenuOpen(!gearMenuOpen)}
                className={`p-2 rounded-xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  gearMenuOpen 
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent text-slate-700 dark:text-slate-200'
                }`}
                title={t.gearMenuTitle}
                aria-label={t.gearMenuTitle}
                aria-expanded={gearMenuOpen}
              >
                <SettingsIcon className={`w-5 h-5 transition-transform duration-300 ${gearMenuOpen ? 'rotate-90 text-indigo-600' : ''}`} />
              </button>

              <AnimatePresence>
                {gearMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E2130] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs font-semibold text-slate-800 dark:text-slate-200 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      {t.gearMenuTitle}
                    </div>
                    
                    {/* Option 1: Konfiguration */}
                    <button
                      onClick={() => {
                        setGearMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className={`w-full px-3 py-2.5 text-left rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer ${
                        activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <SettingsIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{t.gearMenuConfig}</span>
                    </button>

                    {/* Option 2: Farbmodus Toggle */}
                    <button
                      onClick={() => {
                        handleThemeChange(isDarkMode ? 'light' : 'dark');
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                        <span>{isDarkMode ? t.themeLight : t.themeDark}</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                        {theme}
                      </span>
                    </button>

                    {/* Option 3: Impressum */}
                    <button
                      onClick={() => {
                        setGearMenuOpen(false);
                        handleOpenLegal('impressum');
                      }}
                      className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>{t.gearMenuImpressum}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">§ 5 DDG</span>
                    </button>

                    {/* Option 4: Datenschutz */}
                    <button
                      onClick={() => {
                        setGearMenuOpen(false);
                        handleOpenLegal('privacy');
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.gearMenuPrivacy}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">DSGVO</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Logout button */}
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              title={t.logout}
              aria-label={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Dashboard user={user} userData={userData} lang={currentLang} />
            </motion.div>
          )}
          
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ContactsManager user={user} userData={userData} lang={currentLang} />
            </motion.div>
          )}
          
          {activeTab === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <VaultManager user={user} lang={currentLang} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <SettingsView 
                user={user}
                userData={userData}
                currentLang={currentLang}
                onLanguageChange={handleLanguageChange}
                theme={theme}
                onThemeChange={handleThemeChange}
                highContrast={highContrast}
                onToggleHighContrast={handleToggleHighContrast}
                largeFont={largeFont}
                onToggleLargeFont={handleToggleLargeFont}
                onOpenLegal={handleOpenLegal}
                onOpenConsent={() => setConsentForceOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cross-App Legal Footer (Available across all views - Anti-Scraping Protected) */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-[#8D99AE] dark:text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="font-heading font-semibold text-[#2B2D42] dark:text-white">
            Vivo<span className="font-normal text-[#E63946]">Ping</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>Anbieterkennzeichnung & Kontakt geschützt im</span>
          <button
            onClick={() => handleOpenLegal('impressum')}
            className="text-[#2B2D42] dark:text-slate-200 font-semibold underline hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Impressum (§ 5 DDG)
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-[#2B2D42] dark:text-slate-300">
          <button 
            onClick={() => handleOpenLegal('impressum')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Impressum
          </button>
          <span>•</span>
          <button 
            onClick={() => handleOpenLegal('privacy')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Datenschutz
          </button>
          <span>•</span>
          <button 
            onClick={() => handleOpenLegal('terms')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            AGB & EULA
          </button>
          <span>•</span>
          <button 
            onClick={() => handleOpenLegal('appstore')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Play Store & PWA
          </button>
          <span>•</span>
          <button 
            onClick={() => handleOpenLegal('accessibility')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Barrierefreiheit
          </button>
          <span>•</span>
          <button 
            onClick={() => setConsentForceOpen(true)}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Cookies
          </button>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <div 
        role="navigation"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#161824]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex justify-around items-center z-40 shadow-lg"
      >
        <MobileNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
          icon={<Heart className="w-5 h-5" />}
          label={t.navStatus}
        />
        <MobileNavButton 
          active={activeTab === 'contacts'} 
          onClick={() => setActiveTab('contacts')}
          icon={<Users className="w-5 h-5" />}
          label={t.navContacts}
        />
        <MobileNavButton 
          active={activeTab === 'vault'} 
          onClick={() => setActiveTab('vault')}
          icon={<Lock className="w-5 h-5" />}
          label={t.navVault}
        />
        <MobileNavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
          icon={<SettingsIcon className="w-5 h-5" />}
          label={t.navSettings}
        />
      </div>

      {/* Global Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        lang={currentLang}
      />

      {/* Consent Management Banner (Web / Android / iOS) */}
      <ConsentBanner 
        lang={currentLang}
        forceOpen={consentForceOpen}
        onCloseForce={() => setConsentForceOpen(false)}
      />

    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E63946] ${
        active 
          ? 'bg-white dark:bg-[#262A3E] text-[#E63946] shadow-xs' 
          : 'text-[#8D99AE] hover:text-[#2B2D42] dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-[#E63946] ${
        active ? 'text-[#E63946] font-bold' : 'text-[#8D99AE] hover:text-slate-300 font-medium'
      }`}
    >
      {icon}
      <span className="text-[10px] tracking-tight">{label}</span>
    </button>
  );
}

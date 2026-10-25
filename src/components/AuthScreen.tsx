import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Heart, 
  Lock, 
  Users, 
  Cloud, 
  Globe, 
  Mail, 
  Key, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Settings as GearIcon,
  ChevronDown
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';
import { LegalTab } from './legal/LegalModal';
import VivoPingLogo from './VivoPingLogo';

interface AuthScreenProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export default function AuthScreen({ currentLang, onLanguageChange, onOpenLegal }: AuthScreenProps) {
  const t = getTranslation(currentLang);

  // Auth mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Gear dropdown menu state
  const [gearOpen, setGearOpen] = useState(false);

  // Google Login
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || "Anmeldung mit Google fehlgeschlagen.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Submit
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setAuthError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    if (password.length < 6) {
      setAuthError(t.passwordPlaceholder);
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      let msg = err.message || "Authentifizierungsfehler.";
      if (err.code === 'auth/email-already-in-use') {
        msg = "Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Ungültige E-Mail-Adresse.";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = "Ungültige E-Mail-Adresse oder falsches Passwort.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Das Passwort ist zu schwach (mindestens 6 Zeichen erforderlich).";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Zu viele Versuche. Bitte warten Sie einen Moment oder setzen Sie Ihr Passwort zurück.";
      }
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthError("Bitte geben Sie zuerst Ihre E-Mail-Adresse in das Feld ein.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMessage(t.passwordResetSent);
    } catch (err: any) {
      setAuthError(err.message || "Fehler beim Senden der Passwort-Zurücksetzen-E-Mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4 relative font-sans text-[#2B2D42]">
      
      {/* Top Controls Bar: Language + Gear Button ("Zahnrad") */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        
        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <Globe className="w-3.5 h-3.5 text-[#8D99AE] ml-1.5" />
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onLanguageChange(l.code)}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentLang === l.code 
                  ? 'bg-[#E63946] text-white shadow-xs' 
                  : 'text-[#8D99AE] hover:text-[#2B2D42] hover:bg-slate-100'
              }`}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {/* Gear Button ("Zahnrad") with Quick Menu: Konfiguration & Impressum */}
        <div className="relative">
          <button
            onClick={() => setGearOpen(!gearOpen)}
            aria-label="Optionen & Impressum"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/90 hover:bg-white text-[#2B2D42] hover:text-[#E63946] border border-slate-200 shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E63946]"
          >
            <GearIcon className={`w-4 h-4 transition-transform duration-300 ${gearOpen ? 'rotate-90 text-[#E63946]' : 'text-[#8D99AE]'}`} />
            <span className="text-xs font-bold">{t.gearMenuTitle}</span>
            <ChevronDown className="w-3 h-3 text-[#8D99AE]" />
          </button>

          <AnimatePresence>
            {gearOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-semibold text-[#2B2D42]"
              >
                <button
                  onClick={() => {
                    setGearOpen(false);
                    onOpenLegal('impressum');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 hover:text-[#E63946] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{t.gearMenuImpressum}</span>
                  <span className="text-[10px] text-[#8D99AE]">§ 5 DDG</span>
                </button>
                <button
                  onClick={() => {
                    setGearOpen(false);
                    onOpenLegal('privacy');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 hover:text-[#E63946] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{t.gearMenuPrivacy}</span>
                  <span className="text-[10px] text-[#8D99AE]">DSGVO</span>
                </button>
                <button
                  onClick={() => {
                    setGearOpen(false);
                    onOpenLegal('terms');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 hover:text-[#E63946] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>AGB & EULA</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Main Auth Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center border border-slate-100"
      >
        {/* Harmonious Hero Logo Display */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative group">
            {/* Ambient pulse glow behind logo matching crimson color */}
            <div className="absolute inset-0 bg-[#9A031E]/15 rounded-full blur-2xl transform scale-125 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="relative p-3 rounded-3xl bg-linear-to-b from-white to-slate-50 border border-slate-100 shadow-sm flex items-center justify-center">
              <img
                src="/assets/aistudio/Logo_Lifeguard_App_d32e2a0e.png"
                alt="LifeGuard VivoPing Logo"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_8px_20px_rgba(154,3,30,0.25)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <h1 className="text-3xl font-heading font-bold tracking-tight text-[#2B2D42] flex items-center justify-center gap-1">
              <span>Vivo</span>
              <span className="text-[#9A031E]">Ping</span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Digitaler Lebenswächter & Totmann-System
            </p>
          </div>
        </div>
        
        <p className="text-[#8D99AE] mb-5 text-xs sm:text-sm leading-relaxed">
          {t.authDesc}
        </p>

        {/* Cross-Device Notice */}
        <div className="mb-6 p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-left flex items-center gap-3 text-[#2B2D42]">
          <Cloud className="w-4 h-4 text-[#E63946] shrink-0" />
          <p className="text-[11px] font-medium leading-tight">
            {t.authCrossDeviceNotice}
          </p>
        </div>

        {/* 1. Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#2B2D42] hover:bg-[#1f2030] text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-md shadow-slate-300/40 cursor-pointer disabled:opacity-60"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          {t.loginWithGoogle}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[#8D99AE] font-semibold uppercase tracking-wider text-[10px]">
              {t.orDivider}
            </span>
          </div>
        </div>

        {/* 2. Email & Password Form */}
        <div className="space-y-4 text-left">
          
          {/* Mode Switch Tabs (Anmelden vs Registrieren) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-[#E63946] shadow-xs'
                  : 'text-[#8D99AE] hover:text-[#2B2D42]'
              }`}
            >
              {t.signInTab}
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-[#E63946] shadow-xs'
                  : 'text-[#8D99AE] hover:text-[#2B2D42]'
              }`}
            >
              {t.registerTab}
            </button>
          </div>

          {/* Error & Info Alerts */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 text-[#9A031E] p-3 rounded-2xl text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
              <span>{authError}</span>
            </motion.div>
          )}

          {infoMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            
            {/* Name field when registering */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#2B2D42] uppercase tracking-wider block">
                  {t.nameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8D99AE] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E63946] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2B2D42] uppercase tracking-wider block">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8D99AE] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E63946] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#2B2D42] uppercase tracking-wider block">
                  {t.passwordLabel}
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-semibold text-[#E63946] hover:text-[#9A031E] transition-colors cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-[#8D99AE] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E63946] focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8D99AE] hover:text-[#2B2D42] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Email Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white shadow-md shadow-[#E63946]/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>{authMode === 'login' ? t.submitLogin : t.submitRegister}</span>
            </button>
          </form>

        </div>
        
        <p className="mt-5 text-[11px] text-[#8D99AE] leading-tight">
          {t.authTermsNote}
        </p>

        {/* Mandatory Legal Footer Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-[#8D99AE]">
          <button 
            onClick={() => onOpenLegal('impressum')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Impressum
          </button>
          <span>•</span>
          <button 
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            Datenschutz
          </button>
          <span>•</span>
          <button 
            onClick={() => onOpenLegal('terms')}
            className="hover:text-[#E63946] transition-colors cursor-pointer"
          >
            AGB & EULA
          </button>
        </div>
      </motion.div>

      {/* Provider Details Footer (Anti-Scraping Protected) */}
      <div className="mt-6 text-center text-xs text-[#8D99AE] space-y-0.5">
        <p>
          VivoPing • Pflichtangaben nach § 5 DDG (Spamschutz-gesichert im{' '}
          <button
            type="button"
            onClick={() => onOpenLegal('impressum')}
            className="underline hover:text-[#E63946] transition-colors cursor-pointer font-semibold"
          >
            Impressum
          </button>
          )
        </p>
      </div>

    </div>
  );
}

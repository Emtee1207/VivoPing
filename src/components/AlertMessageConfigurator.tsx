import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Globe, 
  Check, 
  Copy, 
  Radio, 
  Send, 
  Sparkles, 
  AlertCircle, 
  ShieldAlert, 
  HeartHandshake, 
  Lock, 
  Compass,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Language, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';
import { 
  AlertTemplateId, 
  ALERT_TEMPLATES, 
  formatAlertMessage 
} from '../alertTemplates';

interface AlertMessageConfiguratorProps {
  user: any;
  userData: any;
  currentLang?: Language;
  onSaved?: () => void;
  compact?: boolean;
}

export default function AlertMessageConfigurator({
  user,
  userData,
  currentLang = 'de',
  onSaved,
  compact = false
}: AlertMessageConfiguratorProps) {
  const t = getTranslation(currentLang);

  // Initial state from userData (or default)
  const initialTemplate: AlertTemplateId = (userData?.alertMessageTemplate as AlertTemplateId) || 'standard';
  const initialMsgLang: Language = (userData?.alertMessageLanguage as Language) || 'de';

  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplateId>(initialTemplate);
  const [selectedMsgLang, setSelectedMsgLang] = useState<Language>(initialMsgLang);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if userData loads later
  useEffect(() => {
    if (userData?.alertMessageTemplate) {
      setSelectedTemplate(userData.alertMessageTemplate);
    }
    if (userData?.alertMessageLanguage) {
      setSelectedMsgLang(userData.alertMessageLanguage);
    }
  }, [userData?.alertMessageTemplate, userData?.alertMessageLanguage]);

  const userName = user?.displayName || user?.email?.split('@')[0] || 'VivoPing-Nutzer';

  // Live preview text
  const previewText = formatAlertMessage({
    templateId: selectedTemplate,
    targetLang: selectedMsgLang,
    userName,
    location: {
      latitude: 48.79012,
      longitude: 9.18293,
      timestamp: Date.now()
    }
  });

  const handleSavePreferences = async (newTemplate: AlertTemplateId, newLang: Language) => {
    if (!user?.uid) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        alertMessageTemplate: newTemplate,
        alertMessageLanguage: newLang,
        alertConfigUpdatedAt: Date.now()
      });
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = (id: AlertTemplateId) => {
    setSelectedTemplate(id);
    handleSavePreferences(id, selectedMsgLang);
  };

  const handleSelectMsgLang = (lang: Language) => {
    setSelectedMsgLang(lang);
    handleSavePreferences(selectedTemplate, lang);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTemplateIcon = (id: AlertTemplateId) => {
    switch (id) {
      case 'medical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'discreet':
        return <HeartHandshake className="w-5 h-5 text-blue-600" />;
      case 'vault_legal':
        return <Lock className="w-5 h-5 text-amber-600" />;
      case 'outdoor_travel':
        return <Compass className="w-5 h-5 text-emerald-600" />;
      case 'standard':
      default:
        return <ShieldAlert className="w-5 h-5 text-[#E63946]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-[#E63946]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h3 className="text-lg sm:text-xl font-heading font-semibold text-[#2B2D42]">
              Notfall-Nachricht & Vorlagenauswahl
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#8D99AE] mt-1">
            Wählen Sie aus 5 vorgefertigten Vorlagen und bestimmen Sie die Zielsprache, in der Angehörige benachrichtigt werden.
          </p>
        </div>

        {/* Live Saving Status Pill */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Check className="w-3.5 h-3.5" />
              In Cloud gespeichert
            </motion.span>
          )}
          {isSaving && (
            <span className="text-xs text-[#8D99AE] animate-pulse">
              Wird synchronisiert...
            </span>
          )}
        </div>
      </div>

      {/* 1. Target Message Language Selector (5 Dispatch Languages) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#E63946]" />
            <h4 className="font-heading font-semibold text-xs sm:text-sm text-[#2B2D42] uppercase tracking-wider">
              1. Zielsprache der Notfall-Nachricht an Kontakte
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-[#8D99AE]">
            Unabhängig von Ihrer App-Sprache
          </span>
        </div>

        <p className="text-xs text-[#8D99AE] leading-relaxed">
          In welcher Sprache sollen Ihre Notfallkontakte alarmiert werden? (z. B. hilfreich, wenn Ihre Familie oder Notfallkontakte im Ausland leben):
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
          {SUPPORTED_LANGUAGES.map((langItem) => {
            const isSelected = selectedMsgLang === langItem.code;
            return (
              <button
                key={langItem.code}
                type="button"
                onClick={() => handleSelectMsgLang(langItem.code)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'border-[#E63946] bg-rose-50/70 text-[#E63946] ring-2 ring-[#E63946]/20 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-[#2B2D42]'
                }`}
              >
                <span className="text-2xl mb-1">{langItem.flag}</span>
                <span className="text-xs font-extrabold">{langItem.nativeName}</span>
                <span className="text-[10px] text-[#8D99AE]">{langItem.name}</span>
                {isSelected && (
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[#E63946] font-bold">
                    <Check className="w-3 h-3" /> Gewählt
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Template Selection (5 Distinct Templates) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#E63946]" />
            <h4 className="font-heading font-semibold text-xs sm:text-sm text-[#2B2D42] uppercase tracking-wider">
              2. Auswahl aus 5 Vorlagen für den Notfall
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-[#8D99AE]">
            5 spezialisierte Szenarien
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ALERT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            const title = tmpl.name[currentLang] || tmpl.name['de'];
            const description = tmpl.description[currentLang] || tmpl.description['de'];
            const recommended = tmpl.recommendedFor[currentLang] || tmpl.recommendedFor['de'];
            const badge = tmpl.badge[currentLang] || tmpl.badge['de'];
            const category = tmpl.category[currentLang] || tmpl.category['de'];

            return (
              <motion.div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-[#E63946] bg-white ring-4 ring-[#E63946]/10 shadow-md'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {getTemplateIcon(tmpl.id)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#8D99AE]">
                          {category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tmpl.id === 'medical'
                            ? 'bg-red-100 text-red-700'
                            : tmpl.id === 'discreet'
                            ? 'bg-blue-100 text-blue-700'
                            : tmpl.id === 'vault_legal'
                            ? 'bg-amber-100 text-amber-800'
                            : tmpl.id === 'outdoor_travel'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-[#E63946]'
                        }`}>
                          {badge}
                        </span>
                      </div>
                      <h4 className="font-heading font-semibold text-sm sm:text-base text-[#2B2D42]">
                        {title}
                      </h4>
                      <p className="text-xs text-[#8D99AE] mt-1 leading-relaxed">
                        {description}
                      </p>
                      <div className="mt-2 text-[11px] font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
                        <span><strong>Empfohlen für:</strong> {recommended}</span>
                      </div>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div className="shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#E63946] bg-[#E63946]' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Preview of the Formatted Message */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E63946]" />
            <h4 className="font-heading font-semibold text-xs sm:text-sm text-[#2B2D42]">
              Echtzeit-Vorschau der formatierten Notfall-Nachricht
            </h4>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs font-semibold text-[#E63946] hover:text-[#9A031E] flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono text-[#2B2D42] leading-relaxed select-all">
          {previewText}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8D99AE] pt-1">
          <span>✓ Automatische Platzhalter: Name ({userName}), Live-GPS-Koordinaten & Zeitstempel</span>
          <span>Wird via Cloud & Offline-SMS verwendet</span>
        </div>
      </div>
    </div>
  );
}

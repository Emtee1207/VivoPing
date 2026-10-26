import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Scale, 
  Smartphone, 
  Accessibility, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert 
} from 'lucide-react';
import { Language, getTranslation } from '../../i18n';
import {
  ProtectedImpressumCards,
  ProtectedEmailButton,
  ProtectedPhoneButton,
  AntiScrapeText,
  useDecodedContact,
} from './ProtectedContact';

export type LegalTab = 'impressum' | 'privacy' | 'terms' | 'appstore' | 'accessibility' | 'disclaimer' | 'withdrawal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  lang: Language;
}

export default function LegalModal({ isOpen, onClose, initialTab = 'impressum', lang }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const t = getTranslation(lang);
  const contact = useDecodedContact();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="legal-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 id="legal-modal-title" className="text-xl font-extrabold text-slate-900">
                  {t.sectionLegal}
                </h2>
                <p className="text-xs text-slate-500">
                  Transparenz, Datenschutz & gesetzliche Pflichtangaben (DSGVO, BFSG, DDG)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Schließen"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 overflow-x-auto text-xs font-bold scrollbar-none">
            <TabBtn 
              active={activeTab === 'impressum'} 
              onClick={() => setActiveTab('impressum')}
              icon={<FileText className="w-3.5 h-3.5" />}
              label="Impressum"
            />
            <TabBtn 
              active={activeTab === 'privacy'} 
              onClick={() => setActiveTab('privacy')}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label="Datenschutz (DSGVO)"
            />
            <TabBtn 
              active={activeTab === 'terms'} 
              onClick={() => setActiveTab('terms')}
              icon={<Scale className="w-3.5 h-3.5" />}
              label="AGB & EULA"
            />
            <TabBtn 
              active={activeTab === 'appstore'} 
              onClick={() => setActiveTab('appstore')}
              icon={<Smartphone className="w-3.5 h-3.5" />}
              label="Play Store & PWA"
            />
            <TabBtn 
              active={activeTab === 'accessibility'} 
              onClick={() => setActiveTab('accessibility')}
              icon={<Accessibility className="w-3.5 h-3.5" />}
              label="Barrierefreiheit (BFSG)"
            />
            <TabBtn 
              active={activeTab === 'disclaimer'} 
              onClick={() => setActiveTab('disclaimer')}
              icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
              label="Medizin-Haftungsausschluss (112)"
            />
            <TabBtn 
              active={activeTab === 'withdrawal'} 
              onClick={() => setActiveTab('withdrawal')}
              icon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
              label="Widerrufsbelehrung"
            />
          </div>

          {/* Tab Content Area */}
          <div
            data-nosnippet="true"
            className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-600 focus:outline-none"
          >
            
            {/* TAB 1: IMPRESSUM */}
            {activeTab === 'impressum' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Impressum & Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gültig für die Web-Applikation (PWA) sowie mobile Android-Applikationen von VivoPing
                  </p>
                </div>

                <ProtectedImpressumCards />

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
                  </h4>
                  <p className="select-none">
                    <AntiScrapeText text={`${contact.name}, ${contact.street}, ${contact.city}`} />, Deutschland.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Verbraucherstreitbeilegung / Universalschlichtungsstelle
                  </h4>
                  <p className="text-xs text-slate-500">
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer" className="text-indigo-600 underline ml-1">
                      https://ec.europa.eu/consumers/odr/
                    </a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Datenschutzerklärung (Privacy Policy)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Standardgemäß konform mit DSGVO (GDPR), CCPA und Google Play Data Safety
                  </p>
                </div>

                {/* Section 1: Overview */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">1. Verantwortlicher</h4>
                  <p className="select-none">
                    Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO):<br />
                    <strong><AntiScrapeText text={contact.name} /></strong>, <AntiScrapeText text={contact.street} />, <AntiScrapeText text={contact.city} />, Deutschland.<br />
                    E-Mail: <ProtectedEmailButton />, <ProtectedPhoneButton />.
                  </p>
                </div>

                {/* Section 2: Data collected */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    2. Welche Nutzer-Daten werden erhoben?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    LifeGuard erhebt ausschließlich Daten, die für die Bereitstellung des Dead Man's Switch Notfall- und Nachlasssystems technisch zwingend erforderlich sind:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                    <li>
                      <strong>Kontodaten & Authentifizierung:</strong> Google Benutzer-ID (UID), E-Mail-Adresse und Anzeigename zur Identifikation und geräteübergreifenden Synchronisation.
                    </li>
                    <li>
                      <strong>Check-in Zeitstempel & Status:</strong> Datum und Uhrzeit der letzten Bestätigung ("Ich bin wohlauf"), Status (Aktiv, Ausstehend, Notfall ausgelöst).
                    </li>
                    <li>
                      <strong>Echtzeit-Standortdaten (Präzise GPS-Koordinaten):</strong> Breitengrad, Längengrad und Zeitstempel. Diese werden nur bei aktiver App erhoben und ausschließlich im verifizierten Notfall an Ihre hinterlegten Notfallkontakte freigegeben.
                    </li>
                    <li>
                      <strong>Notfallkontakte:</strong> Name, E-Mail-Adresse, Telefonnummer und Beziehungsbezeichnung der Personen, die bei Nichtreagieren benachrichtigt werden sollen.
                    </li>
                    <li>
                      <strong>Digitaler Tresor (Passwörter, Versicherungspolicen, Anweisungen):</strong> Vom Nutzer selbst eingegebene vertrauliche Nachlassdaten.
                    </li>
                  </ul>
                </div>

                {/* Section 3: Third parties */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">3. Eingesetzte Drittanbieter-Tools & Auftragsverarbeiter</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900">Google Firebase Authentication</p>
                      <p className="text-slate-500">Google Ireland Ltd. / Google LLC</p>
                      <p className="text-slate-600">Zweck: Sichere Benutzeranmeldung, Token-Prüfung, Sitzungsverwaltung.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900">Google Cloud Firestore</p>
                      <p className="text-slate-500">Region: Europe-West1 (Frankfurt/Belgien)</p>
                      <p className="text-slate-600">Zweck: Verschlüsselte Speicherung von Check-ins, Kontakten und Tresorwerten.</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Your rights */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">4. Ihre Rechte nach der DSGVO</h4>
                  <p className="text-xs text-slate-600">
                    Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), 
                    <strong>Löschung / "Recht auf Vergessenwerden" (Art. 17 DSGVO)</strong>, Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie Datenübertragbarkeit (Art. 20 DSGVO).
                    Eine vollständige Kontolöschung ist direkt in den Einstellungen mit einem Klick möglich.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TERMS OF SERVICE / EULA */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Allgemeine Geschäftsbedingungen (AGB) & Endbenutzer-Lizenzvertrag (EULA)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Standard-Nutzungsbedingungen für webbasierte und mobile Softwareapplikationen
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    WICHTIGER SICHERHEITSHINWEIS & HAFTUNGSAUSSCHLUSS
                  </div>
                  <p className="leading-relaxed">
                    LifeGuard ist ein privates Überwachungs- und Benachrichtigungswerkzeug ("Dead Man's Switch") zur Unterstützung Ihrer persönlichen Notfallvorsorge. 
                    <strong> LifeGuard ist KEIN behördlicher Rettungsdienst und ersetzt keinesfalls den amtlichen Notruf (112 in Europa, 911 in Nordamerika).</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">§ 1 Vertragsgegenstand & Lizenz</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Der Anbieter gewährt dem Nutzer eine persönliche, nicht-exklusive, nicht übertragbare Lizenz zur Nutzung der App VivoPing auf kompatiblen Endgeräten (Web, PWA, Android).
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">§ 2 Pflichten des Nutzers</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Der Nutzer ist dafür verantwortlich, stets aktuelle und gültige Kontaktdaten seiner Notfallkontakte zu pflegen und sicherzustellen, dass die ausgewählten Personen vorab über ihre Benennung als Notfallkontakt informiert wurden.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">§ 3 Technische Verfügbarkeit</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Die Auslösung von Warnungen und die Ermittlung des Standorts hängen von Faktoren außerhalb des Einflussbereichs des Anbieters ab (Mobilfunkabdeckung, Akkustand, GPS-Satellitensignal, Betriebssystem-Ruhezustand). Eine unterbrechungsfreie Funktion zu 100% kann technisch nicht garantiert werden.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">§ 4 Kündigung & Kontolöschung</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Der Nutzer kann das Vertragsverhältnis jederzeit fristlos beenden, indem er sein Konto und sämtliche gespeicherte Daten über das Konfigurationsmenü löscht.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: GOOGLE PLAY & PWA GUIDELINES */}
            {activeTab === 'appstore' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Plattform- & Store-Richtlinien (Google Play & Progressive Web App)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Spezifische Konformitätsnachweiserklärungen für Web/PWA und Android (Google Play)
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Google Play Account Deletion & GDPR Art. 17 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        DSGVO Art. 17 & Google Play Account Deletion Policy
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Konform
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nutzer können ihr Konto und sämtliche zugehörigen Daten jederzeit direkt innerhalb der App löschen. VivoPing bietet im Menüpunkt „Gefahrenzone“ eine sofortige, vollständige und unwiderrufliche Kontolöschung inklusive aller Server-Datensätze.
                    </p>
                  </div>

                  {/* Google Play Background Location */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Google Play Data Safety & Hintergrund-Standortfreigabe
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Konform
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Standortdaten werden nur zur Erfüllung der Kernfunktion („Dead Man&apos;s Switch Rettungsort für Notfallkontakte“) abgefragt. Vor Aktivierung erfolgt eine prominente In-App-Erklärung („Prominent Disclosure“). Es erfolgt kein Verkauf an Datenbroker oder Werbenetzwerke.
                    </p>
                  </div>

                  {/* Progressive Web App (PWA) Distribution */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Progressive Web App (PWA) & Direkt-Installation
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Aktiv
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      VivoPing kann direkt über den Webbrowser als eigenständige Progressive Web App (PWA) ohne kostenpflichtigen Drittanbieter-Store auf dem Startbildschirm installiert werden. Eine Veröffentlichung im Apple App Store ist derzeit deaktiviert.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ACCESSIBILITY (BFSG) */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Erklärung zur digitalen Barrierefreiheit (BFSG / WCAG 2.1 AA)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gemäß Barrierefreiheitsstärkungsgesetz (BFSG) und Europäischer Norm EN 301 549
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-2 text-xs">
                  <p className="leading-relaxed">
                    LifeGuard ist bestrebt, seine digitalen Dienste im Einklang mit dem Barrierefreiheitsstärkungsgesetz (BFSG) sowie den Richtlinien für barrierefreie Webinhalte (WCAG 2.1 auf Konformitätsstufe AA) zugänglich zu gestalten.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Umgesetzte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                    <li>
                      <strong>Farbunabhängige Informationsvermittlung:</strong> Statusleuchten (Aktiv, Ausstehend, Notfall) verwenden neben Farben eindeutige Textkennzeichnungen, Symbole und ARIA-Labels für Screenreader.
                    </li>
                    <li>
                      <strong>Hoher Kontrastmodus:</strong> In den Einstellungen aktivierbare Option zur Erhöhung aller Farbkontraste auf ein Mindestverhältnis von 4,5:1 (Großtext 3:1).
                    </li>
                    <li>
                      <strong>Schriftgrößen-Skalierung:</strong> Integrierte Schriftgrößenanpassung für barrierefreie Lesbarkeit bei Sehschwäche.
                    </li>
                    <li>
                      <strong>Tastaturbedienbarkeit & Fokus:</strong> Vollständige Navigation über Tab-Taste mit deutlich sichtbarem Tastaturfokus (`focus-visible:ring-2`).
                    </li>
                    <li>
                      <strong>Semantische HTML-Struktur:</strong> Korrekte Verwendung von `role="dialog"`, `aria-live` für Statuswechsel und `aria-modal`.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm">Feedback & Kontakt zur Barrierefreiheit</h4>
                  <p className="text-xs text-slate-600">
                    Sollten Ihnen Barrieren auffallen, wenden Sie sich bitte an <AntiScrapeText text={contact.name} /> unter <ProtectedEmailButton /> (<ProtectedPhoneButton />).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: MEDIZINPRODUKTE- & 112-HAFTUNGSAUSSCHLUSS */}
            {activeTab === 'disclaimer' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-950">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Wichtiger rechtlicher Hinweis & Notruf-Abgrenzung</h4>
                    <p className="text-xs mt-1 leading-relaxed">
                      VivoPing ist kein Medizinprodukt im Sinne der EU-Verordnung 2017/745 (MDR) und kein behördlich zertifizierter Hausnotruf nach DIN VDE 0825 / DIN EN 50134.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">1. Ausschluss medizinischer Notfallrettung</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    VivoPing dient ausschließlich als softwaregestützte Lebenszeichen-Überwachung für private Vorsorgezwecke. Die App ersetzt zu keinem Zeitpunkt den behördlichen Notruf (112 in Deutschland/EU, 911 in den USA) und steht in keiner Verbindung zu Leitstellen von Feuerwehr, Rettungsdienst oder Polizei.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">2. Keine Funktions- oder Rettungsgarantie</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Die ordnungsgemäße Auslösung des Alarms setzt ein eingeschaltetes Endgerät, Netzabdeckung (Mobilfunk oder WLAN), verfügbares GPS-Signal sowie aktive Akkuleistung voraus. Der Betreiber übernimmt keine Haftung für Schäden, die durch Verzögerungen, Netzausfälle der Mobilfunkbetreiber oder Fehlbedienung entstehen.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">3. Pflichten des Nutzers</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Der Nutzer verpflichtet sich, seine Notfallkontakte vorab über deren Benennung zu informieren und sicherzustellen, dass die hinterlegten Kontaktdaten (Telefonnummer, E-Mail) stets aktuell sind.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 7: WIDERRUFSBELEHRUNG FÜR DIGITALE DIENSTLEISTUNGEN */}
            {activeTab === 'withdrawal' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Widerrufsbelehrung & Muster-Widerrufsformular
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gesetzliche Verbraucherinformationen gemäß § 312g BGB i.V.m. Art. 246a EGBGB
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Widerrufsrecht</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed select-none">
                    Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (<AntiScrapeText text={`${contact.name}, ${contact.street}, ${contact.city}`} />, E-Mail: <ProtectedEmailButton />, <ProtectedPhoneButton />) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss informieren.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Vorzeitiges Erlöschen des Widerrufsrechts</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Das Widerrufsrecht erlischt bei einem Vertrag über die Bereitstellung von nicht auf einem körperlichen Datenträger befindlichen digitalen Dienstleistungen, wenn der Unternehmer mit der Ausführung des Vertrags begonnen hat, nachdem der Verbraucher ausdrücklich zugestimmt hat und seine Kenntnis davon bestätigt hat, dass er hierdurch sein Widerrufsrecht verliert.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Muster-Widerrufsformular
                  </h4>
                  <div className="text-xs font-mono text-slate-600 leading-relaxed p-3 bg-white rounded-xl border border-slate-200 select-none">
                    An: <AntiScrapeText text={`${contact.name}, ${contact.street}, ${contact.city}`} />, E-Mail: <AntiScrapeText text={contact.email} /><br /><br />
                    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: VivoPing Notfallvorsorge<br />
                    Bestellt am (*)/erhalten am (*): ______________________<br />
                    Name des/der Verbraucher(s): ______________________<br />
                    Anschrift des/der Verbraucher(s): ______________________<br />
                    Datum / Unterschrift: ______________________
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 select-none">
              Gesetzliche Pflichtangaben (§ 5 DDG) • Anti-Scraping geschützt
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
        active 
          ? 'bg-white text-indigo-700 shadow-sm font-extrabold' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

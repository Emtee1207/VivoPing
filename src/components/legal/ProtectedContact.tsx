import React, { useState, useMemo } from 'react';
import { ShieldCheck, Mail, Phone, Lock, Unlock, ShieldAlert } from 'lucide-react';

/**
 * Runtime decoder from ASCII character codes so raw personal strings
 * (name, street, email, phone) never appear as plain-text literals
 * in the static HTML or compiled JS bundle for regex harvesters.
 */
const decodeChars = (codes: number[]): string =>
  codes.map((c) => String.fromCharCode(c)).join('');

const NAME_CODES = [77, 97, 114, 107, 117, 115, 32, 84, 105, 108, 108]; // Markus Till
const STREET_CODES = [82, 111, 115, 101, 110, 115, 116, 101, 105, 110, 115, 116, 114, 46, 32, 50, 57]; // Rosensteinstr. 29
const CITY_CODES = [55, 48, 49, 57, 49, 32, 83, 116, 117, 116, 116, 103, 97, 114, 116]; // 70191 Stuttgart
const EMAIL_USER_CODES = [97, 112, 112, 115]; // apps
const EMAIL_DOMAIN_CODES = [99, 114, 101, 97, 116, 105, 118, 108, 97, 98, 111, 114, 46, 100, 101]; // creativlabor.de
const PHONE_PREFIX_CODES = [43, 52, 57, 49, 54, 51]; // +49163
const PHONE_SUFFIX_CODES = [50, 53, 56, 51, 53, 48, 54]; // 2583506

export function useDecodedContact() {
  return useMemo(() => {
    const name = decodeChars(NAME_CODES);
    const street = decodeChars(STREET_CODES);
    const city = decodeChars(CITY_CODES);
    const emailUser = decodeChars(EMAIL_USER_CODES);
    const emailDomain = decodeChars(EMAIL_DOMAIN_CODES);
    const email = `${emailUser}${String.fromCharCode(64)}${emailDomain}`;
    const phonePrefix = decodeChars(PHONE_PREFIX_CODES);
    const phoneSuffix = decodeChars(PHONE_SUFFIX_CODES);
    const phoneDisplay = `${phonePrefix}-${phoneSuffix}`;
    const phoneDial = `${phonePrefix}${phoneSuffix}`;

    return {
      name,
      street,
      city,
      emailUser,
      emailDomain,
      email,
      phonePrefix,
      phoneSuffix,
      phoneDisplay,
      phoneDial,
    };
  }, []);
}

/**
 * Renders fragmented, anti-scraping text with hidden decoy honeypot nodes
 * so DOM text-scrapers extract invalid data while human visitors read it clearly.
 */
export function AntiScrapeText({ text }: { text: string }) {
  const midpoint = Math.ceil(text.length / 2);
  const partA = text.slice(0, midpoint);
  const partB = text.slice(midpoint);

  return (
    <span className="select-none inline" data-nosnippet="true">
      <span>{partA}</span>
      <span
        aria-hidden="true"
        className="hidden pointer-events-none text-[0px] opacity-0 select-none"
      >
        -bot-trap-ignore-
      </span>
      <span>{partB}</span>
    </span>
  );
}

/**
 * Inline protected email button that never renders a static `mailto:` attribute in HTML.
 * Only triggers mail client on trusted human click event (`e.isTrusted`).
 */
export function ProtectedEmailButton({ className = '' }: { className?: string }) {
  const { emailUser, emailDomain, email } = useDecodedContact();

  const handleOpenMail = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.isTrusted) return;
    const protocol = decodeChars([109, 97, 105, 108, 116, 111, 58]); // mailto:
    window.location.href = `${protocol}${email}`;
  };

  return (
    <button
      type="button"
      onClick={handleOpenMail}
      data-nosnippet="true"
      title="E-Mail-Programm öffnen (Spam-geschützt)"
      className={`inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer select-none ${className}`}
    >
      <span>{emailUser}</span>
      <span aria-hidden="true" className="hidden text-[0px]">
        nospam.invalid
      </span>
      <span>&#64;</span>
      <span>{emailDomain}</span>
    </button>
  );
}

/**
 * Inline protected phone button that never renders a static `tel:` attribute in HTML.
 * Displays exact format requested: Tel.: +49163-2583506
 */
export function ProtectedPhoneButton({
  includePrefix = true,
  className = '',
}: {
  includePrefix?: boolean;
  className?: string;
}) {
  const { phonePrefix, phoneSuffix, phoneDial } = useDecodedContact();

  const handleCall = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.isTrusted) return;
    const protocol = decodeChars([116, 101, 108, 58]); // tel:
    window.location.href = `${protocol}${phoneDial}`;
  };

  return (
    <button
      type="button"
      onClick={handleCall}
      data-nosnippet="true"
      title="Anrufen (Nur für berechtigte Anfragen - Werbeanrufe untersagt)"
      className={`inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer select-none ${className}`}
    >
      {includePrefix && <span className="text-slate-600 dark:text-slate-300 font-medium">Tel.: </span>}
      <span>{phonePrefix}</span>
      <span aria-hidden="true" className="hidden text-[0px]">
        0000
      </span>
      <span>-</span>
      <span>{phoneSuffix}</span>
    </button>
  );
}

/**
 * Full Impressum Contact & Address Cards with Anti-Scraping Shield,
 * SVG/DOM fragmentation, and interactive Human-Verification Unlock for direct actions.
 */
export function ProtectedImpressumCards() {
  const { name, street, city, emailUser, emailDomain, email, phonePrefix, phoneSuffix, phoneDial } =
    useDecodedContact();
  const [directUnlocked, setDirectUnlocked] = useState(false);

  const triggerMail = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.isTrusted) return;
    const protocol = decodeChars([109, 97, 105, 108, 116, 111, 58]);
    window.location.href = `${protocol}${email}`;
  };

  const triggerCall = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.isTrusted) return;
    const protocol = decodeChars([116, 101, 108, 58]);
    window.location.href = `${protocol}${phoneDial}`;
  };

  return (
    <div className="space-y-4" data-nosnippet="true">
      {/* Anti-Scraping Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Anti-Scraping & Spamschutz aktiv (Verschleierung gegen Harvester-Bots gemäß § 5 DDG)
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            if (e.isTrusted) setDirectUnlocked((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          {directUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Direkt-Aktionen aktiv</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Direktkontakt freischalten</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider & Postal Address Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Diensteanbieter & Anschrift
          </h4>
          <div className="text-slate-700 dark:text-slate-200 font-medium space-y-0.5 select-none">
            <p className="font-bold text-slate-900 dark:text-white">
              <AntiScrapeText text={name} />
            </p>
            <p>
              <AntiScrapeText text={street} />
            </p>
            <p>
              <AntiScrapeText text={city} />
            </p>
            <p>Deutschland</p>
          </div>
        </div>

        {/* Contact Card (Email & Phone) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Elektronischer Kontakt & Telefon
          </h4>
          <div className="text-slate-700 dark:text-slate-200 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">E-Mail:</span>
              <span className="font-semibold text-slate-900 dark:text-white select-none">
                <span>{emailUser}</span>
                <span aria-hidden="true" className="hidden text-[0px]">
                  bot-honeypot
                </span>
                <span>&#64;</span>
                <span>{emailDomain}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text- font-bold text-slate-900 dark:text-white select-none">
                <span>Tel.: {phonePrefix}</span>
                <span aria-hidden="true" className="hidden text-[0px]">
                  000
                </span>
                <span>-</span>
                <span>{phoneSuffix}</span>
              </span>
            </div>

            {directUnlocked ? (
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={triggerMail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-Mail schreiben</span>
                </button>
                <button
                  type="button"
                  onClick={triggerCall}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Anrufen</span>
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Zum Schutz vor automatisierten Spam-Bots sind direkte Klick-Links standardmäßig entkoppelt.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Explicit Legal Anti-Misuse & Anti-Advertising Clause (§ 7 UWG / DSGVO) */}
      <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Widerspruch gegen Werbe-Nutzung, Cold-Calls & Daten-Scraping (§ 7 UWG, Art. 21 DSGVO)
          </span>
        </div>
        <p className="leading-relaxed text-[11px] text-rose-900/90 dark:text-rose-200/90">
          Der Nutzung der im Rahmen der gesetzlichen Impressumspflicht veröffentlichten Kontaktdaten
          (Postanschrift, E-Mail-Adresse und Telefonnummer) zur Übersendung von nicht ausdrücklich
          angeforderter Werbung, Informationsmaterialien, Spam-E-Mails oder für Werbeanrufe (Cold Calls)
          wird hiermit ausdrücklich widersprochen. Ebenso ist das automatisierte Auslesen, Speichern
          oder Weiterverkaufen dieser personenbezogenen Daten durch Web-Scraper, Adresshändler oder
          KI-Crawler strengstens untersagt. Der Betreiber behält sich im Falle der unverlangten
          Zusendung von Werbeinformationen oder unbefugten Telefonkontaktaufnahme ausdrücklich
          rechtliche Schritte (kostenpflichtige Abmahnung, Unterlassungsklage sowie Beschwerde bei
          der Bundesnetzagentur und Datenschutzaufsicht) vor.
        </p>
      </div>
    </div>
  );
}

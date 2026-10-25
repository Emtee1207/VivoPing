import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  UserPlus, 
  ShieldCheck, 
  Layers, 
  MessageSquare, 
  FileCheck, 
  X,
  Send,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import OfflineSMSDispatcher from './OfflineSMSDispatcher';
import AlertMessageConfigurator from './AlertMessageConfigurator';
import { ALERT_TEMPLATES } from '../alertTemplates';

export default function ContactsManager({ 
  user, 
  userData, 
  lang = 'de' 
}: { 
  user: any; 
  userData?: any; 
  lang?: Language;
}) {
  const t = getTranslation(lang);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [dsgvoConsent, setDsgvoConsent] = useState(false);
  const [invitationContact, setInvitationContact] = useState<any | null>(null);
  const [newContact, setNewContact] = useState<{
    name: string;
    email: string;
    phone: string;
    relation: string;
    priority: number;
  }>({ name: '', email: '', phone: '', relation: '', priority: 1 });
  const [smsTestOpen, setSmsTestOpen] = useState(false);

  useEffect(() => {
    const contactsRef = collection(db, 'users', user.uid, 'contacts');
    const unsub = onSnapshot(contactsRef, (snap) => {
      setContacts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/contacts`));

    return () => unsub();
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsgvoConsent) {
      alert("Bitte bestätigen Sie die datenschutzrechtliche Zusicherung nach Art. 6 DSGVO.");
      return;
    }
    try {
      const contactsRef = collection(db, 'users', user.uid, 'contacts');
      await addDoc(contactsRef, {
        ...newContact,
        priority: Number(newContact.priority) || 1,
        verified: false,
        dsgvoConfirmedAt: Date.now(),
        createdAt: Date.now(),
      });
      setNewContact({ name: '', email: '', phone: '', relation: '', priority: 1 });
      setDsgvoConsent(false);
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/contacts`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contacts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/contacts/${id}`);
    }
  };

  // Sort contacts by priority (1 -> 2 -> 3)
  const sortedContacts = [...contacts].sort((a, b) => (a.priority || 1) - (b.priority || 1));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-[#2B2D42]">{t.contactsHeaderTitle}</h2>
          <p className="text-[#8D99AE] text-sm">{t.contactsHeaderSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#2B2D42] hover:text-[#E63946] hover:border-[#E63946]/40 shadow-xs transition-all cursor-pointer"
            title="Notfallnachricht & Vorlage anpassen"
          >
            <FileCheck className="w-4 h-4 text-[#E63946]" />
            <span>Notfall-Vorlage & Sprache</span>
          </button>
          <button
            onClick={() => setSmsTestOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#2B2D42] hover:text-[#E63946] hover:border-[#E63946]/40 shadow-xs transition-all cursor-pointer"
            title="Offline-SMS-Fallback testen"
          >
            <MessageSquare className="w-4 h-4 text-[#E63946]" />
            <span>{t.testSmsBtn}</span>
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#E63946] text-white p-3 rounded-2xl hover:bg-[#d62839] active:bg-[#9A031E] transition-all shadow-lg shadow-[#E63946]/25 cursor-pointer"
            aria-label={showAdd ? 'Abbrechen' : 'Kontakt hinzufügen'}
          >
            {showAdd ? <Trash2 className="w-5 h-5 rotate-45" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Escalation Matrix Explainer Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-[#E63946]" />
          <h3 className="font-heading font-semibold text-sm text-[#2B2D42]">{t.escalationTitle}</h3>
        </div>
        <p className="text-xs text-[#8D99AE] leading-relaxed mb-3">
          {t.escalationDesc}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5">
            <span className="font-bold text-[#E63946] block text-[11px] uppercase tracking-wider mb-0.5">
              1. Engster Kreis (0h)
            </span>
            <span className="text-[#2B2D42] text-[11px]">
              Wird sofort bei Ablauf der 24h Pufferfrist alarmiert (z.B. Partner, Eltern).
            </span>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5">
            <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider mb-0.5">
              2. Erweiterter Kreis (+3h)
            </span>
            <span className="text-[#2B2D42] text-[11px]">
              Eskaliert nach 3 weiteren Stunden ohne Reaktion (z.B. Geschwister, Freunde).
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
              3. Externe / Notdienste (+12h)
            </span>
            <span className="text-[#2B2D42] text-[11px]">
              Eskaliert nach 12 Stunden ohne Rückmeldung (z.B. Vermieter, Hausarzt).
            </span>
          </div>
        </div>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder={t.nameLabel}
                className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
              />
              <input
                required
                type="email"
                placeholder={t.emailLabel}
                className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                value={newContact.email}
                onChange={e => setNewContact({...newContact, email: e.target.value})}
              />
              <input
                placeholder={t.phoneLabel}
                className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                value={newContact.phone}
                onChange={e => setNewContact({...newContact, phone: e.target.value})}
              />
              <input
                placeholder={t.relationLabel}
                className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                value={newContact.relation}
                onChange={e => setNewContact({...newContact, relation: e.target.value})}
              />
            </div>

            {/* Priority Selector (Stufenweise Eskalationsmatrix) */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#2B2D42] uppercase tracking-wider block">
                {t.priorityLabel} (Stufenweise Eskalationsmatrix)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewContact({ ...newContact, priority: 1 })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    newContact.priority === 1
                      ? 'border-[#E63946] bg-rose-50/70 text-[#E63946] ring-2 ring-[#E63946]/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">Prio 1: Engster Kreis</div>
                  <div className="text-[10px] text-[#8D99AE] mt-0.5">Sofort bei Fristablauf (0h)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewContact({ ...newContact, priority: 2 })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    newContact.priority === 2
                      ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">Prio 2: Erweiterter Kreis</div>
                  <div className="text-[10px] text-[#8D99AE] mt-0.5">Eskalation nach +3 Stunden</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewContact({ ...newContact, priority: 3 })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    newContact.priority === 3
                      ? 'border-[#2B2D42] bg-slate-100 text-[#2B2D42] ring-2 ring-slate-400/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">Prio 3: Externe / Behelf</div>
                  <div className="text-[10px] text-[#8D99AE] mt-0.5">Eskalation nach +12 Stunden</div>
                </button>
              </div>
            </div>

            {/* Art. 6 DSGVO Consent Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={dsgvoConsent}
                  onChange={(e) => setDsgvoConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#E63946] focus:ring-[#E63946]"
                />
                <span className="text-xs text-[#2B2D42] leading-relaxed">
                  <strong>Datenschutz-Zusicherung (Art. 6 DSGVO):</strong> Ich versichere, dass die genannte Vertrauensperson über die Speicherung ihrer Kontaktdaten und die Benachrichtigung im Notfall vorab informiert wurde und zugestimmt hat.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!dsgvoConsent}
              className="w-full bg-[#2B2D42] hover:bg-[#1f2030] disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all cursor-pointer shadow-md"
            >
              {t.contactAddTitle}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Contact Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedContacts.length === 0 && !showAdd && (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <UserPlus className="w-12 h-12 text-[#8D99AE] mx-auto mb-4" />
            <p className="text-[#2B2D42] font-medium">{t.noContactsYet}</p>
            <p className="text-[#8D99AE] text-sm">{t.noContactsSub}</p>
          </div>
        )}
        
        {sortedContacts.map((contact) => {
          const prio = contact.priority || 1;
          const prioBadge = prio === 1 
            ? 'bg-rose-100 text-[#E63946] border-rose-200' 
            : prio === 2 
            ? 'bg-amber-100 text-amber-800 border-amber-200' 
            : 'bg-slate-100 text-slate-700 border-slate-200';
          
          const prioLabel = prio === 1 
            ? t.priority1Short 
            : prio === 2 
            ? t.priority2Short 
            : t.priority3Short;

          return (
            <motion.div
              layout
              key={contact.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#E63946] font-bold text-base shrink-0">
                  {contact.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[#2B2D42] truncate">{contact.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioBadge}`}>
                      {prioLabel}
                    </span>
                    {contact.verified ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verifiziert
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Einladung offen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#E63946] font-bold uppercase tracking-wider mt-0.5">
                    {contact.relation || 'Kontakt'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#8D99AE]">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#8D99AE]" /> {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="flex items-center gap-1 font-mono text-[#2B2D42]">
                        <Phone className="w-3 h-3 text-[#8D99AE]" /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setInvitationContact(contact)}
                  className="p-2 text-slate-400 hover:text-[#E63946] hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title="Einladung & Test-Ping an Kontakt senden"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 text-slate-300 hover:text-[#E63946] hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Kontakt löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <div className="bg-emerald-50 rounded-3xl p-6 flex items-start gap-4 border border-emerald-100">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
        <div className="text-sm text-emerald-800 leading-relaxed">
          <p className="font-bold mb-1">{t.privacyNoticeTitle}</p>
          {t.privacyNoticeDesc}
        </div>
      </div>

      {/* Offline SMS Dispatcher Modal */}
      <OfflineSMSDispatcher
        isOpen={smsTestOpen}
        onClose={() => setSmsTestOpen(false)}
        contacts={contacts}
        userName={user.displayName || user.email?.split('@')[0] || 'VivoPing-Nutzer'}
        lang={lang}
        defaultTemplateId={userData?.alertMessageTemplate || 'standard'}
        defaultMessageLang={userData?.alertMessageLanguage || 'de'}
      />

      {/* Emergency Message Template & Language Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-left text-[#2B2D42] max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-4 right-4 p-2 text-[#8D99AE] hover:text-[#2B2D42] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              <AlertMessageConfigurator
                user={user}
                userData={userData}
                currentLang={lang}
                onSaved={() => {
                  // Keep open or notify
                }}
              />

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#2B2D42] hover:bg-[#1f2030] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Fertig & Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Invitation & Test-Ping Modal */}
      <AnimatePresence>
        {invitationContact && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invitation-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative text-left text-[#2B2D42]"
            >
              <button
                onClick={() => setInvitationContact(null)}
                className="absolute top-4 right-4 p-2 text-[#8D99AE] hover:text-[#2B2D42] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E63946] flex items-center justify-center shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="invitation-modal-title" className="text-lg font-heading font-semibold text-[#2B2D42]">
                    Einladung & Test-Ping an Vertrauensperson
                  </h3>
                  <p className="text-xs text-[#8D99AE] mt-0.5">
                    Informieren Sie {invitationContact.name} vorab über die Rolle als Notfallkontakt (Stufe {invitationContact.priority || 1}).
                  </p>
                </div>
              </div>

              {/* Formatted Text Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Vorbereitete Einladungsnachricht:
                </span>
                <p className="text-xs font-mono text-[#2B2D42] bg-white p-3 rounded-xl border border-slate-200 leading-relaxed select-all">
                  {`[VivoPing Notfallvorsorge] Hallo ${invitationContact.name}, ${user.displayName || 'Ich'} habe Dich bei VivoPing als Notfallkontakt (Stufe ${invitationContact.priority || 1}) hinterlegt. Bei anhaltender Inaktivität wirst Du automatisch per Notruf über meinen Standort und Notfalltresor informiert. Bitte antworte mir kurz zur Bestätigung!`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const text = `[VivoPing Notfallvorsorge] Hallo ${invitationContact.name}, ${user.displayName || 'Ich'} habe Dich bei VivoPing als Notfallkontakt (Stufe ${invitationContact.priority || 1}) hinterlegt. Bei anhaltender Inaktivität wirst Du automatisch per Notruf über meinen Standort und Notfalltresor informiert. Bitte antworte mir kurz zur Bestätigung!`;
                      const phone = (invitationContact.phone || '').replace(/\s+/g, '');
                      window.location.href = `sms:${phone}?body=${encodeURIComponent(text)}`;
                    }}
                    disabled={!invitationContact.phone}
                    className="py-2.5 px-4 rounded-xl bg-[#E63946] hover:bg-[#d62839] active:bg-[#9A031E] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Per SMS einladen</span>
                  </button>

                  <button
                    onClick={() => {
                      const subject = 'VivoPing Notfallkontakt Einladung';
                      const text = `Hallo ${invitationContact.name},\n\nich habe Dich bei VivoPing als Notfallkontakt (Stufe ${invitationContact.priority || 1}) hinterlegt.\n\nBei anhaltender Inaktivität wirst Du automatisch über meinen letzten Standort und freigegebene Notfallunterlagen informiert.\n\nBitte antworte mir kurz auf diese E-Mail, um den Empfang zu bestätigen.\n\nHerzliche Grüße,\n${user.displayName || 'Ich'}`;
                      window.location.href = `mailto:${invitationContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Per E-Mail einladen</span>
                  </button>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'users', user.uid, 'contacts', invitationContact.id), {
                        verified: !invitationContact.verified
                      });
                      setInvitationContact({ ...invitationContact, verified: !invitationContact.verified });
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    invitationContact.verified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {invitationContact.verified
                      ? 'Status: Verifiziert (Klicken zum Zurücksetzen)'
                      : 'Als verifiziert / bestätigt markieren'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

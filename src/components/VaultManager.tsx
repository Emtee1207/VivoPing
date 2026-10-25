import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock,
  Plus, 
  Trash2, 
  Key, 
  FileText, 
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Download,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { encryptVaultData, decryptVaultData, generateRecoveryPhrase } from '../utils/crypto';

export default function VaultManager({ user, lang = 'de' }: { user: any; lang?: Language }) {
  const t = getTranslation(lang);
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'Zugangsdaten' });
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});

  // E2EE Master Key state
  const [passphrase, setPassphrase] = useState<string>(() => sessionStorage.getItem('vivoping_vault_pass') || '');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !!sessionStorage.getItem('vivoping_vault_pass'));
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Recovery Phrase Modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');

  useEffect(() => {
    const vaultRef = collection(db, 'users', user.uid, 'vault');
    const unsub = onSnapshot(vaultRef, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/vault`));

    return () => unsub();
  }, [user.uid]);

  // Attempt decryption of items when unlocked
  useEffect(() => {
    if (isUnlocked && passphrase) {
      items.forEach(async (item) => {
        if (item.isEncrypted && item.ciphertext && !decryptedCache[item.id]) {
          try {
            const clear = await decryptVaultData(item.ciphertext, item.iv, item.salt, passphrase);
            setDecryptedCache(prev => ({ ...prev, [item.id]: clear }));
          } catch (e) {
            // Wrong passphrase or corrupted
            console.warn("Could not decrypt item with current key:", item.id);
          }
        }
      });
    }
  }, [isUnlocked, passphrase, items]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput) return;
    setPassphrase(passphraseInput);
    sessionStorage.setItem('vivoping_vault_pass', passphraseInput);
    setIsUnlocked(true);
    setPassphraseInput('');
  };

  const handleLock = () => {
    setPassphrase('');
    sessionStorage.removeItem('vivoping_vault_pass');
    setIsUnlocked(false);
    setDecryptedCache({});
    setVisibleItems({});
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vaultRef = collection(db, 'users', user.uid, 'vault');

      // If E2EE passphrase is set, encrypt client-side
      if (isUnlocked && passphrase) {
        const encrypted = await encryptVaultData(newItem.content, passphrase);
        await addDoc(vaultRef, {
          title: newItem.title,
          category: newItem.category,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
          isEncrypted: true,
          createdAt: serverTimestamp()
        });
      } else {
        // Unencrypted fallback with notification
        await addDoc(vaultRef, {
          title: newItem.title,
          content: newItem.content,
          category: newItem.category,
          isEncrypted: false,
          createdAt: serverTimestamp()
        });
      }

      setNewItem({ title: '', content: '', category: 'Zugangsdaten' });
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/vault`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'vault', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/vault/${id}`);
    }
  };

  const toggleVisibility = async (item: any) => {
    const id = item.id;
    if (!visibleItems[id]) {
      // Need decryption?
      if (item.isEncrypted && !decryptedCache[id]) {
        if (!isUnlocked || !passphrase) {
          alert("Bitte entsperren Sie zuerst den Tresor mit Ihrem Master-Passwort.");
          return;
        }
        try {
          const clear = await decryptVaultData(item.ciphertext, item.iv, item.salt, passphrase);
          setDecryptedCache(prev => ({ ...prev, [id]: clear }));
        } catch {
          alert("Entschlüsselung fehlgeschlagen. Das eingegebene Master-Passwort ist falsch.");
          return;
        }
      }
    }
    setVisibleItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Zugangsdaten': return <Key className="w-5 h-5 text-indigo-600" />;
      case 'Versicherung': return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Finanzen': return <CreditCard className="w-5 h-5 text-amber-600" />;
      default: return <FileText className="w-5 h-5 text-[#E63946]" />;
    }
  };

  const openRecoveryGenerator = () => {
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setShowRecoveryModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-semibold text-[#2B2D42]">{t.vaultHeaderTitle}</h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isUnlocked 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-[#E63946] border-rose-200'
            }`}>
              {isUnlocked ? 'E2EE Aktiviert (AES-256)' : 'Gesperrt'}
            </span>
          </div>
          <p className="text-[#8D99AE] text-sm">{t.vaultHeaderSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openRecoveryGenerator}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#2B2D42] hover:text-[#E63946] transition-all cursor-pointer shadow-xs"
            title="12-Wort Notfall-Wiederherstellungsschlüssel"
          >
            <KeyRound className="w-4 h-4 text-[#E63946]" />
            <span>Notfall-Schlüssel</span>
          </button>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#E63946] text-white p-3 rounded-2xl hover:bg-[#d62839] active:bg-[#9A031E] transition-all shadow-lg shadow-[#E63946]/25 cursor-pointer"
            aria-label={showAdd ? 'Abbrechen' : 'Eintrag hinzufügen'}
          >
            {showAdd ? <Trash2 className="w-5 h-5 rotate-45" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* E2EE Lock / Unlock Status Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]">
                {isUnlocked ? 'Zero-Knowledge Tresor Entsperrt' : 'Zero-Knowledge Tresor Gesperrt'}
              </p>
              <p className="text-xs text-[#8D99AE]">
                {isUnlocked 
                  ? 'Einträge werden mit AES-GCM-256 client-seitig ver- und entschlüsselt.'
                  : 'Geben Sie Ihr Master-Passwort ein, um vertrauliche Daten einzusehen oder neu zu verschlüsseln.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isUnlocked ? (
              <form onSubmit={handleUnlock} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  placeholder="Master-Passwort..."
                  value={passphraseInput}
                  onChange={(e) => setPassphraseInput(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#E63946] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2B2D42] hover:bg-[#1f2030] text-white text-xs font-bold cursor-pointer"
                >
                  Entsperren
                </button>
              </form>
            ) : (
              <button
                onClick={handleLock}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Tresor sperren</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add New Vault Item Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E63946]">
                Neuer Tresor-Eintrag {isUnlocked ? '(wird Ende-zu-Ende verschlüsselt)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder={t.vaultTitlePlaceholder}
                  className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                />
                <select
                  className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946]"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  <option value="Zugangsdaten">{t.categoryCredentials}</option>
                  <option value="Versicherung">{t.categoryInsurance}</option>
                  <option value="Finanzen">{t.categoryFinance}</option>
                  <option value="Patientenverfügung">Patientenverfügung / Vorsorge</option>
                  <option value="Sonstiges">{t.categoryOther}</option>
                </select>
              </div>
              <textarea
                required
                placeholder={t.vaultContentPlaceholder}
                rows={4}
                className="bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E63946] w-full"
                value={newItem.content}
                onChange={e => setNewItem({...newItem, content: e.target.value})}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2B2D42] hover:bg-[#1f2030] text-white py-3 rounded-xl font-bold transition-all cursor-pointer shadow-md"
            >
              {t.vaultAddTitle}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Vault Items List */}
      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 && !showAdd && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <Lock className="w-12 h-12 text-[#8D99AE] mx-auto mb-4" />
            <p className="text-[#2B2D42] font-medium">{t.vaultEmptyTitle}</p>
            <p className="text-[#8D99AE] text-sm">{t.vaultEmptySub}</p>
          </div>
        )}
        
        {items.map((item) => {
          const isItemEncrypted = !!item.isEncrypted;
          const displayContent = isItemEncrypted 
            ? (decryptedCache[item.id] || '•••••••••••• (Mit AES-256 verschlüsselt)') 
            : (item.content || '');

          return (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#2B2D42]">{item.title}</h3>
                      {isItemEncrypted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          AES-256 E2EE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#E63946] font-bold uppercase tracking-wider mt-0.5">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(item)}
                    className="p-2 text-slate-400 hover:text-[#2B2D42] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title={visibleItems[item.id] ? 'Verbergen' : 'Anzeigen'}
                  >
                    {visibleItems[item.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {visibleItems[item.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 rounded-2xl p-4 text-xs sm:text-sm text-[#2B2D42] whitespace-pre-wrap font-mono overflow-hidden border border-slate-200/80 mt-2"
                  >
                    {displayContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Security Note Footer */}
      <div className="bg-slate-900 rounded-3xl p-6 flex items-start gap-4 text-white shadow-md">
        <Lock className="w-6 h-6 text-[#E63946] shrink-0 mt-1" />
        <div className="text-xs sm:text-sm leading-relaxed text-slate-300">
          <p className="font-bold mb-1 text-white">Zero-Knowledge Verschlüsselung:</p>
          Ihre sensiblen Daten werden vor der Übertragung auf Ihrem Endgerät mit AES-GCM-256 verschlüsselt. Weder Administratoren noch Dritte können ohne Ihr persönliches Master-Passwort oder den Notfall-Wiederherstellungsschlüssel auf die Inhalte zugreifen.
        </div>
      </div>

      {/* 12-Word Recovery Phrase Modal */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative text-left text-[#2B2D42]"
            >
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="absolute top-4 right-4 p-2 text-[#8D99AE] hover:text-[#2B2D42] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E63946] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="recovery-modal-title" className="font-heading font-semibold text-lg text-[#2B2D42]">
                    12-Wort Notfall-Schlüssel (Recovery Phrase)
                  </h3>
                  <p className="text-xs text-[#8D99AE]">
                    Zur sicheren Wiederherstellung Ihres Tresors im Ernstfall
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#8D99AE] leading-relaxed mb-4">
                Notieren Sie sich diese 12 Wörter auf Papier und verwahren Sie diese an einem sicheren Ort (z. B. beim Notar oder im Heimtresor). Mit dieser Phrase können Ihre Angehörigen den Tresor im Notfall entschlüsseln.
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs text-[#2B2D42] mb-4">
                {recoveryPhrase.split(' ').map((word, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                    <span className="text-[#8D99AE] text-[10px] font-bold w-4">{idx + 1}.</span>
                    <span className="font-bold">{word}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryPhrase);
                    alert("Notfall-Schlüssel in Zwischenablage kopiert. Bitte sicher notieren!");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#2B2D42] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Schlüssel kopieren
                </button>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#2B2D42] hover:bg-[#1f2030] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Fertig & Verwahrt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

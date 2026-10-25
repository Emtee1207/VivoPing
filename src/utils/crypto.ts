/**
 * Client-Side Zero-Knowledge End-to-End Encryption (E2EE)
 * Uses Web Crypto API: PBKDF2 (100,000 rounds, SHA-256) + AES-GCM (256-bit)
 * Plaintext never leaves the client unencrypted.
 */

// Converts ArrayBuffer to Base64 string
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Converts Base64 string to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derives a 256-bit AES-GCM CryptoKey from user passphrase and salt via PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  isEncrypted: true;
}

// Encrypts plaintext string using AES-GCM 256
export async function encryptVaultData(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    isEncrypted: true,
  };
}

// Decrypts ciphertext string using AES-GCM 256
export async function decryptVaultData(
  ciphertextBase64: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<string> {
  const dec = new TextDecoder();
  const salt = base64ToBuffer(saltBase64);
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  return dec.decode(decryptedBuffer);
}

// 12-Word Recovery Wordlist for Emergency Vault Recovery
const WORDLIST = [
  'albatros', 'anker', 'berg', 'bruecke', 'diamant', 'echo', 'falke', 'flammen',
  'freiheit', 'felsen', 'gipfel', 'horizont', 'insel', 'jubel', 'kompass', 'kristall',
  'leuchtturm', 'matrix', 'mond', 'nordstern', 'ozean', 'panther', 'quelle', 'rubin',
  'signal', 'sonne', 'sturm', 'titan', 'uranus', 'vulkan', 'wächter', 'zenit'
];

export function generateRecoveryPhrase(): string {
  const array = new Uint32Array(12);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((val) => WORDLIST[val % WORDLIST.length])
    .join(' ');
}

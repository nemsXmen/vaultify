import { gcm } from "@noble/ciphers/aes.js";
import { scryptAsync, type ScryptOpts } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import * as Crypto from "expo-crypto";

const KDF_PARAMS = {
  N: 2 ** 14,
  dkLen: 32,
  p: 1,
  r: 8
} satisfies ScryptOpts;

export type VaultKdf = {
  readonly name: "scrypt";
  readonly N: number;
  readonly dkLen: number;
  readonly p: number;
  readonly r: number;
  readonly salt: string;
};

export type EncryptedVaultDocument = {
  readonly version: 1;
  readonly cipher: "aes-256-gcm";
  readonly kdf: VaultKdf;
  readonly nonce: string;
  readonly ciphertext: string;
};

export type VaultKeyMaterial = {
  readonly key: Uint8Array;
  readonly kdf: VaultKdf;
};

export async function createEncryptedVaultDocument(masterPassword: string, plaintext: string) {
  const salt = await secureRandomBytes(16);
  const kdf: VaultKdf = { ...KDF_PARAMS, name: "scrypt", salt: bytesToHex(salt) };
  const key = await deriveKey(masterPassword, kdf);
  const document = await encryptVaultDocument({ key, kdf }, plaintext);

  return { document, keyMaterial: { key, kdf } };
}

export async function decryptVaultDocument(masterPassword: string, document: EncryptedVaultDocument) {
  if (document.version !== 1 || document.cipher !== "aes-256-gcm" || document.kdf.name !== "scrypt") {
    throw new Error("Unsupported vault format.");
  }

  const key = await deriveKey(masterPassword, document.kdf);
  const plaintext = decryptVaultDocumentWithKey({ key, kdf: document.kdf }, document);

  return { keyMaterial: { key, kdf: document.kdf }, plaintext };
}

export function decryptVaultDocumentWithKey(keyMaterial: VaultKeyMaterial, document: EncryptedVaultDocument) {
  if (document.version !== 1 || document.cipher !== "aes-256-gcm" || document.kdf.name !== "scrypt") {
    throw new Error("Unsupported vault format.");
  }

  const plaintextBytes = gcm(keyMaterial.key, hexToBytes(document.nonce)).decrypt(hexToBytes(document.ciphertext));
  return bytesToUtf8(plaintextBytes);
}

export async function encryptVaultDocument(keyMaterial: VaultKeyMaterial, plaintext: string): Promise<EncryptedVaultDocument> {
  const nonce = await secureRandomBytes(12);
  const ciphertext = gcm(keyMaterial.key, nonce).encrypt(utf8ToBytes(plaintext));

  return {
    cipher: "aes-256-gcm",
    ciphertext: bytesToHex(ciphertext),
    kdf: keyMaterial.kdf,
    nonce: bytesToHex(nonce),
    version: 1
  };
}

async function secureRandomBytes(length: number) {
  if (Crypto.getRandomBytesAsync) {
    return Crypto.getRandomBytesAsync(length);
  }

  if (Crypto.getRandomBytes) {
    return Crypto.getRandomBytes(length);
  }

  throw new Error("Secure random number generator is unavailable.");
}

async function deriveKey(masterPassword: string, kdf: VaultKdf) {
  return scryptAsync(masterPassword, hexToBytes(kdf.salt), {
    N: kdf.N,
    dkLen: kdf.dkLen,
    p: kdf.p,
    r: kdf.r
  });
}

function bytesToUtf8(bytes: Uint8Array) {
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return decodeURIComponent(escape(result));
}

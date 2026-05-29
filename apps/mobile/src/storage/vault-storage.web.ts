import type { EncryptedVaultDocument } from "@/src/security/vault-crypto";

const STORAGE_KEY = "vaultify.encryptedVault.v1";

export async function hasStoredVault() {
  return (await readStoredVault()) !== undefined;
}

export async function readStoredVault() {
  const raw = getWebStorage()?.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as EncryptedVaultDocument;
  } catch {
    return undefined;
  }
}

export async function writeStoredVault(document: EncryptedVaultDocument) {
  getWebStorage()?.setItem(STORAGE_KEY, JSON.stringify(document));
}

export async function readStoredVaultExport() {
  return getWebStorage()?.getItem(STORAGE_KEY) ?? "";
}

export async function writeStoredVaultExport(rawDocument: string) {
  JSON.parse(rawDocument);
  getWebStorage()?.setItem(STORAGE_KEY, rawDocument);
}

function getWebStorage() {
  if (typeof globalThis.localStorage === "undefined") {
    return undefined;
  }

  return globalThis.localStorage;
}

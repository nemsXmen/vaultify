import * as Clipboard from "expo-clipboard";
import * as OTPAuth from "otpauth";
import { useSyncExternalStore } from "react";
import {
  createEncryptedVaultDocument,
  decryptVaultDocumentWithKey,
  decryptVaultDocument,
  encryptVaultDocument,
  type EncryptedVaultDocument,
  type VaultKeyMaterial
} from "@/src/security/vault-crypto";
import { clearBiometricKeyMaterial, readBiometricKeyMaterial, saveBiometricKeyMaterial } from "@/src/security/biometric-unlock";
import { hasStoredVault, readStoredVault, readStoredVaultExport, writeStoredVault, writeStoredVaultExport } from "@/src/storage/vault-storage";

export type Category = "Login" | "Card" | "Note" | "2FA";
export type ThemeMode = "Cyber Green" | "Night Blue" | "System";
export type AutoLockTimer = "1 Minute" | "5 Minutes" | "15 Minutes" | "1 Hour";

export type VaultCredential = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly notes: string;
  readonly category: Category;
  readonly favorite: boolean;
  readonly updatedAt: string;
  readonly totpSecret?: string;
};

type VaultState = {
  readonly activeCredentialId?: string;
  readonly autoLockTimer: AutoLockTimer;
  readonly backupEnabled: boolean;
  readonly biometricEnabled: boolean;
  readonly hasVault: boolean;
  readonly initialized: boolean;
  readonly lastBackupAt?: string;
  readonly locked: boolean;
  readonly credentials: readonly VaultCredential[];
  readonly theme: ThemeMode;
  readonly toast?: string;
  readonly error?: string;
};

export type CredentialInput = Omit<VaultCredential, "id" | "updatedAt">;

type PersistedVaultPayload = {
  readonly version: 1;
  readonly credentials: readonly VaultCredential[];
  readonly settings: {
    readonly autoLockTimer: AutoLockTimer;
    readonly backupEnabled: boolean;
    readonly biometricEnabled: boolean;
    readonly lastBackupAt?: string;
    readonly theme: ThemeMode;
  };
};

let state: VaultState = {
  autoLockTimer: "5 Minutes",
  backupEnabled: false,
  biometricEnabled: false,
  credentials: [],
  hasVault: false,
  initialized: false,
  locked: true,
  theme: "Cyber Green"
};

const listeners = new Set<() => void>();
let keyMaterial: VaultKeyMaterial | undefined;
let persistQueue = Promise.resolve();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(next: Partial<VaultState>) {
  state = { ...state, ...next };
  emit();
}

function setPersistedState(next: Partial<VaultState>) {
  setState(next);
  void persistCurrentVault();
}

function timestamp() {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date());
}

export function useVaultState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}

export async function initializeVault() {
  if (state.initialized) {
    return state.hasVault;
  }

  const hasVault = await hasStoredVault();
  setState({ hasVault, initialized: true, locked: true });
  return hasVault;
}

export async function createVaultSession(masterPassword: string) {
  if (masterPassword.length < 12) {
    setState({ error: "Master password must contain at least 12 characters." });
    return false;
  }

  const payload = createPayload({ credentials: [] });
  const encrypted = await createEncryptedVaultDocument(masterPassword, JSON.stringify(payload));
  keyMaterial = encrypted.keyMaterial;
  await writeStoredVault(encrypted.document);

  setState({
    activeCredentialId: undefined,
    autoLockTimer: payload.settings.autoLockTimer,
    backupEnabled: payload.settings.backupEnabled,
    biometricEnabled: payload.settings.biometricEnabled,
    credentials: payload.credentials,
    error: undefined,
    hasVault: true,
    initialized: true,
    lastBackupAt: payload.settings.lastBackupAt,
    locked: false,
    theme: payload.settings.theme,
    toast: "Secure vault initialized"
  });
  return true;
}

export async function unlockVaultSession(masterPassword: string) {
  if (masterPassword.length < 12) {
    setState({ error: "Wrong master password. Please try again." });
    return false;
  }

  const document = await readStoredVault();
  if (!document) {
    setState({ error: "No encrypted vault found on this device.", hasVault: false, initialized: true });
    return false;
  }

  try {
    const decrypted = await decryptVaultDocument(masterPassword, document);
    const payload = parsePayload(decrypted.plaintext);
    keyMaterial = decrypted.keyMaterial;
    setState({
      activeCredentialId: payload.credentials[0]?.id,
      autoLockTimer: payload.settings.autoLockTimer,
      backupEnabled: payload.settings.backupEnabled,
      biometricEnabled: payload.settings.biometricEnabled,
      credentials: payload.credentials,
      error: undefined,
      hasVault: true,
      initialized: true,
      lastBackupAt: payload.settings.lastBackupAt,
      locked: false,
      theme: payload.settings.theme,
      toast: "Vault unlocked"
    });
    return true;
  } catch {
    keyMaterial = undefined;
    setState({ error: "Wrong master password. Please try again.", locked: true });
    return false;
  }
}

export async function unlockVaultSessionWithBiometrics() {
  const document = await readStoredVault();

  if (!document) {
    setState({ error: "No encrypted vault found on this device.", hasVault: false, initialized: true });
    return false;
  }

  try {
    const biometricKeyMaterial = await readBiometricKeyMaterial();

    if (!biometricKeyMaterial) {
      setState({ error: "Biometric unlock is not enabled yet." });
      return false;
    }

    const plaintext = decryptVaultDocumentWithKey(biometricKeyMaterial, document);
    const payload = parsePayload(plaintext);
    keyMaterial = biometricKeyMaterial;
    setState({
      activeCredentialId: payload.credentials[0]?.id,
      autoLockTimer: payload.settings.autoLockTimer,
      backupEnabled: payload.settings.backupEnabled,
      biometricEnabled: payload.settings.biometricEnabled,
      credentials: payload.credentials,
      error: undefined,
      hasVault: true,
      initialized: true,
      lastBackupAt: payload.settings.lastBackupAt,
      locked: false,
      theme: payload.settings.theme,
      toast: "Vault unlocked"
    });
    return true;
  } catch {
    keyMaterial = undefined;
    setState({ error: "Biometric unlock failed.", locked: true });
    return false;
  }
}

export function lockVaultSession() {
  keyMaterial = undefined;
  setState({ activeCredentialId: undefined, credentials: [], locked: true, toast: "Vault locked" });
}

export function beginCreateCredential() {
  setState({ activeCredentialId: undefined });
}

export function createCredential(input: CredentialInput) {
  const credential: VaultCredential = {
    ...input,
    id: `credential-${Date.now()}`,
    updatedAt: timestamp()
  };

  setPersistedState({
    activeCredentialId: credential.id,
    credentials: [credential, ...state.credentials],
    toast: "Credential created securely"
  });

  return credential.id;
}

export function updateCredential(id: string, input: CredentialInput) {
  const existing = state.credentials.find((item) => item.id === id);

  if (!existing) {
    return createCredential(input);
  }

  const credential: VaultCredential = {
    ...input,
    id,
    updatedAt: timestamp()
  };

  setPersistedState({
    activeCredentialId: id,
    credentials: state.credentials.map((item) => (item.id === id ? credential : item)),
    toast: "Credential updated securely"
  });

  return id;
}

export function saveCredential(input: CredentialInput) {
  return state.activeCredentialId ? updateCredential(state.activeCredentialId, input) : createCredential(input);
}

export function selectCredential(id: string) {
  setState({ activeCredentialId: id });
}

export function getActiveCredential() {
  return state.credentials.find((item) => item.id === state.activeCredentialId) ?? state.credentials[0];
}

export function deleteCredential(id: string) {
  const nextCredentials = state.credentials.filter((item) => item.id !== id);
  setPersistedState({
    activeCredentialId: state.activeCredentialId === id ? nextCredentials[0]?.id : state.activeCredentialId,
    credentials: nextCredentials,
    toast: "Credential deleted"
  });
}

export function deleteActiveCredential() {
  if (!state.activeCredentialId) {
    return;
  }

  deleteCredential(state.activeCredentialId);
}

export function toggleCredentialFavorite(id: string) {
  const credential = state.credentials.find((item) => item.id === id);

  if (!credential) {
    return;
  }

  setPersistedState({
    credentials: state.credentials.map((item) => (item.id === id ? { ...item, favorite: !item.favorite, updatedAt: timestamp() } : item)),
    toast: credential.favorite ? "Removed from favorites" : "Added to favorites"
  });
}

export function notify(message: string) {
  setState({ toast: message });
}

export async function copyToClipboard(value: string, label: string) {
  if (!value) {
    setState({ toast: `No ${label.toLowerCase()} to copy` });
    return false;
  }

  await Clipboard.setStringAsync(value);
  setState({ toast: `${label} copied` });
  return true;
}

export function clearToast() {
  setState({ toast: undefined });
}

export function getCredentials() {
  return state.credentials;
}

export function generateTotpPreview(secret?: string, now = Date.now()) {
  if (!secret) {
    return undefined;
  }

  try {
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      issuer: "Vaultify",
      label: "Vaultify",
      period: 30,
      secret: normalizeTotpSecret(secret)
    });
    const code = totp.generate({ timestamp: now });
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  } catch {
    return undefined;
  }
}

export function getTotpSecondsRemaining(now = Date.now()) {
  const remaining = OTPAuth.TOTP.remaining({ period: 30, timestamp: now });
  return Math.max(1, Math.ceil(remaining / 1000));
}

export function normalizeTotpSecret(secret: string) {
  return secret.replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}

export function getSecurityStats(credentials = state.credentials) {
  const weakPasswords = credentials.filter((item) => item.password.length > 0 && item.password.length < 12).length;
  const passwordCounts = credentials.reduce<Record<string, number>>((acc, item) => {
    if (item.password) {
      acc[item.password] = (acc[item.password] ?? 0) + 1;
    }
    return acc;
  }, {});
  const reusedPasswords = credentials.filter((item) => item.password && passwordCounts[item.password] > 1).length;
  const missing2FA = credentials.filter((item) => item.category === "Login" && !item.totpSecret).length;
  const oldPasswords = credentials.filter((item) => item.updatedAt !== "Just now" && item.updatedAt.length > 0).length;
  const penalty = weakPasswords * 12 + reusedPasswords * 8 + missing2FA * 6 + oldPasswords * 2;
  const score = credentials.length === 0 ? 0 : Math.max(0, Math.min(100, 100 - penalty));

  return {
    missing2FA,
    oldPasswords,
    reusedPasswords,
    score,
    weakPasswords
  };
}

export async function toggleBiometricUnlock() {
  if (state.biometricEnabled) {
    await clearBiometricKeyMaterial();
    setPersistedState({
      biometricEnabled: false,
      toast: "Biometric unlock disabled"
    });
    return;
  }

  if (!keyMaterial || state.locked) {
    setState({ toast: "Unlock with your master password before enabling biometrics" });
    return;
  }

  const saved = await saveBiometricKeyMaterial(keyMaterial);

  if (!saved) {
    setState({ toast: "Biometric unlock is unavailable or was cancelled" });
    return;
  }

  setPersistedState({
    biometricEnabled: true,
    toast: "Biometric unlock enabled"
  });
}

export function toggleBackup() {
  const enabled = !state.backupEnabled;
  setPersistedState({
    backupEnabled: enabled,
    lastBackupAt: enabled ? timestamp() : state.lastBackupAt,
    toast: enabled ? "Encrypted backup enabled" : "Backup disabled"
  });
}

export function cycleAutoLockTimer() {
  const options: readonly AutoLockTimer[] = ["1 Minute", "5 Minutes", "15 Minutes", "1 Hour"];
  const index = options.indexOf(state.autoLockTimer);
  const autoLockTimer = options[(index + 1) % options.length];
  setPersistedState({ autoLockTimer, toast: `Auto-lock set to ${autoLockTimer}` });
}

export function setAutoLockTimer(autoLockTimer: AutoLockTimer) {
  setPersistedState({ autoLockTimer, toast: `Auto-lock set to ${autoLockTimer}` });
}

export function cycleTheme() {
  const options: readonly ThemeMode[] = ["Cyber Green", "Night Blue", "System"];
  const index = options.indexOf(state.theme);
  const theme = options[(index + 1) % options.length];
  setPersistedState({ theme, toast: `Theme set to ${theme}` });
}

export function setTheme(theme: ThemeMode) {
  setPersistedState({ theme, toast: `Theme set to ${theme}` });
}

export async function exportVault() {
  if (!state.locked) {
    await persistCurrentVault();
  }

  const encryptedPayload = await readStoredVaultExport();
  if (!encryptedPayload) {
    setState({ toast: "No encrypted vault to export" });
    return;
  }

  await Clipboard.setStringAsync(encryptedPayload);
  setState({ toast: state.credentials.length === 0 ? "Empty vault export copied" : "Encrypted export copied" });
}

export async function importVault() {
  const content = await Clipboard.getStringAsync();
  if (!content.trim()) {
    setState({ toast: "Clipboard is empty" });
    return false;
  }

  try {
    const parsed = JSON.parse(content) as Partial<EncryptedVaultDocument>;
    if (parsed.version !== 1 || parsed.cipher !== "aes-256-gcm" || !parsed.kdf || !parsed.nonce || !parsed.ciphertext) {
      setState({ toast: "Clipboard is not a Vaultify export" });
      return false;
    }

    await writeStoredVaultExport(content);
    keyMaterial = undefined;
    setState({
      activeCredentialId: undefined,
      credentials: [],
      hasVault: true,
      initialized: true,
      locked: true,
      toast: "Encrypted vault imported. Unlock it with its master password."
    });
    return true;
  } catch {
    setState({ toast: "Clipboard is not a valid encrypted vault" });
    return false;
  }
}

export async function changeMasterPassword(currentPassword: string, nextPassword: string) {
  if (nextPassword.length < 12) {
    setState({ toast: "New master password is too short" });
    return false;
  }

  const document = await readStoredVault();
  if (!document) {
    setState({ toast: "No encrypted vault to rotate" });
    return false;
  }

  try {
    await decryptVaultDocument(currentPassword, document);
    const encrypted = await createEncryptedVaultDocument(nextPassword, JSON.stringify(createPayload()));
    keyMaterial = encrypted.keyMaterial;
    await writeStoredVault(encrypted.document);
    if (state.biometricEnabled) {
      await saveBiometricKeyMaterial(encrypted.keyMaterial);
    }
    setState({ toast: "Master password updated" });
    return true;
  } catch {
    setState({ toast: "Current master password is incorrect" });
    return false;
  }
}

function createPayload(overrides?: Partial<PersistedVaultPayload>): PersistedVaultPayload {
  return {
    credentials: overrides?.credentials ?? state.credentials,
    settings: {
      autoLockTimer: state.autoLockTimer,
      backupEnabled: state.backupEnabled,
      biometricEnabled: state.biometricEnabled,
      lastBackupAt: state.lastBackupAt,
      theme: state.theme
    },
    version: 1
  };
}

function parsePayload(rawPayload: string): PersistedVaultPayload {
  const payload = JSON.parse(rawPayload) as Partial<PersistedVaultPayload>;
  if (payload.version !== 1 || !Array.isArray(payload.credentials) || !payload.settings) {
    throw new Error("Invalid vault payload.");
  }

  return {
    credentials: payload.credentials,
    settings: {
      autoLockTimer: payload.settings.autoLockTimer ?? "5 Minutes",
      backupEnabled: payload.settings.backupEnabled ?? false,
      biometricEnabled: payload.settings.biometricEnabled ?? false,
      lastBackupAt: payload.settings.lastBackupAt,
      theme: payload.settings.theme ?? "Cyber Green"
    },
    version: 1
  };
}

async function persistCurrentVault() {
  if (!keyMaterial || state.locked) {
    return;
  }

  persistQueue = persistQueue
    .then(async () => {
      const document = await encryptVaultDocument(keyMaterial as VaultKeyMaterial, JSON.stringify(createPayload()));
      await writeStoredVault(document);
    })
    .catch(() => {
      setState({ toast: "Encrypted save failed" });
    });

  return persistQueue;
}

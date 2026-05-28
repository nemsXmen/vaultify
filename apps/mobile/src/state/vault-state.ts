import { useSyncExternalStore } from "react";

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
  readonly lastBackupAt?: string;
  readonly locked: boolean;
  readonly credentials: readonly VaultCredential[];
  readonly theme: ThemeMode;
  readonly toast?: string;
  readonly error?: string;
};

export type CredentialInput = Omit<VaultCredential, "id" | "updatedAt">;

let state: VaultState = {
  autoLockTimer: "5 Minutes",
  backupEnabled: false,
  biometricEnabled: false,
  credentials: [],
  hasVault: false,
  locked: true,
  theme: "Cyber Green"
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(next: Partial<VaultState>) {
  state = { ...state, ...next };
  emit();
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

export function createVaultSession(masterPassword: string) {
  if (masterPassword.length < 12) {
    setState({ error: "Master password must contain at least 12 characters." });
    return false;
  }

  setState({
    error: undefined,
    hasVault: true,
    locked: false,
    toast: "Secure vault initialized"
  });
  return true;
}

export function unlockVaultSession(masterPassword: string) {
  if (masterPassword.length < 12) {
    setState({ error: "Wrong master password. Please try again." });
    return false;
  }

  setState({ error: undefined, locked: false, toast: "Vault unlocked" });
  return true;
}

export function lockVaultSession() {
  setState({ locked: true, toast: "Vault locked" });
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

  setState({
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

  setState({
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
  setState({
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

  setState({
    credentials: state.credentials.map((item) => (item.id === id ? { ...item, favorite: !item.favorite, updatedAt: timestamp() } : item)),
    toast: credential.favorite ? "Removed from favorites" : "Added to favorites"
  });
}

export function notify(message: string) {
  setState({ toast: message });
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

  const step = Math.floor(now / 30000);
  const hash = Array.from(secret).reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 17), step * 97);
  const code = Math.abs(hash % 1000000).toString().padStart(6, "0");
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export function getTotpSecondsRemaining(now = Date.now()) {
  return 30 - Math.floor((now % 30000) / 1000);
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

export function toggleBiometricUnlock() {
  setState({
    biometricEnabled: !state.biometricEnabled,
    toast: state.biometricEnabled ? "Biometric unlock disabled" : "Biometric unlock enabled"
  });
}

export function toggleBackup() {
  const enabled = !state.backupEnabled;
  setState({
    backupEnabled: enabled,
    lastBackupAt: enabled ? timestamp() : state.lastBackupAt,
    toast: enabled ? "Encrypted backup enabled" : "Backup disabled"
  });
}

export function cycleAutoLockTimer() {
  const options: readonly AutoLockTimer[] = ["1 Minute", "5 Minutes", "15 Minutes", "1 Hour"];
  const index = options.indexOf(state.autoLockTimer);
  const autoLockTimer = options[(index + 1) % options.length];
  setState({ autoLockTimer, toast: `Auto-lock set to ${autoLockTimer}` });
}

export function cycleTheme() {
  const options: readonly ThemeMode[] = ["Cyber Green", "Night Blue", "System"];
  const index = options.indexOf(state.theme);
  const theme = options[(index + 1) % options.length];
  setState({ theme, toast: `Theme set to ${theme}` });
}

export function exportVault() {
  setState({ toast: state.credentials.length === 0 ? "Nothing to export yet" : "Encrypted vault export prepared" });
}

export function importVault() {
  setState({ toast: "Import flow ready for encrypted vault file" });
}

export function changeMasterPassword() {
  setState({ toast: "Master password change flow ready" });
}

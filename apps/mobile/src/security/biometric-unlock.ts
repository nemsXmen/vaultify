import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import type { VaultKdf, VaultKeyMaterial } from "@/src/security/vault-crypto";

const BIOMETRIC_KEY_MATERIAL = "vaultify.biometric.keyMaterial.v1";

type StoredBiometricKeyMaterial = {
  readonly version: 1;
  readonly key: string;
  readonly kdf: VaultKdf;
};

const secureStoreOptions = {
  authenticationPrompt: "Unlock Vaultify",
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true
} satisfies SecureStore.SecureStoreOptions;

export async function canUseBiometricUnlock() {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync()
  ]);

  return hasHardware && enrolled;
}

export async function saveBiometricKeyMaterial(keyMaterial: VaultKeyMaterial) {
  const available = await canUseBiometricUnlock();

  if (!available) {
    return false;
  }

  const authenticated = await LocalAuthentication.authenticateAsync({
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
    promptMessage: "Enable biometric unlock"
  });

  if (!authenticated.success) {
    return false;
  }

  const payload: StoredBiometricKeyMaterial = {
    kdf: keyMaterial.kdf,
    key: bytesToHex(keyMaterial.key),
    version: 1
  };

  await SecureStore.setItemAsync(BIOMETRIC_KEY_MATERIAL, JSON.stringify(payload), secureStoreOptions);
  return true;
}

export async function readBiometricKeyMaterial() {
  const rawPayload = await SecureStore.getItemAsync(BIOMETRIC_KEY_MATERIAL, secureStoreOptions);

  if (!rawPayload) {
    return undefined;
  }

  const payload = JSON.parse(rawPayload) as Partial<StoredBiometricKeyMaterial>;

  if (payload.version !== 1 || !payload.key || !payload.kdf) {
    await clearBiometricKeyMaterial();
    return undefined;
  }

  return {
    kdf: payload.kdf,
    key: hexToBytes(payload.key)
  } satisfies VaultKeyMaterial;
}

export async function clearBiometricKeyMaterial() {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY_MATERIAL);
}

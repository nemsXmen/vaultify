import * as Crypto from "expo-crypto";
import type { EncryptedVaultDocument } from "@/src/security/vault-crypto";

export const PC_TRANSFER_KIND = "vaultify.pc-transfer";
const CODE_LENGTH = 6;

export type PcTransferPackage = {
  readonly version: 1;
  readonly kind: typeof PC_TRANSFER_KIND;
  readonly exportedAt: string;
  readonly expiresAt: string;
  readonly itemCount: number;
  readonly codeVerifier: string;
  readonly encryptedVault: EncryptedVaultDocument;
};

export async function createPairingCode() {
  const bytes = await Crypto.getRandomBytesAsync(CODE_LENGTH);
  return Array.from(bytes, (byte) => `${byte % 10}`).join("");
}

export async function createCodeVerifier(code: string, rawVault: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${code}:${rawVault}`);
}

export function formatPairingCode(code: string) {
  return code.replace(/(\d{3})(\d{3})/, "$1 $2");
}

export function parsePcTransferPackage(rawPackage: string) {
  const parsed = JSON.parse(rawPackage) as Partial<PcTransferPackage>;

  if (
    parsed.version !== 1 ||
    parsed.kind !== PC_TRANSFER_KIND ||
    !parsed.exportedAt ||
    !parsed.expiresAt ||
    typeof parsed.itemCount !== "number" ||
    !parsed.codeVerifier ||
    !parsed.encryptedVault
  ) {
    throw new Error("Invalid PC transfer package.");
  }

  return parsed as PcTransferPackage;
}

export function serializeVaultDocument(document: EncryptedVaultDocument) {
  return JSON.stringify(document);
}

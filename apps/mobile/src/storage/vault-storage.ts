import * as SQLite from "expo-sqlite";
import type { EncryptedVaultDocument } from "@/src/security/vault-crypto";

const STORAGE_KEY = "vaultify.encryptedVault.v1";
const DATABASE_NAME = "vaultify.db";
const TABLE_SQL = "CREATE TABLE IF NOT EXISTS vault_storage (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);";

type StoredRow = {
  readonly value: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export async function hasStoredVault() {
  return (await readStoredVault()) !== undefined;
}

export async function readStoredVault() {
  const raw = await readString(STORAGE_KEY);
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
  await writeString(STORAGE_KEY, JSON.stringify(document));
}

export async function readStoredVaultExport() {
  return (await readString(STORAGE_KEY)) ?? "";
}

export async function writeStoredVaultExport(rawDocument: string) {
  JSON.parse(rawDocument);
  await writeString(STORAGE_KEY, rawDocument);
}

async function readString(key: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<StoredRow>("SELECT value FROM vault_storage WHERE key = ?;", key);
  return row?.value;
}

async function writeString(key: string, value: string) {
  const database = await getDatabase();
  await database.runAsync("INSERT OR REPLACE INTO vault_storage (key, value) VALUES (?, ?);", key, value);
}

async function getDatabase() {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function openDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(TABLE_SQL);
  return database;
}

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, PasswordInput, ScreenShell, Toggle, colors, styles } from "@/src/ui/cyber-ui";
import {
  changeMasterPassword,
  exportVault,
  importVault,
  lockVaultSession,
  notify,
  setAutoLockTimer,
  setTheme,
  toggleBackup,
  toggleBiometricUnlock,
  useVaultState,
  type AutoLockTimer,
  type ThemeMode
} from "@/src/state/vault-state";

const autoLockOptions: readonly AutoLockTimer[] = ["1 Minute", "5 Minutes", "15 Minutes", "1 Hour"];
const themeOptions: readonly ThemeMode[] = ["Cyber Green", "Night Blue", "System"];

type Sheet = "autoLock" | "masterPassword" | "export" | "import" | "theme" | "about" | "privacy" | null;

export default function SettingsScreen() {
  const { autoLockTimer, backupEnabled, biometricEnabled, credentials, lastBackupAt, theme } = useVaultState();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const canChangePassword = currentPassword.length >= 12 && nextPassword.length >= 12 && nextPassword === confirmPassword;

  async function submitMasterPasswordChange() {
    if (!canChangePassword) {
      notify("Passwords must match and contain at least 12 characters");
      return;
    }

    if (await changeMasterPassword(currentPassword, nextPassword)) {
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setSheet(null);
    }
  }

  return (
    <ScreenShell active="Settings">
      <Header title="Settings" />

      <Panel>
        <Text style={styles.smallTitle}>Unlock & Privacy</Text>
        <SettingAction
          icon="finger-print-outline"
          label="Biometric Unlock"
          right={<Toggle active={biometricEnabled} onPress={toggleBiometricUnlock} />}
          onPress={toggleBiometricUnlock}
        />
        <SettingAction icon="timer-outline" label="Auto-Lock Timer" value={autoLockTimer} onPress={() => setSheet("autoLock")} />
        <SettingAction icon="key-outline" label="Change Master Password" value="Requires current password" onPress={() => setSheet("masterPassword")} />
      </Panel>

      <Panel>
        <Text style={styles.smallTitle}>Vault Data</Text>
        <SettingAction icon="download-outline" label="Export Vault" value={`${credentials.length} items`} onPress={() => setSheet("export")} />
        <SettingAction icon="cloud-upload-outline" label="Import Vault" value="Read from clipboard" onPress={() => setSheet("import")} />
        <SettingAction
          icon="archive-outline"
          label="Backup"
          value={backupEnabled ? lastBackupAt ?? "Enabled" : "Off"}
          right={<Toggle active={backupEnabled} onPress={toggleBackup} />}
          onPress={toggleBackup}
        />
      </Panel>

      <Panel>
        <Text style={styles.smallTitle}>Experience</Text>
        <SettingAction icon="color-palette-outline" label="Theme" value={theme} onPress={() => setSheet("theme")} />
        <SettingAction icon="information-circle-outline" label="About Vaultify" value="Local-first vault" onPress={() => setSheet("about")} />
        <SettingAction icon="shield-outline" label="Privacy Policy" value="Offline-first" onPress={() => setSheet("privacy")} />
      </Panel>

      <Button
        icon="lock-closed-outline"
        label="Lock Vault"
        tone="danger"
        onPress={() => {
          lockVaultSession();
          router.replace("/unlock");
        }}
      />

      {sheet ? (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, { borderColor: "rgba(57,255,90,0.38)", shadowColor: colors.green }]}>
            {sheet === "autoLock" ? (
              <>
                <SheetHeader icon="timer-outline" title="Auto-Lock Timer" onClose={() => setSheet(null)} />
                {autoLockOptions.map((option) => (
                  <OptionRow
                    key={option}
                    active={autoLockTimer === option}
                    label={option}
                    onPress={() => {
                      setAutoLockTimer(option);
                      setSheet(null);
                    }}
                  />
                ))}
              </>
            ) : null}

            {sheet === "masterPassword" ? (
              <>
                <SheetHeader icon="key-outline" title="Change Master Password" onClose={() => setSheet(null)} />
                <Text style={styles.centerMuted}>This re-encrypts the local vault with your new master password.</Text>
                <PasswordInput label="Current Master Password" value={currentPassword} onChangeText={setCurrentPassword} />
                <PasswordInput label="New Master Password" value={nextPassword} onChangeText={setNextPassword} />
                <PasswordInput label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} />
                <Button disabled={!canChangePassword} icon="checkmark" label="Update Password" onPress={submitMasterPasswordChange} />
              </>
            ) : null}

            {sheet === "export" ? (
              <>
                <SheetHeader icon="download-outline" title="Export Vault" onClose={() => setSheet(null)} />
                <Text style={styles.centerMuted}>Copies the encrypted vault document to clipboard. Secrets are never exported in plaintext.</Text>
                <Panel>
                  <Text style={styles.itemTitle}>{credentials.length} vault items</Text>
                  <Text style={styles.muted}>{backupEnabled ? `Backup enabled: ${lastBackupAt ?? "ready"}` : "Backup is off"}</Text>
                </Panel>
                <Button
                  icon="copy-outline"
                  label="Copy Export Package"
                  onPress={() => {
                    void exportVault();
                    setSheet(null);
                  }}
                />
              </>
            ) : null}

            {sheet === "import" ? (
              <>
                <SheetHeader icon="cloud-upload-outline" title="Import Vault" onClose={() => setSheet(null)} />
                <Text style={styles.centerMuted}>Paste or copy a Vaultify export package first. This verifies the package from clipboard.</Text>
                <Button
                  icon="scan-outline"
                  label="Verify Clipboard Import"
                  onPress={() => {
                    void importVault();
                    setSheet(null);
                  }}
                />
              </>
            ) : null}

            {sheet === "theme" ? (
              <>
                <SheetHeader icon="color-palette-outline" title="Theme" onClose={() => setSheet(null)} />
                {themeOptions.map((option) => (
                  <OptionRow
                    key={option}
                    active={theme === option}
                    label={option}
                    onPress={() => {
                      setTheme(option);
                      setSheet(null);
                    }}
                  />
                ))}
              </>
            ) : null}

            {sheet === "about" ? (
              <>
                <SheetHeader icon="information-circle-outline" title="About Vaultify" onClose={() => setSheet(null)} />
                <Text style={styles.centerMuted}>Vaultify is a local-first private vault. The MVP keeps secrets on-device and prepares encrypted storage, 2FA and local PC session flows.</Text>
                <Panel>
                  <Text style={styles.itemTitle}>Current vault</Text>
                  <Text style={styles.muted}>{credentials.length} credentials, {credentials.filter((item) => item.totpSecret).length} with 2FA secret</Text>
                </Panel>
              </>
            ) : null}

            {sheet === "privacy" ? (
              <>
                <SheetHeader icon="shield-outline" title="Privacy Policy" onClose={() => setSheet(null)} />
                <Text style={styles.centerMuted}>No account is required. No cloud sync is enabled. Sensitive persistence must use encrypted storage; plaintext AsyncStorage is intentionally avoided.</Text>
                <Panel>
                  <Text style={styles.itemTitle}>Privacy stance</Text>
                  <Text style={styles.muted}>Offline-first, local-only, no analytics, no mandatory network.</Text>
                </Panel>
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function SheetHeader({ icon, onClose, title }: { readonly icon: React.ComponentProps<typeof CyberIcon>["name"]; readonly onClose: () => void; readonly title: string }) {
  return (
    <View style={styles.splitRow}>
      <View style={styles.row}>
        <CyberIcon name={icon} size={24} />
        <Text style={[styles.itemTitle, { fontSize: 18 }]}>{title}</Text>
      </View>
      <Pressable onPress={onClose}>
        <CyberIcon color={colors.muted} name="close" />
      </Pressable>
    </View>
  );
}

function OptionRow({ active, label, onPress }: { readonly active: boolean; readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.splitRow, { borderColor: active ? colors.green : "rgba(57,255,90,0.18)", borderRadius: 14, borderWidth: 1, padding: 14 }]}>
      <Text style={styles.itemTitle}>{label}</Text>
      <CyberIcon name={active ? "checkmark-circle" : "ellipse-outline"} />
    </Pressable>
  );
}

function SettingAction({
  icon,
  label,
  onPress,
  right,
  value
}: {
  readonly icon: React.ComponentProps<typeof CyberIcon>["name"];
  readonly label: string;
  readonly onPress: () => void;
  readonly right?: React.ReactNode;
  readonly value?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.splitRow}>
      <View style={[styles.row, styles.flex]}>
        <CyberIcon color={colors.green} name={icon} size={18} />
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>{label}</Text>
          {value ? <Text numberOfLines={1} style={styles.muted}>{value}</Text> : null}
        </View>
      </View>
      {right ?? <CyberIcon name="chevron-forward" size={18} />}
    </Pressable>
  );
}

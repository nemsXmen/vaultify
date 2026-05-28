import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, Toggle, colors, styles } from "@/src/ui/cyber-ui";
import {
  changeMasterPassword,
  cycleAutoLockTimer,
  cycleTheme,
  exportVault,
  importVault,
  lockVaultSession,
  notify,
  toggleBackup,
  toggleBiometricUnlock,
  useVaultState
} from "@/src/state/vault-state";

export default function SettingsScreen() {
  const { autoLockTimer, backupEnabled, biometricEnabled, credentials, lastBackupAt, theme } = useVaultState();

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
        <SettingAction icon="timer-outline" label="Auto-Lock Timer" value={autoLockTimer} onPress={cycleAutoLockTimer} />
        <SettingAction icon="key-outline" label="Change Master Password" value="Security flow" onPress={changeMasterPassword} />
      </Panel>

      <Panel>
        <Text style={styles.smallTitle}>Vault Data</Text>
        <SettingAction icon="download-outline" label="Export Vault" value={`${credentials.length} items`} onPress={exportVault} />
        <SettingAction icon="cloud-upload-outline" label="Import Vault" value="Encrypted file" onPress={importVault} />
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
        <SettingAction icon="color-palette-outline" label="Theme" value={theme} onPress={cycleTheme} />
        <SettingAction icon="information-circle-outline" label="About Vaultify" value="Local-first vault" onPress={() => notify("Vaultify keeps secrets on your device")} />
        <SettingAction icon="shield-outline" label="Privacy Policy" value="Offline-first" onPress={() => notify("No cloud account required")} />
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
    </ScreenShell>
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
      <View style={styles.row}>
        <CyberIcon color={colors.green} name={icon} size={18} />
        <View>
          <Text style={styles.itemTitle}>{label}</Text>
          {value ? <Text style={styles.muted}>{value}</Text> : null}
        </View>
      </View>
      {right ?? (
        <CyberIcon name="chevron-forward" size={18} />
      )}
    </Pressable>
  );
}

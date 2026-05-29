import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Logo, PasswordInput, ScreenShell, styles } from "@/src/ui/cyber-ui";
import { unlockVaultSession, unlockVaultSessionWithBiometrics, useVaultState } from "@/src/state/vault-state";

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockingBiometric, setUnlockingBiometric] = useState(false);
  const vault = useVaultState();

  async function unlock() {
    setUnlocking(true);
    try {
      if (await unlockVaultSession(password)) {
        router.replace("/home");
      }
    } finally {
      setUnlocking(false);
    }
  }

  async function unlockWithBiometrics() {
    setUnlockingBiometric(true);
    try {
      if (await unlockVaultSessionWithBiometrics()) {
        router.replace("/home");
      }
    } finally {
      setUnlockingBiometric(false);
    }
  }

  return (
    <ScreenShell>
      <View style={{ alignItems: "center", flex: 1, gap: 20, justifyContent: "center" }}>
        <Logo large />
        <Text style={[styles.title, { textAlign: "center" }]}>Unlock Vault</Text>
        <Text style={styles.centerMuted}>Enter your master password</Text>
        <View style={{ alignSelf: "stretch", gap: 12 }}>
          <PasswordInput label="Master Password" onChangeText={setPassword} value={password} />
          <Button disabled={unlocking || password.length === 0} icon="lock-open" label={unlocking ? "Decrypting..." : "Unlock"} onPress={unlock} />
          {vault.biometricEnabled ? (
            <Button
              disabled={unlockingBiometric}
              icon="finger-print"
              label={unlockingBiometric ? "Checking biometrics..." : "Unlock with Biometrics"}
              tone="ghost"
              onPress={unlockWithBiometrics}
            />
          ) : null}
          <Text style={styles.dangerText}>Forgot master password?</Text>
          {vault.error ? <Text style={styles.dangerText}>{vault.error}</Text> : null}
        </View>
      </View>
    </ScreenShell>
  );
}

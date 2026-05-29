import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Logo, PasswordInput, ScreenShell, styles } from "@/src/ui/cyber-ui";
import { notify, unlockVaultSession, useVaultState } from "@/src/state/vault-state";

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
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

  return (
    <ScreenShell>
      <View style={{ alignItems: "center", flex: 1, gap: 20, justifyContent: "center" }}>
        <Logo large />
        <Text style={[styles.title, { textAlign: "center" }]}>Unlock Vault</Text>
        <Text style={styles.centerMuted}>Enter your master password</Text>
        <View style={{ alignSelf: "stretch", gap: 12 }}>
          <PasswordInput label="Master Password" onChangeText={setPassword} value={password} />
          <Button disabled={unlocking || password.length === 0} icon="lock-open" label={unlocking ? "Decrypting..." : "Unlock"} onPress={unlock} />
          <Button icon="finger-print" label="Unlock with Face ID" tone="ghost" onPress={() => notify("Biometric unlock will use the native secure keychain later")} />
          <Text style={styles.dangerText}>Forgot master password?</Text>
          {vault.error ? <Text style={styles.dangerText}>{vault.error}</Text> : null}
        </View>
      </View>
    </ScreenShell>
  );
}

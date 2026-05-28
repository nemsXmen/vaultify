import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, CyberInput, Logo, ScreenShell, Toggle, styles } from "@/src/ui/cyber-ui";
import { notify, unlockVaultSession, useVaultState } from "@/src/state/vault-state";

export default function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const vault = useVaultState();

  function unlock() {
    if (unlockVaultSession(password)) {
      router.replace("/home");
    }
  }

  return (
    <ScreenShell>
      <View style={{ alignItems: "center", flex: 1, gap: 20, justifyContent: "center" }}>
        <Logo large />
        <Text style={[styles.title, { textAlign: "center" }]}>Unlock Vault</Text>
        <Text style={styles.centerMuted}>Enter your master password</Text>
        <View style={{ alignSelf: "stretch", gap: 12 }}>
          <CyberInput label="Master Password" onChangeText={setPassword} secureTextEntry={!visible} value={password} />
          <View style={styles.splitRow}>
            <Text style={styles.label}>Show password</Text>
            <Toggle active={visible} onPress={() => setVisible((next) => !next)} />
          </View>
          <Button icon="lock-open" label="Unlock" onPress={unlock} />
          <Button icon="finger-print" label="Unlock with Face ID" tone="ghost" onPress={() => notify("Biometric unlock will use the native secure keychain later")} />
          <Text style={styles.dangerText}>Forgot master password?</Text>
          {vault.error ? <Text style={styles.dangerText}>{vault.error}</Text> : null}
        </View>
      </View>
    </ScreenShell>
  );
}

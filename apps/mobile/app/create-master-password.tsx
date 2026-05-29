import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, PasswordInput, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { createVaultSession } from "@/src/state/vault-state";

export default function CreateMasterPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);
  const valid = strength >= 3 && password === confirm;

  async function submit() {
    if (!valid) {
      setError("Use a stronger password and make sure both fields match.");
      return;
    }
    setSaving(true);
    try {
      if (await createVaultSession(password)) {
        router.replace("/home");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell>
      <Header title="Create Master Password" />
      <Text style={styles.subtitle}>This password unlocks your vault. It cannot be recovered.</Text>
      <View style={{ gap: 12 }}>
        <PasswordInput label="Master Password" onChangeText={setPassword} value={password} />
        <PasswordInput label="Confirm Password" onChangeText={setConfirm} value={confirm} />
      </View>

      <View style={{ gap: 8 }}>
        <View style={styles.splitRow}>
          <Text style={styles.label}>Password Strength</Text>
          <Text style={{ color: strength >= 3 ? colors.green : colors.yellow, fontWeight: "900" }}>
            {strength >= 4 ? "Strong" : strength >= 3 ? "Good" : "Weak"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 7 }}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={{ backgroundColor: item < strength ? colors.green : "rgba(255,255,255,0.12)", borderRadius: 4, flex: 1, height: 7 }} />
          ))}
        </View>
      </View>

      <Panel>
        {["12+ characters", "Uppercase and lowercase", "Include numbers", "Include symbols"].map((tip) => (
          <View key={tip} style={styles.row}>
            <CyberIcon name="checkmark-circle" size={16} />
            <Text style={styles.successText}>{tip}</Text>
          </View>
        ))}
      </Panel>
      {error ? <Text style={styles.dangerText}>{error}</Text> : null}
      <Button disabled={!valid || saving} label={saving ? "Encrypting..." : "Create Secure Vault"} onPress={submit} />
    </ScreenShell>
  );
}

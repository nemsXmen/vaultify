import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { beginCreateCredential, getSecurityStats, notify, useVaultState } from "@/src/state/vault-state";

export default function SecurityCenterScreen() {
  const { credentials } = useVaultState();
  const stats = getSecurityStats(credentials);
  const findings = [
    ["Weak Passwords", stats.weakPasswords, colors.red, "warning-outline"],
    ["Reused Passwords", stats.reusedPasswords, "#FF9F43", "copy-outline"],
    ["Old Passwords", stats.oldPasswords, colors.yellow, "time-outline"],
    ["Missing 2FA", stats.missing2FA, colors.green, "keypad-outline"]
  ] as const;

  return (
    <ScreenShell active="Security">
      <Header title="Security Center" />
      <Panel style={styles.scoreCard}>
        <View>
          <Text style={styles.smallTitle}>Security Score</Text>
          <View style={styles.scoreInline}>
            <Text style={styles.scoreBig}>{stats.score}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <Text style={styles.successText}>
            {credentials.length === 0 ? "No credentials to audit yet" : "Live audit from your vault"}
          </Text>
        </View>
        <View style={[styles.scoreRing, styles.scoreRingSmall]}>
          <Text style={styles.scoreRingText}>{stats.score}</Text>
        </View>
      </Panel>

      {findings.map(([label, count, color, icon]) => (
        <Panel key={label} style={{ borderColor: `${color}66` }}>
          <View style={styles.splitRow}>
            <View style={styles.row}>
              <CyberIcon color={color} name={icon} />
              <Text style={styles.itemTitle}>{label}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color, fontSize: 16, fontWeight: "900" }}>{count}</Text>
              <CyberIcon color={color} name="chevron-forward" size={18} />
            </View>
          </View>
        </Panel>
      ))}

      {credentials.length === 0 ? (
        <Panel style={{ alignItems: "center", paddingVertical: 24 }}>
          <CyberIcon name="shield-half-outline" size={42} />
          <Text style={styles.itemTitle}>No vault data yet</Text>
          <Text style={styles.centerMuted}>Add credentials first, then Vaultify can detect weak, reused, old and unprotected passwords.</Text>
          <Button
            icon="add"
            label="Add Credential"
            onPress={() => {
              beginCreateCredential();
              router.push({ pathname: "/credential-form", params: { mode: "create" } });
            }}
          />
        </Panel>
      ) : (
        <Button icon="shield-checkmark" label="View All Recommendations" tone="ghost" onPress={() => notify("Security recommendations refreshed")} />
      )}
    </ScreenShell>
  );
}

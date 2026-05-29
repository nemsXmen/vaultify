import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, CyberIcon, CyberInput, Header, Panel, QRMock, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { copyToClipboard, generateTotpPreview, getTotpSecondsRemaining } from "@/src/state/vault-state";

export default function TwoFactorSetupScreen() {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const code = useMemo(() => generateTotpPreview(secret) ?? "000 000", [secret]);
  const seconds = getTotpSecondsRemaining();

  return (
    <ScreenShell active="2FA">
      <Header title="2FA Setup" />
      <View style={styles.row}>
        <Button icon="qr-code" label="Scan QR Code" tone={mode === "scan" ? "primary" : "ghost"} onPress={() => setMode("scan")} />
        <Button icon="create-outline" label="Manual" tone={mode === "manual" ? "primary" : "ghost"} onPress={() => setMode("manual")} />
      </View>
      {mode === "scan" ? (
        <>
          <Text style={[styles.centerMuted, { marginTop: 16 }]}>Scan this QR code with your authenticator app</Text>
          <QRMock />
        </>
      ) : (
        <CyberInput label="Manual Secret Key" onChangeText={setSecret} value={secret} />
      )}
      <Panel>
        <Text style={styles.label}>Secret Key</Text>
        <View style={styles.splitRow}>
          <Text style={styles.itemTitle}>{secret}</Text>
          <Pressable onPress={() => void copyToClipboard(secret, "2FA secret")}>
            <CyberIcon name="copy-outline" />
          </Pressable>
        </View>
      </Panel>
      <Panel>
        <Text style={styles.label}>Preview Code</Text>
        <View style={styles.splitRow}>
          <Text style={{ color: colors.cyan, fontSize: 34, fontWeight: "900" }}>{code}</Text>
          <View style={[styles.scoreRing, styles.scoreRingSmall]}>
            <Text style={styles.scoreRingText}>{seconds}</Text>
          </View>
        </View>
      </Panel>
      <Button icon="copy-outline" label="Copy Preview Code" onPress={() => void copyToClipboard(code.replace(" ", ""), "2FA code")} />
    </ScreenShell>
  );
}

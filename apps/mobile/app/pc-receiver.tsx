import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { importPcTransferPackage, useVaultState } from "@/src/state/vault-state";

export default function PcReceiverScreen() {
  const [packageText, setPackageText] = useState("");
  const [code, setCode] = useState("");
  const [receiving, setReceiving] = useState(false);
  const { error } = useVaultState();
  const canReceive = packageText.trim().length > 0 && code.replace(/\s+/g, "").length === 6;

  async function receivePackage() {
    setReceiving(true);
    try {
      if (await importPcTransferPackage(packageText, code)) {
        router.replace("/unlock");
      }
    } finally {
      setReceiving(false);
    }
  }

  return (
    <ScreenShell>
      <Header title="Receive from Phone" />
      <Panel style={{ alignItems: "center", gap: 14 }}>
        <CyberIcon color={colors.green} name="desktop-outline" size={42} />
        <Text style={styles.itemTitle}>Vaultify PC Receiver</Text>
        <Text style={styles.centerMuted}>On your phone, open Settings, Share with PC, then copy the secure vault file and paste it here.</Text>
      </Panel>

      <Panel>
        {["Copy the secure vault file on your phone", "Paste it below on this computer", "Enter the pairing code shown on the phone"].map((item, index) => (
          <View key={item} style={styles.row}>
            <Text style={styles.successText}>0{index + 1}</Text>
            <Text style={styles.itemTitle}>{item}</Text>
          </View>
        ))}
      </Panel>

      <Panel>
        <Text style={styles.label}>Secure vault file</Text>
        <TextInput
          multiline
          onChangeText={setPackageText}
          placeholder="Paste the secure vault file here"
          placeholderTextColor={colors.muted}
          style={[styles.passwordInput, { minHeight: 150, paddingTop: 14, textAlignVertical: "top" }]}
          value={packageText}
        />
      </Panel>

      <Panel>
        <Text style={styles.label}>Pairing code</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={7}
          onChangeText={setCode}
          placeholder="000 000"
          placeholderTextColor={colors.muted}
          style={[styles.passwordInput, { color: colors.green, fontSize: 28, fontWeight: "900", textAlign: "center" }]}
          value={code}
        />
      </Panel>

      {error ? <Text style={styles.dangerText}>{error}</Text> : null}

      <View style={{ gap: 10 }}>
        <Button disabled={!canReceive || receiving} icon="download-outline" label={receiving ? "Receiving..." : "Receive Vault"} onPress={receivePackage} />
        <Button icon="lock-closed-outline" label="Unlock Existing Vault" tone="ghost" onPress={() => router.replace("/unlock")} />
      </View>
    </ScreenShell>
  );
}

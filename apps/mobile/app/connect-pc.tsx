import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, QRMock, ScreenShell, styles } from "@/src/ui/cyber-ui";
import { copyToClipboard, notify } from "@/src/state/vault-state";

export default function ConnectPcScreen() {
  const [sessionStarted, setSessionStarted] = useState(false);

  return (
    <ScreenShell>
      <Header title="Connect with PC" />
      <Text style={styles.centerMuted}>Access your vault securely over local Wi-Fi.</Text>
      <Panel>
        {["Open Vaultify on your computer", "Scan the QR code below", "Start a secure session"].map((item, index) => (
          <View key={item} style={styles.row}>
            <Text style={styles.successText}>0{index + 1}</Text>
            <Text style={styles.itemTitle}>{item}</Text>
          </View>
        ))}
      </Panel>
      <QRMock />
      <Panel>
        <Text style={styles.label}>Wi-Fi Network</Text>
        <View style={styles.splitRow}>
          <Text style={styles.itemTitle}>Home_WIFI_5G</Text>
          <Pressable onPress={() => void copyToClipboard("Home_WIFI_5G", "Wi-Fi network")}>
            <CyberIcon name="copy-outline" />
          </Pressable>
        </View>
      </Panel>
      <Button
        icon={sessionStarted ? "shield-checkmark" : "desktop-outline"}
        label={sessionStarted ? "Secure Session Active" : "Start Secure Session"}
        onPress={() => {
          setSessionStarted(true);
          notify("Secure PC session started");
        }}
      />
      <Button icon="laptop-outline" label="Show Paired Devices" tone="ghost" onPress={() => notify("No paired devices yet")} />
    </ScreenShell>
  );
}

import { Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { notify } from "@/src/state/vault-state";

export default function StatesScreen() {
  return (
    <ScreenShell>
      <Header title="Error / Modals" />
      <Panel style={{ borderColor: "rgba(255,77,94,0.55)" }}>
        <CyberIcon color={colors.red} name="warning-outline" size={30} />
        <Text style={styles.itemTitle}>Delete Credential</Text>
        <Text style={styles.muted}>This action cannot be undone.</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={styles.flex}>
            <Button icon="close" label="Cancel" tone="ghost" onPress={() => notify("Delete cancelled")} />
          </View>
          <View style={styles.flex}>
            <Button icon="trash-outline" label="Delete" tone="danger" onPress={() => notify("Credential deleted")} />
          </View>
        </View>
      </Panel>
      <Panel style={{ borderColor: "rgba(255,209,102,0.55)" }}>
        <CyberIcon color={colors.yellow} name="warning-outline" size={30} />
        <Text style={styles.itemTitle}>Wrong Password</Text>
        <Text style={styles.muted}>Incorrect master password.</Text>
        <Button icon="refresh" label="Try Again" tone="ghost" onPress={() => notify("Try again")} />
      </Panel>
      <Panel>
        <CyberIcon color={colors.green} name="checkmark-circle" size={30} />
        <Text style={styles.itemTitle}>Copied!</Text>
        <Text style={styles.muted}>Password copied to clipboard.</Text>
      </Panel>
    </ScreenShell>
  );
}

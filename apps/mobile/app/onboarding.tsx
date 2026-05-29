import { router } from "expo-router";
import { Button, CyberIcon, Logo, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import { Text, View } from "react-native";

const features = [
  ["Encrypted locally", "Your data stays only on your device.", "lock-closed"],
  ["Autofill passwords", "Fill your logins quickly and securely.", "flash"],
  ["2FA code generator", "Generate secure offline codes.", "keypad"],
  ["Connect with PC", "Access your vault on your computer.", "desktop-outline"]
] as const;

export default function OnboardingScreen() {
  return (
    <ScreenShell>
      <View style={{ flex: 1, gap: 22, justifyContent: "space-between" }}>
        <View style={{ gap: 18 }}>
          <Text style={styles.title}>Your security,{"\n"}our priority</Text>
          <Text style={styles.subtitle}>Vaultify keeps your passwords, 2FA codes and notes private on this device.</Text>
          <View style={{ alignItems: "center", marginVertical: 4 }}>
            <Logo large />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          {features.map(([title, description, icon]) => (
            <Panel key={title} style={{ alignItems: "center", flexDirection: "row", gap: 14 }}>
              <View style={{
                alignItems: "center",
                backgroundColor: "rgba(57,255,90,0.13)",
                borderColor: colors.border,
                borderRadius: 18,
                borderWidth: 1,
                height: 58,
                justifyContent: "center",
                width: 58
              }}>
                <CyberIcon name={icon} size={28} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.muted}>{description}</Text>
              </View>
            </Panel>
          ))}
        </View>

        <View style={{ paddingBottom: 18 }}>
          <Button icon="arrow-forward" label="Get Started" onPress={() => router.push("/create-master-password")} />
        </View>
      </View>
    </ScreenShell>
  );
}

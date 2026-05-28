import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, CredentialRow, CyberIcon, Header, MetricCard, Panel, ScreenShell, SearchBox, colors, styles } from "@/src/ui/cyber-ui";
import { beginCreateCredential, getSecurityStats, selectCredential, useVaultState } from "@/src/state/vault-state";

export default function HomeScreen() {
  const { credentials } = useVaultState();
  const logins = credentials.filter((item) => item.category === "Login").length;
  const cards = credentials.filter((item) => item.category === "Card").length;
  const notes = credentials.filter((item) => item.category === "Note").length;
  const twoFactor = credentials.filter((item) => item.totpSecret || item.category === "2FA").length;
  const stats = getSecurityStats(credentials);

  return (
    <ScreenShell active="Home">
      <Header back={false} title="Vaultify" action={<CyberIcon name="notifications-outline" />} />
      <SearchBox label="Search your vault..." />
      <Panel style={styles.scoreCard}>
        <View>
          <Text style={styles.smallTitle}>Security Score</Text>
          <View style={styles.scoreInline}>
            <Text style={styles.scoreBig}>{stats.score}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <Text style={styles.successText}>
            {credentials.length === 0 ? "Add credentials to calculate your score" : "Score based on your current vault"}
          </Text>
        </View>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreRingText}>{stats.score}</Text>
        </View>
      </Panel>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <MetricCard icon="lock-closed" label="Logins" value={`${logins}`} />
        <MetricCard icon="card" label="Cards" value={`${cards}`} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <MetricCard icon="document-text" label="Notes" value={`${notes}`} />
        <MetricCard icon="keypad" label="2FA" value={`${twoFactor}`} />
      </View>
      <Text style={styles.itemTitle}>Recent Items</Text>
      {credentials.length > 0 ? (
        credentials.slice(0, 4).map((credential) => (
          <CredentialRow
            key={credential.id}
            favorite={credential.favorite}
            onPress={() => {
              selectCredential(credential.id);
              router.push("/credential-detail");
            }}
            title={credential.title}
            username={credential.username || credential.category}
          />
        ))
      ) : (
        <Panel style={{ alignItems: "center", borderColor: "rgba(57,255,90,0.34)", paddingVertical: 24 }}>
          <CyberIcon color={colors.green} name="file-tray-outline" size={42} />
          <Text style={styles.itemTitle}>Your vault is empty</Text>
          <Text style={styles.centerMuted}>Create your first encrypted credential to start building your local vault.</Text>
          <Button
            icon="add"
            label="Add First Credential"
            onPress={() => {
              beginCreateCredential();
              router.push({ pathname: "/credential-form", params: { mode: "create" } });
            }}
          />
        </Panel>
      )}
    </ScreenShell>
  );
}

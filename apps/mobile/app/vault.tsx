import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, CredentialRow, Header, Pill, ScreenShell, SearchBox, styles } from "@/src/ui/cyber-ui";
import { beginCreateCredential, selectCredential, useVaultState } from "@/src/state/vault-state";

const filters = ["All", "Favorites", "Recent", "Login", "Card", "Note", "2FA"] as const;

export default function VaultScreen() {
  const { credentials } = useVaultState();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = useMemo(() => {
    return credentials.filter((item) => {
      const matchesSearch = `${item.title} ${item.username}`.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "All" ||
        (filter === "Favorites" ? item.favorite : filter === "Recent" ? true : item.category === filter);
      return matchesSearch && matchesFilter;
    });
  }, [credentials, filter, search]);

  return (
    <ScreenShell active="Vault">
      <Header back={false} title="Logins" />
      <SearchBox label="Search vault..." value={search} onChangeText={setSearch} />
      <View style={styles.row}>
        {filters.map((item) => (
          <Pill key={item} active={filter === item} label={item} onPress={() => setFilter(item)} />
        ))}
      </View>
      {visible.length > 0 ? (
        visible.map((credential) => (
          <CredentialRow
            key={credential.id}
            favorite={credential.favorite}
            onPress={() => {
              selectCredential(credential.id);
              router.push("/credential-detail");
            }}
            title={credential.title}
            username={credential.username}
          />
        ))
      ) : (
        <View style={{ gap: 12, paddingTop: 24 }}>
          <Text style={styles.centerMuted}>No credential matches this search.</Text>
          <Button
            icon="add"
            label="Add Credential"
            onPress={() => {
              beginCreateCredential();
              router.push({ pathname: "/credential-form", params: { mode: "create" } });
            }}
          />
        </View>
      )}
    </ScreenShell>
  );
}

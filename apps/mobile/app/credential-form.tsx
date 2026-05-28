import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, CyberInput, Header, IconButton, PasswordInput, Pill, ScreenShell, Toggle, styles } from "@/src/ui/cyber-ui";
import { createCredential, updateCredential, useVaultState, type Category, type CredentialInput } from "@/src/state/vault-state";

const categories: readonly Category[] = ["Login", "Card", "Note", "2FA"];
const fallbackPassword = "K7#mN!pQ9@zL2$";
const fallbackTotpSecret = "JBSWY3DPEHPK3PXP";

export default function CredentialFormScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { activeCredentialId, credentials } = useVaultState();
  const isCreateMode = params.mode === "create" || !activeCredentialId;
  const active = useMemo(
    () => (isCreateMode ? undefined : credentials.find((item) => item.id === activeCredentialId)),
    [activeCredentialId, credentials, isCreateMode]
  );
  const [category, setCategory] = useState<Category>(active?.category ?? "Login");
  const [title, setTitle] = useState(active?.title ?? "");
  const [url, setUrl] = useState(active?.url ?? "");
  const [username, setUsername] = useState(active?.username ?? "");
  const [password, setPassword] = useState(active?.password ?? "");
  const [totpSecret, setTotpSecret] = useState(active?.totpSecret ?? "");
  const [notes, setNotes] = useState(active?.notes ?? "");
  const [favorite, setFavorite] = useState(active?.favorite ?? false);
  const [error, setError] = useState("");
  const valid = title.trim().length > 0 && (category === "Note" || password.length > 0 || totpSecret.length > 0);

  function buildInput(): CredentialInput {
    return {
      category,
      favorite,
      notes: notes.trim(),
      password,
      title: title.trim(),
      totpSecret: totpSecret.trim() || undefined,
      url: url.trim(),
      username: username.trim()
    };
  }

  function submit() {
    if (!valid) {
      setError("A title is required. Logins also need a password or a 2FA secret.");
      return;
    }

    const savedId = isCreateMode || !active ? createCredential(buildInput()) : updateCredential(active.id, buildInput());
    router.replace(savedId ? "/credential-detail" : "/vault");
  }

  return (
    <ScreenShell>
      <Header title={isCreateMode ? "Add Credential" : "Edit Credential"} action={<IconButton icon="checkmark" onPress={submit} />} />
      <View style={styles.row}>
        {categories.map((item) => (
          <Pill key={item} active={category === item} label={item} onPress={() => setCategory(item)} />
        ))}
      </View>
      <CyberInput label="Site Name" onChangeText={setTitle} value={title} />
      <CyberInput label="URL" keyboardType="url" onChangeText={setUrl} value={url} />
      <CyberInput label="Username" keyboardType="email-address" onChangeText={setUsername} value={username} />
      <PasswordInput label="Password" onChangeText={setPassword} value={password} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={styles.flex}>
          <Button icon="refresh" label="Generate" tone="ghost" onPress={() => setPassword(fallbackPassword)} />
        </View>
        <View style={styles.flex}>
          <Button icon="keypad" label="2FA Secret" tone="ghost" onPress={() => setTotpSecret(fallbackTotpSecret)} />
        </View>
      </View>
      <CyberInput label="2FA Secret (optional)" onChangeText={setTotpSecret} value={totpSecret} />
      <CyberInput label="Notes" multiline onChangeText={setNotes} value={notes} />
      <View style={styles.splitRow}>
        <View>
          <Text style={styles.label}>Favorite</Text>
          <Text style={styles.muted}>Pin this item in quick access</Text>
        </View>
        <Toggle active={favorite} onPress={() => setFavorite((next) => !next)} />
      </View>
      {error ? <Text style={styles.dangerText}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={styles.flex}>
          <Button icon="flash" label="Generator" tone="ghost" onPress={() => router.push("/password-generator")} />
        </View>
        <View style={styles.flex}>
          <Button disabled={!valid} icon="save" label={isCreateMode ? "Create" : "Update"} onPress={submit} />
        </View>
      </View>
    </ScreenShell>
  );
}

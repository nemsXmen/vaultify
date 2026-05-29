import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import {
  copyToClipboard,
  deleteActiveCredential,
  generateTotpPreview,
  getTotpSecondsRemaining,
  toggleCredentialFavorite,
  useVaultState
} from "@/src/state/vault-state";

export default function CredentialDetailScreen() {
  const { activeCredentialId, credentials } = useVaultState();
  const credential = credentials.find((item) => item.id === activeCredentialId) ?? credentials[0];
  const [visible, setVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now, setNow] = useState(Date.now());
  const totpCode = useMemo(() => generateTotpPreview(credential?.totpSecret, now), [credential?.totpSecret, now]);
  const seconds = getTotpSecondsRemaining(now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!credential) {
    return (
      <ScreenShell>
        <Header title="Credential" />
        <Panel style={{ alignItems: "center" }}>
          <CyberIcon name="file-tray-outline" size={38} />
          <Text style={styles.itemTitle}>No credential selected</Text>
          <Text style={styles.centerMuted}>Create or select an item from your vault.</Text>
          <Button icon="add" label="Add Credential" onPress={() => router.replace({ pathname: "/credential-form", params: { mode: "create" } })} />
        </Panel>
      </ScreenShell>
    );
  }

  function removeCredential() {
    deleteActiveCredential();
    setConfirmDelete(false);
    router.replace("/vault");
  }

  return (
    <ScreenShell>
      <Header
        title={credential.title}
        action={
          <CyberIcon
            color={credential.favorite ? colors.yellow : colors.muted}
            name={credential.favorite ? "star" : "star-outline"}
          />
        }
      />
      <View style={{ alignItems: "center" }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{credential.title.charAt(0)}</Text>
        </View>
        <Text style={[styles.itemTitle, { marginTop: 8 }]}>{credential.title}</Text>
        <Text style={styles.muted}>{credential.category}</Text>
      </View>

      <Panel>
        <Text style={styles.label}>Username</Text>
        <View style={[styles.splitRow, { gap: 12 }]}>
          <Text ellipsizeMode="middle" numberOfLines={1} style={[styles.itemTitle, styles.truncateText, styles.flex]}>
            {credential.username || "No username"}
          </Text>
          <Button icon="copy-outline" label="Copy" tone="ghost" onPress={() => void copyToClipboard(credential.username, "Username")} />
        </View>
      </Panel>

      <Panel>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.passwordField, { marginTop: 2 }]}>
          <Text ellipsizeMode="tail" numberOfLines={1} style={[styles.passwordInput, { paddingTop: 15 }]}>
            {visible ? credential.password || "No password" : "****************"}
          </Text>
          <Pressable onPress={() => setVisible((next) => !next)} style={styles.passwordEye}>
            <CyberIcon color={visible ? colors.green : colors.muted} name={visible ? "eye-off" : "eye"} />
          </Pressable>
        </View>
      </Panel>

      {totpCode ? (
        <Panel style={{ borderColor: "rgba(57,255,90,0.42)" }}>
          <Text style={styles.label}>2FA Code</Text>
          <View style={styles.splitRow}>
            <Text style={{ color: colors.text, fontSize: 34, fontWeight: "900" }}>{totpCode}</Text>
            <View style={[styles.scoreRing, styles.scoreRingSmall]}>
              <Text style={styles.scoreRingText}>{seconds}</Text>
            </View>
          </View>
          <Text style={styles.muted}>Refreshes from system time every 30 seconds.</Text>
          <Button icon="copy-outline" label="Copy 2FA Code" tone="ghost" onPress={() => void copyToClipboard(totpCode.replace(" ", ""), "2FA code")} />
        </Panel>
      ) : (
        <Panel>
          <Text style={styles.label}>2FA Code</Text>
          <Text style={styles.muted}>No 2FA secret saved for this credential.</Text>
          <Button icon="keypad" label="Add 2FA Secret" tone="ghost" onPress={() => router.push({ pathname: "/credential-form", params: { mode: "edit" } })} />
        </Panel>
      )}

      <Panel>
        <Text style={styles.label}>Website</Text>
        <Text ellipsizeMode="middle" numberOfLines={1} style={styles.itemTitle}>{credential.url || "No URL"}</Text>
      </Panel>
      <Panel>
        <Text style={styles.label}>Last Updated</Text>
        <Text style={styles.muted}>{credential.updatedAt}</Text>
      </Panel>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={styles.flex}>
          <Button icon="create-outline" label="Edit" tone="ghost" onPress={() => router.push({ pathname: "/credential-form", params: { mode: "edit" } })} />
        </View>
        <View style={styles.flex}>
          <Button icon={credential.favorite ? "star" : "star-outline"} label={credential.favorite ? "Unfavorite" : "Favorite"} tone="ghost" onPress={() => toggleCredentialFavorite(credential.id)} />
        </View>
      </View>
      <Button icon="copy-outline" label="Copy Password" onPress={() => void copyToClipboard(credential.password, "Password")} />
      <Button icon="trash-outline" label="Delete Credential" tone="danger" onPress={() => setConfirmDelete(true)} />

      {confirmDelete ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={{ alignItems: "center", gap: 10 }}>
              <CyberIcon color={colors.red} name="trash-outline" size={42} />
              <Text style={[styles.title, { fontSize: 24, lineHeight: 29, textAlign: "center" }]}>Delete Credential</Text>
              <Text style={styles.centerMuted}>This removes "{credential.title}" from the current vault session. This action cannot be undone.</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={styles.flex}>
                <Button icon="close" label="Cancel" tone="ghost" onPress={() => setConfirmDelete(false)} />
              </View>
              <View style={styles.flex}>
                <Button icon="trash-outline" label="Delete" tone="danger" onPress={removeCredential} />
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

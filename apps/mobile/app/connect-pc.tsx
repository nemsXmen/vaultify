import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, colors, styles } from "@/src/ui/cyber-ui";
import {
  copyPcTransferPackage,
  copyToClipboard,
  createPcTransferSession,
  type PcTransferSession
} from "@/src/state/vault-state";
import { formatPairingCode } from "@/src/security/pc-transfer";
import { startPcShareServer, type PcShareServerSession } from "@/src/network/pc-share-server";

function getReceiverUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;
  return host ? `http://${host}:8081/pc-receiver` : "http://<PC-IP>:8081/pc-receiver";
}

export default function ConnectPcScreen() {
  const [session, setSession] = useState<PcTransferSession>();
  const [serverSession, setServerSession] = useState<PcShareServerSession>();
  const [serverError, setServerError] = useState("");
  const [creating, setCreating] = useState(false);
  const receiverUrl = getReceiverUrl();

  useEffect(() => {
    return () => {
      void serverSession?.stop();
    };
  }, [serverSession]);

  async function startSession() {
    setCreating(true);
    setServerError("");
    try {
      await serverSession?.stop();
      setServerSession(undefined);
      const nextSession = await createPcTransferSession();
      if (nextSession) {
        const nextServer = await startPcShareServer(nextSession);
        setSession(nextSession);
        setServerSession(nextServer);
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not start the local PC share.");
    } finally {
      setCreating(false);
    }
  }

  async function stopSession() {
    await serverSession?.stop();
    setServerSession(undefined);
    setSession(undefined);
    setServerError("");
  }

  const expiresAt = session
    ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(session.expiresAt))
    : undefined;

  return (
    <ScreenShell>
      <Header title="Share with PC" />
      <Text style={styles.centerMuted}>Start a local session, open the phone address on your computer, then enter the pairing code. The encrypted vault is sent over your Wi-Fi.</Text>

      <Panel>
        {["Keep the PC and phone on the same Wi-Fi", "Open the phone address on your PC", "Enter the pairing code to receive the vault"].map((item, index) => (
          <View key={item} style={styles.row}>
            <Text style={styles.successText}>0{index + 1}</Text>
            <Text style={styles.itemTitle}>{item}</Text>
          </View>
        ))}
      </Panel>

      <Panel style={{ alignItems: "center", gap: 14 }}>
        <View style={{
          alignItems: "center",
          backgroundColor: "rgba(57,255,90,0.13)",
          borderColor: colors.border,
          borderRadius: 22,
          borderWidth: 1,
          height: 82,
          justifyContent: "center",
          width: 82
        }}>
          <CyberIcon name="desktop-outline" size={42} />
        </View>
        <Text style={styles.label}>Pairing code</Text>
        <Text style={{ color: colors.green, fontSize: 38, fontWeight: "900", letterSpacing: 0 }}>
          {session ? formatPairingCode(session.code) : "--- ---"}
        </Text>
        <Text style={styles.centerMuted}>
          {session ? `${session.itemCount} encrypted items. Expires at ${expiresAt}.` : "Start a secure session to generate a one-time code."}
        </Text>
      </Panel>

      <Panel>
        <Text style={styles.label}>Open this on your PC</Text>
        <View style={styles.splitRow}>
          <Text numberOfLines={1} style={[styles.itemTitle, styles.flex]}>{serverSession?.url ?? receiverUrl}</Text>
          <CyberIcon name="desktop-outline" />
        </View>
        <Text style={styles.muted}>
          {serverSession ? "This is the phone address. Open it from the computer browser while the session is active." : "Start a session to create the phone receiver address."}
        </Text>
        <Button
          disabled={!serverSession}
          icon="copy-outline"
          label="Copy PC Address"
          tone="ghost"
          onPress={() => void copyToClipboard(serverSession?.url ?? receiverUrl, "PC address")}
        />
      </Panel>

      {serverError ? <Text style={styles.dangerText}>{serverError}</Text> : null}

      {session ? (
        <Panel>
          <View style={styles.splitRow}>
            <View style={styles.flex}>
              <Text style={styles.label}>Fallback</Text>
              <Text style={styles.muted}>If the PC cannot reach the phone address, copy the encrypted file manually and import it on the PC.</Text>
            </View>
            <CyberIcon name="shield-checkmark-outline" />
          </View>
          <Button icon="copy-outline" label="Copy Secure Vault File" onPress={() => void copyPcTransferPackage(session.packageText)} />
        </Panel>
      ) : null}

      <Button
        disabled={creating}
        icon={session ? "refresh" : "desktop-outline"}
        label={creating ? "Preparing..." : session ? "Regenerate Session" : "Start PC Share"}
        onPress={startSession}
      />
      {session ? <Button icon="close" label="Stop Session" tone="ghost" onPress={() => void stopSession()} /> : null}
    </ScreenShell>
  );
}

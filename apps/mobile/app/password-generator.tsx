import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, CyberIcon, Header, Panel, ScreenShell, Toggle, colors, styles } from "@/src/ui/cyber-ui";
import { notify } from "@/src/state/vault-state";

const pools = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%&*?"
};

function buildPassword(seed: number, length: number, options: Record<keyof typeof pools, boolean>) {
  const selected = Object.entries(pools)
    .filter(([key]) => options[key as keyof typeof pools])
    .map(([, value]) => value)
    .join("");
  const source = selected || pools.lowercase;
  return Array.from({ length }, (_, index) => source[(seed + index * 11) % source.length]).join("");
}

export default function PasswordGeneratorScreen() {
  const [seed, setSeed] = useState(17);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const generated = useMemo(() => buildPassword(seed, length, options), [length, options, seed]);

  return (
    <ScreenShell>
      <Header title="Password Generator" />
      <Panel>
        <View style={styles.splitRow}>
          <Text style={{ color: colors.green, fontSize: 24, fontWeight: "900" }}>{generated}</Text>
          <CyberIcon name="refresh" />
        </View>
      </Panel>
      <View style={styles.splitRow}>
        <Text style={styles.itemTitle}>Length: {length}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label="-" tone="ghost" onPress={() => setLength((next) => Math.max(8, next - 1))} />
          <Button label="+" tone="ghost" onPress={() => setLength((next) => Math.min(32, next + 1))} />
        </View>
      </View>
      <View style={{ backgroundColor: "rgba(57,255,90,0.18)", borderRadius: 6, height: 8 }}>
        <View style={{ backgroundColor: colors.green, borderRadius: 6, height: 8, width: `${(length / 32) * 100}%` }} />
      </View>
      {[
        ["uppercase", "Uppercase (A-Z)"],
        ["lowercase", "Lowercase (a-z)"],
        ["numbers", "Numbers (0-9)"],
        ["symbols", "Symbols (!@#$%&*)"]
      ].map(([key, label]) => (
        <View key={key} style={styles.splitRow}>
          <Text style={styles.itemTitle}>{label}</Text>
          <Toggle
            active={options[key as keyof typeof options]}
            onPress={() => setOptions((next) => ({ ...next, [key]: !next[key as keyof typeof options] }))}
          />
        </View>
      ))}
      <Button icon="refresh" label="Regenerate" tone="ghost" onPress={() => setSeed((next) => next + 7)} />
      <Button icon="copy-outline" label="Copy Password" onPress={() => notify("Generated password copied")} />
    </ScreenShell>
  );
}

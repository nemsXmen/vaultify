import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { beginCreateCredential, clearToast, useVaultState } from "@/src/state/vault-state";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export const colors = {
  bg: "#020604",
  panel: "rgba(5, 18, 15, 0.88)",
  panel2: "rgba(8, 28, 22, 0.78)",
  border: "rgba(58, 255, 102, 0.24)",
  green: "#39FF5A",
  greenSoft: "#9EFFA7",
  cyan: "#67E8F9",
  red: "#FF4D5E",
  yellow: "#FFD166",
  text: "#F6FFF8",
  muted: "#93A39A"
};

const MIN_SCREEN_BOTTOM_PADDING = 24;
const BOTTOM_NAV_CONTENT_OFFSET = 112;

export function ScreenShell({
  active,
  children,
  padded = true,
  scroll = true
}: {
  readonly active?: "Home" | "Vault" | "2FA" | "Security" | "Settings";
  readonly children: React.ReactNode;
  readonly padded?: boolean;
  readonly scroll?: boolean;
}) {
  const vault = useVaultState();
  const insets = useSafeAreaInsets();
  const navBottomOffset = Math.max(insets.bottom, 0);
  const contentBottomPadding = active
    ? BOTTOM_NAV_CONTENT_OFFSET + navBottomOffset
    : Math.max(insets.bottom, MIN_SCREEN_BOTTOM_PADDING);
  const content = (
    <View style={[styles.content, padded ? styles.padded : null, { paddingBottom: contentBottomPadding }]}>
      {children}
    </View>
  );

  useEffect(() => {
    if (active && vault.initialized && vault.hasVault && vault.locked) {
      router.replace("/unlock");
    }
  }, [active, vault.hasVault, vault.initialized, vault.locked]);

  return (
    <View style={[styles.root, { paddingTop: Platform.OS === "android" ? insets.top : 0 }]}>
      <CyberBackground />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {active ? <BottomNav active={active} /> : null}
      <ToastHost />
    </View>
  );
}

function ToastHost() {
  const { toast } = useVaultState();

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(clearToast, 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <View style={styles.toast}>
      <Ionicons color={colors.green} name="checkmark-circle" size={20} />
      <Text style={styles.toastText}>{toast}</Text>
    </View>
  );
}

export function CyberBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.glowTop} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottom} />
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={`v-${index}`} style={[styles.gridLineVertical, { left: `${index * 11}%` }]} />
      ))}
      {Array.from({ length: 12 }).map((_, index) => (
        <View key={`h-${index}`} style={[styles.gridLineHorizontal, { top: `${index * 9}%` }]} />
      ))}
    </View>
  );
}

export function Logo({ large }: { readonly large?: boolean }) {
  return (
    <View style={[styles.logoOuter, large ? styles.logoOuterLarge : null]}>
      <View style={[styles.logoInner, large ? styles.logoInnerLarge : null]}>
        <Ionicons color={colors.green} name="shield-checkmark" size={large ? 62 : 38} />
      </View>
    </View>
  );
}

export function Header({
  action,
  back = true,
  title
}: {
  readonly action?: React.ReactNode;
  readonly back?: boolean;
  readonly title: string;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton icon="chevron-back" onPress={() => router.back()} />
      ) : (
        <IconButton icon="menu" onPress={() => router.push("/settings")} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerAction}>{action ?? <CyberIcon name="notifications-outline" />}</View>
    </View>
  );
}

export function CyberIcon({ color = colors.green, name, size = 22 }: { readonly color?: string; readonly name: IconName; readonly size?: number }) {
  return <Ionicons color={color} name={name} size={size} />;
}

export function IconButton({ icon, onPress }: { readonly icon: IconName; readonly onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <Ionicons color={colors.green} name={icon} size={25} />
    </Pressable>
  );
}

export function Panel({ children, style }: { readonly children: React.ReactNode; readonly style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Button({
  disabled,
  href,
  icon,
  label,
  onPress,
  tone = "primary"
}: {
  readonly disabled?: boolean;
  readonly href?: Href;
  readonly icon?: IconName;
  readonly label: string;
  readonly onPress?: () => void;
  readonly tone?: "primary" | "danger" | "ghost";
}) {
  const iconColor = tone === "ghost" ? colors.text : "#021006";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress ?? (href ? () => router.push(href) : undefined)}
      style={[
        styles.button,
        tone === "ghost" ? styles.buttonGhost : null,
        tone === "danger" ? styles.buttonDanger : null,
        disabled ? styles.disabled : null
      ]}
    >
      {icon ? <Ionicons color={iconColor} name={icon} size={18} /> : null}
      <Text style={[styles.buttonText, tone === "ghost" ? styles.buttonGhostText : null]}>{label}</Text>
    </Pressable>
  );
}

export function CyberInput({
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  secureTextEntry,
  value
}: {
  readonly keyboardType?: KeyboardTypeOptions;
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly secureTextEntry?: boolean;
  readonly value: string;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#607067"
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline ? styles.inputTall : null]}
        value={value}
      />
    </View>
  );
}

export function PasswordInput({
  label,
  onChangeText,
  value
}: {
  readonly label: string;
  readonly onChangeText: (value: string) => void;
  readonly value: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordField}>
        <TextInput
          onChangeText={onChangeText}
          placeholder="Enter password"
          placeholderTextColor="#607067"
          secureTextEntry={!visible}
          style={styles.passwordInput}
          value={value}
        />
        <Pressable onPress={() => setVisible((next) => !next)} style={styles.passwordEye}>
          <Ionicons color={visible ? colors.green : colors.muted} name={visible ? "eye-off" : "eye"} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

export function SearchBox({
  label,
  onChangeText,
  value
}: {
  readonly label: string;
  readonly onChangeText?: (value: string) => void;
  readonly value?: string;
}) {
  return (
    <View style={styles.searchBox}>
      <Ionicons color={colors.muted} name="search" size={20} />
      <TextInput
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#77857D"
        style={styles.searchInput}
        value={value}
      />
      <Ionicons color={colors.green} name="scan-outline" size={20} />
    </View>
  );
}

export function Pill({ active, label, onPress }: { readonly active?: boolean; readonly label: string; readonly onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active ? styles.pillActive : null]}>
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ active, onPress }: { readonly active?: boolean; readonly onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active ? styles.toggleActive : null]}>
      <View style={styles.toggleKnob} />
    </Pressable>
  );
}

export function MetricCard({ icon, label, value }: { readonly icon: IconName; readonly label: string; readonly value: string }) {
  return (
    <Panel style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons color={colors.green} name={icon} size={22} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Panel>
  );
}

export function ScoreCard({ compact }: { readonly compact?: boolean }) {
  return (
    <Panel style={styles.scoreCard}>
      <View>
        <Text style={styles.smallTitle}>Security Score</Text>
        <View style={styles.scoreInline}>
          <Text style={styles.scoreBig}>82</Text>
          <Text style={styles.scoreUnit}>/100</Text>
        </View>
        <Text style={styles.successText}>Great! Your vault is secure</Text>
      </View>
      <View style={[styles.scoreRing, compact ? styles.scoreRingSmall : null]}>
        <Text style={styles.scoreRingText}>82</Text>
      </View>
    </Panel>
  );
}

export function CredentialRow({
  favorite,
  onPress,
  title,
  username
}: {
  readonly favorite?: boolean;
  readonly onPress?: () => void;
  readonly title: string;
  readonly username: string;
}) {
  return (
    <Pressable onPress={onPress ?? (() => router.push("/credential-detail"))} style={styles.credentialRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{title.charAt(0)}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.muted}>{username}</Text>
      </View>
      <Ionicons color={favorite ? colors.yellow : "rgba(147,163,154,0.35)"} name={favorite ? "star" : "star-outline"} size={22} />
    </Pressable>
  );
}

export function QRMock() {
  return (
    <View style={styles.qrFrame}>
      <View style={styles.qr}>
        {Array.from({ length: 64 }).map((_, index) => (
          <View key={index} style={[styles.qrCell, index % 2 === 0 || index % 7 === 0 || index % 13 === 0 ? styles.qrCellDark : null]} />
        ))}
      </View>
    </View>
  );
}

export function EmptyState({ action, text, title }: { readonly action: string; readonly text: string; readonly title: string }) {
  return (
    <Panel style={styles.emptyPanel}>
      <Logo />
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.centerMuted}>{text}</Text>
      <Button
        icon="add"
        label={action}
        onPress={() => {
          beginCreateCredential();
          router.push({ pathname: "/credential-form", params: { mode: "create" } });
        }}
      />
    </Panel>
  );
}

function BottomNav({ active }: { readonly active: "Home" | "Vault" | "2FA" | "Security" | "Settings" }) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 0);
  const items: readonly { label: "Home" | "Vault" | "Security" | "Settings"; href: Href; icon: IconName }[] = [
    { label: "Home", href: "/home", icon: active === "Home" ? "home" : "home-outline" },
    { label: "Vault", href: "/vault", icon: active === "Vault" ? "lock-closed" : "lock-closed-outline" },
    { label: "Security", href: "/security-center", icon: active === "Security" ? "shield-checkmark" : "shield-checkmark-outline" },
    { label: "Settings", href: "/settings", icon: active === "Settings" ? "settings" : "settings-outline" }
  ];

  return (
    <View style={[styles.bottomNav, { bottom: bottomOffset }]}>
      <View style={styles.navSide}>
        {items.slice(0, 2).map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.href)} style={styles.navItem}>
            <Ionicons color={active === item.label ? colors.green : colors.muted} name={item.icon} size={20} />
            <Text style={[styles.navText, active === item.label ? styles.navActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View pointerEvents="box-none" style={styles.fabDock}>
        <Pressable
          onPress={() => {
            beginCreateCredential();
            router.push({ pathname: "/credential-form", params: { mode: "create" } });
          }}
          style={styles.fab}
        >
          <View pointerEvents="none" style={styles.fabHighlight} />
          <View pointerEvents="none" style={styles.fabCoreGlow} />
          <Ionicons color="#021006" name="add" size={34} />
        </Pressable>
      </View>
      <View style={styles.navSide}>
        {items.slice(2).map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.href)} style={styles.navItem}>
            <Ionicons color={active === item.label ? colors.green : colors.muted} name={item.icon} size={20} />
            <Text style={[styles.navText, active === item.label ? styles.navActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    flex: 1,
    overflow: "hidden"
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    gap: 15
  },
  padded: {
    padding: 16
  },
  glowTop: {
    backgroundColor: "rgba(57,255,90,0.16)",
    borderRadius: 180,
    height: 260,
    position: "absolute",
    right: -120,
    top: -130,
    width: 260
  },
  glowCenter: {
    backgroundColor: "rgba(37,99,235,0.12)",
    borderRadius: 180,
    height: 240,
    left: -120,
    position: "absolute",
    top: 160,
    width: 240
  },
  glowBottom: {
    backgroundColor: "rgba(57,255,90,0.12)",
    borderRadius: 230,
    bottom: -150,
    height: 330,
    left: 30,
    position: "absolute",
    width: 330
  },
  gridLineVertical: {
    backgroundColor: "rgba(57,255,90,0.035)",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1
  },
  gridLineHorizontal: {
    backgroundColor: "rgba(57,255,90,0.03)",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  logoOuter: {
    alignItems: "center",
    borderColor: "rgba(57,255,90,0.8)",
    borderRadius: 25,
    borderWidth: 1,
    height: 82,
    justifyContent: "center",
    shadowColor: colors.green,
    shadowOpacity: 0.85,
    shadowRadius: 18,
    width: 82
  },
  logoOuterLarge: {
    borderRadius: 44,
    height: 132,
    width: 132
  },
  logoInner: {
    alignItems: "center",
    backgroundColor: "rgba(57,255,90,0.16)",
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  logoInnerLarge: {
    borderRadius: 36,
    height: 104,
    width: 104
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  headerAction: {
    alignItems: "flex-end",
    width: 44
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  neonIcon: {
    color: colors.green,
    fontSize: 19,
    fontWeight: "900"
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    shadowColor: colors.green,
    shadowOpacity: 0.22,
    shadowRadius: 14
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
    shadowColor: colors.green,
    shadowOpacity: 0.55,
    shadowRadius: 16
  },
  buttonGhost: {
    backgroundColor: "rgba(5,18,15,0.78)",
    borderColor: colors.border,
    borderWidth: 1,
    shadowOpacity: 0.15
  },
  buttonDanger: {
    backgroundColor: colors.red,
    shadowColor: colors.red
  },
  buttonText: {
    color: "#021006",
    fontSize: 15,
    fontWeight: "900"
  },
  buttonGhostText: {
    color: colors.text
  },
  disabled: {
    opacity: 0.45
  },
  inputWrap: {
    gap: 7
  },
  label: {
    color: "#B5C7BC",
    fontSize: 12,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "rgba(3,10,8,0.82)",
    borderColor: "rgba(57,255,90,0.22)",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 13
  },
  inputTall: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  passwordField: {
    alignItems: "center",
    backgroundColor: "rgba(3,10,8,0.82)",
    borderColor: "rgba(57,255,90,0.34)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    overflow: "hidden",
    shadowColor: colors.green,
    shadowOpacity: 0.16,
    shadowRadius: 12
  },
  passwordInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 54,
    paddingLeft: 14,
    paddingRight: 8
  },
  passwordEye: {
    alignItems: "center",
    alignSelf: "stretch",
    borderLeftColor: "rgba(57,255,90,0.16)",
    borderLeftWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "rgba(3,10,8,0.86)",
    borderColor: "rgba(57,255,90,0.22)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    minHeight: 44
  },
  pill: {
    backgroundColor: "rgba(5,18,15,0.84)",
    borderColor: "rgba(57,255,90,0.18)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8
  },
  pillActive: {
    backgroundColor: colors.green
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  pillTextActive: {
    color: "#021006"
  },
  toggle: {
    alignItems: "flex-start",
    backgroundColor: "rgba(148,163,184,0.26)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    padding: 4,
    width: 50
  },
  toggleActive: {
    alignItems: "flex-end",
    backgroundColor: colors.green
  },
  toggleKnob: {
    backgroundColor: colors.text,
    borderRadius: 10,
    height: 20,
    width: 20
  },
  metricCard: {
    alignItems: "center",
    flex: 1,
    minHeight: 94
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "rgba(57,255,90,0.15)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  metricLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  metricValue: {
    color: colors.muted,
    fontSize: 11
  },
  scoreCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  smallTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  scoreInline: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 4,
    marginTop: 6
  },
  scoreBig: {
    color: colors.green,
    fontSize: 38,
    fontWeight: "900"
  },
  scoreUnit: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6
  },
  successText: {
    color: colors.greenSoft,
    fontSize: 12,
    fontWeight: "800"
  },
  scoreRing: {
    alignItems: "center",
    borderColor: colors.green,
    borderRadius: 48,
    borderWidth: 8,
    height: 96,
    justifyContent: "center",
    width: 96
  },
  scoreRingSmall: {
    height: 76,
    width: 76
  },
  scoreRingText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  credentialRow: {
    alignItems: "center",
    backgroundColor: "rgba(3,10,8,0.78)",
    borderColor: "rgba(57,255,90,0.16)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 68,
    padding: 11
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  avatarText: {
    color: "#07100B",
    fontSize: 24,
    fontWeight: "900"
  },
  flex: {
    flex: 1
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  truncateText: {
    flexShrink: 1,
    maxWidth: "100%"
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  centerMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center"
  },
  qrFrame: {
    alignSelf: "center",
    borderColor: colors.green,
    borderRadius: 18,
    borderWidth: 4,
    padding: 8,
    shadowColor: colors.green,
    shadowOpacity: 0.75,
    shadowRadius: 18
  },
  qr: {
    backgroundColor: colors.text,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    height: 136,
    padding: 8,
    width: 136
  },
  qrCell: {
    backgroundColor: colors.text,
    height: 12,
    width: 12
  },
  qrCellDark: {
    backgroundColor: "#030A08"
  },
  emptyPanel: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 420
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  splitRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: "rgba(1, 9, 5, 0.98)",
    borderTopColor: "rgba(57,255,90,0.2)",
    borderTopWidth: 1,
    flexDirection: "row",
    height: 66,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    position: "absolute",
    left: 0,
    right: 0,
    shadowColor: colors.green,
    shadowOpacity: 0.25,
    shadowRadius: 18
  },
  navSide: {
    alignItems: "center",
    flexDirection: "row",
    gap: 22,
    justifyContent: "space-between",
    width: "36%"
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 46
  },
  navText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800"
  },
  navActive: {
    color: colors.green
  },
  fab: {
    alignItems: "center",
    backgroundColor: "#39FF5A",
    borderColor: "rgba(158,255,167,0.9)",
    borderRadius: 31,
    borderWidth: 1,
    height: 62,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.95,
    shadowRadius: 22,
    width: 62
  },
  fabDock: {
    alignItems: "center",
    bottom: 22,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0
  },
  fabHighlight: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderRadius: 34,
    height: 28,
    left: 8,
    position: "absolute",
    right: 8,
    top: 4
  },
  fabCoreGlow: {
    backgroundColor: "rgba(6, 65, 22, 0.22)",
    borderRadius: 48,
    bottom: -18,
    height: 42,
    left: 4,
    position: "absolute",
    right: 4
  },
  dangerText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  warningText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "900"
  },
  toast: {
    alignItems: "center",
    backgroundColor: "rgba(5, 48, 24, 0.96)",
    borderColor: "rgba(57,255,90,0.36)",
    borderRadius: 14,
    borderWidth: 1,
    bottom: 88,
    flexDirection: "row",
    gap: 8,
    left: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    position: "absolute",
    right: 16
  },
  toastText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.68)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 18,
    position: "absolute",
    right: 0,
    top: 0
  },
  modalPanel: {
    backgroundColor: "rgba(5, 18, 15, 0.98)",
    borderColor: "rgba(255,77,94,0.42)",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    shadowColor: colors.red,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    width: "100%"
  }
});

export const text = StyleSheet.create({
  mono: {
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"]
  }
});

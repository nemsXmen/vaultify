import { View } from "react-native";
import { EmptyState, Header, ScreenShell } from "@/src/ui/cyber-ui";

export default function EmptyStatesScreen() {
  return (
    <ScreenShell active="Vault">
      <Header title="Empty States" />
      <View style={{ gap: 12 }}>
        <EmptyState action="+ Add Item" title="Your vault is empty" text="Add your first credential to get started." />
        <EmptyState action="+ Add 2FA" title="No 2FA yet" text="Add a 2FA entry to generate codes here." />
      </View>
    </ScreenShell>
  );
}

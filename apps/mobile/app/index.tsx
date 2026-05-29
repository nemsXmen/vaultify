import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { initializeVault, useVaultState } from "@/src/state/vault-state";
import { colors } from "@/src/ui/cyber-ui";
import { useEffect } from "react";

export default function IndexScreen() {
  const { hasVault, initialized } = useVaultState();

  useEffect(() => {
    void initializeVault();
  }, []);

  if (!initialized) {
    return (
      <View style={{ alignItems: "center", backgroundColor: colors.bg, flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return <Redirect href={hasVault ? "/unlock" : "/onboarding"} />;
}

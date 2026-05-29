import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initializeVault } from "@/src/state/vault-state";

export default function RootLayout() {
  useEffect(() => {
    void initializeVault();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ contentStyle: { backgroundColor: "#020604" }, headerShown: false }} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

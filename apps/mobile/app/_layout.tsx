import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ contentStyle: { backgroundColor: "#020604" }, headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}

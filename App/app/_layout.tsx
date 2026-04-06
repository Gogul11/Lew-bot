import "../global.css";
import { Stack } from "expo-router";
import { lightTheme } from "@/constants/theme";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: lightTheme.colors.surface },
        headerTitleStyle: { color: lightTheme.colors.text, fontWeight: "700" },
        headerTintColor: lightTheme.colors.primary,
        contentStyle: { backgroundColor: lightTheme.colors.background }
      }}
    >
      <Stack.Screen name="index" options={{ title: "Lew" }} />
      <Stack.Screen name="user" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

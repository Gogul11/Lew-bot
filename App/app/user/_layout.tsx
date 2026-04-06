import { Stack } from "expo-router";
import { lightTheme } from "@/constants/theme";

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: lightTheme.colors.surface },
        headerTitleStyle: { color: lightTheme.colors.text, fontWeight: "700" },
        headerTintColor: lightTheme.colors.primary,
        contentStyle: { backgroundColor: lightTheme.colors.background }
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}

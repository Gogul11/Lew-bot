import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { lightTheme } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: lightTheme.colors.surface },
        headerTitleStyle: { color: lightTheme.colors.text, fontWeight: "700" },
        headerTintColor: lightTheme.colors.primary,
        tabBarActiveTintColor: lightTheme.colors.primary,
        tabBarInactiveTintColor: lightTheme.colors.textMuted,
        tabBarStyle: { backgroundColor: lightTheme.colors.surface, borderTopColor: lightTheme.colors.border }
      }}
    >
      <Tabs.Screen
        name="bot"
        options={{
          title: "Bot",
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}

import { Link } from "expo-router";
import { SafeAreaView, Text, View } from "react-native";
import { lightTheme } from "@/constants/theme";

export default function HomePage() {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <View className="flex-1 justify-center px-6">
        <View
          className="rounded-3xl border p-6"
          style={{
            backgroundColor: lightTheme.colors.surface,
            borderColor: lightTheme.colors.border
          }}
        >
          <Text className="text-center text-4xl font-bold" style={{ color: lightTheme.colors.primary }}>
            Lew
          </Text>
          <Text className="mt-3 text-center text-base" style={{ color: lightTheme.colors.textMuted }}>
            Welcome to Lew. Start by logging in or creating a new account.
          </Text>

          <Link
            href="./user/login"
            className="mt-8 rounded-xl px-4 py-3 text-center text-base font-semibold"
            style={{
              backgroundColor: lightTheme.colors.primary,
              color: "#FFFFFF"
            }}
          >
            Login
          </Link>

          <Link
            href="./user/register"
            className="mt-3 rounded-xl border px-4 py-3 text-center text-base font-semibold"
            style={{
              borderColor: lightTheme.colors.primary,
              color: lightTheme.colors.primary
            }}
          >
            Register
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

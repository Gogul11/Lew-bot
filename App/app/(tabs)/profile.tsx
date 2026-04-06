import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { lightTheme } from "@/constants/theme";
import { StoredUserDetails } from "@/types/user";
import { storageUtils } from "@/utils/storage";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUserDetails | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await storageUtils.getUser();
      setUser(storedUser);
    };

    void loadUser();
  }, []);

  const logout = async () => {
    await Promise.all([storageUtils.removeUser(), storageUtils.removeBot()]);
    Alert.alert("Logged out", "Session data cleared.", [
      {
        text: "Go Home",
        onPress: () => router.replace("/")
      }
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <View className="flex-1 px-6 py-6">
        <Text className="text-3xl font-bold" style={{ color: lightTheme.colors.text }}>
          Profile
        </Text>

        <View
          className="mt-6 rounded-2xl border p-4"
          style={{ borderColor: lightTheme.colors.border, backgroundColor: lightTheme.colors.surface }}
        >
          <Text className="text-sm" style={{ color: lightTheme.colors.textMuted }}>
            User ID
          </Text>
          <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
            {user?.userId ?? "Not available"}
          </Text>

          <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
            Username
          </Text>
          <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
            {user?.username ?? "Not available"}
          </Text>

          <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
            Email
          </Text>
          <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
            {user?.email ?? "Not available"}
          </Text>

          <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
            Logged In At
          </Text>
          <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
            {user?.loggedInAt ?? "Not available"}
          </Text>
        </View>

        <Pressable onPress={logout} className="mt-6 items-center rounded-xl py-3" style={{ backgroundColor: lightTheme.colors.primary }}>
          <Text className="text-base font-semibold text-white">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

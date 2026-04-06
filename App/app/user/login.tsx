import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { lightTheme } from "@/constants/theme";
import { StoredUserDetails } from "@/types/user";
import { createStableUserIdFromEmail, getUsernameFromEmail } from "@/utils/auth";
import { getUserFriendlyErrorMessage } from "@/utils/apierror";
import { storageUtils } from "@/utils/storage";
import { usersApiUtils } from "@/utils/usersapiutils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedEmail = email.trim().toLowerCase();
      const response = await usersApiUtils.login({
        email: normalizedEmail,
        password
      });

      const userDetails: StoredUserDetails = {
        userId: createStableUserIdFromEmail(normalizedEmail),
        email: normalizedEmail,
        username: getUsernameFromEmail(normalizedEmail),
        loggedInAt: new Date().toISOString()
      };

      await storageUtils.saveUser(userDetails);

      Alert.alert("Success", response.message, [
        {
          text: "Continue",
          onPress: () => router.replace("../bot")
        }
      ]);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Login failed");
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <View className="flex-1 px-6 pt-10">
        <Text className="text-3xl font-bold" style={{ color: lightTheme.colors.text }}>
          Welcome back
        </Text>
        <Text className="mt-2 text-base" style={{ color: lightTheme.colors.textMuted }}>
          Login to continue using Lew.
        </Text>

        <View className="mt-8 gap-y-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-xl border px-4 py-3 text-base"
            placeholderTextColor={lightTheme.colors.textMuted}
            style={{ borderColor: lightTheme.colors.border, color: lightTheme.colors.text }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            className="rounded-xl border px-4 py-3 text-base"
            placeholderTextColor={lightTheme.colors.textMuted}
            style={{ borderColor: lightTheme.colors.border, color: lightTheme.colors.text }}
          />

          <Pressable
            onPress={onSubmit}
            disabled={isSubmitting}
            className="mt-2 items-center rounded-xl py-3"
            style={{ backgroundColor: lightTheme.colors.primary, opacity: isSubmitting ? 0.8 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-semibold text-white">Login</Text>
            )}
          </Pressable>
        </View>

        <Link href="./register" className="mt-6 text-center text-base" style={{ color: lightTheme.colors.primary }}>
          Don&apos;t have an account? Register
        </Link>
      </View>
    </SafeAreaView>
  );
}

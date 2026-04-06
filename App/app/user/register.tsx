import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { lightTheme } from "@/constants/theme";
import { getUserFriendlyErrorMessage } from "@/utils/apierror";
import { usersApiUtils } from "@/utils/usersapiutils";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in username, email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await usersApiUtils.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      Alert.alert("Success", response.message, [
        {
          text: "Go to Login",
          onPress: () => router.replace("./login")
        }
      ]);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Registration failed");
      Alert.alert("Registration failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <View className="flex-1 px-6 pt-10">
        <Text className="text-3xl font-bold" style={{ color: lightTheme.colors.text }}>
          Create account
        </Text>
        <Text className="mt-2 text-base" style={{ color: lightTheme.colors.textMuted }}>
          Register to get started with Lew.
        </Text>

        <View className="mt-8 gap-y-4">
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            className="rounded-xl border px-4 py-3 text-base"
            placeholderTextColor={lightTheme.colors.textMuted}
            style={{ borderColor: lightTheme.colors.border, color: lightTheme.colors.text }}
          />

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
              <Text className="text-base font-semibold text-white">Register</Text>
            )}
          </Pressable>
        </View>

        <Link href="./login" className="mt-6 text-center text-base" style={{ color: lightTheme.colors.primary }}>
          Already have an account? Login
        </Link>
      </View>
    </SafeAreaView>
  );
}

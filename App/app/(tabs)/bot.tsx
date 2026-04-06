import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { lightTheme } from "@/constants/theme";
import { StoredBotDetails } from "@/types/bot";
import { StoredUserDetails } from "@/types/user";
import { getUserFriendlyErrorMessage } from "@/utils/apierror";
import { botsApiUtils } from "@/utils/botsapiutils";
import { storageUtils } from "@/utils/storage";

const extractBotIdFromQrData = (rawData: string) => {
  const cleaned = rawData.trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const candidate = parsed.device_id ?? parsed.bot_id ?? parsed.id;

    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  } catch {
    // QR may be a plain string. In that case return it directly.
  }

  return cleaned;
};

export default function BotScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [storedUser, setStoredUser] = useState<StoredUserDetails | null>(null);
  const [storedBot, setStoredBot] = useState<StoredBotDetails | null>(null);

  const canScan = useMemo(() => Boolean(storedUser?.userId), [storedUser]);

  useEffect(() => {
    const loadStoredState = async () => {
      const [user, bot] = await Promise.all([storageUtils.getUser(), storageUtils.getBot()]);
      setStoredUser(user);
      setStoredBot(bot);
    };

    void loadStoredState();
  }, []);

  const openScanner = async () => {
    if (!canScan) {
      Alert.alert("Login required", "Please login first to book a bot.");
      return;
    }

    const granted = permission?.granted === true;

    if (!granted) {
      const requested = await requestPermission();
      if (!requested.granted) {
        Alert.alert("Camera permission needed", "Allow camera access to scan QR.");
        return;
      }
    }

    setHasScanned(false);
    setIsScannerOpen(true);
  };

  const onBarcodeScanned = async (event: BarcodeScanningResult) => {
    if (hasScanned || isBooking || isReleasing) {
      return;
    }

    setHasScanned(true);
    setIsScannerOpen(false);

    const scannedBotId = extractBotIdFromQrData(event.data);
    if (scannedBotId.length === 0) {
      Alert.alert("Invalid QR", "Could not read bot id from QR code.");
      return;
    }

    if (!storedUser?.userId) {
      Alert.alert("Login required", "Please login before booking.");
      return;
    }

    try {
      const botDetails: StoredBotDetails = {
        scannedBotId,
        scannedAt: new Date().toISOString(),
        bookingData: null
      };

      await storageUtils.saveBot(botDetails);
      setStoredBot(botDetails);

      Alert.alert("Bot scanned", `Bot id ${scannedBotId} is ready to pair.`);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to save scanned bot");
      Alert.alert("Scan failed", message);
    }
  };

  const onPairPress = async () => {
    if (!storedUser?.userId) {
      Alert.alert("Login required", "Please login before pairing.");
      return;
    }

    if (!storedBot?.scannedBotId) {
      Alert.alert("Scan required", "Scan a bot QR code before pairing.");
      return;
    }

    try {
      setIsBooking(true);
      const response = await botsApiUtils.bookBot({ user_id: storedUser.userId });

      const pairedBotDetails: StoredBotDetails = {
        ...storedBot,
        pairedAt: new Date().toISOString(),
        bookingData: response.data ?? null
      };

      await storageUtils.saveBot(pairedBotDetails);
      setStoredBot(pairedBotDetails);

      Alert.alert("Booked", response.message);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to book bot");
      Alert.alert("Pairing failed", message);
    } finally {
      setIsBooking(false);
    }
  };

  const onReleasePress = async () => {
    if (!storedUser?.userId) {
      Alert.alert("Login required", "Please login before releasing.");
      return;
    }

    const deviceId = storedBot?.bookingData?.device_id;

    if (!deviceId) {
      Alert.alert("No booked bot", "Pair a bot before releasing it.");
      return;
    }

    try {
      setIsReleasing(true);
      const response = await botsApiUtils.releaseBot({
        user_id: storedUser.userId,
        device_id: deviceId
      });

      await storageUtils.removeBot();
      setStoredBot(null);

      Alert.alert("Released", response.message);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to release bot");
      Alert.alert("Release failed", message);
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <View className="flex-1 px-6 py-6">
        <Text className="text-3xl font-bold" style={{ color: lightTheme.colors.text }}>
          Book Bot
        </Text>
        <Text className="mt-2 text-base" style={{ color: lightTheme.colors.textMuted }}>
          Scan a bot QR code, then pair that exact bot.
        </Text>

        <View
          className="mt-6 rounded-2xl border p-4"
          style={{ borderColor: lightTheme.colors.border, backgroundColor: lightTheme.colors.surface }}
        >
          <Text className="text-sm" style={{ color: lightTheme.colors.textMuted }}>
            Logged in as
          </Text>
          <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
            {storedUser?.email ?? "Not logged in"}
          </Text>
        </View>

        {isScannerOpen ? (
          <View className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: lightTheme.colors.border }}>
            <CameraView style={{ height: 320, width: "100%" }} onBarcodeScanned={onBarcodeScanned} />
          </View>
        ) : null}

        <Pressable
          onPress={openScanner}
          disabled={isBooking || isReleasing}
          className="mt-6 items-center rounded-xl py-3"
          style={{ backgroundColor: lightTheme.colors.primary, opacity: isBooking || isReleasing ? 0.8 : 1 }}
        >
          <Text className="text-base font-semibold text-white">Scan Bot QR</Text>
        </Pressable>

        {isBooking || isReleasing ? (
          <View className="mt-4 flex-row items-center justify-center gap-x-2">
            <ActivityIndicator color={lightTheme.colors.primary} />
            <Text style={{ color: lightTheme.colors.textMuted }}>
              {isReleasing ? "Releasing bot..." : "Booking bot..."}
            </Text>
          </View>
        ) : null}

        {storedBot ? (
          <View
            className="mt-6 rounded-2xl border p-4"
            style={{ borderColor: lightTheme.colors.border, backgroundColor: lightTheme.colors.surface }}
          >
            <Text className="text-sm" style={{ color: lightTheme.colors.textMuted }}>
              Scanned Bot Id
            </Text>
            <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
              {storedBot.scannedBotId}
            </Text>

            <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
              Booked Device Id
            </Text>
            <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
              {storedBot.bookingData?.device_id ?? "Not available"}
            </Text>

            <Pressable
              onPress={onPairPress}
              disabled={isBooking || isReleasing}
              className="mt-5 items-center rounded-xl py-3"
              style={{ backgroundColor: lightTheme.colors.primaryDark, opacity: isBooking || isReleasing ? 0.8 : 1 }}
            >
              <Text className="text-base font-semibold text-white">Pair Bot</Text>
            </Pressable>

            {storedBot.bookingData?.device_id ? (
              <Pressable
                onPress={onReleasePress}
                disabled={isBooking || isReleasing}
                className="mt-3 items-center rounded-xl py-3"
                style={{ backgroundColor: lightTheme.colors.danger, opacity: isBooking || isReleasing ? 0.8 : 1 }}
              >
                <Text className="text-base font-semibold text-white">Release Bot</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { lightTheme } from "@/constants/theme";
import { StoredBotDetails } from "@/types/bot";
import { StoredUserDetails } from "@/types/user";
import { getUserFriendlyErrorMessage } from "@/utils/apierror";
import { bleUtils } from "@/utils/ble";
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
  const [isPairing, setIsPairing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isSendingMovement, setIsSendingMovement] = useState(false);
  const [storedUser, setStoredUser] = useState<StoredUserDetails | null>(null);
  const [storedBot, setStoredBot] = useState<StoredBotDetails | null>(null);
  const [isBlePaired, setIsBlePaired] = useState(false);

  const canScan = useMemo(() => Boolean(storedUser?.userId), [storedUser]);

  useEffect(() => {
    const loadStoredState = async () => {
      const [user, bot] = await Promise.all([storageUtils.getUser(), storageUtils.getBot()]);
      const paired = await bleUtils.isLewDevicePaired();
      setStoredUser(user);
      setStoredBot(bot);
      setIsBlePaired(paired);
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
    if (hasScanned || isBooking || isPairing || isVerifying || isReleasing) {
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
      await bleUtils.disconnectLewDevice();
      setIsBlePaired(false);

      const botDetails: StoredBotDetails = {
        scannedBotId,
        scannedAt: new Date().toISOString(),
        bookedAt: undefined,
        pairedAt: undefined,
        verifiedAt: undefined,
        bookingData: null
      };

      await storageUtils.saveBot(botDetails);
      setStoredBot(botDetails);

      Alert.alert("Bot scanned", `Bot id ${scannedBotId} is ready to book.`);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to save scanned bot");
      Alert.alert("Scan failed", message);
    }
  };

  const onBookPress = async () => {
    if (!storedUser?.userId) {
      Alert.alert("Login required", "Please login before booking.");
      return;
    }

    if (!storedBot?.scannedBotId) {
      Alert.alert("Scan required", "Scan a bot QR code before booking.");
      return;
    }

    if (storedBot.bookingData?.device_id && storedBot.bookingData?.token) {
      Alert.alert("Already booked", "This bot is already booked. You can pair or release it.");
      return;
    }

    try {
      setIsBooking(true);
      const response = await botsApiUtils.bookBot({ user_id: storedUser.userId });
      const bookedBotDetails: StoredBotDetails = {
        ...storedBot,
        bookedAt: new Date().toISOString(),
        pairedAt: undefined,
        verifiedAt: undefined,
        bookingData: response.data ?? null
      };

      await storageUtils.saveBot(bookedBotDetails);
      setStoredBot(bookedBotDetails);

      Alert.alert("Booked", response.message);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to book bot");
      Alert.alert("Booking failed", message);
    } finally {
      setIsBooking(false);
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

    const bookingData = storedBot.bookingData;

    if (!bookingData?.device_id || !bookingData.token) {
      Alert.alert("Book required", "Book the bot first, then tap Pair.");
      return;
    }

    try {
      setIsPairing(true);
      await bleUtils.pairLewDevice();

      const pairedBotDetails: StoredBotDetails = {
        ...storedBot,
        pairedAt: new Date().toISOString(),
        verifiedAt: undefined,
        bookingData
      };

      await storageUtils.saveBot(pairedBotDetails);
      setStoredBot(pairedBotDetails);
      setIsBlePaired(true);

      Alert.alert("Pairing complete", "Lew is paired. Tap Verify to send the access details.");
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to pair bot");
      Alert.alert("Pairing failed", message);
    } finally {
      setIsPairing(false);
    }
  };

  const onVerifyPress = async () => {
    if (!storedUser?.userId) {
      Alert.alert("Login required", "Please login before verifying.");
      return;
    }

    if (!storedBot?.scannedBotId) {
      Alert.alert("Scan required", "Scan a bot QR code before verifying.");
      return;
    }

    const bookingData = storedBot.bookingData;

    if (!bookingData?.device_id || !bookingData.token) {
      Alert.alert("Book required", "Book the bot first, then tap Verify.");
      return;
    }

    if (!isBlePaired) {
      Alert.alert("Pair required", "Pair the bot first, then tap Verify.");
      return;
    }

    try {
      setIsVerifying(true);
      await bleUtils.sendLewAccess({
        device_id: bookingData.device_id,
        user_id: storedUser.userId,
        token: bookingData.token
      });

      const verifiedBotDetails: StoredBotDetails = {
        ...storedBot,
        verifiedAt: new Date().toISOString(),
        bookingData
      };

      await storageUtils.saveBot(verifiedBotDetails);
      setStoredBot(verifiedBotDetails);

      Alert.alert("Verification sent", "Lew received the access details over BLE.");
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to verify bot");
      Alert.alert("Verification failed", message);
    } finally {
      setIsVerifying(false);
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
      await bleUtils.disconnectLewDevice();
      setIsBlePaired(false);

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

  const onMovementPress = async (shouldMove: boolean) => {
    if (!storedBot?.verifiedAt) {
      Alert.alert("Verify required", "Verify the bot first, then use Start or Stop.");
      return;
    }

    if (!isBlePaired) {
      Alert.alert("Pair required", "Pair the bot first before sending movement commands.");
      return;
    }

    try {
      setIsSendingMovement(true);
      await bleUtils.sendMovementCommand(shouldMove);
      Alert.alert("Command sent", shouldMove ? "Start command sent." : "Stop command sent.");
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, "Failed to send movement command");
      Alert.alert("Command failed", message);
    } finally {
      setIsSendingMovement(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: lightTheme.colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold" style={{ color: lightTheme.colors.text }}>
          Book Bot
        </Text>
        <Text className="mt-2 text-base" style={{ color: lightTheme.colors.textMuted }}>
          Scan the QR, book the bot, pair over BLE, then verify to send details.
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
          disabled={isBooking || isPairing || isVerifying || isReleasing}
          className="mt-6 items-center rounded-xl py-3"
          style={{
            backgroundColor: lightTheme.colors.primary,
            opacity: isBooking || isPairing || isVerifying || isReleasing ? 0.8 : 1
          }}
        >
          <Text className="text-base font-semibold text-white">Scan Bot QR</Text>
        </Pressable>

        {isBooking || isPairing || isVerifying || isReleasing || isSendingMovement ? (
          <View className="mt-4 flex-row items-center justify-center gap-x-2">
            <ActivityIndicator color={lightTheme.colors.primary} />
            <Text style={{ color: lightTheme.colors.textMuted }}>
              {isReleasing
                ? "Releasing bot..."
                : isSendingMovement
                  ? "Sending movement command..."
                : isVerifying
                  ? "Sending access details..."
                  : isPairing
                    ? "Pairing over BLE..."
                    : "Booking bot..."}
            </Text>
          </View>
        ) : null}

        {storedBot?.verifiedAt ? (
          <View
            className="mt-6 rounded-2xl border p-4"
            style={{ borderColor: lightTheme.colors.border, backgroundColor: lightTheme.colors.surface }}
          >
            <Text className="text-sm" style={{ color: lightTheme.colors.textMuted }}>
              Movement Controls
            </Text>

            <Pressable
              onPress={() => onMovementPress(true)}
              disabled={isBooking || isPairing || isVerifying || isReleasing || isSendingMovement || !isBlePaired}
              className="mt-4 items-center rounded-xl py-3"
              style={{
                backgroundColor: lightTheme.colors.primary,
                opacity:
                  isBooking || isPairing || isVerifying || isReleasing || isSendingMovement || !isBlePaired
                    ? 0.8
                    : 1
              }}
            >
              <Text className="text-base font-semibold text-white">Start</Text>
            </Pressable>

            <Pressable
              onPress={() => onMovementPress(false)}
              disabled={isBooking || isPairing || isVerifying || isReleasing || isSendingMovement || !isBlePaired}
              className="mt-3 items-center rounded-xl py-3"
              style={{
                backgroundColor: lightTheme.colors.danger,
                opacity:
                  isBooking || isPairing || isVerifying || isReleasing || isSendingMovement || !isBlePaired
                    ? 0.8
                    : 1
              }}
            >
              <Text className="text-base font-semibold text-white">Stop</Text>
            </Pressable>
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

            <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
              Booked At
            </Text>
            <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
              {storedBot.bookedAt ? new Date(storedBot.bookedAt).toLocaleString() : "Not yet"}
            </Text>

            <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
              BLE Paired
            </Text>
            <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
              {storedBot.pairedAt && isBlePaired ? new Date(storedBot.pairedAt).toLocaleString() : "Not yet"}
            </Text>

            <Text className="mt-3 text-sm" style={{ color: lightTheme.colors.textMuted }}>
              Details Verified
            </Text>
            <Text className="text-base font-semibold" style={{ color: lightTheme.colors.text }}>
              {storedBot.verifiedAt ? new Date(storedBot.verifiedAt).toLocaleString() : "Not yet"}
            </Text>

            <Pressable
              onPress={onBookPress}
              disabled={isBooking || isPairing || isVerifying || isReleasing || Boolean(storedBot.bookingData?.device_id)}
              className="mt-5 items-center rounded-xl py-3"
              style={{
                backgroundColor: lightTheme.colors.primaryDark,
                opacity:
                  isBooking || isPairing || isVerifying || isReleasing || Boolean(storedBot.bookingData?.device_id)
                    ? 0.8
                    : 1
              }}
            >
              <Text className="text-base font-semibold text-white">
                {storedBot.bookingData?.device_id ? "Booked" : "Book Bot"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onPairPress}
              disabled={
                isBooking ||
                isPairing ||
                isVerifying ||
                isReleasing ||
                isBlePaired ||
                !storedBot.bookingData?.device_id ||
                !storedBot.bookingData?.token
              }
              className="mt-3 items-center rounded-xl py-3"
              style={{
                backgroundColor: lightTheme.colors.primary,
                opacity:
                  isBooking ||
                  isPairing ||
                  isVerifying ||
                  isReleasing ||
                  isBlePaired ||
                  !storedBot.bookingData?.device_id ||
                  !storedBot.bookingData?.token
                    ? 0.8
                    : 1
              }}
            >
              <Text className="text-base font-semibold text-white">
                {isBlePaired ? "Paired" : storedBot.pairedAt ? "Retry Pairing" : "Pair Bot"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onVerifyPress}
              disabled={
                isBooking ||
                isPairing ||
                isVerifying ||
                isReleasing ||
                !storedBot.bookingData?.device_id ||
                !storedBot.bookingData?.token ||
                !isBlePaired
              }
              className="mt-3 items-center rounded-xl py-3"
              style={{
                backgroundColor: lightTheme.colors.primaryDark,
                opacity:
                  isBooking ||
                  isPairing ||
                  isVerifying ||
                  isReleasing ||
                  !storedBot.bookingData?.device_id ||
                  !storedBot.bookingData?.token ||
                  !isBlePaired
                    ? 0.8
                    : 1
              }}
            >
              <Text className="text-base font-semibold text-white">
                {storedBot.verifiedAt ? "Verify Again" : "Verify Bot"}
              </Text>
            </Pressable>

            {storedBot.bookingData?.device_id ? (
              <Pressable
                onPress={onReleasePress}
                disabled={isBooking || isPairing || isVerifying || isReleasing}
                className="mt-3 items-center rounded-xl py-3"
                style={{
                  backgroundColor: lightTheme.colors.danger,
                  opacity: isBooking || isPairing || isVerifying || isReleasing ? 0.8 : 1
                }}
              >
                <Text className="text-base font-semibold text-white">Release Bot</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

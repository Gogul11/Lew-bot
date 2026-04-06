import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

const LEW_DEVICE_NAME = "Lew-1";
const LEW_SERVICE_UUID = "1234";
const LEW_CHARACTERISTIC_UUID = "abcd";
const LEW_MOVEMENT_CHARACTERISTIC_UUID = "ef12";
const SCAN_TIMEOUT_MS = 15000;
const POST_WRITE_CONNECTION_HOLD_MS = 3000;

type PairPayload = {
  device_id: string;
  user_id: string;
  token: string;
};

let activeManager: BleManager | null = null;
let activeDevice: Device | null = null;

const waitForPoweredOn = (manager: BleManager) =>
  new Promise<void>((resolve, reject) => {
    const subscription = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        subscription.remove();
        resolve();
      }
    }, true);

    setTimeout(() => {
      subscription.remove();
      reject(new Error("Bluetooth is unavailable. Turn it on and try again."));
    }, 10000);
  });

const requestAndroidBlePermissions = async () => {
  if (Platform.OS !== "android") {
    return true;
  }

  if (typeof Platform.Version !== "number") {
    return true;
  }

  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ]);

    return Object.values(result).every((value) => value === PermissionsAndroid.RESULTS.GRANTED);
  }

  const locationPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return locationPermission === PermissionsAndroid.RESULTS.GRANTED;
};

const toBase64 = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }

  const bytes = new TextEncoder().encode(value);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    output += alphabet[(chunk >> 18) & 63];
    output += alphabet[(chunk >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? alphabet[chunk & 63] : "=";
  }

  return output;
};

const sleep = (durationMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });

const findLewDevice = (manager: BleManager) =>
  new Promise<Device>((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      manager.stopDeviceScan();
      callback();
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error("Lew device not found. Keep it powered on and nearby, then try again.")));
    }, SCAN_TIMEOUT_MS);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        clearTimeout(timeout);
        finish(() => reject(new Error(error.message)));
        return;
      }

      const discoveredName = device?.name ?? device?.localName;

      if (device && discoveredName === LEW_DEVICE_NAME) {
        clearTimeout(timeout);
        finish(() => resolve(device));
      }
    });
  });

export const bleUtils = {
  async pairLewDevice() {
    const hasPermission = await requestAndroidBlePermissions();

    if (!hasPermission) {
      throw new Error("Bluetooth permission is required to pair with the bot.");
    }

    if (activeManager && activeDevice) {
      const isStillConnected = await activeDevice.isConnected();
      if (isStillConnected) {
        return activeDevice;
      }

      activeManager.destroy();
      activeManager = null;
      activeDevice = null;
    }

    const manager = new BleManager();

    try {
      await waitForPoweredOn(manager);

      const device = await findLewDevice(manager);
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      activeManager = manager;
      activeDevice = connectedDevice;

      return connectedDevice;
    } catch (error) {
      manager.destroy();
      throw error;
    }
  },

  async sendLewAccess(payload: PairPayload) {
    if (!activeDevice) {
      throw new Error("Pair the Lew device first, then tap Verify.");
    }

    const isStillConnected = await activeDevice.isConnected();
    if (!isStillConnected) {
      await bleUtils.disconnectLewDevice();
      throw new Error("Lew is no longer connected. Pair it again, then tap Verify.");
    }

    try {
      await activeDevice.writeCharacteristicWithResponseForService(
        LEW_SERVICE_UUID,
        LEW_CHARACTERISTIC_UUID,
        toBase64(JSON.stringify(payload))
      );

      await sleep(POST_WRITE_CONNECTION_HOLD_MS);

      return activeDevice;
    } catch (error) {
      throw error;
    }
  },

  async sendMovementCommand(isMoving: boolean) {
    if (!activeDevice) {
      throw new Error("Pair the Lew device first before sending movement updates.");
    }

    const isStillConnected = await activeDevice.isConnected();
    if (!isStillConnected) {
      await bleUtils.disconnectLewDevice();
      throw new Error("Lew is no longer connected. Pair it again to resume movement updates.");
    }

    await activeDevice.writeCharacteristicWithResponseForService(
      LEW_SERVICE_UUID,
      LEW_MOVEMENT_CHARACTERISTIC_UUID,
      toBase64(isMoving ? "1" : "0")
    );

    return activeDevice;
  },

  async disconnectLewDevice() {
    if (activeDevice) {
      const isStillConnected = await activeDevice.isConnected();
      if (isStillConnected) {
        await activeDevice.cancelConnection();
      }
    }

    activeDevice = null;

    if (activeManager) {
      activeManager.destroy();
      activeManager = null;
    }
  },

  async isLewDevicePaired() {
    if (!activeDevice) {
      return false;
    }

    return activeDevice.isConnected();
  }
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoredBotDetails } from "@/types/bot";
import { StoredUserDetails } from "@/types/user";

export const STORAGE_KEYS = {
  user: "lew:user",
  bot: "lew:bot"
} as const;

const setJsonItem = async <T>(key: string, value: T) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const getJsonItem = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const storageUtils = {
  saveUser: (user: StoredUserDetails) => setJsonItem(STORAGE_KEYS.user, user),
  getUser: () => getJsonItem<StoredUserDetails>(STORAGE_KEYS.user),
  removeUser: () => AsyncStorage.removeItem(STORAGE_KEYS.user),

  saveBot: (bot: StoredBotDetails) => setJsonItem(STORAGE_KEYS.bot, bot),
  getBot: () => getJsonItem<StoredBotDetails>(STORAGE_KEYS.bot),
  removeBot: () => AsyncStorage.removeItem(STORAGE_KEYS.bot)
};

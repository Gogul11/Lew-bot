import axios from "axios";
import { Platform } from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === "android" ? "<Backend-Url>" : "<Backend-Url>");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export { API_BASE_URL };

import { ApiResponse } from "@/types/user";

export type BookBotPayload = {
  user_id: string;
};

export type ReleaseBotPayload = {
  user_id: string;
  device_id: string;
};

export type BotRecord = {
  _id?: string;
  device_id?: string;
  mac_address?: string;
  is_active?: boolean;
  token?: string;
  user_id?: string | null;
};

export type BookBotResponse = ApiResponse & {
  data?: BotRecord;
};

export type ReleaseBotResponse = ApiResponse;

export type StoredBotDetails = {
  scannedBotId: string;
  scannedAt: string;
  pairedAt?: string;
  bookingData: BotRecord | null;
};

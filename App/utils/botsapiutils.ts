import { api } from "@/lib/api";
import { BookBotPayload, BookBotResponse, ReleaseBotPayload, ReleaseBotResponse } from "@/types/bot";
import { normalizeAxiosError } from "@/utils/apierror";

export const BOT_API_LINKS = {
  bookBot: "/bots/bookBot",
  releaseBot: "/bots/releaseBot"
} as const;

export const botsApiUtils = {
  async bookBot(payload: BookBotPayload): Promise<BookBotResponse> {
    try {
      const response = await api.post<BookBotResponse>(BOT_API_LINKS.bookBot, payload);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, "Bot not found.");
    }
  },

  async releaseBot(payload: ReleaseBotPayload): Promise<ReleaseBotResponse> {
    try {
      const response = await api.post<ReleaseBotResponse>(BOT_API_LINKS.releaseBot, payload);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, "Failed to release bot.");
    }
  }
};

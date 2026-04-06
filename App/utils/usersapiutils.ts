import { api } from "@/lib/api";
import { ApiResponse, LoginPayload, RegisterPayload } from "@/types/user";
import { normalizeAxiosError } from "@/utils/apierror";

export const USER_API_LINKS = {
  register: "/user/create",
  login: "/user/login"
} as const;

export const usersApiUtils = {
  async register(payload: RegisterPayload): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(USER_API_LINKS.register, payload);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, "User not found.");
    }
  },

  async login(payload: LoginPayload): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(USER_API_LINKS.login, payload);
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error, "User not found.");
    }
  }
};

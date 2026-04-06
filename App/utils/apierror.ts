import axios from "axios";

export class ApiClientError extends Error {
  statusCode?: number;
  code?: string;
  isNetworkError: boolean;

  constructor(message: string, options?: { statusCode?: number; code?: string; isNetworkError?: boolean }) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.isNetworkError = options?.isNetworkError ?? false;
  }
}

export const normalizeAxiosError = (error: unknown, notFoundMessage: string) => {
  if (!axios.isAxiosError<{ message?: string }>(error)) {
    if (error instanceof Error) {
      return new ApiClientError(error.message);
    }

    return new ApiClientError("Something went wrong. Please try again.");
  }

  const statusCode = error.response?.status;
  const code = error.code;
  const serverMessage = error.response?.data?.message;
  const isNetworkError = !error.response && Boolean(error.request);

  if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
    return new ApiClientError(serverMessage, { statusCode, code, isNetworkError });
  }

  if (code === "ECONNABORTED") {
    return new ApiClientError("Request timed out. Please try again.", { statusCode, code, isNetworkError });
  }

  if (isNetworkError) {
    return new ApiClientError("Unable to connect to server. Check your network or API URL.", {
      statusCode,
      code,
      isNetworkError
    });
  }

  if (statusCode === 400) {
    return new ApiClientError("Invalid request data.", { statusCode, code, isNetworkError });
  }

  if (statusCode === 401) {
    return new ApiClientError("Invalid credentials.", { statusCode, code, isNetworkError });
  }

  if (statusCode === 404) {
    return new ApiClientError(notFoundMessage, { statusCode, code, isNetworkError });
  }

  if (statusCode === 409) {
    return new ApiClientError("Resource already exists.", { statusCode, code, isNetworkError });
  }

  if ((statusCode ?? 0) >= 500) {
    return new ApiClientError("Server error. Please try again shortly.", { statusCode, code, isNetworkError });
  }

  return new ApiClientError("Request failed. Please try again.", { statusCode, code, isNetworkError });
};

export const getUserFriendlyErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

/**
 * LoanMate — API Client
 * Centralized HTTP/Supabase client with error handling, retries, typing, and auth token management.
 * When Supabase is connected, this becomes the single point of contact.
 * For now, it wraps mock data with the same interface the real API will use.
 */
import { API } from "@/config/constants";

// ─── Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  /** Skip auth token header for public endpoints */
  skipAuth?: boolean;
}

// ─── API Client Class ────────────────────────────────────────────
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private tokenProvider: (() => string | null) | null = null;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Set a static auth token.
   */
  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Register a dynamic token provider (used by securityService).
   * This function is called on every request to get the latest token.
   */
  setTokenProvider(provider: () => string | null) {
    this.tokenProvider = provider;
  }

  clearAuthToken() {
    delete this.defaultHeaders["Authorization"];
    this.tokenProvider = null;
  }

  /**
   * Build request headers, injecting the auth token if available.
   */
  private _buildHeaders(extraHeaders: Record<string, string> = {}, skipAuth = false): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...extraHeaders };

    if (!skipAuth && !headers["Authorization"] && this.tokenProvider) {
      const token = this.tokenProvider();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      headers = {},
      timeout = API.REQUEST_TIMEOUT_MS,
      skipAuth = false,
    } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this._buildHeaders(headers, skipAuth),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        return {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required. Please log in again.",
          },
          status: 401,
        };
      }

      // Handle 429 Too Many Requests (server-side rate limiting)
      if (response.status === 429) {
        return {
          data: null,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
          status: 429,
        };
      }

      const data = response.ok ? await response.json() : null;
      const error = !response.ok
        ? {
            code: `HTTP_${response.status}`,
            message: response.statusText,
            details: await response.json().catch(() => null),
          }
        : null;

      return { data, error, status: response.status };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      return {
        data: null,
        error: {
          code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
          message: isAbort ? "Request timed out" : "Network error",
          details: err,
        },
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  async put<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  async patch<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// ─── Singleton Export ────────────────────────────────────────────
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || ""
);

export default ApiClient;

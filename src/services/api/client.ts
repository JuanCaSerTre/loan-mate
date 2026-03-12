/**
 * LoanMate — API Client
 * Centralized HTTP/Supabase client with error handling, retries, and typing.
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
}

// ─── API Client Class ────────────────────────────────────────────
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.defaultHeaders["Authorization"];
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, timeout = API.REQUEST_TIMEOUT_MS } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

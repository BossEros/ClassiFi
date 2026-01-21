const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";

/**
 * Configuration options for an API request.
 */
export interface ApiRequestConfig {
  /** The HTTP method to use (GET, POST, etc.). Defaults to GET. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Custom headers to include in the request. */
  headers?: HeadersInit;
  /** The request body/payload. */
  body?: unknown;
}

/**
 * Standardized API response structure.
 *
 * @template T - The type of the data returned by the API.
 */
export interface ApiResponse<T> {
  /** The data returned by the API, if successful. */
  data?: T;
  /** Error message, if the request failed. */
  error?: string;
  /** The HTTP status code of the response. */
  status: number;
}

/**
 * Gets the auth token from localStorage.
 * This is where the authService stores the token after login.
 *
 * @returns The authentication token if present, otherwise null.
 */
function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

/**
 * Base API client for making HTTP requests throughout the application.
 * Handles authentication, common headers, and error normalization.
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Makes an API request to the backend.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call (e.g., "/users").
   * @param config - The request configuration (method, headers, body).
   * @returns A promise resolving to the API response.
   */
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body } = config;

    const url = `${this.baseURL}${endpoint}`;

    // Get auth token and build headers
    // Only include Content-Type for requests with a body
    const authToken = getAuthToken();
    const requestHeaders: HeadersInit = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear auth state and redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");

          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes("/login")) {
            console.warn(
              "[Auth] Token expired or invalid, redirecting to login...",
            );
            window.location.href = "/login?expired=true";
          }

          return {
            error: "Session expired. Please log in again.",
            status: response.status,
          };
        }

        // Extract error message from different possible response formats
        let errorMessage = "An error occurred";

        if (data.error && data.error.message) {
          // Backend error format: { success: false, error: { message: "..." } }
          errorMessage = data.error.message;
        } else if (data.detail) {
          // FastAPI HTTPException format
          errorMessage = data.detail;
        } else if (data.message) {
          // Custom error format
          errorMessage = data.message;
        } else if (typeof data === "string") {
          errorMessage = data;
        }

        return {
          error: errorMessage,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to the server. Please check your internet connection.",
        status: 0,
      };
    }
  }

  /**
   * Performs a GET request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param headers - Optional custom headers.
   * @returns A promise resolving to the API response.
   */
  async get<T>(
    endpoint: string,
    headers?: HeadersInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  /**
   * Performs a POST request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param body - The payload to send.
   * @param headers - Optional custom headers.
   * @returns A promise resolving to the API response.
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  /**
   * Performs a PUT request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param body - The payload to send.
   * @param headers - Optional custom headers.
   * @returns A promise resolving to the API response.
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  /**
   * Performs a PATCH request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param body - The payload to send.
   * @param headers - Optional custom headers.
   * @returns A promise resolving to the API response.
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  /**
   * Performs a DELETE request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param body - Optional payload for DELETE requests.
   * @param headers - Optional custom headers.
   * @returns A promise resolving to the API response.
   */
  async delete<T>(
    endpoint: string,
    body?: unknown,
    headers?: HeadersInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", body, headers });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

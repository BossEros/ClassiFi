import { supabase } from "@/data/api/supabaseClient"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1"

/**
 * Configuration options for an API request.
 */
export interface ApiRequestConfig {
  /** The HTTP method to use (GET, POST, etc.). Defaults to GET. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Custom headers to include in the request. */
  headers?: HeadersInit
  /** The request body/payload. */
  body?: unknown
  /** Response type - 'json' (default) or 'blob' for binary data. */
  responseType?: "json" | "blob"
}

/**
 * Standardized API response structure.
 *
 * @template T - The type of the data returned by the API.
 */
export interface ApiResponse<T> {
  /** The data returned by the API, if successful. */
  data?: T
  /** Error message, if the request failed. */
  error?: string
  /** The HTTP status code of the response. */
  status: number
}

/**
 * Gets the auth token from Supabase session.
 * Uses Supabase's secure session management instead of manual localStorage storage.
 *
 * @returns The authentication token if present, otherwise null.
 */
async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()

  return data.session?.access_token ?? null
}

/**
 * Base API client for making HTTP requests throughout the application.
 * Handles authentication, common headers, and error normalization.
 */
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Makes an API request to the backend.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call (e.g., "/users").
   * @param config - The request configuration (method, headers, body, responseType).
   * @returns A promise resolving to the API response.
   */
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, responseType = "json" } = config

    const url = `${this.baseURL}${endpoint}`

    // Get auth token and build headers
    // Only include Content-Type for requests with a body
    const authToken = await getAuthToken()
    const requestHeaders: HeadersInit = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      // Handle blob responses
      if (responseType === "blob") {
        if (!response.ok) {
          // For blob errors, try to read as text for error message
          const errorText = await response.text()
          let errorMessage = "An error occurred"
          
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.error?.message) {
              errorMessage = errorData.error.message
            } else if (errorData.detail) {
              errorMessage = errorData.detail
            } else if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch {
            errorMessage = errorText || errorMessage
          }

          return {
            error: errorMessage,
            status: response.status,
          }
        }

        const blob = await response.blob()
        return {
          data: blob as T,
          status: response.status,
        }
      }

      // Parse response defensively - handle empty or non-JSON responses
      const rawText = await response.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: Record<string, any> | string | null = null

      if (rawText) {
        try {
          data = JSON.parse(rawText) as Record<string, any>
        } catch {
          // If JSON parsing fails, use raw text as the data
          data = rawText
        }
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear user data (token is managed by Supabase)
          localStorage.removeItem("user")

          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes("/login")) {
            console.warn(
              "[Auth] Token expired or invalid, redirecting to login...",
            )
            window.location.href = "/login?expired=true"
          }

          return {
            error: "Session expired. Please log in again.",
            status: response.status,
          }
        }

        // Extract error message from different possible response formats
        let errorMessage = "An error occurred"

        if (typeof data === "object" && data !== null) {
          if (data.error?.message) {
            // Backend error format: { success: false, error: { message: "..." } }
            errorMessage = data.error.message
          } else if (data.detail) {
            // FastAPI HTTPException format
            errorMessage = data.detail
          } else if (data.message) {
            // Custom error format
            errorMessage = data.message
          }
        } else if (typeof data === "string") {
          errorMessage = data
        }

        return {
          error: errorMessage,
          status: response.status,
        }
      }

      return {
        data: data as T,
        status: response.status,
      }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to the server. Please check your internet connection.",
        status: 0,
      }
    }
  }

  /**
   * Performs a GET request.
   *
   * @template T - The expected response data type.
   * @param endpoint - The API endpoint to call.
   * @param config - Optional request configuration (headers, responseType).
   * @returns A promise resolving to the API response.
   */
  async get<T>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", ...config })
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
    return this.request<T>(endpoint, { method: "POST", body, headers })
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
    return this.request<T>(endpoint, { method: "PUT", body, headers })
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
    return this.request<T>(endpoint, { method: "PATCH", body, headers })
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
    return this.request<T>(endpoint, { method: "DELETE", body, headers })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: HeadersInit
  body?: unknown
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

/**
 * Base API client for making HTTP requests
 */
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Makes an API request
   */
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body } = config

    const url = `${this.baseURL}${endpoint}`

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract error message from different possible response formats
        let errorMessage = 'An error occurred'

        if (data.detail) {
          // FastAPI HTTPException format
          errorMessage = data.detail
        } else if (data.message) {
          // Custom error format
          errorMessage = data.message
        } else if (typeof data === 'string') {
          errorMessage = data
        }

        return {
          error: errorMessage,
          status: response.status
        }
      }

      return {
        data,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unable to connect to the server. Please check your internet connection.',
        status: 0
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    body?: unknown,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', body, headers })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

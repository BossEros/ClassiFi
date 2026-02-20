import { useCallback, useState, type Dispatch, type SetStateAction } from "react"

interface ExecuteRequestArgs<TResponse> {
  requestFn: () => Promise<TResponse>
  onSuccess: (response: TResponse) => void
  fallbackErrorMessage: string
}

/**
 * Manages loading and error state for async page requests.
 *
 * @param initialLoading - Initial loading state value.
 * @returns Loading/error state and an execute helper.
 */
export function useRequestState(initialLoading: boolean = true): {
  isLoading: boolean
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  executeRequest: <TResponse>(
    args: ExecuteRequestArgs<TResponse>,
  ) => Promise<void>
} {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const executeRequest = useCallback(
    async <TResponse,>({
      requestFn,
      onSuccess,
      fallbackErrorMessage,
    }: ExecuteRequestArgs<TResponse>): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await requestFn()
        onSuccess(response)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : fallbackErrorMessage,
        )
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { isLoading, error, setError, executeRequest }
}

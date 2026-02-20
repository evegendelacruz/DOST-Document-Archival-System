/**
 * API client utility that automatically includes the user ID header
 * for activity logging purposes.
 */

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user?.id || null;
  } catch {
    return null;
  }
}

interface FetchOptions extends RequestInit {
  skipUserHeader?: boolean;
}

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipUserHeader, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {};

  // Add user ID header for activity logging
  if (!skipUserHeader) {
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }
  }

  // Merge with custom headers
  const mergedHeaders = {
    ...headers,
    ...(customHeaders as Record<string, string>),
  };

  return fetch(url, {
    ...restOptions,
    headers: mergedHeaders,
  });
}

// Convenience methods
export const api = {
  get: (url: string, options?: FetchOptions) =>
    apiFetch(url, { ...options, method: 'GET' }),

  post: (url: string, body?: unknown, options?: FetchOptions) =>
    apiFetch(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (url: string, body?: unknown, options?: FetchOptions) =>
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (url: string, options?: FetchOptions) =>
    apiFetch(url, { ...options, method: 'DELETE' }),

  // For form data uploads (doesn't set Content-Type header)
  upload: (url: string, formData: FormData, options?: FetchOptions) => {
    const userId = getUserId();
    if (userId) {
      formData.append('userId', userId);
    }
    return apiFetch(url, {
      ...options,
      method: 'POST',
      body: formData,
    });
  },
};

export default api;

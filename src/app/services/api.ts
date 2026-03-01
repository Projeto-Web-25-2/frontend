const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL não configurada');
}

interface ApiOptions extends RequestInit {
  authToken?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }
  return response.json() as Promise<T>;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authToken, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Erro na API');
    throw new Error(errorText || 'Erro na API');
  }

  return parseResponse<T>(response);
}

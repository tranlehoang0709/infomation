export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error('Thiếu NEXT_PUBLIC_API_URL.');
  return `${base.replace(/\/$/, '')}${path}`;
}

export function apiAssetUrl(path: string) {
  return apiUrl(path);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body && !(typeof FormData !== 'undefined' && init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng thử lại sau.', 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : Array.isArray(payload?.message) ? payload.message.join(' ') : 'Đã xảy ra lỗi. Vui lòng thử lại.';
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

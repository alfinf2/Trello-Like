const API_BASE = (
    (import.meta.env.VITE_API_URL as string | undefined) ?? ''
).replace(/\/+$/, '');

const TOKEN_KEY = 'task-tracker.token';

export const TOKEN_STORAGE_KEY = TOKEN_KEY;

export function getToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (token === null) {
        window.localStorage.removeItem(TOKEN_KEY);

        return;
    }

    window.localStorage.setItem(TOKEN_KEY, token);
}

export class ApiError extends Error {
    readonly status: number;

    readonly errors: Record<string, string[]> | undefined;

    constructor(
        message: string,
        status: number,
        errors?: Record<string, string[]>,
    ) {
        super(message);

        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(
    handler: UnauthorizedHandler | null,
): void {
    unauthorizedHandler = handler;
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
}

interface ErrorPayload {
    message?: unknown;
    errors?: unknown;
}

async function request<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const method = options.method ?? 'GET';
    const headers: Record<string, string> = { Accept: 'application/json' };

    const token = getToken();

    if (token !== null) {
        headers.Authorization = `Bearer ${token}`;
    }

    let body: BodyInit | undefined;

    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.body);
    }

    let response: Response;

    try {
        response = await fetch(`${API_BASE}/api/v1${path}`, {
            method,
            headers,
            body,
        });
    } catch {
        throw new ApiError(
            'Unable to reach the server. Please check your connection.',
            0,
        );
    }

    let payload: unknown = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const errorPayload = (payload ?? {}) as ErrorPayload;

        const message =
            typeof errorPayload.message === 'string' &&
            errorPayload.message !== ''
                ? errorPayload.message
                : response.statusText ||
                  `Request failed with status ${response.status}`;

        const errors =
            errorPayload.errors && typeof errorPayload.errors === 'object'
                ? (errorPayload.errors as Record<string, string[]>)
                : undefined;

        if (response.status === 401 && unauthorizedHandler !== null) {
            unauthorizedHandler();
        }

        throw new ApiError(message, response.status, errors);
    }

    return payload as T;
}

export const api = {
    get: <T>(path: string): Promise<T> => request<T>(path),
    post: <T>(path: string, body?: unknown): Promise<T> =>
        request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: unknown): Promise<T> =>
        request<T>(path, { method: 'PUT', body }),
    delete: <T>(path: string, body?: unknown): Promise<T> =>
        request<T>(path, { method: 'DELETE', body }),
};

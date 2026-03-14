export const AUTH_TOKEN_STORAGE_KEY = "altern.auth.token";

export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
    if (!token) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function authHeaders(token, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

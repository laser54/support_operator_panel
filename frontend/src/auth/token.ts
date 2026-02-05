const TOKEN_KEY = 'token';
const TOKEN_EVENT = 'auth-token-changed';

export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function subscribeAuthTokenChange(onChange: () => void) {
    const onStorage = (e: StorageEvent) => {
        if (e.key === TOKEN_KEY) onChange();
    };
    const onCustom = () => onChange();

    window.addEventListener('storage', onStorage);
    window.addEventListener(TOKEN_EVENT, onCustom);

    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(TOKEN_EVENT, onCustom);
    };
}


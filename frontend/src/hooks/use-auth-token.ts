import { useSyncExternalStore } from 'react';
import { getAuthToken, subscribeAuthTokenChange } from '@/auth/token';

export function useAuthToken() {
    return useSyncExternalStore(subscribeAuthTokenChange, getAuthToken, () => null);
}


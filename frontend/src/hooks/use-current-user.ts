import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthToken } from '@/hooks/use-auth-token';

export type CurrentUser = {
    id: number;
    username: string;
    role: 'operator' | 'supervisor' | 'admin';
    is_active: boolean;
    effective_role: 'operator' | 'supervisor' | 'admin';
    role_override: 'operator' | 'supervisor' | 'admin' | null;
    role_override_until: string | null;
};

export function useCurrentUser() {
    const token = useAuthToken();

    return useQuery<CurrentUser>({
        // Важно: token в ключе, чтобы при смене аккаунта в том же браузере
        // не использовать закэшированные данные предыдущего пользователя.
        queryKey: ['currentUser', token],
        queryFn: async () => {
            const response = await api.get('/auth/me');
            return response.data;
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });
}

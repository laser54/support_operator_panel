import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export type CurrentUser = {
    id: number;
    username: string;
    role: 'operator' | 'admin';
    is_active: boolean;
};

export function useCurrentUser() {
    const token = localStorage.getItem('token');

    return useQuery<CurrentUser>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const response = await api.get('/auth/me');
            return response.data;
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });
}

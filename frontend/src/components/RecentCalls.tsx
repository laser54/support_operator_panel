import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function RecentCalls() {
    const { data: calls, isLoading } = useQuery({
        queryKey: ['calls', 'recent'],
        queryFn: async () => {
            const response = await api.get('/calls/?limit=5');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {calls?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No calls registered yet.</p>
                    ) : (
                        calls?.map((call: any) => (
                            <div key={call.id} className="flex flex-col space-y-1 border-b pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-sm">{call.applicant_name || 'Anonymous'}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(call.created_at), 'HH:mm dd.MM')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{call.question}</p>
                                {call.topic && (
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                        {call.topic}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Loader2, Phone, Clock, Users } from 'lucide-react';

const COLORS = ['#D4F62F', '#A3E635', '#FFFFFF', '#71717A', '#3F3F46'];

export default function DashboardPage() {
    const { data: calls, isLoading } = useQuery({
        queryKey: ['calls', 'all'], // Using a different key or same as history?
        queryFn: async () => {
            // Fetch more items for stats, or add a dedicated stats endpoint
            const response = await api.get('/calls/?limit=500');
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // --- Statistics Calculations ---
    const totalCalls = calls?.length || 0;

    // Avg Duration
    const totalDuration = calls?.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0) || 0;
    const avgDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;
    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    // Calls by Gender
    const genderStats = calls?.reduce((acc: any, c: any) => {
        const g = c.caller_gender || 'Unspecified';
        acc[g] = (acc[g] || 0) + 1;
        return acc;
    }, {});
    const genderData = Object.entries(genderStats || {}).map(([name, value]) => ({ name, value }));

    // Calls by Date (Simple calls per day)
    const callsByDate = calls?.reduce((acc: any, c: any) => {
        const date = new Date(c.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
    // Sort by date can be tricky with locale string, best to use timestamps or ISO keys
    // Simplified for demo:
    const dataByDate = Object.entries(callsByDate || {}).slice(0, 10).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                        <p className="text-xs text-muted-foreground">+ from last period (mock)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Operators</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Currently online</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Calls Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataByDate}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Caller Demographics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                            {genderData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2, Phone, Clock, Users, TrendingUp, MessageCircle } from 'lucide-react';

type Call = {
    id: number;
    operator_id: number;
    operator: { id: number; username: string } | null;
    caller_gender: string | null;
    question: string;
    solution: string | null;
    notes: string | null;
    created_at: string;
    duration_seconds: number | null;
    script: { question: string; answer: string | null } | null;
};

type User = {
    id: number;
    username: string;
    role: 'operator' | 'supervisor' | 'admin';
    effective_role: 'operator' | 'supervisor' | 'admin';
    is_active: boolean;
};

type Filters = {
    dateFrom: string;
    dateTo: string;
    operatorId: string;
    search: string;
    minDuration: string;
    maxDuration: string;
    gender: string;
    source: string;
};

type OperatorStats = {
    operatorId: number;
    name: string;
    totalCalls: number;
    avgDuration: number;
    talkTime: number;
    resolutionRate: number;
    scriptRate: number;
    lastCallAt: string | null;
};

const CHART_COLORS = ['#2563EB', '#22C55E', '#EAB308', '#F97316', '#64748B', '#0EA5E9'];

const defaultFilters: Filters = {
    dateFrom: '',
    dateTo: '',
    operatorId: '',
    search: '',
    minDuration: '',
    maxDuration: '',
    gender: 'all',
    source: 'all',
};

function toIsoStart(dateValue: string) {
    return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEnd(dateValue: string) {
    return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatLongDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}ч ${remMins}м`;
    return `${remMins}м`;
}

function normalizeQuestion(value: string) {
    return value
        .toLowerCase()
        .replace(/[^\w\sа-яё-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getCallSource(call: Call) {
    if (call.script?.answer) return 'script';
    if (call.notes) return 'notes';
    if (call.solution) return 'solution';
    return 'none';
}

function getSourceLabel(source: string) {
    switch (source) {
        case 'script':
            return 'Скрипт';
        case 'notes':
            return 'Заметка';
        case 'solution':
            return 'Решение';
        case 'none':
            return 'Без ответа';
        default:
            return 'Все';
    }
}

function formatShortDate(value: string) {
    const date = new Date(value);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function formatShortDateTime(value: string) {
    const date = new Date(value);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
    const { data: currentUser } = useCurrentUser();
    const isPrivileged = currentUser?.effective_role !== 'operator';
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
    const [selectedQuestionKey, setSelectedQuestionKey] = useState<string | null>(null);

    const { data: users } = useQuery({
        queryKey: ['users', 'list'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data as User[];
        },
        enabled: !!isPrivileged,
    });

    const { data: calls, isLoading } = useQuery({
        queryKey: ['calls', 'dashboard', filters, isPrivileged],
        queryFn: async () => {
            const params: Record<string, string | number> = {
                limit: 500,
            };
            if (filters.search) params.search = filters.search;
            if (filters.operatorId && isPrivileged) params.operator_id = parseInt(filters.operatorId, 10);
            if (filters.dateFrom) params.created_from = toIsoStart(filters.dateFrom);
            if (filters.dateTo) params.created_to = toIsoEnd(filters.dateTo);
            if (filters.minDuration) params.min_duration = parseInt(filters.minDuration, 10);
            if (filters.maxDuration) params.max_duration = parseInt(filters.maxDuration, 10);
            const response = await api.get('/calls/', { params });
            return response.data as Call[];
        },
    });

    const genderOptions = useMemo(() => {
        const set = new Set<string>();
        (calls || []).forEach((call) => {
            if (call.caller_gender) set.add(call.caller_gender);
        });
        return ['all', ...Array.from(set)];
    }, [calls]);

    const filteredCalls = useMemo(() => {
        let data = calls || [];
        if (filters.gender !== 'all') {
            data = data.filter((call) => (call.caller_gender || 'Не указано') === filters.gender);
        }
        if (filters.source !== 'all') {
            data = data.filter((call) => getCallSource(call) === filters.source);
        }
        return data;
    }, [calls, filters.gender, filters.source]);

    const totalCalls = filteredCalls.length;
    const durations = filteredCalls.map((call) => call.duration_seconds || 0);
    const durationSum = durations.reduce((acc, value) => acc + value, 0);
    const avgDuration = totalCalls > 0 ? Math.round(durationSum / totalCalls) : 0;
    const resolvedCalls = filteredCalls.filter((call) => getCallSource(call) !== 'none').length;
    const scriptCalls = filteredCalls.filter((call) => getCallSource(call) === 'script').length;
    const resolutionRate = totalCalls > 0 ? Math.round((resolvedCalls / totalCalls) * 100) : 0;
    const scriptRate = totalCalls > 0 ? Math.round((scriptCalls / totalCalls) * 100) : 0;
    const activeOperatorsCount = new Set(filteredCalls.map((call) => call.operator_id)).size;

    const callsByDate = useMemo(() => {
        const map = new Map<string, number>();
        filteredCalls.forEach((call) => {
            const key = new Date(call.created_at).toISOString().slice(0, 10);
            map.set(key, (map.get(key) || 0) + 1);
        });
        const data = Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-14)
            .map(([date, count]) => ({
                name: formatShortDate(date),
                value: count,
            }));
        return data;
    }, [filteredCalls]);

    const callsByHour = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, idx) => ({ name: `${idx}:00`, value: 0 }));
        filteredCalls.forEach((call) => {
            const hour = new Date(call.created_at).getHours();
            hours[hour].value += 1;
        });
        return hours;
    }, [filteredCalls]);

    const genderData = useMemo(() => {
        const map = new Map<string, number>();
        filteredCalls.forEach((call) => {
            const key = call.caller_gender || 'Не указано';
            map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredCalls]);

    const sourceData = useMemo(() => {
        const map = new Map<string, number>();
        filteredCalls.forEach((call) => {
            const key = getCallSource(call);
            map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({
            name: getSourceLabel(name),
            value,
        }));
    }, [filteredCalls]);

    const topQuestions = useMemo(() => {
        const map = new Map<string, { question: string; count: number; lastSeen: string }>();
        filteredCalls.forEach((call) => {
            const raw = call.question?.trim();
            if (!raw) return;
            const key = normalizeQuestion(raw);
            if (!key) return;
            const existing = map.get(key);
            if (!existing) {
                map.set(key, { question: raw, count: 1, lastSeen: call.created_at });
            } else {
                existing.count += 1;
                if (new Date(call.created_at) > new Date(existing.lastSeen)) {
                    existing.lastSeen = call.created_at;
                }
            }
        });
        return Array.from(map.entries())
            .map(([key, value]) => ({ key, ...value }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [filteredCalls]);

    const recentCalls = useMemo(() => {
        return [...filteredCalls]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6);
    }, [filteredCalls]);

    const operatorStats = useMemo(() => {
        if (!isPrivileged) return [];
        const map = new Map<number, OperatorStats>();
        filteredCalls.forEach((call) => {
            const current = map.get(call.operator_id) || {
                operatorId: call.operator_id,
                name: call.operator?.username || users?.find((u) => u.id === call.operator_id)?.username || `#${call.operator_id}`,
                totalCalls: 0,
                avgDuration: 0,
                talkTime: 0,
                resolutionRate: 0,
                scriptRate: 0,
                lastCallAt: null,
            };
            current.totalCalls += 1;
            current.talkTime += call.duration_seconds || 0;
            current.resolutionRate += getCallSource(call) !== 'none' ? 1 : 0;
            current.scriptRate += getCallSource(call) === 'script' ? 1 : 0;
            if (!current.lastCallAt || new Date(call.created_at) > new Date(current.lastCallAt)) {
                current.lastCallAt = call.created_at;
            }
            map.set(call.operator_id, current);
        });
        return Array.from(map.values())
            .map((stat) => ({
                ...stat,
                avgDuration: stat.totalCalls > 0 ? Math.round(stat.talkTime / stat.totalCalls) : 0,
                resolutionRate: stat.totalCalls > 0 ? Math.round((stat.resolutionRate / stat.totalCalls) * 100) : 0,
                scriptRate: stat.totalCalls > 0 ? Math.round((stat.scriptRate / stat.totalCalls) * 100) : 0,
            }))
            .sort((a, b) => b.totalCalls - a.totalCalls);
    }, [filteredCalls, isPrivileged, users]);

    const selectedOperator = operatorStats.find((stat) => stat.operatorId === selectedOperatorId) || null;
    const selectedOperatorCalls = useMemo(() => {
        if (!selectedOperatorId) return [];
        return filteredCalls
            .filter((call) => call.operator_id === selectedOperatorId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8);
    }, [filteredCalls, selectedOperatorId]);

    const selectedQuestionCalls = useMemo(() => {
        if (!selectedQuestionKey) return [];
        return filteredCalls
            .filter((call) => normalizeQuestion(call.question || '') === selectedQuestionKey)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8);
    }, [filteredCalls, selectedQuestionKey]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isPrivileged ? 'Дашборд супервайзера' : 'Дашборд оператора'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isPrivileged
                            ? 'Обзор нагрузки, качества и динамики операторов.'
                            : 'Личная эффективность, динамика звонков и частые вопросы.'}
                    </p>
                </div>
                <Badge variant="outline">
                    {currentUser?.effective_role === 'admin' ? 'Админ' : isPrivileged ? 'Супервайзер' : 'Оператор'}
                </Badge>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Фильтры</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
                        <div className="space-y-1">
                            <Label htmlFor="dateFrom">С даты</Label>
                            <Input
                                id="dateFrom"
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="dateTo">По дату</Label>
                            <Input
                                id="dateTo"
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="search">Поиск</Label>
                            <Input
                                id="search"
                                placeholder="Вопрос, заметки, решение..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        {isPrivileged && (
                            <div className="space-y-1">
                                <Label htmlFor="operator">Оператор</Label>
                                <Select
                                    value={filters.operatorId || 'all'}
                                    onValueChange={(value) =>
                                        setFilters({ ...filters, operatorId: value === 'all' ? '' : value })
                                    }
                                >
                                    <SelectTrigger id="operator">
                                        <SelectValue placeholder="Все операторы" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все</SelectItem>
                                        {(users || [])
                                            .filter((user) => user.is_active)
                                            .map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.username} ({user.role})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="gender">Пол</Label>
                            <Select
                                value={filters.gender}
                                onValueChange={(value) => setFilters({ ...filters, gender: value })}
                            >
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Все" />
                                </SelectTrigger>
                                <SelectContent>
                                    {genderOptions.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item === 'all' ? 'Все' : item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="source">Источник ответа</Label>
                            <Select
                                value={filters.source}
                                onValueChange={(value) => setFilters({ ...filters, source: value })}
                            >
                                <SelectTrigger id="source">
                                    <SelectValue placeholder="Все" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    <SelectItem value="script">Скрипт</SelectItem>
                                    <SelectItem value="solution">Решение</SelectItem>
                                    <SelectItem value="notes">Заметка</SelectItem>
                                    <SelectItem value="none">Без ответа</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="minDuration">Длительность от (сек)</Label>
                            <Input
                                id="minDuration"
                                type="number"
                                min={0}
                                value={filters.minDuration}
                                onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="maxDuration">Длительность до (сек)</Label>
                            <Input
                                id="maxDuration"
                                type="number"
                                min={0}
                                value={filters.maxDuration}
                                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setFilters(defaultFilters)}
                            >
                                Сбросить
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Обзор</TabsTrigger>
                    <TabsTrigger value="questions">Вопросы</TabsTrigger>
                    {isPrivileged && <TabsTrigger value="operators">Операторы</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Всего звонков</CardTitle>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalCalls}</div>
                                <p className="text-xs text-muted-foreground">Отфильтрованный объем</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Средняя длит.</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                                <p className="text-xs text-muted-foreground">На один звонок</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Скрипты</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{scriptRate}%</div>
                                <p className="text-xs text-muted-foreground">Доля с ответом из скрипта</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Решено</CardTitle>
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{resolutionRate}%</div>
                                <p className="text-xs text-muted-foreground">С ответом/заметкой</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Операторы</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeOperatorsCount}</div>
                                <p className="text-xs text-muted-foreground">В диапазоне фильтра</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Динамика по дням</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={callsByDate}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Нагрузка по часам</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={callsByHour}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-7">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Сегменты</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={genderData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {genderData.map((entry, index) => (
                                                    <Cell key={`gender-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {genderData.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sourceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {sourceData.map((entry, index) => (
                                                    <Cell key={`source-${entry.name}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Последние звонки</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Дата</TableHead>
                                                {isPrivileged && <TableHead>Оператор</TableHead>}
                                                <TableHead>Вопрос</TableHead>
                                                <TableHead>Длит.</TableHead>
                                                <TableHead>Источник</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentCalls.length ? (
                                                recentCalls.map((call) => (
                                                    <TableRow key={call.id}>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatShortDateTime(call.created_at)}
                                                        </TableCell>
                                                        {isPrivileged && (
                                                            <TableCell className="text-muted-foreground">
                                                                {call.operator?.username || `#${call.operator_id}`}
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="max-w-[260px] truncate" title={call.question}>
                                                            {call.question}
                                                        </TableCell>
                                                        <TableCell>
                                                            {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{getSourceLabel(getCallSource(call))}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={isPrivileged ? 5 : 4} className="h-24 text-center">
                                                        Нет данных по фильтру.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="questions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Частые вопросы</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 lg:grid-cols-2">
                                {topQuestions.length ? (
                                    topQuestions.map((item, index) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            className="flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition hover:bg-muted/30"
                                            onClick={() => setSelectedQuestionKey(item.key)}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{item.question}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Последний раз: {formatShortDateTime(item.lastSeen)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold">{item.count}</span>
                                                <p className="text-xs text-muted-foreground">обращений</p>
                                                <Badge variant="outline">#{index + 1}</Badge>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">Нет данных по фильтру.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isPrivileged && (
                    <TabsContent value="operators" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Производительность операторов</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Оператор</TableHead>
                                                <TableHead>Звонков</TableHead>
                                                <TableHead>Средняя длит.</TableHead>
                                                <TableHead>Разговорное время</TableHead>
                                                <TableHead>Решено</TableHead>
                                                <TableHead>Скрипты</TableHead>
                                                <TableHead>Последний</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {operatorStats.length ? (
                                                operatorStats.map((stat) => (
                                                    <TableRow
                                                        key={stat.operatorId}
                                                        className="cursor-pointer"
                                                        onClick={() => setSelectedOperatorId(stat.operatorId)}
                                                    >
                                                        <TableCell className="font-medium">{stat.name}</TableCell>
                                                        <TableCell>{stat.totalCalls}</TableCell>
                                                        <TableCell>{formatDuration(stat.avgDuration)}</TableCell>
                                                        <TableCell>{formatLongDuration(stat.talkTime)}</TableCell>
                                                        <TableCell>{stat.resolutionRate}%</TableCell>
                                                        <TableCell>{stat.scriptRate}%</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {stat.lastCallAt ? formatShortDateTime(stat.lastCallAt) : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        Нет данных по фильтру.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog open={!!selectedOperator} onOpenChange={(open) => !open && setSelectedOperatorId(null)}>
                <DialogContent className="max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Детали оператора</DialogTitle>
                    </DialogHeader>
                    {selectedOperator && (
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Звонков</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-2xl font-bold">
                                        {selectedOperator.totalCalls}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Средняя длит.</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-2xl font-bold">
                                        {formatDuration(selectedOperator.avgDuration)}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Решено</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-2xl font-bold">
                                        {selectedOperator.resolutionRate}%
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Скрипты</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-2xl font-bold">
                                        {selectedOperator.scriptRate}%
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Дата</TableHead>
                                            <TableHead>Вопрос</TableHead>
                                            <TableHead>Длит.</TableHead>
                                            <TableHead>Источник</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOperatorCalls.length ? (
                                            selectedOperatorCalls.map((call) => (
                                                <TableRow key={call.id}>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatShortDateTime(call.created_at)}
                                                    </TableCell>
                                                    <TableCell className="max-w-[260px] truncate" title={call.question}>
                                                        {call.question}
                                                    </TableCell>
                                                    <TableCell>
                                                        {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{getSourceLabel(getCallSource(call))}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    Нет данных по фильтру.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedQuestionKey} onOpenChange={(open) => !open && setSelectedQuestionKey(null)}>
                <DialogContent className="max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Детали вопроса</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Дата</TableHead>
                                        {isPrivileged && <TableHead>Оператор</TableHead>}
                                        <TableHead>Вопрос</TableHead>
                                        <TableHead>Длит.</TableHead>
                                        <TableHead>Источник</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedQuestionCalls.length ? (
                                        selectedQuestionCalls.map((call) => (
                                            <TableRow key={call.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {formatShortDateTime(call.created_at)}
                                                </TableCell>
                                                {isPrivileged && (
                                                    <TableCell className="text-muted-foreground">
                                                        {call.operator?.username || `#${call.operator_id}`}
                                                    </TableCell>
                                                )}
                                                <TableCell className="max-w-[260px] truncate" title={call.question}>
                                                    {call.question}
                                                </TableCell>
                                                <TableCell>
                                                    {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{getSourceLabel(getCallSource(call))}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isPrivileged ? 5 : 4} className="h-24 text-center">
                                                Нет данных по фильтру.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Phone, Clock, TrendingUp, BarChart3, Timer, CheckCircle2 } from 'lucide-react';

interface CallStats {
    total_calls: number;
    avg_duration_seconds: number | null;
    total_duration_seconds: number;
    resolved_count: number;
    shortest_call: number | null;
    longest_call: number | null;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDurationLong(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}ч ${mins}м`;
    }
    if (mins > 0) {
        return `${mins}м ${secs}с`;
    }
    return `${secs}с`;
}

export function OperatorStatsWidget() {
    const [isHovered, setIsHovered] = useState(false);

    // Получаем звонки за сегодня для текущего оператора
    const { data: stats, isLoading } = useQuery({
        queryKey: ['operator-today-stats'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayIso = today.toISOString();
            
            const response = await api.get('/calls/', {
                params: {
                    created_from: todayIso,
                    limit: 1000,
                },
            });
            
            const calls = response.data as Array<{ 
                duration_seconds: number | null;
                resolution: { name: string } | null;
            }>;
            
            const totalCalls = calls.length;
            const callsWithDuration = calls.filter(c => c.duration_seconds != null && c.duration_seconds > 0);
            const durations = callsWithDuration.map(c => c.duration_seconds!);
            
            const totalDuration = durations.reduce((sum, d) => sum + d, 0);
            const avgDuration = durations.length > 0 ? totalDuration / durations.length : null;
            const shortest = durations.length > 0 ? Math.min(...durations) : null;
            const longest = durations.length > 0 ? Math.max(...durations) : null;
            
            // Считаем "решённые" звонки (грубо — по наличию resolution)
            const resolvedCount = calls.filter(c => c.resolution != null).length;
            
            return {
                total_calls: totalCalls,
                avg_duration_seconds: avgDuration,
                total_duration_seconds: totalDuration,
                resolved_count: resolvedCount,
                shortest_call: shortest,
                longest_call: longest,
            } as CallStats;
        },
        refetchInterval: 60000,
        staleTime: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                <div className="h-4 w-16 bg-zinc-700 rounded" />
            </div>
        );
    }

    const totalCalls = stats?.total_calls ?? 0;
    const avgDuration = stats?.avg_duration_seconds;
    const isActive = totalCalls >= 10;

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Компактная кнопка-триггер */}
            <button
                type="button"
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                    ${isActive 
                        ? 'bg-emerald-500/20 border border-emerald-500/30' 
                        : 'bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-700/80'
                    }
                `}
            >
                <BarChart3 className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span className="font-semibold text-white tabular-nums text-sm">{totalCalls}</span>
                <span className="text-zinc-500 text-xs">звонков</span>
                {isActive && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Всплывающая панель */}
            {isHovered && (
                <div 
                    className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                >
                    {/* Header */}
                    <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">Статистика за сегодня</span>
                            {isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                                    Высокая активность
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-4 space-y-3">
                        {/* Всего звонков */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-sm text-zinc-400">Всего звонков</span>
                            </div>
                            <span className="text-lg font-bold text-white tabular-nums">{totalCalls}</span>
                        </div>

                        {/* С резолюцией */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm text-zinc-400">Завершено</span>
                            </div>
                            <span className="text-lg font-bold text-white tabular-nums">
                                {stats?.resolved_count ?? 0}
                            </span>
                        </div>

                        <div className="h-px bg-zinc-700/50 my-2" />

                        {/* Средняя длительность */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-sm text-zinc-400">Ср. длительность</span>
                            </div>
                            <span className="text-lg font-bold text-white tabular-nums font-mono">
                                {avgDuration != null ? formatDuration(avgDuration) : '--:--'}
                            </span>
                        </div>

                        {/* Общее время */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                    <Timer className="w-4 h-4 text-violet-400" />
                                </div>
                                <span className="text-sm text-zinc-400">Общее время</span>
                            </div>
                            <span className="text-sm font-semibold text-white">
                                {stats?.total_duration_seconds 
                                    ? formatDurationLong(stats.total_duration_seconds) 
                                    : '0м'
                                }
                            </span>
                        </div>

                        {/* Мин/Макс */}
                        {(stats?.shortest_call || stats?.longest_call) && (
                            <>
                                <div className="h-px bg-zinc-700/50 my-2" />
                                <div className="flex justify-between text-xs">
                                    <div className="text-zinc-500">
                                        Мин: <span className="text-zinc-300 font-mono">
                                            {stats.shortest_call ? formatDuration(stats.shortest_call) : '--'}
                                        </span>
                                    </div>
                                    <div className="text-zinc-500">
                                        Макс: <span className="text-zinc-300 font-mono">
                                            {stats.longest_call ? formatDuration(stats.longest_call) : '--'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

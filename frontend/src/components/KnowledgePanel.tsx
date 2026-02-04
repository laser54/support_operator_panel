import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, Check, Sparkles, ArrowRight, BookOpen, ChevronDown, Flame } from 'lucide-react';
import { toast } from 'sonner';

import type { ScriptSelection } from '@/components/ScriptSelector';

// Ref interface для внешнего управления панелью
export interface KnowledgePanelRef {
    focusSearch: () => void;
}

interface KnowledgePanelProps {
    onSelectScript?: (script: ScriptSelection) => void;
    resetSignal?: number;
}

type TopRange = 'recent' | 'month' | 'year';

const rangeLabels: Record<TopRange, string> = {
    recent: 'Последнее',
    month: 'Месяц',
    year: 'Год',
};

const pluralizeMentions = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'упоминание';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'упоминания';
    return 'упоминаний';
};

export const KnowledgePanel = forwardRef<KnowledgePanelRef, KnowledgePanelProps>(function KnowledgePanel(
    { onSelectScript, resetSignal },
    ref
) {
    const [query, setQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [topRange, setTopRange] = useState<TopRange>('recent');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Ref для внешнего управления
    useImperativeHandle(ref, () => ({
        focusSearch: () => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        },
    }), []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['search', searchQuery],
        queryFn: async () => {
            if (!searchQuery) return null;
            const response = await api.get(`/search/?query=${encodeURIComponent(searchQuery)}`);
            return response.data;
        },
        enabled: searchQuery.length > 0,
    });

    const {
        data: topQuestions,
        isLoading: isTopLoading,
        isError: isTopError,
    } = useQuery({
        queryKey: ['top-questions', topRange],
        queryFn: async () => {
            const response = await api.get('/scripts/top-questions', {
                params: { range: topRange, limit: 10 },
            });
            return response.data as Array<{
                script_id: number;
                question: string;
                answer: string | null;
                total: number;
            }>;
        },
        enabled: searchQuery.length === 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(query);
    };

    useEffect(() => {
        if (typeof resetSignal === 'number') {
            setQuery('');
            setSearchQuery('');
            setTopRange('recent');
        }
    }, [resetSignal]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Ответ скопирован');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUseSolution = (match: any) => {
        if (onSelectScript) {
            onSelectScript({
                external_id: match.id,
                question: match.question,
                answer: match.answer,
                is_custom: false,
                needs_review: false
            });
            toast.success('Решение привязано к форме');
        }
    };

    const handleUseTopScript = (item: { script_id: number; question: string; answer: string | null }) => {
        if (!item.answer) return;
        handleUseSolution({
            id: item.script_id,
            question: item.question,
            answer: item.answer,
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="shrink-0 px-5 py-3 border-b border-white/10 bg-zinc-950 text-white">
                <div className="flex items-center gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                                База знаний
                                <span className="text-[10px] uppercase bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    AI
                                </span>
                            </h2>
                        </div>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Введите во"
                                className="pl-10 pr-10 h-10 w-full bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {query.trim().length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery('');
                                        setSearchQuery('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                                    aria-label="Очистить поиск"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="h-10 px-5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Найти
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-28 w-full rounded-xl" />
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center justify-center py-16 text-destructive">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <p className="font-medium">Ошибка поиска</p>
                        <p className="text-sm text-muted-foreground mt-1">Попробуйте ещё раз</p>
                    </div>
                )}

                {!isLoading && !data && !searchQuery && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                                    <Flame className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Частые вопросы</p>
                                    <p className="text-xs text-muted-foreground">
                                        Топ-10 по обращениям из реестра скриптов
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Нажмите, чтобы раскрыть ответ
                            </div>
                        </div>

                        <Tabs value={topRange} onValueChange={(value) => setTopRange(value as TopRange)}>
                            <TabsList className="h-9">
                                {Object.entries(rangeLabels).map(([value, label]) => (
                                    <TabsTrigger key={value} value={value} className="text-xs px-3 py-1.5">
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <TabsContent value={topRange} className="mt-3">
                                {isTopLoading && (
                                    <div className="space-y-3">
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                    </div>
                                )}

                                {isTopError && (
                                    <div className="text-sm text-destructive py-6 text-center">
                                        Не удалось загрузить топ вопросов
                                    </div>
                                )}

                                {!isTopLoading && !isTopError && (topQuestions?.length ?? 0) === 0 && (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        Пока нет данных для этого периода
                                    </div>
                                )}

                                {!isTopLoading && !isTopError && topQuestions && topQuestions.length > 0 && (
                                    <div className="space-y-3">
                                        {topQuestions.map((item, index) => (
                                            <details
                                                key={item.script_id}
                                                className="group rounded-xl border border-border/60 bg-white/70 shadow-sm hover:border-amber-300 transition-colors"
                                            >
                                                <summary className="cursor-pointer list-none px-4 py-3 flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                                            {index + 1}
                                                        </span>
                                                        <div className="text-sm text-foreground leading-snug">
                                                            {item.question}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                        <span>
                                                            {item.total} {pluralizeMentions(item.total)}
                                                        </span>
                                                        <ChevronDown className="h-4 w-4 text-amber-500 transition-transform duration-200 group-open:rotate-180" />
                                                    </div>
                                                </summary>
                                                {item.answer && (
                                                    <div className="px-4 pb-4 space-y-3">
                                                        <div className="text-sm text-foreground/90 leading-relaxed">
                                                            {item.answer}
                                                        </div>
                                                        {onSelectScript && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                                                                onClick={() => handleUseTopScript(item)}
                                                            >
                                                                Использовать ответ
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </details>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {!isLoading && data && data.matches?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <p className="font-medium text-foreground">Ответы не найдены</p>
                        <p className="text-sm mt-1">Попробуйте переформулировать вопрос</p>
                    </div>
                )}

                {!isLoading && data && data.matches?.map((match: any, index: number) => (
                    <div
                        key={match.id}
                        className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Question */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                                        Вопрос
                                    </span>
                                    {match.score && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${match.score > 0.7
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : match.score > 0.4
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${match.score > 0.7 ? 'bg-emerald-500' : match.score > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                                                }`} />
                                            {(match.score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <h4 className="font-medium text-foreground">{match.question}</h4>
                            </div>
                        </div>

                        {/* Answer */}
                        <div className="bg-muted/50 rounded-xl p-4 mb-3 border-l-4 border-l-violet-400">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Ответ</div>
                            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {match.answer}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {onSelectScript && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                                    onClick={() => handleUseSolution(match)}
                                >
                                    Использовать ответ
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3"
                                onClick={() => copyToClipboard(match.answer, match.id)}
                            >
                                {copiedId === match.id ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

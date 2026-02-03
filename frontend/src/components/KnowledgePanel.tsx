import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Copy, Check, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import type { ScriptSelection } from '@/components/ScriptSelector';

interface KnowledgePanelProps {
    onSelectScript?: (script: ScriptSelection) => void;
}

export function KnowledgePanel({ onSelectScript }: KnowledgePanelProps) {
    const [query, setQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['search', searchQuery],
        queryFn: async () => {
            if (!searchQuery) return null;
            const response = await api.get(`/search/?query=${encodeURIComponent(searchQuery)}`);
            return response.data;
        },
        enabled: searchQuery.length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(query);
    };

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

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-border/50 bg-background">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                            База знаний
                            <span className="text-[10px] uppercase bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI
                            </span>
                        </h2>
                        <p className="text-xs text-muted-foreground">Найдите ответ на вопрос клиента</p>
                    </div>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Введите вопрос клиента..."
                            className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="h-11 px-6 bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Поиск...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Найти
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </form>
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
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-violet-500/50" />
                        </div>
                        <p className="font-medium text-foreground">AI-поиск по базе знаний</p>
                        <p className="text-sm mt-1 text-center max-w-xs">
                            Введите вопрос клиента, чтобы найти подходящий ответ
                        </p>
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
                        className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Question */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
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
                        <div className="bg-muted/50 rounded-xl p-4 mb-3 border-l-4 border-l-primary/50">
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
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import type { ScriptSelection } from '@/components/ScriptSelector';

interface SearchPanelProps {
    onSelectScript?: (script: ScriptSelection) => void;
}

export function SearchPanel({ onSelectScript }: SearchPanelProps) {
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
        toast.success('Solution copied to clipboard');
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
            toast.success('Script linked to call form');
        }
    };

    return (
        <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search knowledge base..."
                            className="pl-9"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </form>
            </CardHeader>
            <CardContent className="px-0 flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}

                {isError && (
                    <div className="text-center py-10 text-destructive">
                        Error searching knowledge base. Please try again.
                    </div>
                )}

                {!isLoading && !data && !searchQuery && (
                    <div className="text-center py-20 text-muted-foreground italic">
                        Enter a question to find answers from the AI Knowledge Base
                    </div>
                )}

                {!isLoading && data && data.matches?.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No answers found for this query.
                    </div>
                )}

                {!isLoading && data && data.matches?.map((match: any) => (
                    <div key={match.id} className="mb-4 bg-white rounded-lg border p-4 shadow-sm hover:border-violet-300 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm text-zinc-800">Q: {match.question}</h4>
                            <div className="flex gap-1">
                                {onSelectScript && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => handleUseSolution(match)}
                                    >
                                        Use Answer
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(match.answer, match.id)}
                                >
                                    {copiedId === match.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded border-l-4 border-l-violet-400">
                            {match.answer}
                        </div>
                        {match.score && (
                            <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${match.score > 0.7 ? 'bg-green-500' : match.score > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                Match Score: {(match.score * 100).toFixed(1)}%
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

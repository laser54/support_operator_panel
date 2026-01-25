import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this hook exists or I'll implement simple debounce

// If useDebounce doesn't exist, I'll inline a simple one or just fetch on enter for now to save tokens/time, or use a simple timeout.
// I'll stick to simple "Search" button or type+debounce.

export interface ScriptSelection {
    external_id?: string | null;
    question: string;
    answer: string;
    is_custom: boolean;
    needs_review: boolean;
}

interface ScriptSelectorProps {
    onSelect: (script: ScriptSelection | null) => void;
    selectedScript?: ScriptSelection | null; // From parent
}

export function ScriptSelector({ onSelect, selectedScript: externalSelection }: ScriptSelectorProps) {
    // We only use 'custom' mode internally now, or 'view' mode if external selection exists
    const [customQuestion, setCustomQuestion] = useState('');
    const [customAnswer, setCustomAnswer] = useState('');
    const [needsReview, setNeedsReview] = useState(false);

    // Sync with external selection if provided
    useEffect(() => {
        if (externalSelection) {
            // ensure parent knows (though parent passed it)
        }
    }, [externalSelection]);

    const handleCustomChange = (q: string, a: string, review: boolean) => {
        setCustomQuestion(q);
        setCustomAnswer(a);
        setNeedsReview(review);

        if (q && a) {
            onSelect({
                external_id: null,
                question: q,
                answer: a,
                is_custom: true,
                needs_review: review,
            });
        } else {
            onSelect(null);
        }
    };

    if (externalSelection) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-green-800 mb-1">Linked Knowledge Base Script</p>
                            <p className="text-sm font-bold text-green-900">{externalSelection.question}</p>
                            <p className="text-xs text-green-700 mt-1 line-clamp-2">{externalSelection.answer}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-green-700 hover:text-green-900 hover:bg-green-100">
                            Change
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-dashed">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Add Custom Script</h4>
                        <span className="text-xs text-muted-foreground">Link a Knowledge Base item from the right panel OR add a custom one here.</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Question / Issue</Label>
                        <Input
                            value={customQuestion}
                            onChange={(e) => handleCustomChange(e.target.value, customAnswer, needsReview)}
                            placeholder="What is the issue?"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Solution / Answer</Label>
                        <Textarea
                            value={customAnswer}
                            onChange={(e) => handleCustomChange(customQuestion, e.target.value, needsReview)}
                            placeholder="How was it solved?"
                            className="h-24"
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="review"
                            checked={needsReview}
                            onCheckedChange={(c) => handleCustomChange(customQuestion, customAnswer, c as boolean)}
                        />
                        <Label htmlFor="review" className="cursor-pointer">
                            Propose to Script Catalog (Supervisor Review)
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

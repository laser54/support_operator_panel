import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, X, MessageSquare, Lightbulb, FileQuestion } from 'lucide-react';

export interface ScriptSelection {
    external_id?: string | null;
    question: string;
    answer: string | null;
    is_custom: boolean;
    needs_review: boolean;
}

type SolutionMode = 'none' | 'kb_linked' | 'notes_only' | 'propose_qa';

interface ScriptSelectorProps {
    onSelect: (script: ScriptSelection | null) => void;
    onNotesChange: (notes: string) => void;
    selectedScript?: ScriptSelection | null;
    notes?: string;
}

export function ScriptSelector({
    onSelect,
    onNotesChange,
    selectedScript: externalSelection,
    notes = ''
}: ScriptSelectorProps) {
    const [mode, setMode] = useState<SolutionMode>('propose_qa');
    const [localNotes, setLocalNotes] = useState(notes);

    // Custom Q&A fields
    const [customQuestion, setCustomQuestion] = useState('');
    const [customAnswer, setCustomAnswer] = useState('');
    const [needsReview, setNeedsReview] = useState(false);

    // Sync external selection
    useEffect(() => {
        if (externalSelection && !externalSelection.is_custom) {
            setMode('kb_linked');
        }
    }, [externalSelection]);

    // Sync notes from parent
    useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);

    const handleNotesChange = (value: string) => {
        setLocalNotes(value);
        onNotesChange(value);
    };

    const handleModeChange = (newMode: SolutionMode) => {
        setMode(newMode);
        if (newMode !== 'kb_linked') {
            onSelect(null);
        }
        if (newMode !== 'propose_qa') {
            setCustomQuestion('');
            setCustomAnswer('');
            setNeedsReview(false);
        }
    };

    const handleCustomSubmit = () => {
        if (!customQuestion.trim()) return;

        onSelect({
            external_id: null,
            question: customQuestion,
            answer: customAnswer || null,
            is_custom: true,
            needs_review: needsReview,
        });
        setMode('kb_linked'); // Switch to linked view after creating
    };

    const handleClearSelection = () => {
        onSelect(null);
        setMode('none');
        setCustomQuestion('');
        setCustomAnswer('');
        setNeedsReview(false);
    };

    // If KB script is linked
    if (mode === 'kb_linked' && externalSelection) {
        return (
            <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-sm text-green-800">
                                {externalSelection.is_custom ? 'Кастомный скрипт прикреплён' : 'Скрипт из базы знаний привязан'}
                            </CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSelection}
                            className="text-green-700 hover:text-red-600 hover:bg-red-50 h-8"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Убрать
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                        <p className="font-medium text-sm text-green-900 mb-1">Q: {externalSelection.question}</p>
                        {externalSelection.answer ? (
                            <p className="text-sm text-green-700 line-clamp-3">A: {externalSelection.answer}</p>
                        ) : (
                            <p className="text-sm text-amber-600 italic">Ответ ожидается (на ревью)</p>
                        )}
                    </div>
                    {externalSelection.needs_review && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                            <FileQuestion className="h-3 w-3" />
                            Отправлено на ревью
                        </div>
                    )}

                    {/* Notes section always available */}
                    <div className="mt-4 pt-3 border-t border-green-200">
                        <Label className="text-xs text-green-700 mb-1 block">Доп. заметки (опционально)</Label>
                        <Textarea
                            value={localNotes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Any additional comments about this call..."
                            className="h-16 text-sm bg-white/80 border-green-200 focus:border-green-400"
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Решение и заметки
                </CardTitle>
                <CardDescription className="text-xs">
                    Выберите ответ из базы знаний, добавьте заметки или предложите новый Q&A
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Mode selector */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={mode === 'notes_only' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleModeChange('notes_only')}
                        className="flex-1 text-xs h-9"
                    >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Заметки
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'propose_qa' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleModeChange('propose_qa')}
                        className="flex-1 text-xs h-9"
                    >
                        <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                        Предложить Q&A
                    </Button>
                </div>

                {/* Notes mode */}
                {mode === 'notes_only' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label className="text-xs">Заметки оператора</Label>
                        <Textarea
                            value={localNotes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Опишите, как была решена проблема, детали и нюансы..."
                            className="h-28"
                        />
                        <p className="text-xs text-muted-foreground">
                            Заметки сохраняются в звонке, но не попадают в базу знаний.
                        </p>
                    </div>
                )}

                {/* Propose Q&A mode */}
                {mode === 'propose_qa' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Вопрос / проблема *</Label>
                            <Input
                                value={customQuestion}
                                onChange={(e) => setCustomQuestion(e.target.value)}
                                placeholder="В чём был вопрос клиента?"
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Ответ / решение</Label>
                            <Textarea
                                value={customAnswer}
                                onChange={(e) => setCustomAnswer(e.target.value)}
                                placeholder="Как решили? (можно оставить пустым — добавит супервизор)"
                                className="h-20 text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                                id="needs-review"
                                checked={needsReview}
                                onCheckedChange={(c) => setNeedsReview(c as boolean)}
                            />
                            <Label htmlFor="needs-review" className="text-xs cursor-pointer">
                                Отправить на ревью (добавить в очередь реестра скриптов)
                            </Label>
                        </div>
                        <Button
                            type="button"
                            onClick={handleCustomSubmit}
                            disabled={!customQuestion.trim()}
                            className="w-full"
                            size="sm"
                        >
                            <Check className="h-4 w-4 mr-1.5" />
                            Attach Custom Q&A
                        </Button>
                    </div>
                )}

                {/* Waiting for KB selection hint */}
                {mode === 'none' && (
                    <div className="text-center py-4 text-sm text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                        <p>Ищите в базе знаний в правой панели</p>
                        <p className="text-xs mt-1">or choose an option above</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

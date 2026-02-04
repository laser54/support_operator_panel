import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    User,
    Phone,
    MapPin,
    Building2,
    Clock,
    MessageSquare,
    StickyNote,
    Save,
    X,
    CheckCircle2,
    Sparkles,
    Edit3,
} from 'lucide-react';
import type { ScriptSelection } from '@/components/ScriptSelector';

export interface CallPreviewData {
    applicant_name: string;
    phone_number?: string;
    caller_gender?: string;
    region_id: string;
    department_id: string;
    description: string;
    duration_seconds: number;
    region_name?: string;
    department_name?: string;
    scriptData?: ScriptSelection | null;
    operatorNotes?: string;
}

interface SaveCallConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: CallPreviewData | null;
    onConfirm: (updatedData: CallPreviewData) => void;
    isLoading?: boolean;
}

function formatDurationEditable(seconds: number): { minutes: number; secs: number } {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes, secs };
}

function formatDurationDisplay(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}ч ${minutes}м ${secs}с`;
    }
    if (minutes > 0) {
        return `${minutes}м ${secs}с`;
    }
    return `${secs}с`;
}

export function SaveCallConfirmDialog({
    open,
    onOpenChange,
    data,
    onConfirm,
    isLoading = false,
}: SaveCallConfirmDialogProps) {
    const [editMode, setEditMode] = useState<'duration' | 'notes' | null>(null);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [editedNotes, setEditedNotes] = useState('');

    useEffect(() => {
        if (data) {
            const { minutes, secs } = formatDurationEditable(data.duration_seconds);
            setDurationMinutes(minutes);
            setDurationSeconds(secs);
            setEditedNotes(data.operatorNotes || '');
        }
        setEditMode(null);
    }, [data, open]);

    if (!data) return null;

    const handleConfirm = () => {
        const totalSeconds = durationMinutes * 60 + durationSeconds;
        onConfirm({
            ...data,
            duration_seconds: totalSeconds,
            operatorNotes: editedNotes,
        });
    };

    const InfoRow = ({
        icon: Icon,
        label,
        value,
        className = '',
    }: {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        value: string | React.ReactNode;
        className?: string;
    }) => (
        <div className={`flex items-start gap-3 py-2.5 ${className}`}>
            <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    {label}
                </p>
                <div className="text-sm font-medium text-foreground">{value || '—'}</div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-white to-zinc-50/50 border-zinc-200">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">
                                    Подтверждение сохранения
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400 text-xs">
                                    Проверьте данные звонка перед сохранением
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-1 max-h-[50vh] overflow-y-auto">
                    {/* Caller Info Section */}
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Информация о звонящем
                            </span>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-0.5 divide-y divide-zinc-100">
                            <InfoRow icon={User} label="Имя" value={data.applicant_name} />
                            <InfoRow
                                icon={Phone}
                                label="Телефон"
                                value={data.phone_number || 'Не указан'}
                            />
                            {data.caller_gender && (
                                <InfoRow
                                    icon={User}
                                    label="Пол"
                                    value={data.caller_gender === 'М' ? 'Мужской' : 'Женский'}
                                />
                            )}
                            <InfoRow
                                icon={MapPin}
                                label="Регион"
                                value={data.region_name || `ID: ${data.region_id}`}
                            />
                            <InfoRow
                                icon={Building2}
                                label="Отдел"
                                value={data.department_name || `ID: ${data.department_id}`}
                            />
                        </div>
                    </div>

                    {/* Duration Section - Editable */}
                    <div className="pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-700" />
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Длительность звонка
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                                onClick={() => setEditMode(editMode === 'duration' ? null : 'duration')}
                            >
                                <Edit3 className="w-3 h-3 mr-1" />
                                {editMode === 'duration' ? 'Готово' : 'Изменить'}
                            </Button>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-white p-4">
                            {editMode === 'duration' ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                                            Минуты
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={999}
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-10 text-center text-lg font-mono font-bold"
                                        />
                                    </div>
                                    <span className="text-2xl font-bold text-zinc-300 mt-5">:</span>
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                                            Секунды
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={durationSeconds}
                                            onChange={(e) => setDurationSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="h-10 text-center text-lg font-mono font-bold"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100">
                                        <Clock className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <span className="text-2xl font-bold font-mono tabular-nums text-zinc-800">
                                        {formatDurationDisplay(durationMinutes * 60 + durationSeconds)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question/Description */}
                    <div className="pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <MessageSquare className="w-3.5 h-3.5 text-zinc-700" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Вопрос / Описание
                            </span>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white p-3">
                            <p className="text-sm text-foreground leading-relaxed">
                                {data.description}
                            </p>
                        </div>
                    </div>

                    {/* Script/Solution if present */}
                    {data.scriptData && (
                        <div className="pt-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Решение из справочника
                                </span>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                    {data.scriptData.answer}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Notes - Editable */}
                    <div className="pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <StickyNote className="w-3.5 h-3.5 text-zinc-700" />
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Заметки оператора
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                                onClick={() => setEditMode(editMode === 'notes' ? null : 'notes')}
                            >
                                <Edit3 className="w-3 h-3 mr-1" />
                                {editMode === 'notes' ? 'Готово' : 'Изменить'}
                            </Button>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-white p-3">
                            {editMode === 'notes' ? (
                                <Textarea
                                    value={editedNotes}
                                    onChange={(e) => setEditedNotes(e.target.value)}
                                    placeholder="Добавьте заметки..."
                                    className="min-h-[80px] resize-none"
                                />
                            ) : (
                                <p className="text-sm text-foreground leading-relaxed">
                                    {editedNotes || <span className="text-muted-foreground italic">Нет заметок</span>}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-200 gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Сохранить звонок
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

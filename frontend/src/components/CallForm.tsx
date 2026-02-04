import { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { ScriptSelector, type ScriptSelection } from '@/components/ScriptSelector';

const callSchema = z.object({
    region_id: z.string().min(1, 'Region is required'),
    department_id: z.string().min(1, 'Department is required'),
    applicant_name: z.string().min(2, 'Name is required'),
    phone_number: z.string().optional(),
    caller_gender: z.string().optional(),
    description: z.string().min(5, 'Description is required'),
    duration_seconds: z.number().int().min(0).optional(),
});

type CallFormValues = z.infer<typeof callSchema>;

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

interface CallFormProps {
    externalSelectedScript?: ScriptSelection | null;
    onClearExternalScript?: () => void;
}

export function CallForm({ externalSelectedScript, onClearExternalScript }: CallFormProps) {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerStopped, setIsTimerStopped] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<CallFormValues | null>(null);
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [editingDurationSeconds, setEditingDurationSeconds] = useState(0);
    const [editingMinutes, setEditingMinutes] = useState(0);
    const [editingSeconds, setEditingSeconds] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const [scriptData, setScriptData] = useState<ScriptSelection | null>(null);
    const [operatorNotes, setOperatorNotes] = useState('');

    const form = useForm<CallFormValues>({
        resolver: zodResolver(callSchema),
        defaultValues: {
            region_id: '',
            department_id: '',
            applicant_name: '',
            phone_number: '',
            caller_gender: '',
            description: '',
            duration_seconds: undefined,
        },
    });

    const { data: regions, isLoading: regionsLoading, error: regionsError } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            try {
                const response = await api.get('/regions/');
                return response.data;
            } catch (error: any) {
                console.error('Error fetching regions:', error);
                if (error.response?.status === 401) {
                    toast.error('Требуется авторизация. Пожалуйста, войдите снова.');
                } else if (error.response?.status === 403) {
                    toast.error('Нет доступа к регионам');
                } else {
                    toast.error('Ошибка загрузки регионов');
                }
                throw error;
            }
        },
    });

    const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            try {
                const response = await api.get('/departments/');
                return response.data;
            } catch (error: any) {
                console.error('Error fetching departments:', error);
                if (error.response?.status === 401) {
                    toast.error('Требуется авторизация. Пожалуйста, войдите снова.');
                } else if (error.response?.status === 403) {
                    toast.error('Нет доступа к департаментам');
                } else {
                    toast.error('Ошибка загрузки департаментов');
                }
                throw error;
            }
        },
    });

    const selectedRegionId = form.watch('region_id');
    const applicantName = form.watch('applicant_name');
    const phoneNumber = form.watch('phone_number');
    const description = form.watch('description');
    const isDepartmentDisabled = !selectedRegionId || (departments?.length ?? 0) === 0;
    const filteredDepartments = useMemo(() => {
        if (!departments) return [];
        if (!selectedRegionId) return departments;
        const regionId = parseInt(selectedRegionId, 10);
        return departments.filter((d: any) => d.region_id === regionId);
    }, [departments, selectedRegionId]);

    useEffect(() => {
        if (!selectedRegionId) return;
        const currentDeptId = form.getValues('department_id');
        if (!currentDeptId) return;
        const regionId = parseInt(selectedRegionId, 10);
        const hasDepartment = departments?.some(
            (d: any) => d.region_id === regionId && String(d.id) === currentDeptId
        );
        if (!hasDepartment) {
            form.setValue('department_id', '');
        }
    }, [departments, form, selectedRegionId]);

    // Sync with external script selection
    useEffect(() => {
        if (externalSelectedScript) {
            setScriptData(externalSelectedScript);
            const question = externalSelectedScript.question || '';
            form.setValue('description', question);
        }
    }, [externalSelectedScript, form]);

    // Clear external if our local scriptData changes to null (e.g. user clicked change in ScriptSelector)
    useEffect(() => {
        if (scriptData === null && externalSelectedScript && onClearExternalScript) {
            onClearExternalScript();
        }
    }, [scriptData, externalSelectedScript, onClearExternalScript]);

    // Auto-start timer when user starts filling the form
    useEffect(() => {
        // Don't auto-start if timer is already running or was stopped
        if (isTimerRunning || isTimerStopped) return;

        // Check if any field has meaningful content
        const hasContent =
            selectedRegionId ||
            applicantName.trim().length > 0 ||
            (phoneNumber && phoneNumber.trim().length > 0) ||
            description.trim().length > 0;

        if (hasContent) {
            setIsTimerRunning(true);
            setIsTimerStopped(false);
            setElapsedSeconds(0);
            startTimeRef.current = Date.now();
        }
    }, [selectedRegionId, applicantName, phoneNumber, description, isTimerRunning, isTimerStopped]);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            startTimeRef.current = Date.now() - elapsedSeconds * 1000;
            intervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    setElapsedSeconds(elapsed);
                }
            }, 100);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isTimerRunning, elapsedSeconds]);

    function handleStartTimer() {
        setIsTimerRunning(true);
        setIsTimerStopped(false);
        setElapsedSeconds(0);
        startTimeRef.current = Date.now();
    }

    function handleStopTimer() {
        setIsTimerRunning(false);
        setIsTimerStopped(true);
        form.setValue('duration_seconds', elapsedSeconds);
    }

    function handleDurationChange(value: string) {
        const seconds = parseInt(value, 10);
        if (!isNaN(seconds) && seconds >= 0) {
            setElapsedSeconds(seconds);
            form.setValue('duration_seconds', seconds);
        }
    }


    const queryClient = useQueryClient();

    const submitMutation = useMutation({
        mutationFn: async (data: CallFormValues) => {
            const payload = {
                caller_name: data.applicant_name,
                caller_phone: data.phone_number,
                caller_gender: data.caller_gender || null,
                caller_region_id: data.region_id ? parseInt(data.region_id) : null,
                caller_department_id: data.department_id ? parseInt(data.department_id) : null,
                topic: 'General', // TODO: Add field for topic
                question: data.description,
                solution: scriptData?.answer || null,
                notes: operatorNotes || null,
                script: scriptData,
                duration_seconds: data.duration_seconds ?? null,
            };
            const response = await api.post('/calls/', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Звонок успешно сохранен');
            queryClient.invalidateQueries({ queryKey: ['calls'] });
            form.reset();
            setIsTimerRunning(false);
            setIsTimerStopped(false);
            setElapsedSeconds(0);
            setShowConfirmDialog(false);
            setPendingFormData(null);
            setIsEditingDuration(false);
            setScriptData(null);
            setOperatorNotes('');
            startTimeRef.current = null;
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to save call');
        }
    });

    function onSubmit(data: CallFormValues) {
        // Показываем диалог подтверждения с длительностью
        const durationToShow = data.duration_seconds ?? elapsedSeconds;
        setEditingDurationSeconds(durationToShow);
        // Конвертируем секунды в минуты и секунды для редактирования
        setEditingMinutes(Math.floor(durationToShow / 60));
        setEditingSeconds(durationToShow % 60);
        setIsEditingDuration(false);
        setPendingFormData(data);
        setShowConfirmDialog(true);
    }

    function handleConfirmSave() {
        if (!pendingFormData) return;

        const finalData = {
            ...pendingFormData,
            duration_seconds: editingDurationSeconds,
        };

        setShowConfirmDialog(false);
        submitMutation.mutate(finalData);
    }

    function handleEditDuration() {
        setIsEditingDuration(true);
    }

    function handleCancelDialog() {
        setShowConfirmDialog(false);
        setPendingFormData(null);
        setIsEditingDuration(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Timer Section */}
                <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Длительность звонка</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isTimerRunning
                                    ? 'Таймер работает...'
                                    : isTimerStopped
                                        ? 'Таймер остановлен'
                                        : 'Нажмите Start для начала отсчета'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isTimerRunning && !isTimerStopped && (
                                <Button
                                    type="button"
                                    onClick={handleStartTimer}
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Start
                                </Button>
                            )}
                            {isTimerRunning && (
                                <Button
                                    type="button"
                                    onClick={handleStopTimer}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Stop
                                </Button>
                            )}
                            {isTimerStopped && (
                                <>
                                    <Button
                                        type="button"
                                        onClick={handleStartTimer}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Resume
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setElapsedSeconds(0);
                                            setIsTimerStopped(false);
                                            form.setValue('duration_seconds', undefined);
                                        }}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Reset
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className={`text-5xl font-mono font-bold tabular-nums ${isTimerRunning
                                ? 'text-green-600 dark:text-green-400'
                                : isTimerStopped
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-muted-foreground'
                                }`}>
                                {formatDuration(elapsedSeconds)}
                            </div>
                        </div>

                        {isTimerStopped && (
                            <div className="flex flex-col gap-2 pt-3 border-t">
                                <label className="text-xs font-medium text-muted-foreground text-center mb-1">
                                    Длительность звонка (секунды)
                                </label>
                                <div className="flex items-center justify-center">
                                    <Input
                                        type="number"
                                        value={elapsedSeconds}
                                        onChange={(e) => handleDurationChange(e.target.value)}
                                        className="w-32 text-center font-mono text-lg"
                                        min={0}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Будет записано: {formatDuration(elapsedSeconds)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="region_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Region</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите регион" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {regionsLoading ? (
                                            <SelectItem value="__loading" disabled>
                                                Загрузка...
                                            </SelectItem>
                                        ) : regionsError ? (
                                            <SelectItem value="__error" disabled>
                                                Ошибка загрузки регионов
                                            </SelectItem>
                                        ) : !regions || regions.length === 0 ? (
                                            <SelectItem value="__empty" disabled>
                                                Нет доступных регионов
                                            </SelectItem>
                                        ) : (
                                            regions.map((r: any) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="department_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isDepartmentDisabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    isDepartmentDisabled
                                                        ? 'Сначала выберите регион'
                                                        : 'Выберите департамент'
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departmentsLoading ? (
                                            <SelectItem value="__loading" disabled>
                                                Загрузка...
                                            </SelectItem>
                                        ) : departmentsError ? (
                                            <SelectItem value="__error" disabled>
                                                Ошибка загрузки департаментов
                                            </SelectItem>
                                        ) : filteredDepartments.length === 0 ? (
                                            <SelectItem value="__empty" disabled>
                                                {!selectedRegionId
                                                    ? 'Сначала выберите регион'
                                                    : 'Нет департаментов для этого региона'}
                                            </SelectItem>
                                        ) : (
                                            filteredDepartments.map((d: any) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="applicant_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input placeholder="+1 234 567 890" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="caller_gender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Пол звонившего</FormLabel>
                            <FormControl>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={field.value === 'М' ? 'default' : 'outline'}
                                        className={`flex-1 ${field.value === 'М' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                        onClick={() => field.onChange('М')}
                                    >
                                        М (Мужской)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={field.value === 'Ж' ? 'default' : 'outline'}
                                        className={`flex-1 ${field.value === 'Ж' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                                        onClick={() => field.onChange('Ж')}
                                    >
                                        Ж (Женский)
                                    </Button>
                                    {field.value && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => field.onChange('')}
                                            className="shrink-0"
                                            title="Сбросить выбор"
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2 mb-4">
                    <FormLabel>Solution & Notes</FormLabel>
                    <ScriptSelector
                        selectedScript={scriptData}
                        notes={operatorNotes}
                        onSelect={(s) => {
                            setScriptData(s);
                            if (s) {
                                form.setValue('description', s.question);
                            }
                        }}
                        onNotesChange={setOperatorNotes}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe the issue..."
                                    className="resize-none h-32"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={submitMutation.isPending}>
                        {submitMutation.isPending ? 'Saving...' : 'Save Call'}
                    </Button>
                </div>
            </form>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Подтверждение сохранения</CardTitle>
                            <CardDescription>
                                Проверьте длительность звонка перед сохранением
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isEditingDuration ? (
                                <>
                                    <div className="text-center py-4">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Длительность звонка:
                                        </p>
                                        <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {formatDuration(editingDurationSeconds)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ({editingDurationSeconds} секунд)
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleEditDuration}
                                            className="flex-1"
                                        >
                                            Отредактировать
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleConfirmSave}
                                            className="flex-1"
                                        >
                                            Сохранить
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium block">
                                            Длительность звонка
                                        </label>
                                        <div className="flex items-center gap-3 justify-center">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-muted-foreground text-center">
                                                    Минуты
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={editingMinutes}
                                                    onChange={(e) => {
                                                        const minutes = parseInt(e.target.value, 10);
                                                        if (!isNaN(minutes) && minutes >= 0) {
                                                            setEditingMinutes(minutes);
                                                            const totalSeconds = minutes * 60 + editingSeconds;
                                                            setEditingDurationSeconds(totalSeconds);
                                                        }
                                                    }}
                                                    className="w-20 text-center font-mono text-lg"
                                                    min={0}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="pt-6 text-2xl font-bold text-muted-foreground">
                                                :
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-muted-foreground text-center">
                                                    Секунды
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={editingSeconds}
                                                    onChange={(e) => {
                                                        const seconds = parseInt(e.target.value, 10);
                                                        if (!isNaN(seconds) && seconds >= 0 && seconds < 60) {
                                                            setEditingSeconds(seconds);
                                                            const totalSeconds = editingMinutes * 60 + seconds;
                                                            setEditingDurationSeconds(totalSeconds);
                                                        }
                                                    }}
                                                    className="w-20 text-center font-mono text-lg"
                                                    min={0}
                                                    max={59}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Всего: {formatDuration(editingDurationSeconds)} ({editingDurationSeconds} сек)
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditingDuration(false)}
                                            className="flex-1"
                                        >
                                            Отмена
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleConfirmSave}
                                            className="flex-1"
                                        >
                                            Сохранить
                                        </Button>
                                    </div>
                                </>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancelDialog}
                                className="w-full"
                            >
                                Отменить сохранение
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Form>
    );
}

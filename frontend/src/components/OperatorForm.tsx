import { useEffect, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Play, Square, RotateCcw, Save, User, Phone, MapPin, Building2, MessageSquare, Clock, StickyNote, Tag, CheckCircle2, FileQuestion, Link2Off } from 'lucide-react';
import type { ScriptSelection } from '@/components/ScriptSelector';
import { SaveCallConfirmDialog, type CallPreviewData } from '@/components/SaveCallConfirmDialog';

// Ref interface для внешнего управления формой
export interface OperatorFormRef {
    submitForm: () => void;
    resetForm: () => void;
}

const callSchema = z.object({
    region_id: z.string().min(1, 'Выберите регион'),
    department_id: z.string().min(1, 'Выберите отдел'),
    applicant_name: z.string().min(2, 'Введите имя'),
    phone_number: z.string().optional(),
    caller_gender: z.string().optional(),
    call_type_id: z.string().min(1, 'Выберите тип звонка'),
    resolution_id: z.string().min(1, 'Выберите решение'),
    description: z.string().min(3, 'Опишите вопрос'),
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

interface OperatorFormProps {
    externalSelectedScript?: ScriptSelection | null;
    onClearExternalScript?: () => void;
    onCallSaved?: () => void;
}

export const OperatorForm = forwardRef<OperatorFormRef, OperatorFormProps>(function OperatorForm(
    { externalSelectedScript, onClearExternalScript, onCallSaved },
    ref
) {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerStopped, setIsTimerStopped] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const [scriptData, setScriptData] = useState<ScriptSelection | null>(null);
    const [operatorNotes, setOperatorNotes] = useState('');
    const [operatorAnswer, setOperatorAnswer] = useState('');
    const [reviewEnabled, setReviewEnabled] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [previewData, setPreviewData] = useState<CallPreviewData | null>(null);
    const [regionSearch, setRegionSearch] = useState('');
    const [departmentSearch, setDepartmentSearch] = useState('');

    const form = useForm<CallFormValues>({
        resolver: zodResolver(callSchema),
        defaultValues: {
            region_id: '',
            department_id: '',
            applicant_name: '',
            phone_number: '',
            caller_gender: '',
            call_type_id: '',
            resolution_id: '',
            description: '',
            duration_seconds: undefined,
        },
    });

    // Ref для внешнего управления
    const formRef = useRef<HTMLFormElement>(null);
    
    useImperativeHandle(ref, () => ({
        submitForm: () => {
            formRef.current?.requestSubmit();
        },
        resetForm: () => {
            const hasData = form.getValues('applicant_name') || 
                           form.getValues('description') || 
                           form.getValues('phone_number') ||
                           form.getValues('region_id');
            if (hasData) {
                if (window.confirm('Очистить форму? Несохранённые данные будут потеряны.')) {
                    form.reset();
                    setIsTimerRunning(false);
                    setIsTimerStopped(false);
                    setElapsedSeconds(0);
                    setScriptData(null);
                    setOperatorAnswer('');
                    setOperatorNotes('');
                    setReviewEnabled(false);
                    startTimeRef.current = null;
                    if (onClearExternalScript) onClearExternalScript();
                    toast.info('Форма очищена');
                }
            }
        },
    }), [form, onClearExternalScript]);

    const { data: regions, isLoading: regionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const response = await api.get('/regions/');
            return response.data;
        },
    });

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.get('/departments/');
            return response.data;
        },
    });

    const { data: callTypes, isLoading: callTypesLoading } = useQuery({
        queryKey: ['call-types'],
        queryFn: async () => {
            const response = await api.get('/call-types/');
            return response.data;
        },
    });

    const { data: callResolutions, isLoading: callResolutionsLoading } = useQuery({
        queryKey: ['call-resolutions'],
        queryFn: async () => {
            const response = await api.get('/call-resolutions/');
            return response.data;
        },
    });

    const selectedRegionId = form.watch('region_id');
    const applicantName = form.watch('applicant_name');
    const phoneNumber = form.watch('phone_number');
    const description = form.watch('description');

    useEffect(() => {
        if (reviewEnabled) {
            if (externalSelectedScript && onClearExternalScript) {
                onClearExternalScript();
            }
            if (scriptData) {
                setScriptData(null);
            }
        }
    }, [reviewEnabled, externalSelectedScript, onClearExternalScript, scriptData]);

    const filteredDepartments = useMemo(() => {
        if (!departments) return [];
        if (!selectedRegionId) return departments;
        const regionId = parseInt(selectedRegionId, 10);
        return departments.filter((d: any) => d.region_id === regionId);
    }, [departments, selectedRegionId]);

    const visibleRegions = useMemo(() => {
        if (!regions) return [];
        const query = regionSearch.trim().toLowerCase();
        if (!query) return regions;
        return regions.filter((r: any) =>
            String(r?.name ?? '').toLowerCase().includes(query)
        );
    }, [regions, regionSearch]);

    const visibleDepartments = useMemo(() => {
        const query = departmentSearch.trim().toLowerCase();
        if (!query) return filteredDepartments;
        return filteredDepartments.filter((d: any) =>
            String(d?.name ?? '').toLowerCase().includes(query)
        );
    }, [filteredDepartments, departmentSearch]);

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

    useEffect(() => {
        if (externalSelectedScript) {
            if (reviewEnabled) {
                setReviewEnabled(false);
            }
            setScriptData(externalSelectedScript);
            const currentDescription = form.getValues('description');
            if (!currentDescription.trim()) {
                form.setValue('description', externalSelectedScript.question || '');
            }
            if (!operatorAnswer.trim() && externalSelectedScript.answer) {
                setOperatorAnswer(externalSelectedScript.answer);
            }
        }
    }, [externalSelectedScript, form, reviewEnabled, operatorAnswer]);

    useEffect(() => {
        if (isTimerRunning || isTimerStopped) return;
        const hasContent =
            selectedRegionId ||
            applicantName.trim().length > 0 ||
            (phoneNumber && phoneNumber.trim().length > 0) ||
            description.trim().length > 0;
        if (hasContent) {
            setIsTimerRunning(true);
            setElapsedSeconds(0);
            startTimeRef.current = Date.now();
        }
    }, [selectedRegionId, applicantName, phoneNumber, description, isTimerRunning, isTimerStopped]);

    useEffect(() => {
        if (isTimerRunning) {
            startTimeRef.current = Date.now() - elapsedSeconds * 1000;
            intervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
                }
            }, 100);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isTimerRunning, elapsedSeconds]);

    const handleStartTimer = () => {
        setIsTimerRunning(true);
        setIsTimerStopped(false);
        setElapsedSeconds(0);
        startTimeRef.current = Date.now();
    };

    const handleStopTimer = () => {
        setIsTimerRunning(false);
        setIsTimerStopped(true);
        form.setValue('duration_seconds', elapsedSeconds);
    };

    const handleResetTimer = () => {
        setElapsedSeconds(0);
        setIsTimerStopped(false);
        form.setValue('duration_seconds', undefined);
    };

    const queryClient = useQueryClient();

    const submitMutation = useMutation({
        mutationFn: async (confirmedData: CallPreviewData) => {
            const reviewScript =
                reviewEnabled && confirmedData.description.trim().length > 0
                    ? {
                        external_id: null,
                        question: confirmedData.description,
                        answer: confirmedData.operatorAnswer?.trim() || null,
                        is_custom: true,
                        needs_review: true,
                        in_registry_queue: false,
                    }
                    : null;

            const payload = {
                caller_name: confirmedData.applicant_name,
                caller_phone: confirmedData.phone_number,
                caller_gender: confirmedData.caller_gender || null,
                caller_region_id: confirmedData.region_id ? parseInt(confirmedData.region_id) : null,
                caller_department_id: confirmedData.department_id ? parseInt(confirmedData.department_id) : null,
                call_type_id: confirmedData.call_type_id ? parseInt(confirmedData.call_type_id) : null,
                resolution_id: confirmedData.resolution_id ? parseInt(confirmedData.resolution_id) : null,
                topic: confirmedData.call_type_name || 'General',
                question: confirmedData.description,
                solution: confirmedData.operatorAnswer?.trim() || null,
                notes: confirmedData.operatorNotes || null,
                script: confirmedData.scriptData || reviewScript,
                duration_seconds: confirmedData.duration_seconds,
            };
            const response = await api.post('/calls/', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Звонок сохранён');
            queryClient.invalidateQueries({ queryKey: ['calls'] });
            form.reset();
            setIsTimerRunning(false);
            setIsTimerStopped(false);
            setElapsedSeconds(0);
            setScriptData(null);
            setOperatorAnswer('');
            setOperatorNotes('');
            setReviewEnabled(false);
            setShowConfirmDialog(false);
            setPreviewData(null);
            startTimeRef.current = null;
            if (onClearExternalScript) onClearExternalScript();
            if (onCallSaved) onCallSaved();
        },
        onError: () => {
            toast.error('Ошибка сохранения');
        }
    });

    // Get region and department names for display
    const getRegionName = (regionId: string) => {
        if (!regions || !regionId) return undefined;
        const region = regions.find((r: any) => String(r.id) === regionId);
        return region?.name;
    };

    const getDepartmentName = (departmentId: string) => {
        if (!departments || !departmentId) return undefined;
        const dept = departments.find((d: any) => String(d.id) === departmentId);
        return dept?.name;
    };

    const getCallTypeName = (callTypeId: string) => {
        if (!callTypes || !callTypeId) return undefined;
        const callType = callTypes.find((t: any) => String(t.id) === callTypeId);
        return callType?.name;
    };

    const getResolutionName = (resolutionId: string) => {
        if (!callResolutions || !resolutionId) return undefined;
        const resolution = callResolutions.find((r: any) => String(r.id) === resolutionId);
        return resolution?.name;
    };

    const onSubmit = (data: CallFormValues) => {
        // Stop timer if still running
        if (isTimerRunning) {
            setIsTimerRunning(false);
            setIsTimerStopped(true);
        }

        // Prepare preview data for confirmation dialog
        const preview: CallPreviewData = {
            applicant_name: data.applicant_name,
            phone_number: data.phone_number,
            caller_gender: data.caller_gender,
            region_id: data.region_id,
            department_id: data.department_id,
            call_type_id: data.call_type_id,
            resolution_id: data.resolution_id,
            description: data.description,
            duration_seconds: data.duration_seconds ?? elapsedSeconds,
            region_name: getRegionName(data.region_id),
            department_name: getDepartmentName(data.department_id),
            call_type_name: getCallTypeName(data.call_type_id),
            resolution_name: getResolutionName(data.resolution_id),
            scriptData: scriptData,
            operatorAnswer: operatorAnswer,
            operatorNotes: operatorNotes,
        };

        setPreviewData(preview);
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = (confirmedData: CallPreviewData) => {
        submitMutation.mutate(confirmedData);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header with Timer - FIXED */}
            <div className="shrink-0 px-5 py-3 border-b border-border/50 bg-zinc-950 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight">Новый звонок</h1>
                            <p className="text-[10px] text-zinc-400">Заполните данные</p>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-2">
                        <div className={`
                            px-3 py-1.5 rounded-lg font-mono text-xl font-bold tabular-nums
                            ${isTimerRunning
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isTimerStopped
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-zinc-800 text-zinc-500'
                            }
                        `}>
                            <Clock className="w-3.5 h-3.5 inline-block mr-1.5 opacity-60" />
                            {formatDuration(elapsedSeconds)}
                        </div>

                        <div className="flex gap-1">
                            {!isTimerRunning && !isTimerStopped && (
                                <Button type="button" size="icon" onClick={handleStartTimer} className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700">
                                    <Play className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            {isTimerRunning && (
                                <Button type="button" size="icon" variant="destructive" onClick={handleStopTimer} className="h-8 w-8">
                                    <Square className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            {isTimerStopped && (
                                <>
                                    <Button type="button" size="icon" variant="outline" onClick={handleStartTimer} className="h-8 w-8 border-zinc-700 hover:bg-zinc-800">
                                        <Play className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={handleResetTimer} className="h-8 w-8 text-zinc-400 hover:text-white">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content - SCROLLABLE */}
            <Form {...form}>
                <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
                    <div className="flex-1 p-3 space-y-2">
                        {/* Row 1: Region & Department */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="region_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Регион
                                        </FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            onOpenChange={(open) => {
                                                if (!open) setRegionSearch('');
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Выберите..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input
                                                        value={regionSearch}
                                                        onChange={(e) => setRegionSearch(e.target.value)}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        placeholder="Поиск региона..."
                                                        className="h-8"
                                                        autoComplete="off"
                                                        aria-label="Поиск региона"
                                                    />
                                                </div>
                                                {regionsLoading ? (
                                                    <SelectItem value="__loading" disabled>Загрузка...</SelectItem>
                                                ) : regions?.length === 0 ? (
                                                    <SelectItem value="__empty" disabled>Нет регионов</SelectItem>
                                                ) : visibleRegions.length === 0 ? (
                                                    <SelectItem value="__no_results" disabled>Ничего не найдено</SelectItem>
                                                ) : (
                                                    visibleRegions.map((r: any) => (
                                                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
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
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Отдел
                                        </FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!selectedRegionId}
                                            onOpenChange={(open) => {
                                                if (!open) setDepartmentSearch('');
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder={!selectedRegionId ? '← Регион' : 'Выберите...'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input
                                                        value={departmentSearch}
                                                        onChange={(e) => setDepartmentSearch(e.target.value)}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        placeholder="Поиск отдела..."
                                                        className="h-8"
                                                        autoComplete="off"
                                                        aria-label="Поиск отдела"
                                                        disabled={!selectedRegionId}
                                                    />
                                                </div>
                                                {filteredDepartments.length === 0 ? (
                                                    <SelectItem value="__empty" disabled>
                                                        {!selectedRegionId ? 'Сначала выберите регион' : 'Нет отделов'}
                                                    </SelectItem>
                                                ) : visibleDepartments.length === 0 ? (
                                                    <SelectItem value="__no_results" disabled>Ничего не найдено</SelectItem>
                                                ) : (
                                                    visibleDepartments.map((d: any) => (
                                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 2: Name / Phone / Gender */}
                        <div className="grid grid-cols-3 gap-3 items-end">
                            <FormField
                                control={form.control}
                                name="applicant_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <User className="w-3 h-3" /> Имя
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Иван Иванов" className="h-8" {...field} />
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
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> Телефон
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="+7 ..." className="h-8" {...field} />
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
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground">Пол</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={field.value === 'М' ? 'default' : 'outline'}
                                                    className={`flex-1 h-8 text-xs ${field.value === 'М' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                                    onClick={() => field.onChange('М')}
                                                >
                                                    М
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={field.value === 'Ж' ? 'default' : 'outline'}
                                                    className={`flex-1 h-8 text-xs ${field.value === 'Ж' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                                                    onClick={() => field.onChange('Ж')}
                                                >
                                                    Ж
                                                </Button>
                                                {field.value && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => field.onChange('')}
                                                        className="h-8 px-2 text-xs"
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 3: Call Type & Outcome */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="call_type_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Тип звонка
                                        </FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Выберите..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {callTypesLoading ? (
                                                    <SelectItem value="__loading" disabled>Загрузка...</SelectItem>
                                                ) : callTypes?.length === 0 ? (
                                                    <SelectItem value="__empty" disabled>Нет типов</SelectItem>
                                                ) : (
                                                    callTypes?.map((t: any) => (
                                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
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
                                name="resolution_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Исход/результат
                                        </FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Выберите..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {callResolutionsLoading ? (
                                                    <SelectItem value="__loading" disabled>Загрузка...</SelectItem>
                                                ) : callResolutions?.length === 0 ? (
                                                    <SelectItem value="__empty" disabled>Нет исходов</SelectItem>
                                                ) : (
                                                    callResolutions?.map((r: any) => (
                                                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Appeal */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" /> Обращение клиента
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Кратко зафиксируйте суть обращения..."
                                            className="h-16 resize-none text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Linked script info */}
                        {scriptData && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                                            Скрипт из реестра привязан
                                        </p>
                                        <p className="text-xs text-emerald-900 line-clamp-1">
                                            {scriptData.question}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setScriptData(null);
                                            if (onClearExternalScript) onClearExternalScript();
                                        }}
                                        className="h-7 px-2 text-[11px] text-emerald-700 hover:text-red-600"
                                    >
                                        <Link2Off className="h-3.5 w-3.5 mr-1" />
                                        Открепить
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Operator answer */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> Ответ клиенту (опционально)
                                </label>
                                {scriptData?.answer && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px]"
                                        onClick={() => setOperatorAnswer(scriptData.answer || '')}
                                    >
                                        Подставить из реестра
                                    </Button>
                                )}
                            </div>
                            <Textarea
                                placeholder="Как вы ответили клиенту? Можно оставить пустым."
                                className="h-16 resize-none text-sm"
                                value={operatorAnswer}
                                onChange={(e) => setOperatorAnswer(e.target.value)}
                            />
                        </div>

                        {/* Review toggle */}
                        {!scriptData && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[11px] font-medium text-amber-700 flex items-center gap-2">
                                        <FileQuestion className="w-3 h-3" />
                                        Предложить в реестр (ревью)
                                    </label>
                                    <Checkbox
                                        checked={reviewEnabled}
                                        onCheckedChange={(value) => setReviewEnabled(!!value)}
                                    />
                                </div>
                                <p className="text-[10px] text-amber-700/80 mt-1">
                                    В ревью уйдёт «Обращение клиента» + ваш ответ (если заполнен).
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <StickyNote className="w-3 h-3" /> Заметки (необязательно)
                            </label>
                            <Textarea
                                placeholder="Внутренние заметки для истории..."
                                className="h-12 resize-none text-sm"
                                value={operatorNotes}
                                onChange={(e) => setOperatorNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit Button - FIXED at bottom */}
                    <div className="shrink-0 p-4 pt-3 border-t border-border/50 bg-muted/30">
                        <Button
                            type="submit"
                            disabled={submitMutation.isPending}
                            className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                            title="Сохранить звонок (Ctrl+Enter)"
                        >
                            {submitMutation.isPending ? (
                                'Сохранение...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Сохранить звонок
                                    <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-medium">
                                        Ctrl+↵
                                    </kbd>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Confirmation Dialog */}
            <SaveCallConfirmDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                data={previewData}
                onConfirm={handleConfirmSave}
                isLoading={submitMutation.isPending}
            />
        </div>
    );
});

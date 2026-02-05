import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Loader2, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';

// Цветовая карта для типов звонков
const callTypeColors: Record<string, 'blue' | 'orange' | 'purple' | 'cyan' | 'pink' | 'yellow' | 'muted'> = {
    'консультация': 'blue',
    'жалоба': 'orange',
    'предложение': 'purple',
    'вопрос': 'cyan',
    'запрос': 'pink',
    'обращение': 'yellow',
};

// Цветовая карта для резолюций
const resolutionColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
    'решено': 'success',
    'решен': 'success',
    'выполнено': 'success',
    'отказано': 'error',
    'отклонено': 'error',
    'в работе': 'warning',
    'ожидает': 'warning',
    'ожидание': 'warning',
    'передано': 'info',
    'перенаправлено': 'info',
    'информирован': 'info',
};

// Получить цвет для типа звонка
function getCallTypeColor(name: string | null | undefined): 'blue' | 'orange' | 'purple' | 'cyan' | 'pink' | 'yellow' | 'muted' {
    if (!name) return 'muted';
    const lower = name.toLowerCase();
    for (const [key, color] of Object.entries(callTypeColors)) {
        if (lower.includes(key)) return color;
    }
    return 'muted';
}

// Получить цвет для резолюции
function getResolutionColor(name: string | null | undefined): 'success' | 'warning' | 'error' | 'info' | 'muted' {
    if (!name) return 'muted';
    const lower = name.toLowerCase();
    for (const [key, color] of Object.entries(resolutionColors)) {
        if (lower.includes(key)) return color;
    }
    return 'muted';
}

type Call = {
    id: number;
    operator_id: number;
    operator: { id: number; username: string } | null;
    caller_name: string | null;
    caller_phone: string | null;
    caller_gender: string | null;
    region: { name: string } | null;
    department: { name: string } | null;
    call_type: { id: number; name: string } | null;
    resolution: { id: number; name: string } | null;
    question: string;
    solution: string | null;
    notes: string | null;
    created_at: string;
    duration_seconds: number | null;
    script: { question: string; answer: string | null; is_custom: boolean } | null;
};

type User = {
    id: number;
    username: string;
    role: 'operator' | 'supervisor' | 'admin';
    effective_role: 'operator' | 'supervisor' | 'admin';
    is_active: boolean;
};

type CallFilters = {
    dateFrom: string;
    dateTo: string;
    operatorId: string;
    search: string;
    minDuration: string;
    maxDuration: string;
};

type EditCallForm = {
    id: number;
    caller_name: string;
    caller_phone: string;
    question: string;
    solution: string;
    notes: string;
    duration_seconds: string;
};

const columnHelper = createColumnHelper<Call>();

const defaultFilters: CallFilters = {
    dateFrom: '',
    dateTo: '',
    operatorId: '',
    search: '',
    minDuration: '',
    maxDuration: '',
};

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toIsoStart(dateValue: string) {
    return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEnd(dateValue: string) {
    return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

export default function HistoryPage() {
    const [filters, setFilters] = useState<CallFilters>(defaultFilters);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<EditCallForm | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewCall, setViewCall] = useState<Call | null>(null);
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();
    const isPrivileged = currentUser?.effective_role !== 'operator';

    const { data: users } = useQuery({
        queryKey: ['users', 'list'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data as User[];
        },
        enabled: !!isPrivileged,
    });

    const activeUsers = useMemo(() => (users || []).filter((user) => user.is_active), [users]);

    const { data: calls, isLoading, isError } = useQuery({
        queryKey: ['calls', 'history', filters],
        queryFn: async () => {
            const params: Record<string, string | number> = {
                limit: 100,
            };

            if (filters.search) params.search = filters.search;
            if (filters.operatorId) params.operator_id = parseInt(filters.operatorId, 10);
            if (filters.dateFrom) params.created_from = toIsoStart(filters.dateFrom);
            if (filters.dateTo) params.created_to = toIsoEnd(filters.dateTo);
            if (filters.minDuration) params.min_duration = parseInt(filters.minDuration, 10);
            if (filters.maxDuration) params.max_duration = parseInt(filters.maxDuration, 10);

            const response = await api.get('/calls/', { params });
            return response.data as Call[];
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: { id: number; data: Record<string, unknown> }) => {
            const response = await api.patch(`/calls/${payload.id}`, payload.data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Звонок обновлен');
            queryClient.invalidateQueries({ queryKey: ['calls'] });
            setIsEditOpen(false);
            setEditForm(null);
        },
        onError: () => {
            toast.error('Не удалось обновить звонок');
        },
    });

    const openEdit = useCallback((call: Call) => {
        setEditForm({
            id: call.id,
            caller_name: call.caller_name || '',
            caller_phone: call.caller_phone || '',
            question: call.question || '',
            solution: call.solution || '',
            notes: call.notes || '',
            duration_seconds: call.duration_seconds === null ? '' : String(call.duration_seconds),
        });
        setIsEditOpen(true);
    }, []);

    const openView = useCallback((call: Call) => {
        setViewCall(call);
        setIsViewOpen(true);
    }, []);

    const columns = useMemo(() => {
        const cols = [
            columnHelper.accessor('id', {
                header: 'ID',
                cell: (info) => <span className="text-muted-foreground">#{info.getValue()}</span>,
            }),
            columnHelper.accessor('created_at', {
                header: 'Дата',
                cell: (info) => format(new Date(info.getValue()), 'dd.MM.yyyy HH:mm'),
            }),
            columnHelper.accessor('caller_name', {
                header: 'Звонивший',
                cell: (info) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{info.getValue() || '-'}</span>
                        {info.row.original.caller_phone && (
                            <span className="text-xs text-muted-foreground">{info.row.original.caller_phone}</span>
                        )}
                    </div>
                ),
            }),
            columnHelper.display({
                id: 'call_type',
                header: 'Тип',
                cell: (info) => {
                    const callType = info.row.original.call_type;
                    if (!callType) return <span className="text-muted-foreground">-</span>;
                    return (
                        <Badge variant={getCallTypeColor(callType.name)} className="whitespace-nowrap">
                            {callType.name}
                        </Badge>
                    );
                },
            }),
            columnHelper.display({
                id: 'resolution',
                header: 'Результат',
                cell: (info) => {
                    const resolution = info.row.original.resolution;
                    if (!resolution) return <span className="text-muted-foreground">-</span>;
                    return (
                        <Badge variant={getResolutionColor(resolution.name)} className="whitespace-nowrap">
                            {resolution.name}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor('question', {
                header: 'Вопрос',
                cell: (info) => (
                    <div className="max-w-[180px] truncate" title={info.getValue()}>
                        {info.getValue()}
                    </div>
                ),
            }),
            columnHelper.display({
                id: 'solution',
                header: 'Ответ',
                cell: (info) => {
                    const script = info.row.original.script;
                    const answer = info.row.original.solution;
                    if (script?.answer) {
                        return (
                            <div className="max-w-[200px] truncate text-green-700" title={script.answer}>
                                {script.answer}
                            </div>
                        );
                    }
                    if (answer) {
                        return (
                            <div className="max-w-[200px] truncate text-blue-600" title={answer}>
                                {answer}
                            </div>
                        );
                    }
                    return <span className="text-muted-foreground">-</span>;
                },
            }),
            columnHelper.accessor('duration_seconds', {
                header: 'Длительность',
                cell: (info) => {
                    const val = info.getValue();
                    if (val === null) return '-';
                    return formatDuration(val);
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: '',
                cell: (info) => (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(info.row.original)}
                            title="Подробнее"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(info.row.original)}
                            title="Редактировать"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }),
        ];

        if (isPrivileged) {
            cols.splice(2, 0,
                columnHelper.display({
                    id: 'operator',
                    header: 'Оператор',
                    cell: (info) => (
                        <span className="text-muted-foreground">
                            {info.row.original.operator?.username || `#${info.row.original.operator_id}`}
                        </span>
                    ),
                })
            );
        }

        return cols;
    }, [isPrivileged, openEdit, openView]);

    const table = useReactTable({
        data: calls || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    function updateEditField<K extends keyof EditCallForm>(key: K, value: EditCallForm[K]) {
        setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    }

    function handleSaveEdit() {
        if (!editForm) return;
        if (!editForm.question.trim()) {
            toast.error('Вопрос не может быть пустым');
            return;
        }

        const duration = editForm.duration_seconds.trim();
        const durationValue = duration === '' ? null : parseInt(duration, 10);
        if (duration && Number.isNaN(durationValue)) {
            toast.error('Некорректная длительность');
            return;
        }

        const payload: Record<string, unknown> = {
            caller_name: editForm.caller_name.trim() || null,
            caller_phone: editForm.caller_phone.trim() || null,
            question: editForm.question.trim(),
            solution: editForm.solution.trim() || null,
            notes: editForm.notes.trim() || null,
            duration_seconds: durationValue,
        };

        updateMutation.mutate({
            id: editForm.id,
            data: payload,
        });
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-destructive py-10">
                Не удалось загрузить историю звонков.
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>История звонков</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 rounded-md border bg-muted/20 p-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                                placeholder="Имя, телефон, вопрос, заметки..."
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
                                        {activeUsers.map((user) => (
                                            <SelectItem key={user.id} value={String(user.id)}>
                                                {user.username} ({user.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
                                onClick={() => setFilters(defaultFilters)}
                                className="w-full"
                            >
                                Сбросить
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        Нет результатов.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog
                open={isEditOpen}
                onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) {
                        setEditForm(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Редактирование звонка</DialogTitle>
                    </DialogHeader>
                    {editForm && (
                        <div className="grid gap-4 overflow-y-auto pr-2 flex-1 min-h-0">
                            <div className="grid gap-2">
                                <Label htmlFor="editCallerName">Имя звонящего</Label>
                                <Input
                                    id="editCallerName"
                                    value={editForm.caller_name}
                                    onChange={(e) => updateEditField('caller_name', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editCallerPhone">Телефон</Label>
                                <Input
                                    id="editCallerPhone"
                                    value={editForm.caller_phone}
                                    onChange={(e) => updateEditField('caller_phone', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editQuestion">Вопрос</Label>
                                <Textarea
                                    id="editQuestion"
                                    value={editForm.question}
                                    onChange={(e) => updateEditField('question', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editSolution">Решение</Label>
                                <Textarea
                                    id="editSolution"
                                    value={editForm.solution}
                                    onChange={(e) => updateEditField('solution', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editNotes">Заметки</Label>
                                <Textarea
                                    id="editNotes"
                                    value={editForm.notes}
                                    onChange={(e) => updateEditField('notes', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editDuration">Длительность (сек)</Label>
                                <Input
                                    id="editDuration"
                                    type="number"
                                    min={0}
                                    value={editForm.duration_seconds}
                                    onChange={(e) => updateEditField('duration_seconds', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={updateMutation.isPending}
                        >
                            Отмена
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Сохраняю...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog
                open={isViewOpen}
                onOpenChange={(open) => {
                    setIsViewOpen(open);
                    if (!open) {
                        setViewCall(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Подробности звонка #{viewCall?.id}</DialogTitle>
                    </DialogHeader>
                    {viewCall && (
                        <div className="grid gap-4 overflow-y-auto pr-2 flex-1 min-h-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs">Дата и время</Label>
                                    <p className="font-medium">
                                        {format(new Date(viewCall.created_at), 'dd.MM.yyyy HH:mm:ss')}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">Длительность</Label>
                                    <p className="font-medium">
                                        {viewCall.duration_seconds !== null
                                            ? formatDuration(viewCall.duration_seconds)
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs">Звонивший</Label>
                                    <p className="font-medium">{viewCall.caller_name || '-'}</p>
                                    {viewCall.caller_phone && (
                                        <p className="text-sm text-muted-foreground">{viewCall.caller_phone}</p>
                                    )}
                                    {viewCall.caller_gender && (
                                        <p className="text-sm text-muted-foreground">Пол: {viewCall.caller_gender}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">Оператор</Label>
                                    <p className="font-medium">
                                        {viewCall.operator?.username || `#${viewCall.operator_id}`}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs">Тип звонка</Label>
                                    {viewCall.call_type ? (
                                        <Badge variant={getCallTypeColor(viewCall.call_type.name)} className="mt-1">
                                            {viewCall.call_type.name}
                                        </Badge>
                                    ) : (
                                        <p className="text-muted-foreground">-</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">Результат</Label>
                                    {viewCall.resolution ? (
                                        <Badge variant={getResolutionColor(viewCall.resolution.name)} className="mt-1">
                                            {viewCall.resolution.name}
                                        </Badge>
                                    ) : (
                                        <p className="text-muted-foreground">-</p>
                                    )}
                                </div>
                            </div>

                            {(viewCall.region || viewCall.department) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Регион</Label>
                                        <p className="font-medium">{viewCall.region?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Отдел</Label>
                                        <p className="font-medium">{viewCall.department?.name || '-'}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-muted-foreground text-xs">Вопрос</Label>
                                <div className="mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                                    {viewCall.question}
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground text-xs">Ответ / Решение</Label>
                                {viewCall.script?.answer ? (
                                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md whitespace-pre-wrap text-green-800 dark:text-green-200">
                                        <span className="text-xs text-green-600 dark:text-green-400 block mb-1">Из скрипта:</span>
                                        {viewCall.script.answer}
                                    </div>
                                ) : viewCall.solution ? (
                                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                                        {viewCall.solution}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground mt-1">-</p>
                                )}
                            </div>

                            {viewCall.notes && (
                                <div>
                                    <Label className="text-muted-foreground text-xs">Заметки оператора</Label>
                                    <div className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md whitespace-pre-wrap">
                                        {viewCall.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                            Закрыть
                        </Button>
                        <Button
                            onClick={() => {
                                setIsViewOpen(false);
                                if (viewCall) {
                                    openEdit(viewCall);
                                }
                            }}
                        >
                            Редактировать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/api/client';
import { toast } from 'sonner';
import {
    Loader2,
    Plus,
    Trash2,
    Edit3,
    MapPin,
    Building2,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Save,
    X,
    PhoneCall,
    CheckCircle2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// Types
type Region = {
    id: number;
    name: string;
    code: string;
};

type Department = {
    id: number;
    name: string;
    region_id: number;
};

type CallType = {
    id: number;
    name: string;
};

type CallResolution = {
    id: number;
    name: string;
};

// Schemas
const regionSchema = z.object({
    name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
    code: z.string().min(1, 'Обязательное поле').max(20, 'Максимум 20 символов'),
});

const departmentSchema = z.object({
    name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
    region_id: z.string().min(1, 'Выберите регион'),
});

const callTypeSchema = z.object({
    name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
});

const callResolutionSchema = z.object({
    name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
});

type RegionForm = z.infer<typeof regionSchema>;
type DepartmentForm = z.infer<typeof departmentSchema>;
type CallTypeForm = z.infer<typeof callTypeSchema>;
type CallResolutionForm = z.infer<typeof callResolutionSchema>;

// Region row component with expandable departments
function RegionRow({
    region,
    departments,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onAddDepartment,
    onEditDepartment,
    onDeleteDepartment,
}: {
    region: Region;
    departments: Department[];
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddDepartment: () => void;
    onEditDepartment: (dept: Department) => void;
    onDeleteDepartment: (dept: Department) => void;
}) {
    const regionDepts = departments.filter((d) => d.region_id === region.id);

    return (
        <div className="border border-border/50 rounded-xl overflow-hidden bg-white">
            {/* Region Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={onToggle}
            >
                <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </button>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{region.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                            {region.code}
                        </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {regionDepts.length} {regionDepts.length === 1 ? 'подразделение' :
                            regionDepts.length >= 2 && regionDepts.length <= 4 ? 'подразделения' : 'подразделений'}
                    </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onEdit}
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                        disabled={regionDepts.length > 0}
                        title={regionDepts.length > 0 ? 'Сначала удалите подразделения' : 'Удалить регион'}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Departments List */}
            {isExpanded && (
                <div className="border-t border-border/50 bg-muted/20">
                    {regionDepts.length > 0 ? (
                        <div className="divide-y divide-border/30">
                            {regionDepts.map((dept) => (
                                <div
                                    key={dept.id}
                                    className="flex items-center gap-3 px-4 py-2.5 pl-14 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <span className="flex-1 text-sm text-foreground">{dept.name}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={() => onEditDepartment(dept)}
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => onDeleteDepartment(dept)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                            Подразделений пока нет
                        </div>
                    )}
                    <div className="px-4 py-2 border-t border-border/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground hover:text-foreground gap-2"
                            onClick={onAddDepartment}
                        >
                            <Plus className="w-4 h-4" />
                            Добавить подразделение
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DirectoriesPage() {
    const queryClient = useQueryClient();
    const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set());

    // Dialog states
    const [regionDialog, setRegionDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; region?: Region }>({
        open: false,
        mode: 'create',
    });
    const [deptDialog, setDeptDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; dept?: Department; regionId?: number }>({
        open: false,
        mode: 'create',
    });
    const [callTypeDialog, setCallTypeDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; callType?: CallType }>({
        open: false,
        mode: 'create',
    });
    const [resolutionDialog, setResolutionDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; resolution?: CallResolution }>({
        open: false,
        mode: 'create',
    });
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        type: 'region' | 'department' | 'call_type' | 'resolution';
        item?: Region | Department | CallType | CallResolution;
    }>({
        open: false,
        type: 'region',
    });

    // Forms
    const regionForm = useForm<RegionForm>({
        resolver: zodResolver(regionSchema),
        defaultValues: { name: '', code: '' },
    });

    const deptForm = useForm<DepartmentForm>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', region_id: '' },
    });

    const callTypeForm = useForm<CallTypeForm>({
        resolver: zodResolver(callTypeSchema),
        defaultValues: { name: '' },
    });

    const resolutionForm = useForm<CallResolutionForm>({
        resolver: zodResolver(callResolutionSchema),
        defaultValues: { name: '' },
    });

    // Queries
    const { data: regions = [], isLoading: regionsLoading } = useQuery<Region[]>({
        queryKey: ['regions'],
        queryFn: async () => {
            const response = await api.get('/regions/');
            return response.data;
        },
    });

    const { data: departments = [], isLoading: deptsLoading } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.get('/departments/');
            return response.data;
        },
    });

    const { data: callTypes = [], isLoading: callTypesLoading } = useQuery<CallType[]>({
        queryKey: ['call-types'],
        queryFn: async () => {
            const response = await api.get('/call-types/');
            return response.data;
        },
    });

    const { data: callResolutions = [], isLoading: resolutionsLoading } = useQuery<CallResolution[]>({
        queryKey: ['call-resolutions'],
        queryFn: async () => {
            const response = await api.get('/call-resolutions/');
            return response.data;
        },
    });

    // Mutations - Regions
    const createRegionMutation = useMutation({
        mutationFn: async (data: RegionForm) => {
            const response = await api.post('/regions/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
            toast.success('Регион создан');
            setRegionDialog({ open: false, mode: 'create' });
            regionForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка создания региона');
        },
    });

    const updateRegionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<RegionForm> }) => {
            const response = await api.patch(`/regions/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
            toast.success('Регион обновлён');
            setRegionDialog({ open: false, mode: 'create' });
            regionForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка обновления региона');
        },
    });

    const deleteRegionMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/regions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
            toast.success('Регион удалён');
            setDeleteDialog({ open: false, type: 'region' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка удаления региона');
        },
    });

    // Mutations - Departments
    const createDeptMutation = useMutation({
        mutationFn: async (data: DepartmentForm) => {
            const response = await api.post('/departments/', {
                name: data.name,
                region_id: parseInt(data.region_id),
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Подразделение создано');
            setDeptDialog({ open: false, mode: 'create' });
            deptForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка создания подразделения');
        },
    });

    const updateDeptMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<{ name: string; region_id: number }> }) => {
            const response = await api.patch(`/departments/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Подразделение обновлено');
            setDeptDialog({ open: false, mode: 'create' });
            deptForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка обновления подразделения');
        },
    });

    const deleteDeptMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/departments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Подразделение удалено');
            setDeleteDialog({ open: false, type: 'department' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка удаления подразделения');
        },
    });

    // Mutations - Call Types
    const createCallTypeMutation = useMutation({
        mutationFn: async (data: CallTypeForm) => {
            const response = await api.post('/call-types/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-types'] });
            toast.success('Тип звонка создан');
            setCallTypeDialog({ open: false, mode: 'create' });
            callTypeForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка создания типа звонка');
        },
    });

    const updateCallTypeMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CallTypeForm> }) => {
            const response = await api.patch(`/call-types/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-types'] });
            toast.success('Тип звонка обновлён');
            setCallTypeDialog({ open: false, mode: 'create' });
            callTypeForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка обновления типа звонка');
        },
    });

    const deleteCallTypeMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/call-types/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-types'] });
            toast.success('Тип звонка удалён');
            setDeleteDialog({ open: false, type: 'call_type' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка удаления типа звонка');
        },
    });

    // Mutations - Call Resolutions
    const createResolutionMutation = useMutation({
        mutationFn: async (data: CallResolutionForm) => {
            const response = await api.post('/call-resolutions/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-resolutions'] });
            toast.success('Решение создано');
            setResolutionDialog({ open: false, mode: 'create' });
            resolutionForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка создания решения');
        },
    });

    const updateResolutionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CallResolutionForm> }) => {
            const response = await api.patch(`/call-resolutions/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-resolutions'] });
            toast.success('Решение обновлено');
            setResolutionDialog({ open: false, mode: 'create' });
            resolutionForm.reset();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка обновления решения');
        },
    });

    const deleteResolutionMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/call-resolutions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-resolutions'] });
            toast.success('Решение удалено');
            setDeleteDialog({ open: false, type: 'resolution' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Ошибка удаления решения');
        },
    });

    // Handlers
    const toggleRegion = (id: number) => {
        setExpandedRegions((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const openCreateRegion = () => {
        regionForm.reset({ name: '', code: '' });
        setRegionDialog({ open: true, mode: 'create' });
    };

    const openEditRegion = (region: Region) => {
        regionForm.reset({ name: region.name, code: region.code });
        setRegionDialog({ open: true, mode: 'edit', region });
    };

    const openCreateDept = (regionId: number) => {
        deptForm.reset({ name: '', region_id: String(regionId) });
        setDeptDialog({ open: true, mode: 'create', regionId });
    };

    const openEditDept = (dept: Department) => {
        deptForm.reset({ name: dept.name, region_id: String(dept.region_id) });
        setDeptDialog({ open: true, mode: 'edit', dept });
    };

    const openCreateCallType = () => {
        callTypeForm.reset({ name: '' });
        setCallTypeDialog({ open: true, mode: 'create' });
    };

    const openEditCallType = (callType: CallType) => {
        callTypeForm.reset({ name: callType.name });
        setCallTypeDialog({ open: true, mode: 'edit', callType });
    };

    const openCreateResolution = () => {
        resolutionForm.reset({ name: '' });
        setResolutionDialog({ open: true, mode: 'create' });
    };

    const openEditResolution = (resolution: CallResolution) => {
        resolutionForm.reset({ name: resolution.name });
        setResolutionDialog({ open: true, mode: 'edit', resolution });
    };

    const handleRegionSubmit = (data: RegionForm) => {
        if (regionDialog.mode === 'edit' && regionDialog.region) {
            updateRegionMutation.mutate({ id: regionDialog.region.id, data });
        } else {
            createRegionMutation.mutate(data);
        }
    };

    const handleDeptSubmit = (data: DepartmentForm) => {
        if (deptDialog.mode === 'edit' && deptDialog.dept) {
            updateDeptMutation.mutate({
                id: deptDialog.dept.id,
                data: { name: data.name, region_id: parseInt(data.region_id) },
            });
        } else {
            createDeptMutation.mutate(data);
        }
    };

    const handleCallTypeSubmit = (data: CallTypeForm) => {
        if (callTypeDialog.mode === 'edit' && callTypeDialog.callType) {
            updateCallTypeMutation.mutate({ id: callTypeDialog.callType.id, data });
        } else {
            createCallTypeMutation.mutate(data);
        }
    };

    const handleResolutionSubmit = (data: CallResolutionForm) => {
        if (resolutionDialog.mode === 'edit' && resolutionDialog.resolution) {
            updateResolutionMutation.mutate({ id: resolutionDialog.resolution.id, data });
        } else {
            createResolutionMutation.mutate(data);
        }
    };

    const handleDeleteConfirm = () => {
        if (deleteDialog.type === 'region' && deleteDialog.item) {
            deleteRegionMutation.mutate((deleteDialog.item as Region).id);
        } else if (deleteDialog.type === 'department' && deleteDialog.item) {
            deleteDeptMutation.mutate((deleteDialog.item as Department).id);
        } else if (deleteDialog.type === 'call_type' && deleteDialog.item) {
            deleteCallTypeMutation.mutate((deleteDialog.item as CallType).id);
        } else if (deleteDialog.type === 'resolution' && deleteDialog.item) {
            deleteResolutionMutation.mutate((deleteDialog.item as CallResolution).id);
        }
    };

    const isLoading = regionsLoading || deptsLoading || callTypesLoading || resolutionsLoading;
    const isMutating = createRegionMutation.isPending || updateRegionMutation.isPending ||
        createDeptMutation.isPending || updateDeptMutation.isPending;
    const isCallTypeMutating = createCallTypeMutation.isPending || updateCallTypeMutation.isPending;
    const isResolutionMutating = createResolutionMutation.isPending || updateResolutionMutation.isPending;
    const deleteLabel = deleteDialog.type === 'region'
        ? 'регион'
        : deleteDialog.type === 'department'
            ? 'подразделение'
            : deleteDialog.type === 'call_type'
                ? 'тип звонка'
                : 'решение';

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Справочники</CardTitle>
                            <CardDescription className="mt-1">
                                Управление регионами, подразделениями, типами звонков и решениями
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={openCreateRegion} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить регион
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{regions.length}</div>
                                <div className="text-xs text-muted-foreground">Регионов</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                            <div className="w-10 h-10 rounded-lg bg-zinc-500/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{departments.length}</div>
                                <div className="text-xs text-muted-foreground">Подразделений</div>
                            </div>
                        </div>
                    </div>

                    {/* Regions List */}
                    <div className="space-y-3">
                        {regions.length > 0 ? (
                            regions.map((region) => (
                                <RegionRow
                                    key={region.id}
                                    region={region}
                                    departments={departments}
                                    isExpanded={expandedRegions.has(region.id)}
                                    onToggle={() => toggleRegion(region.id)}
                                    onEdit={() => openEditRegion(region)}
                                    onDelete={() => setDeleteDialog({ open: true, type: 'region', item: region })}
                                    onAddDepartment={() => openCreateDept(region.id)}
                                    onEditDepartment={openEditDept}
                                    onDeleteDepartment={(dept) => setDeleteDialog({ open: true, type: 'department', item: dept })}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">Регионов пока нет</p>
                                <p className="text-sm mt-1">Добавьте первый регион для начала работы</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-4xl mx-auto mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <PhoneCall className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Типы звонков и решения</CardTitle>
                            <CardDescription className="mt-1">
                                Управление типами звонков и исходами
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={openCreateCallType} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Добавить тип
                        </Button>
                        <Button variant="outline" onClick={openCreateResolution} className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Добавить решение
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <PhoneCall className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-foreground">Типы звонков</span>
                                <Badge variant="outline" className="text-xs">{callTypes.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {callTypes.length > 0 ? (
                                    callTypes.map((callType) => (
                                        <div key={callType.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-white">
                                            <span className="flex-1 text-sm text-foreground">{callType.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openEditCallType(callType)}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteDialog({ open: true, type: 'call_type', item: callType })}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                                        Типов звонков пока нет
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-foreground">Решения</span>
                                <Badge variant="outline" className="text-xs">{callResolutions.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {callResolutions.length > 0 ? (
                                    callResolutions.map((resolution) => (
                                        <div key={resolution.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-white">
                                            <span className="flex-1 text-sm text-foreground">{resolution.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openEditResolution(resolution)}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteDialog({ open: true, type: 'resolution', item: resolution })}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                                        Решений пока нет
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Region Dialog */}
            <Dialog open={regionDialog.open} onOpenChange={(open) => setRegionDialog((prev) => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {regionDialog.mode === 'edit' ? 'Редактирование региона' : 'Новый регион'}
                        </DialogTitle>
                        <DialogDescription>
                            {regionDialog.mode === 'edit' ? 'Измените данные региона' : 'Добавьте новый регион в справочник'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...regionForm}>
                        <form onSubmit={regionForm.handleSubmit(handleRegionSubmit)} className="space-y-4">
                            <FormField
                                control={regionForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Москва и МО" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={regionForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Код</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MSK" {...field} className="font-mono uppercase" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRegionDialog({ open: false, mode: 'create' })}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={isMutating}>
                                    {isMutating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {regionDialog.mode === 'edit' ? 'Сохранить' : 'Создать'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Department Dialog */}
            <Dialog open={deptDialog.open} onOpenChange={(open) => setDeptDialog((prev) => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {deptDialog.mode === 'edit' ? 'Редактирование подразделения' : 'Новое подразделение'}
                        </DialogTitle>
                        <DialogDescription>
                            {deptDialog.mode === 'edit' ? 'Измените данные подразделения' : 'Добавьте новое подразделение в регион'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...deptForm}>
                        <form onSubmit={deptForm.handleSubmit(handleDeptSubmit)} className="space-y-4">
                            <FormField
                                control={deptForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Отдел продаж" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={deptForm.control}
                                name="region_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Регион</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите регион" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {regions.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                                            {r.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeptDialog({ open: false, mode: 'create' })}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={isMutating}>
                                    {isMutating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {deptDialog.mode === 'edit' ? 'Сохранить' : 'Создать'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Call Type Dialog */}
            <Dialog open={callTypeDialog.open} onOpenChange={(open) => setCallTypeDialog((prev) => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {callTypeDialog.mode === 'edit' ? 'Редактирование типа звонка' : 'Новый тип звонка'}
                        </DialogTitle>
                        <DialogDescription>
                            {callTypeDialog.mode === 'edit' ? 'Измените название типа звонка' : 'Добавьте новый тип звонка в справочник'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...callTypeForm}>
                        <form onSubmit={callTypeForm.handleSubmit(handleCallTypeSubmit)} className="space-y-4">
                            <FormField
                                control={callTypeForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Жалоба" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCallTypeDialog({ open: false, mode: 'create' })}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={isCallTypeMutating}>
                                    {isCallTypeMutating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {callTypeDialog.mode === 'edit' ? 'Сохранить' : 'Создать'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Resolution Dialog */}
            <Dialog open={resolutionDialog.open} onOpenChange={(open) => setResolutionDialog((prev) => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {resolutionDialog.mode === 'edit' ? 'Редактирование решения' : 'Новое решение'}
                        </DialogTitle>
                        <DialogDescription>
                            {resolutionDialog.mode === 'edit' ? 'Измените название решения' : 'Добавьте новое решение в справочник'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...resolutionForm}>
                        <form onSubmit={resolutionForm.handleSubmit(handleResolutionSubmit)} className="space-y-4">
                            <FormField
                                control={resolutionForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Заявка направлена" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setResolutionDialog({ open: false, mode: 'create' })}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={isResolutionMutating}>
                                    {isResolutionMutating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {resolutionDialog.mode === 'edit' ? 'Сохранить' : 'Создать'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Удалить {deleteLabel}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы уверены, что хотите удалить{' '}
                            <strong>
                            {deleteDialog.item && 'name' in deleteDialog.item ? deleteDialog.item.name : ''}
                            </strong>
                            ? Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteRegionMutation.isPending || deleteDeptMutation.isPending ||
                                deleteCallTypeMutation.isPending || deleteResolutionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Удалить'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

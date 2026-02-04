import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Shield, User as UserIcon, Pencil } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    AlertDialogTrigger,
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

type User = {
    id: number;
    username: string;
    role: 'operator' | 'supervisor' | 'admin';
    is_active: boolean;
    role_override: 'operator' | 'supervisor' | 'admin' | null;
    role_override_until: string | null;
    effective_role: 'operator' | 'supervisor' | 'admin';
};

const createUserSchema = z.object({
    username: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
    password: z.string().min(4, 'Минимум 4 символа'),
    role: z.enum(['operator', 'supervisor', 'admin']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
    username: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
    password: z.string().min(4, 'Минимум 4 символа').optional().or(z.literal('')),
    role: z.enum(['operator', 'supervisor', 'admin']),
    is_active: z.boolean(),
    role_override: z.enum(['none', 'supervisor', 'admin']),
    role_override_until: z.string().optional().or(z.literal('')),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const form = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            password: '',
            role: 'operator',
        },
    });

    const editForm = useForm<EditUserForm>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            username: '',
            password: '',
            role: 'operator',
            is_active: true,
            role_override: 'none',
            role_override_until: '',
        },
    });

    const toLocalDateTimeInput = (iso: string) => {
        const date = new Date(iso);
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (!editingUser) return;
        editForm.reset({
            username: editingUser.username,
            password: '',
            role: editingUser.role,
            is_active: editingUser.is_active,
            role_override: editingUser.role_override ? editingUser.role_override : 'none',
            role_override_until: editingUser.role_override_until
                ? toLocalDateTimeInput(editingUser.role_override_until)
                : '',
        });
    }, [editingUser, editForm]);

    const tempRoleValue = editForm.watch('role_override');

    // Fetch users
    const { data: users, isLoading, isError, error } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data;
        },
    });

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: async (data: CreateUserForm) => {
            const response = await api.post('/users', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Пользователь создан');
            setIsCreateDialogOpen(false);
            form.reset();
        },
        onError: (err: any) => {
            const message = err.response?.data?.detail || 'Ошибка создания';
            toast.error(message);
        },
    });

    // Update user mutation
    const updateMutation = useMutation({
        mutationFn: async (payload: { userId: number; data: Partial<CreateUserForm> & {
            role_override?: 'admin' | 'supervisor' | null;
            role_override_until?: string | null;
            is_active?: boolean;
        } }) => {
            const response = await api.patch(`/users/${payload.userId}`, payload.data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Пользователь обновлён');
            setIsEditDialogOpen(false);
            setEditingUser(null);
        },
        onError: (err: any) => {
            const message = err.response?.data?.detail || 'Ошибка обновления';
            toast.error(message);
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: async (userId: number) => {
            await api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Пользователь удалён');
            setDeleteUserId(null);
        },
        onError: (err: any) => {
            const message = err.response?.data?.detail || 'Ошибка удаления';
            toast.error(message);
            setDeleteUserId(null);
        },
    });

    const onSubmit = (data: CreateUserForm) => {
        createMutation.mutate(data);
    };

    const onEditSubmit = (data: EditUserForm) => {
        if (!editingUser) return;
        const roleOverride = data.role_override === 'none' ? null : data.role_override;
        const roleOverrideUntil = data.role_override_until
            ? new Date(data.role_override_until).toISOString()
            : null;

        if (roleOverride && !roleOverrideUntil) {
            toast.error('Укажите срок временной роли');
            return;
        }
        if (!roleOverride && roleOverrideUntil) {
            toast.error('Выберите временную роль');
            return;
        }

        const payload: {
            username: string;
            role: 'operator' | 'supervisor' | 'admin';
            is_active: boolean;
            password?: string;
            role_override?: 'admin' | 'supervisor' | null;
            role_override_until?: string | null;
        } = {
            username: data.username,
            role: data.role,
            is_active: data.is_active,
            role_override: roleOverride,
            role_override_until: roleOverrideUntil,
        };

        if (data.password && data.password.length > 0) {
            payload.password = data.password;
        }

        updateMutation.mutate({ userId: editingUser.id, data: payload });
    };

    const handleDelete = () => {
        if (deleteUserId) {
            deleteMutation.mutate(deleteUserId);
        }
    };

    const roleLabel = (role: User['role']) => {
        if (role === 'admin') return 'Админ';
        if (role === 'supervisor') return 'Супервизор';
        return 'Оператор';
    };

    const formatDateTime = (iso: string) =>
        new Date(iso).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        const errorMessage = (error as any)?.response?.status === 403
            ? 'Доступ запрещён. Только для администраторов.'
            : 'Ошибка загрузки пользователей';
        return (
            <div className="text-center py-10">
                <div className="text-destructive text-lg font-medium">{errorMessage}</div>
                <p className="text-muted-foreground mt-2">Обратитесь к администратору системы</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-2xl">Управление пользователями</CardTitle>
                    <CardDescription className="mt-1">
                        Добавление, редактирование и удаление пользователей системы
                    </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Добавить
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Новый пользователь</DialogTitle>
                            <DialogDescription>
                                Создайте нового пользователя для доступа к системе
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Логин</FormLabel>
                                            <FormControl>
                                                <Input placeholder="operator1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Пароль</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Роль</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Выберите роль" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="operator">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="h-4 w-4" />
                                                            Оператор
                                                        </div>
                                                    </SelectItem>
                                                <SelectItem value="supervisor">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-4 w-4" />
                                                        Супервизор
                                                    </div>
                                                </SelectItem>
                                                    <SelectItem value="admin">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4" />
                                                            Администратор
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {createMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Создание...
                                            </>
                                        ) : (
                                            'Создать'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setEditingUser(null);
                    }}
                >
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Редактировать пользователя</DialogTitle>
                            <DialogDescription>
                                Измените профиль, статус и временные права
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                <FormField
                                    control={editForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Логин</FormLabel>
                                            <FormControl>
                                                <Input placeholder="operator1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Новый пароль (опционально)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={editForm.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Постоянная роль</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Выберите роль" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="operator">
                                                            <div className="flex items-center gap-2">
                                                                <UserIcon className="h-4 w-4" />
                                                                Оператор
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="supervisor">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="h-4 w-4" />
                                                                Супервизор
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="admin">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="h-4 w-4" />
                                                                Администратор
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                                                <FormLabel>Активен</FormLabel>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={(value) => field.onChange(!!value)}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={editForm.control}
                                        name="role_override"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Временная роль</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        if (value === 'none') {
                                                            editForm.setValue('role_override_until', '');
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Нет" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Нет</SelectItem>
                                                        <SelectItem value="supervisor">Супервизор</SelectItem>
                                                        <SelectItem value="admin">Админ</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="role_override_until"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>До</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="datetime-local"
                                                        disabled={tempRoleValue === 'none'}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {updateMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            'Сохранить'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Логин</TableHead>
                                <TableHead>Роль</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Временные права</TableHead>
                                <TableHead className="text-right w-[140px]">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users && users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="text-muted-foreground">
                                            #{user.id}
                                        </TableCell>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'operator' ? 'secondary' : 'default'}>
                                                <span className="flex items-center gap-1">
                                                    {user.role === 'operator' ? (
                                                        <UserIcon className="h-3 w-3" />
                                                    ) : (
                                                        <Shield className="h-3 w-3" />
                                                    )}
                                                    {roleLabel(user.role)}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                                                {user.is_active ? 'Активен' : 'Неактивен'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.role_override && user.role_override_until ? (
                                                (() => {
                                                    const until = new Date(user.role_override_until);
                                                    const isActive = until.getTime() > Date.now();
                                                    return (
                                                        <div className="flex flex-col">
                                                            <Badge variant={isActive ? 'default' : 'secondary'}>
                                                                {isActive ? 'Активно' : 'Истёк'}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                {roleLabel(user.role_override)} до {formatDateTime(user.role_override_until)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Нет</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteUserId(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Вы уверены, что хотите удалить пользователя <strong>{user.username}</strong>?
                                                                Это действие нельзя отменить.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
                                                                Отмена
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={handleDelete}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {deleteMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    'Удалить'
                                                                )}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Пользователей пока нет
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

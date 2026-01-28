import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    role: 'operator' | 'admin';
    is_active: boolean;
};

const createUserSchema = z.object({
    username: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
    password: z.string().min(4, 'Минимум 4 символа'),
    role: z.enum(['operator', 'admin']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    const form = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            password: '',
            role: 'operator',
        },
    });

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

    const handleDelete = () => {
        if (deleteUserId) {
            deleteMutation.mutate(deleteUserId);
        }
    };

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
                                <TableHead className="text-right w-[100px]">Действия</TableHead>
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
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role === 'admin' ? (
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        Админ
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        Оператор
                                                    </span>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                                                {user.is_active ? 'Активен' : 'Неактивен'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
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

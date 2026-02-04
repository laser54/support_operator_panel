import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Pencil, X, ListChecks, FileQuestion } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ReviewScript = {
    id: number;
    question: string;
    answer: string | null;
    is_custom: boolean;
    needs_review: boolean;
    in_registry_queue: boolean;
    created_at: string;
};

const editScriptSchema = z.object({
    question: z.string().min(3, 'Минимум 3 символа'),
    answer: z.string().optional().or(z.literal('')),
});

type EditScriptForm = z.infer<typeof editScriptSchema>;

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

export default function ScriptsReviewPage() {
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingScript, setEditingScript] = useState<ReviewScript | null>(null);

    const editForm = useForm<EditScriptForm>({
        resolver: zodResolver(editScriptSchema),
        defaultValues: {
            question: '',
            answer: '',
        },
    });

    useEffect(() => {
        if (!editingScript) return;
        editForm.reset({
            question: editingScript.question,
            answer: editingScript.answer ?? '',
        });
    }, [editingScript, editForm]);

    const pendingQuery = useQuery<ReviewScript[]>({
        queryKey: ['scripts-review', 'pending'],
        queryFn: async () => {
            const response = await api.get('/scripts/review', { params: { filter_type: 'pending' } });
            return response.data;
        },
    });

    const queueQuery = useQuery<ReviewScript[]>({
        queryKey: ['scripts-review', 'queue'],
        queryFn: async () => {
            const response = await api.get('/scripts/review', { params: { filter_type: 'queue' } });
            return response.data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: { scriptId: number; data: Partial<ReviewScript> }) => {
            const response = await api.patch(`/scripts/${payload.scriptId}`, payload.data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scripts-review'] });
            toast.success('Обновлено');
            setIsEditDialogOpen(false);
            setEditingScript(null);
        },
        onError: (err: any) => {
            const message = err.response?.data?.detail || 'Ошибка обновления';
            toast.error(message);
        },
    });

    const onEditSubmit = (data: EditScriptForm) => {
        if (!editingScript) return;
        updateMutation.mutate({
            scriptId: editingScript.id,
            data: {
                question: data.question,
                answer: data.answer && data.answer.length > 0 ? data.answer : null,
            },
        });
    };

    const handleQueueAdd = (scriptId: number) => {
        updateMutation.mutate({
            scriptId,
            data: { in_registry_queue: true },
        });
    };

    const handleQueueRemove = (scriptId: number) => {
        updateMutation.mutate({
            scriptId,
            data: { in_registry_queue: false },
        });
    };

    const handleClearReview = (scriptId: number) => {
        updateMutation.mutate({
            scriptId,
            data: { needs_review: false },
        });
    };

    const isLoading = pendingQuery.isLoading || queueQuery.isLoading;
    const isError = pendingQuery.isError || queueQuery.isError;
    const error = (pendingQuery.error || queueQuery.error) as any;

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        const errorMessage = error?.response?.status === 403
            ? 'Доступ запрещён. Только для администраторов/супервизоров.'
            : 'Ошибка загрузки вопросов';
        return (
            <div className="text-center py-10">
                <div className="text-destructive text-lg font-medium">{errorMessage}</div>
                <p className="text-muted-foreground mt-2">Обратитесь к администратору системы</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                    <FileQuestion className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">Ревью вопросов</CardTitle>
                        <CardDescription>
                            Просмотр вопросов операторов и отбор в очередь для реестра скриптов
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList className="mb-4">
                        <TabsTrigger value="pending">На ревью</TabsTrigger>
                        <TabsTrigger value="queue">Очередь в реестр</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Вопрос</TableHead>
                                        <TableHead>Ответ</TableHead>
                                        <TableHead className="w-[160px]">Создано</TableHead>
                                        <TableHead className="text-right w-[220px]">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingQuery.data && pendingQuery.data.length > 0 ? (
                                        pendingQuery.data.map((script) => (
                                            <TableRow key={script.id}>
                                                <TableCell className="text-muted-foreground">
                                                    #{script.id}
                                                </TableCell>
                                                <TableCell className="font-medium">{script.question}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {script.answer || '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDateTime(script.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingScript(script);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleQueueAdd(script.id)}
                                                            title="В очередь"
                                                        >
                                                            <ListChecks className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleClearReview(script.id)}
                                                            title="Снять с ревью"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                Нет вопросов на ревью
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="queue">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Вопрос</TableHead>
                                        <TableHead>Ответ</TableHead>
                                        <TableHead className="w-[160px]">Статус</TableHead>
                                        <TableHead className="text-right w-[200px]">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queueQuery.data && queueQuery.data.length > 0 ? (
                                        queueQuery.data.map((script) => (
                                            <TableRow key={script.id}>
                                                <TableCell className="text-muted-foreground">
                                                    #{script.id}
                                                </TableCell>
                                                <TableCell className="font-medium">{script.question}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {script.answer || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default">В очереди</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingScript(script);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleQueueRemove(script.id)}
                                                            title="Убрать из очереди"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                Очередь пуста
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingScript(null);
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать вопрос</DialogTitle>
                        <DialogDescription>
                            Уточните формулировку и ответ перед добавлением в реестр
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="question"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Вопрос</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="answer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ответ</FormLabel>
                                        <FormControl>
                                            <Textarea className="min-h-[120px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
        </Card>
    );
}

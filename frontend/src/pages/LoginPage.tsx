import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { setAuthToken } from '@/auth/token';
import { ShieldCheck, Zap, Server, Activity, ArrowRight, HelpCircle } from 'lucide-react';

const loginSchema = z.object({
    username: z.string().min(1, 'Укажите имя пользователя'),
    password: z.string().min(1, 'Укажите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginForm) => {
            const formData = new FormData();
            formData.append('username', data.username);
            formData.append('password', data.password);
            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.clear();
            setAuthToken(data.access_token);
            toast.success('Успешный вход в систему');
            navigate('/', { replace: true });
        },
        onError: () => {
            setError('Неверный логин или пароль');
            toast.error('Ошибка авторизации');
        },
    });

    function onSubmit(data: LoginForm) {
        loginMutation.mutate(data);
    }

    return (
        <div className="flex min-h-screen w-full font-sans bg-zinc-50">
            {/* Левая панель - Бренд и Информация (Dark Industrial) */}
            <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-zinc-950 text-white p-12 lg:p-16 border-r border-zinc-800">
                {/* Индустриальный паттерн "сетка" на фоне */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '48px 48px'
                    }}
                />

                {/* Абстрактные световые акценты (в цветах бренда) */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    {/* Логотип */}
                    <div className="flex items-center gap-3 select-none">
                        <div className="flex h-10 w-10 items-center justify-center bg-primary text-black font-bold text-xl rounded-sm">
                            S
                        </div>
                        <span className="text-2xl font-bold tracking-widest uppercase text-white">
                            Support<span className="text-primary px-1">Operator</span>
                        </span>
                        <span className="ml-2 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-zinc-800 text-zinc-300 rounded-sm">
                            Panel
                        </span>
                    </div>

                    {/* Заголовок */}
                    <div className="mt-28 flex flex-col gap-6">
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1]">
                            Умный помощник <br />
                            <span className="text-primary italic">специалиста поддержки.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                            Платформа создана для максимального удобства операторов контактного центра.
                            Она объединяет понятный интерфейс, быстрый AI-поиск по базе знаний и автоподбор
                            скриптов для моментального качественного решения запросов клиентов.
                        </p>
                    </div>

                    {/* Фичи системы */}
                    <div className="mt-20 grid grid-cols-2 gap-x-12 gap-y-10 max-w-3xl">
                        <div className="flex items-start gap-4">
                            <div className="p-2 border border-zinc-800 bg-zinc-900/50 text-primary rounded-sm">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-100 mb-1">AI База Знаний</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">Умный поиск по скриптам и статьям в реальном времени, помогающий найти точный ответ за секунду.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 border border-zinc-800 bg-zinc-900/50 text-primary rounded-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-100 mb-1">Удобный интерфейс</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">Чистый дизайн, снижающий когнитивную нагрузку и позволяющий полностью сфокусироваться на помощи клиенту.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 border border-zinc-800 bg-zinc-900/50 text-primary rounded-sm">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-100 mb-1">Автозаполнение</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">Умные подсказки и шаблоны ответов позволяют обрабатывать больше звонков с меньшим количеством рутины.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 border border-zinc-800 bg-zinc-900/50 text-primary rounded-sm">
                                <Server className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-100 mb-1">Единое окно</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">Вся история обращений, форма звонка и подсказки объединены в одном комфортном рабочем пространстве.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Подвал левой панели */}
                <div className="relative z-10 flex items-center justify-between text-zinc-500 text-sm border-t border-zinc-800/60 pt-6">
                    <span>&copy; {new Date().getFullYear()} Support Operator. Система помогает, а не контролирует.</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-zinc-300">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="tracking-widest uppercase text-xs font-bold">Status: Online</span>
                    </div>
                </div>
            </div>

            {/* Правая панель - Форма авторизации (Light Refined) */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center relative p-6 sm:p-12 md:p-16 lg:p-24 bg-white/50">
                {/* Мобильный логотип */}
                <div className="flex items-center gap-3 lg:hidden mb-12 select-none">
                    <div className="flex h-10 w-10 items-center justify-center bg-primary text-black font-bold text-xl rounded-sm">
                        S
                    </div>
                    <span className="text-2xl font-bold tracking-widest uppercase">Support Operator</span>
                </div>

                <div className="w-full max-w-[400px] mx-auto">
                    {/* Заголовок формы */}
                    <div className="mb-10 space-y-3">
                        <h2 className="text-3xl font-black tracking-tight text-zinc-950">
                            Авторизация
                        </h2>
                        <p className="text-zinc-500 leading-relaxed">
                            Доступ предоставлен только для авторизованных сотрудников платформы. Введите ваши учетные данные.
                        </p>
                    </div>

                    {/* Разделительная линия в индустриальном стиле */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-zinc-200 flex-1"></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Вход в систему</div>
                        <div className="h-px bg-zinc-200 flex-1"></div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                                            Имя пользователя / Логин
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="username"
                                                placeholder="Например: operator_am"
                                                className="h-14 px-4 bg-zinc-50 border-zinc-200 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-destructive font-medium" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                                                Пароль
                                            </FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                autoComplete="current-password"
                                                placeholder="••••••••••••"
                                                className="h-14 px-4 bg-zinc-50 border-zinc-200 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-destructive font-medium" />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <div className="p-4 text-sm font-semibold text-destructive bg-destructive/5 border border-destructive/20 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-14 text-base font-bold shadow-none group"
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending ? 'АВТОРИЗАЦИЯ...' : 'ВОЙТИ'}
                                    <ArrowRight className="ml-2 w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </form>
                    </Form>

                    {/* Поясняющий текст под кнопкой */}
                    <div className="mt-8 pt-8 border-t border-zinc-200 flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Если вы забыли пароль или у вас нет доступа, пожалуйста, обратитесь к <span className="font-semibold text-zinc-700">системному администратору</span>. Попытки несанкционированного входа фиксируются.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

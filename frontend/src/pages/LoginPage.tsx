import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/api/client';
import { toast } from 'sonner';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

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
            localStorage.setItem('token', data.access_token);
            toast.success('Login successful');
            navigate('/');
        },
        onError: () => {
            setError('Invalid username or password');
            toast.error('Login failed');
        },
    });

    function onSubmit(data: LoginForm) {
        loginMutation.mutate(data);
    }

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
                    <div className="mr-2 h-6 w-6 rounded-sm bg-primary" />
                    PAYLINE
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg text-zinc-300">
                            &ldquo;Support operations optimized for speed and precision.
                            The industrial standard for operator controls.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Access Control
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the operator panel
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="operator_id" {...field} />
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                            <Button type="submit" className="w-full font-bold" disabled={loginMutation.isPending}>
                                {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}

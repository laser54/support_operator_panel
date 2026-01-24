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
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Support Panel</CardTitle>
                    <CardDescription className="text-center">Enter your credentials to access</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="admin" {...field} />
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
                            {error && <div className="text-sm text-red-500">{error}</div>}
                            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                                {loginMutation.isPending ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

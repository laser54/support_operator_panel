import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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

const callSchema = z.object({
    region_id: z.string().min(1, 'Region is required'),
    department_id: z.string().min(1, 'Department is required'),
    applicant_name: z.string().min(2, 'Name is required'),
    phone_number: z.string().optional(),
    description: z.string().min(5, 'Description is required'),
});

type CallFormValues = z.infer<typeof callSchema>;

export function CallForm() {
    const form = useForm<CallFormValues>({
        resolver: zodResolver(callSchema),
        defaultValues: {
            region_id: '',
            department_id: '',
            applicant_name: '',
            phone_number: '',
            description: '',
        },
    });

    const { data: regions } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => (await api.get('/regions/')).data,
    });

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => (await api.get('/departments/')).data,
    });

    const queryClient = useQueryClient();

    const submitMutation = useMutation({
        mutationFn: async (data: CallFormValues) => {
            const payload = {
                applicant_name: data.applicant_name,
                caller_phone: data.phone_number,
                caller_region_id: data.region_id ? parseInt(data.region_id) : null,
                caller_department_id: data.department_id ? parseInt(data.department_id) : null,
                topic: 'General', // TODO: Add field for topic
                question: data.description,
                status: 'open'
            };
            const response = await api.post('/calls/', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Call saved successfully');
            queryClient.invalidateQueries({ queryKey: ['calls'] });
            form.reset();
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to save call');
        }
    });

    function onSubmit(data: CallFormValues) {
        submitMutation.mutate(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="region_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Region</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select region" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {regions?.map((r: any) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departments?.map((d: any) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
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
        </Form>
    );
}

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
import { useQuery, useMutation } from '@tanstack/react-query';
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

    const submitMutation = useMutation({
        mutationFn: async (data: CallFormValues) => {
            // Assuming there is an endpoint to create a call, though not explicitly in Phase 1 plan but implied in Phase 2 "Submit form"
            // Since backend might not have it yet, we will just log it for now or assume /calls/
            // Checking the plan, "Сабмит формы (сохранение звонка)" is Phase 3 item 4.
            // So for Phase 2 strict plan, we just need the form UI.
            // But let's try to post to a placeholder or wait.
            // I'll make it a console log for now as per "Core UI" phase focus.
            console.log('Submitting call:', data);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
        },
        onSuccess: () => {
            toast.success('Call saved locally (Mock)');
            form.reset();
        },
        onError: () => {
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

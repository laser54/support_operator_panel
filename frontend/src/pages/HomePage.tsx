import { CallForm } from '@/components/CallForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
    return (
        <div className="grid h-full grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 lg:col-span-4 h-full flex flex-col">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>New Call</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <CallForm />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-7 lg:col-span-8 h-full flex flex-col">
                <Card className="h-full bg-slate-50 border-dashed">
                    <CardContent className="h-full flex items-center justify-center text-muted-foreground">
                        Search & Knowledge Base (Coming Soon - Phase 3)
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

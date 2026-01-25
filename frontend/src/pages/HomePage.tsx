import { useState } from 'react';
import { CallForm } from '@/components/CallForm';
import { RecentCalls } from '@/components/RecentCalls';
import { SearchPanel } from '@/components/SearchPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScriptSelection } from '@/components/ScriptSelector';

export default function HomePage() {
    const [selectedScript, setSelectedScript] = useState<ScriptSelection | null>(null);

    return (
        <div className="grid h-full grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 lg:col-span-3 h-full flex flex-col gap-6">
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                        <CardTitle>New Call</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <CallForm
                            externalSelectedScript={selectedScript}
                            onClearExternalScript={() => setSelectedScript(null)}
                        />
                    </CardContent>
                </Card>

                <div className="h-1/3 min-h-[200px]">
                    <RecentCalls />
                </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9 h-full flex flex-col">
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Knowledge Base
                            <span className="text-[10px] uppercase bg-green-100 text-green-700 px-1.5 py-0.5 rounded leading-none">AI Powered</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <SearchPanel onSelectScript={setSelectedScript} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

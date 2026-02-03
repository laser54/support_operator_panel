import { useState } from 'react';
import { OperatorForm } from '@/components/OperatorForm';
import { KnowledgePanel } from '@/components/KnowledgePanel';
import type { ScriptSelection } from '@/components/ScriptSelector';

/**
 * HomePage - Рабочее место оператора
 * 
 * Дизайн: Split-screen layout
 * - Левая половина: Форма ввода данных (компактная, без скролла)
 * - Правая половина: База знаний / AI-поиск
 */
export default function HomePage() {
    const [selectedScript, setSelectedScript] = useState<ScriptSelection | null>(null);

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-0">
            {/* LEFT PANEL: Operator Form - Fixed, No Scroll */}
            <div className="w-1/2 min-w-[480px] max-w-[640px] border-r border-border/50 bg-background">
                <OperatorForm
                    externalSelectedScript={selectedScript}
                    onClearExternalScript={() => setSelectedScript(null)}
                />
            </div>

            {/* RIGHT PANEL: Knowledge Base */}
            <div className="flex-1 bg-muted/30">
                <KnowledgePanel onSelectScript={setSelectedScript} />
            </div>
        </div>
    );
}

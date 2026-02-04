import { useState, useEffect, useRef } from 'react';
import { OperatorForm, type OperatorFormRef } from '@/components/OperatorForm';
import { KnowledgePanel, type KnowledgePanelRef } from '@/components/KnowledgePanel';
import type { ScriptSelection } from '@/components/ScriptSelector';

/**
 * HomePage - Рабочее место оператора
 * 
 * Дизайн: Split-screen layout
 * - Левая половина: Форма ввода данных (компактная, без скролла)
 * - Правая половина: База знаний / AI-поиск
 * 
 * Горячие клавиши:
 * - Ctrl+Enter: Сохранить звонок
 * - Ctrl+S: Фокус на поиск в базе знаний
 * - Escape: Очистить форму (с подтверждением)
 */
export default function HomePage() {
    const [selectedScript, setSelectedScript] = useState<ScriptSelection | null>(null);
    const [kbResetToken, setKbResetToken] = useState(0);
    
    const operatorFormRef = useRef<OperatorFormRef>(null);
    const knowledgePanelRef = useRef<KnowledgePanelRef>(null);

    // Глобальные горячие клавиши
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Enter - сохранить звонок
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                operatorFormRef.current?.submitForm();
            }
            // Ctrl+S - фокус на поиск
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                knowledgePanelRef.current?.focusSearch();
            }
            // Escape - очистить форму
            if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                // Не очищаем если фокус в модальном окне или select
                const activeEl = document.activeElement;
                const isInDialog = activeEl?.closest('[role="dialog"]');
                const isInSelect = activeEl?.closest('[data-radix-select-viewport]');
                if (!isInDialog && !isInSelect) {
                    operatorFormRef.current?.resetForm();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-0">
            {/* LEFT PANEL: Operator Form - Fixed, No Scroll */}
            <div className="w-[720px] min-w-[680px] max-w-[760px] border-r border-border/50 bg-background">
                <OperatorForm
                    ref={operatorFormRef}
                    externalSelectedScript={selectedScript}
                    onClearExternalScript={() => setSelectedScript(null)}
                    onCallSaved={() => setKbResetToken((prev) => prev + 1)}
                />
            </div>

            {/* RIGHT PANEL: Knowledge Base */}
            <div className="flex-1 bg-muted/30">
                <KnowledgePanel 
                    ref={knowledgePanelRef}
                    onSelectScript={setSelectedScript} 
                    resetSignal={kbResetToken} 
                />
            </div>
        </div>
    );
}

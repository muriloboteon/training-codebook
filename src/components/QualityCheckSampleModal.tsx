import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import type { TrainingQuestion } from './RecreateCodebookModal';
import ModalButton from './ModalButton';
import SelectField from './SelectField';

// -----------------------------------------------------------------------------
// QualityCheckSampleModal — seletor de amostra do Quality Check.
//
// Aberto ao clicar "Run quality check" quando o codebook foi treinado com mais
// de uma pergunta: o usuário escolhe em qual pergunta a amostra vai rodar (não
// faz sentido validar um codebook de streaming com respostas de fitness). As
// opções são só as perguntas selecionadas no passo do Recreate. Com uma pergunta
// só, o pai pula este modal e vai direto ao processamento.
//
// Layout: mesmo chrome do modal de Instructions / processamento (560px de
// largura); a altura acompanha o conteúdo — só um SelectField de seleção única
// com o texto das perguntas, sem metadados de estudo/respostas. A lista aberta
// flutua sobre o footer (e além do modal, se preciso).
//
// Protótipo puramente visual: nada é persistido.
// -----------------------------------------------------------------------------

interface QualityCheckSampleModalProps {
    isOpen: boolean;
    questions: TrainingQuestion[];
    /** Chamado com a pergunta escolhida ao clicar "Run quality check". */
    onRun: (question: TrainingQuestion) => void;
    /** Chamado ao cancelar (ESC / clique-fora / X / Cancel). */
    onCancel: () => void;
}

function QualityCheckSampleModal({ isOpen, questions, onRun, onCancel }: QualityCheckSampleModalProps) {
    // Nada pré-selecionado: o botão fica desabilitado até o usuário escolher.
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Reseta a escolha a cada abertura.
    useEffect(() => {
        if (isOpen) setSelectedId(null);
    }, [isOpen]);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const selected = questions.find((q) => q.id === selectedId) ?? null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Select a sample"
            onMouseDown={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Acima do modal de regras (2000).
                zIndex: 2100,
                padding: space.xl,
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    width: '560px',
                    maxWidth: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: color.surface,
                    borderRadius: radius.xl,
                    boxShadow: shadow.modal,
                    // Sem overflow: hidden — a lista do SelectField flutua para
                    // fora do corpo. Header/footer arredondam os próprios cantos.
                }}
            >
                {/* Header */}
                <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: `${radius.xl} ${radius.xl} 0 0` }}>
                    <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>Select a sample</span>
                    <button
                        type="button"
                        aria-label="Cancel"
                        onClick={onCancel}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.xs, border: 'none', background: 'none', cursor: 'pointer', borderRadius: radius.sm, color: color.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body — dropdown com as perguntas do treino (seleção única) */}
                <div style={{ padding: `${space.lg} ${space.xl}` }}>
                    <SelectField
                        label="Select a question to sample from"
                        placeholder="Select a question"
                        options={questions.map((q) => ({ value: q.id, label: q.text }))}
                        value={selectedId}
                        onChange={setSelectedId}
                        // Helper da amostragem: o AI Coder roda só em 10% das respostas.
                        helperText="The AI Coder will run on a 10% sample of the selected question's responses."
                    />
                </div>

                {/* Footer */}
                <div style={{ padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: space.sm, backgroundColor: color.surface, borderRadius: `0 0 ${radius.xl} ${radius.xl}` }}>
                    <ModalButton variant="tertiary" onClick={onCancel}>Cancel</ModalButton>
                    <ModalButton variant="primary" disabled={!selected} onClick={() => { if (selected) onRun(selected); }}>
                        Run quality check
                    </ModalButton>
                </div>
            </div>
        </div>
    );
}

export default QualityCheckSampleModal;

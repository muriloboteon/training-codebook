import React, { useEffect, useMemo, useState } from 'react';
import {
    X,
    MagicWand,
    MagnifyingGlass,
    CaretRight,
    CaretDown,
    CheckSquare,
    Square,
    MinusSquare,
} from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';

// -----------------------------------------------------------------------------
// RecreateCodebookModal — fluxo "Recreate a Codebook".
//
// Aberto ao clicar no ícone MagicWand TEAL numa linha do Coder (ação separada
// do "Train Codebook" roxo). Protótipo puramente visual: todo o estado é local
// e some ao recarregar. Nada é persistido.
//
// Conteúdo:
//   - Lista de estudos em acordeão (expande/colapsa por estudo, independente).
//     Só aparecem estudos que contêm um codebook com o MESMO nome do codebook
//     selecionado na tabela principal.
//   - Seleção por pergunta (unidade atômica). O checkbox do estudo é tri-state:
//     selecionar o estudo marca todas as perguntas; parcial = indeterminado.
//   - Campo "Instructions" (textarea) opcional para orientações adicionais.
// -----------------------------------------------------------------------------

interface StudyQuestion {
    id: string;
    text: string;
    responses: number;
}

interface Study {
    id: string;
    name: string;
    date: string;
    /** Nomes dos codebooks presentes neste estudo — usado só para o filtro. */
    codebookNames: string[];
    questions: StudyQuestion[];
}

// ---------------------------------------------------------------------------
// Mock data (fictício, apenas para validar a UI). Cada estudo é marcado com os
// nomes de codebook que contém; o filtro casa com o codebook clicado na tabela.
// Os nomes batem com os codebookId de CoderCodebooksTable.
// ---------------------------------------------------------------------------

// Estudos NPSGrpCBK — lista longa (gerada) para exercitar a busca e o scroll.
const NPS_STUDY_SEEDS: Array<{ name: string; date: string; questions: [string, number][] }> = [
    { name: 'NPS Q3 2025', date: '12/08/2025', questions: [['Why did you give that score?', 4820], ['What would make you rate us higher?', 3110]] },
    { name: 'NPS Q2 2025', date: '30/05/2025', questions: [['Why did you give that score?', 5230]] },
    { name: 'NPS Q1 2025', date: '28/02/2025', questions: [['Why did you give that score?', 4990]] },
    { name: 'NPS Q4 2024', date: '15/12/2024', questions: [['Why did you give that score?', 5410], ['What is the one thing we should improve?', 3260]] },
    { name: 'NPS Q3 2024', date: '20/08/2024', questions: [['Why did you give that score?', 4610]] },
    { name: 'NPS Q2 2024', date: '22/05/2024', questions: [['Why did you give that score?', 4380]] },
    { name: 'NPS Q1 2024', date: '26/02/2024', questions: [['Why did you give that score?', 4120]] },
    { name: 'Relationship NPS — EMEA', date: '18/04/2025', questions: [['What is the primary reason for your score?', 2870], ["Anything else you'd like to add?", 1440]] },
    { name: 'Relationship NPS — Americas', date: '10/10/2024', questions: [['What is the primary reason for your score?', 3120], ["Anything else you'd like to add?", 1580]] },
    { name: 'Relationship NPS — APAC', date: '02/09/2024', questions: [['What is the primary reason for your score?', 2740]] },
    { name: 'Relationship NPS — DACH', date: '11/07/2024', questions: [['What is the primary reason for your score?', 1990]] },
    { name: 'Relationship NPS — LATAM', date: '05/06/2024', questions: [['What is the primary reason for your score?', 1660]] },
    { name: 'Transactional NPS — Onboarding', date: '19/07/2024', questions: [['How likely are you to recommend us after onboarding?', 1890], ['What stood out during your first weeks?', 1340]] },
    { name: 'Transactional NPS — Renewal', date: '03/06/2024', questions: [['Why did you renew (or consider leaving)?', 2210]] },
    { name: 'Transactional NPS — Support', date: '27/04/2024', questions: [['How likely are you to recommend us after that support interaction?', 2530]] },
    { name: 'Transactional NPS — Checkout', date: '14/03/2024', questions: [['How was your checkout experience?', 1720]] },
    { name: 'Product NPS — Mobile App', date: '08/02/2024', questions: [['What would make the mobile app better?', 2040]] },
    { name: 'Product NPS — Web App', date: '21/01/2024', questions: [['What would make the web app better?', 1880]] },
    { name: 'Product NPS — Enterprise', date: '09/12/2023', questions: [['What would make our platform better for your team?', 940]] },
    { name: 'Win-back NPS — Churned Accounts', date: '17/11/2023', questions: [['What would bring you back?', 720]] },
];

const NPS_STUDIES: Study[] = NPS_STUDY_SEEDS.map((seed, i) => ({
    id: `nps-${i + 1}`,
    name: seed.name,
    date: seed.date,
    // A EMEA aparece também no SentCBK (estudo compartilhado entre codebooks).
    codebookNames: seed.name === 'Relationship NPS — EMEA' ? ['NPSGrpCBK', 'SentCBK'] : ['NPSGrpCBK'],
    questions: seed.questions.map(([text, responses], q) => ({ id: `nps-${i + 1}-q${q + 1}`, text, responses })),
}));

const OTHER_STUDIES: Study[] = [
    {
        id: 'sent-1',
        name: 'Customer Sentiment Pulse',
        date: '22/06/2025',
        codebookNames: ['SentCBK'],
        questions: [
            { id: 'sent-1-q1', text: 'How do you feel about our product?', responses: 1980 },
            { id: 'sent-1-q2', text: 'Describe your experience in a few words.', responses: 1620 },
        ],
    },
    {
        id: 'sent-2',
        name: 'Support Sentiment — H2',
        date: '14/11/2024',
        codebookNames: ['SentCBK'],
        questions: [
            { id: 'sent-2-q1', text: 'How did that interaction make you feel?', responses: 3450 },
        ],
    },
    {
        id: 'ex-1',
        name: 'Étude client France 2025',
        date: '05/03/2025',
        codebookNames: ['Exemple plan de code client'],
        questions: [
            { id: 'ex-1-q1', text: 'Pourquoi cette note ?', responses: 860 },
            { id: 'ex-1-q2', text: 'Que pouvons-nous améliorer ?', responses: 720 },
        ],
    },
];

const STUDIES: Study[] = [...NPS_STUDIES, ...OTHER_STUDIES];

interface RecreateCodebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Chamado ao confirmar "Generate codebook rules" — o pai fecha este modal
     *  e abre o AccountCodebookRulesModal (transição, não empilhamento). */
    onGenerate: () => void;
    sourceCodebookName: string;
}

function RecreateCodebookModal({ isOpen, onClose, onGenerate, sourceCodebookName }: RecreateCodebookModalProps) {
    const [expandedStudyIds, setExpandedStudyIds] = useState<string[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [instructions, setInstructions] = useState('');
    const [query, setQuery] = useState('');

    // Estudos que contêm um codebook com o mesmo nome do selecionado na tabela.
    const studies = useMemo(
        () => STUDIES.filter((s) => s.codebookNames.includes(sourceCodebookName)),
        [sourceCodebookName],
    );

    // Filtro de busca — casa por nome do estudo ou texto das perguntas.
    const visibleStudies = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return studies;
        return studies.filter(
            (s) => s.name.toLowerCase().includes(q) || s.questions.some((qq) => qq.text.toLowerCase().includes(q)),
        );
    }, [studies, query]);

    // Reseta o estado ao (re)abrir. Default: tudo colapsado e nada selecionado;
    // se houver exatamente um estudo, expande-o.
    useEffect(() => {
        if (isOpen) {
            setSelectedQuestionIds([]);
            setInstructions('');
            setQuery('');
            setExpandedStudyIds(studies.length === 1 ? [studies[0].id] : []);
        }
    }, [isOpen, studies]);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedSet = new Set(selectedQuestionIds);

    const toggleExpanded = (id: string) => {
        setExpandedStudyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleQuestion = (qid: string) => {
        setSelectedQuestionIds((prev) => (prev.includes(qid) ? prev.filter((x) => x !== qid) : [...prev, qid]));
    };

    const toggleStudy = (study: Study) => {
        const qIds = study.questions.map((q) => q.id);
        const allSelected = qIds.every((id) => selectedSet.has(id));
        setSelectedQuestionIds((prev) => {
            if (allSelected) return prev.filter((id) => !qIds.includes(id)); // desmarca todas
            const merged = new Set(prev);
            qIds.forEach((id) => merged.add(id)); // marca todas
            return Array.from(merged);
        });
    };

    // Métricas para o rodapé.
    const selectedStudyCount = studies.filter((s) =>
        s.questions.some((q) => selectedSet.has(q.id)),
    ).length;
    const canProceed = selectedQuestionIds.length > 0;

    // -----------------------------------------------------------------------
    // Estilos reutilizados
    // -----------------------------------------------------------------------
    const primaryButtonStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.sm,
        padding: '8px 16px',
        backgroundColor: color.brandPrimary,
        border: 'none',
        borderRadius: radius.lg,
        fontSize: font.size.md,
        fontWeight: font.weight.semibold,
        color: color.surface,
        cursor: 'pointer',
        fontFamily: font.family,
    };

    const tertiaryButtonStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.sm,
        padding: '8px 16px',
        backgroundColor: color.surface,
        border: `1px solid ${color.borderControl}`,
        borderRadius: radius.lg,
        fontSize: font.size.md,
        fontWeight: font.weight.semibold,
        color: color.textDark,
        cursor: 'pointer',
        fontFamily: font.family,
    };

    const disabledButtonStyle: React.CSSProperties = {
        ...primaryButtonStyle,
        backgroundColor: color.borderStrong,
        cursor: 'not-allowed',
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Recreate Codebook"
            onMouseDown={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: space.xl,
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    width: '920px',
                    maxWidth: '100%',
                    height: 'min(760px, 90vh)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: color.surface,
                    borderRadius: radius.xl,
                    boxShadow: shadow.modal,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                            {/* MagicWand teal — casa com o ícone de entrada da ação. */}
                            <MagicWand size={20} weight="bold" color={color.teal} />
                            <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textStrong }}>
                                Recreate Codebook
                            </span>
                        </div>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: space.xs,
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                borderRadius: radius.sm,
                                color: color.textMuted,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>
                    <div style={{ marginTop: space.xs, fontSize: font.size.md, color: color.textMuted }}>
                        Codebook: <strong style={{ color: color.text }}>{sourceCodebookName}</strong>
                    </div>
                </div>

                {/* Body — fixed flex column; only the study list scrolls. */}
                <div style={{ padding: space.xl, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {studies.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EmptyState codebookName={sourceCodebookName} />
                        </div>
                    ) : (
                        <>
                            <p style={{ margin: 0, flexShrink: 0, fontSize: font.size.md, color: color.text, lineHeight: '20px' }}>
                                Select the studies and questions whose data should be used to recreate{' '}
                                <strong>{sourceCodebookName}</strong>. Selecting a study selects all of its questions.
                            </p>

                            {/* Search — fixed above the scrollable list */}
                            <div style={{ flexShrink: 0, position: 'relative', marginTop: space.md }}>
                                <MagnifyingGlass
                                    size={16}
                                    weight="bold"
                                    color={color.textMuted}
                                    style={{ position: 'absolute', left: space.sm, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search studies or questions…"
                                    aria-label="Search studies"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px 8px 32px',
                                        fontSize: font.size.md,
                                        color: color.text,
                                        border: `1px solid ${color.borderControl}`,
                                        borderRadius: radius.md,
                                        outline: 'none',
                                        fontFamily: font.family,
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = color.brand; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = color.borderControl; }}
                                />
                            </div>

                            {/* Study accordion — scrollable region */}
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: space.sm, marginTop: space.md, paddingRight: space.xs }}>
                                {visibleStudies.length === 0 && (
                                    <div style={{ padding: `${space.xl} 0`, textAlign: 'center', fontSize: font.size.md, color: color.textMuted }}>
                                        No studies match “{query.trim()}”.
                                    </div>
                                )}
                                {visibleStudies.map((study) => {
                                    const qIds = study.questions.map((q) => q.id);
                                    const selectedCount = qIds.filter((id) => selectedSet.has(id)).length;
                                    const state: CheckState =
                                        selectedCount === 0 ? 'unchecked' : selectedCount === qIds.length ? 'checked' : 'indeterminate';
                                    const expanded = expandedStudyIds.includes(study.id);
                                    return (
                                        <div key={study.id} style={{ flexShrink: 0, border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                                            {/* Study row */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: space.sm,
                                                    padding: space.md,
                                                    backgroundColor: state === 'unchecked' ? color.surface : color.brandSoft,
                                                }}
                                            >
                                                <TriStateCheckbox
                                                    state={state}
                                                    ariaLabel={`Select all questions in ${study.name}`}
                                                    onToggle={() => toggleStudy(study)}
                                                />
                                                {/* Expand/collapse — name on the left, badge + caret on the right */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(study.id)}
                                                    aria-expanded={expanded}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: space.sm,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        textAlign: 'left',
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        fontFamily: font.family,
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textStrong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {study.name}
                                                        </div>
                                                        <div style={{ fontSize: font.size.sm, color: color.textMuted, marginTop: '2px' }}>
                                                            {study.questions.length} {study.questions.length === 1 ? 'question' : 'questions'} · {study.date}
                                                        </div>
                                                    </div>
                                                    {selectedCount > 0 && (
                                                        <span style={{ flexShrink: 0, fontSize: font.size.sm, fontWeight: font.weight.medium, color: color.brand }}>
                                                            {selectedCount} selected
                                                        </span>
                                                    )}
                                                    {expanded
                                                        ? <CaretDown size={16} weight="bold" color={color.textMuted} style={{ flexShrink: 0 }} />
                                                        : <CaretRight size={16} weight="bold" color={color.textMuted} style={{ flexShrink: 0 }} />}
                                                </button>
                                            </div>

                                            {/* Questions */}
                                            {expanded && (
                                                <div style={{ borderTop: `1px solid ${color.borderSubtle}` }}>
                                                    {study.questions.map((q) => {
                                                        const checked = selectedSet.has(q.id);
                                                        return (
                                                            <button
                                                                key={q.id}
                                                                type="button"
                                                                onClick={() => toggleQuestion(q.id)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: space.sm,
                                                                    width: '100%',
                                                                    textAlign: 'left',
                                                                    padding: `${space.sm} ${space.md}`,
                                                                    paddingLeft: '44px',
                                                                    border: 'none',
                                                                    borderTop: `1px solid ${color.borderSubtle}`,
                                                                    background: 'none',
                                                                    cursor: 'pointer',
                                                                    fontFamily: font.family,
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                            >
                                                                {checked
                                                                    ? <CheckSquare size={18} weight="fill" color={color.brand} />
                                                                    : <Square size={18} color={color.textFaint} />}
                                                                <span style={{ flex: 1, minWidth: 0, fontSize: font.size.md, color: color.text }}>
                                                                    {q.text}
                                                                </span>
                                                                <span style={{ flexShrink: 0, fontSize: font.size.sm, color: color.textMuted }}>
                                                                    {q.responses.toLocaleString()} responses
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Instructions — fixed below the scrollable list */}
                            <div style={{ flexShrink: 0, marginTop: space.xl }}>
                                <label
                                    htmlFor="recreate-instructions"
                                    style={{ display: 'block', fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textStrong }}
                                >
                                    Instructions
                                </label>
                                <div style={{ fontSize: font.size.sm, color: color.textMuted, marginTop: '2px' }}>
                                    Optional — add any guidance to use when recreating the codebook.
                                </div>
                                <textarea
                                    id="recreate-instructions"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Keep the existing net structure, merge near-duplicate codes, prefer concise code names…"
                                    style={{
                                        width: '100%',
                                        marginTop: space.sm,
                                        padding: space.sm,
                                        fontSize: font.size.md,
                                        lineHeight: '20px',
                                        color: color.text,
                                        border: `1px solid ${color.borderControl}`,
                                        borderRadius: radius.md,
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: font.family,
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = color.brand; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = color.borderControl; }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: `${space.md} ${space.xl}`,
                        borderTop: `1px solid ${color.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: space.md,
                        backgroundColor: color.surfaceSubtle,
                    }}
                >
                    <div style={{ fontSize: font.size.sm, color: color.textMuted }}>
                        {studies.length > 0 && (
                            `${selectedQuestionIds.length} ${selectedQuestionIds.length === 1 ? 'question' : 'questions'} selected` +
                            (selectedStudyCount > 0 ? ` across ${selectedStudyCount} ${selectedStudyCount === 1 ? 'study' : 'studies'}` : '')
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: space.sm }}>
                        <button type="button" style={tertiaryButtonStyle} onClick={onClose}>Cancel</button>
                        {studies.length > 0 && (
                            <button
                                type="button"
                                style={canProceed ? primaryButtonStyle : disabledButtonStyle}
                                disabled={!canProceed}
                                onClick={onGenerate}
                            >
                                <MagicWand size={16} weight="bold" />
                                Generate codebook rules
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tri-state checkbox (checked / unchecked / indeterminate)
// ---------------------------------------------------------------------------
type CheckState = 'checked' | 'unchecked' | 'indeterminate';

function TriStateCheckbox({
    state,
    ariaLabel,
    onToggle,
}: {
    state: CheckState;
    ariaLabel: string;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={state === 'indeterminate' ? 'mixed' : state === 'checked'}
            aria-label={ariaLabel}
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
            }}
        >
            {state === 'checked' && <CheckSquare size={20} weight="fill" color={color.brand} />}
            {state === 'indeterminate' && <MinusSquare size={20} weight="fill" color={color.brand} />}
            {state === 'unchecked' && <Square size={20} color={color.textFaint} />}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Empty state — nenhum estudo contém um codebook com esse nome
// ---------------------------------------------------------------------------
function EmptyState({ codebookName }: { codebookName: string }) {
    return (
        <div style={{ textAlign: 'center', padding: `${space.xl} ${space.lg}` }}>
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: radius.full,
                    backgroundColor: color.surfaceSubtle,
                    marginBottom: space.md,
                }}
            >
                <MagicWand size={24} weight="bold" color={color.textFaint} />
            </div>
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: color.textStrong }}>
                No studies available
            </div>
            <div style={{ fontSize: font.size.md, color: color.textMuted, marginTop: space.xs, lineHeight: '20px' }}>
                No studies contain a codebook named <strong style={{ color: color.text }}>{codebookName}</strong>.
            </div>
        </div>
    );
}

export default RecreateCodebookModal;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    X,
    MagicWand,
    CheckCircle,
    Circle,
    Database,
    FolderOpen,
    CaretRight,
    CaretDown,
    PencilSimple,
    Spinner,
    Warning,
} from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';

// -----------------------------------------------------------------------------
// TrainCodebookModal — wizard do fluxo "Train a Codebook".
//
// Aberto ao clicar no ícone MagicWand (Train Codebook) numa linha do Coder.
// É um protótipo puramente visual: todo o estado é local e some ao recarregar.
// Nada é persistido nem a tabela do AI Coder é populada.
//
// Passos:
//   1. Reference  — selecionar até 3 estudos com respostas codificadas manualmente
//   2. Destination — indicar o codebook de IA de destino (vazio ou populado)
//   3. Training    — estado de processamento simulado (não recodifica respostas)
//   4. Review      — árvore de nets/códigos/regras, editável (acessado como AI Coder)
// -----------------------------------------------------------------------------

const STUDY_LIMIT = 3;

interface Study {
    id: string;
    name: string;
    question: string;
    responses: number;
    questions: number;
    date: string;
}

interface DestinationCodebook {
    id: string;
    name: string;
    codes: number; // 0 = vazio
}

interface RuleCode {
    id: string;
    name: string;
    rule: string;
}

interface Net {
    id: string;
    name: string;
    codes: RuleCode[];
}

// ---------------------------------------------------------------------------
// Mock data (fictício, apenas para validar a UI)
// ---------------------------------------------------------------------------
const REFERENCE_STUDIES: Study[] = [
    { id: 's1', name: 'NPS Q3 2025', question: 'Why did you give that score?', responses: 4820, questions: 1, date: '12/08/2025' },
    { id: 's2', name: 'Customer Effort Survey', question: 'What made your experience easy or hard?', responses: 2610, questions: 2, date: '30/06/2025' },
    { id: 's3', name: 'Product Feedback — Mobile App', question: 'What would you improve?', responses: 3175, questions: 1, date: '05/05/2025' },
    { id: 's4', name: 'Onboarding Pulse 2025', question: 'How was your first week?', responses: 980, questions: 3, date: '18/03/2025' },
    { id: 's5', name: 'Churn Exit Interview', question: 'Why are you leaving us?', responses: 1240, questions: 1, date: '22/01/2025' },
    { id: 's6', name: 'Support CSAT — H2', question: 'How could support have helped more?', responses: 5390, questions: 1, date: '14/11/2024' },
];

const DESTINATION_CODEBOOKS: DestinationCodebook[] = [
    { id: 'd1', name: 'New AI codebook (empty)', codes: 0 },
    { id: 'd2', name: 'NPS Grouping — AI', codes: 24 },
    { id: 'd3', name: 'Sentiment Rating — AI', codes: 12 },
    { id: 'd4', name: 'Product Themes — AI', codes: 41 },
];

const RESULT_TREE: Net[] = [
    {
        id: 'n1',
        name: 'Service & Support',
        codes: [
            { id: 'c1', name: 'Fast response time', rule: 'Assign when the respondent praises how quickly the team, agent, or support replied or resolved their issue — including mentions of "quick", "fast", "immediate", or short wait times.' },
            { id: 'c2', name: 'Helpful staff', rule: 'Assign when the respondent describes staff, agents, or representatives as helpful, friendly, knowledgeable, or going out of their way to solve the problem.' },
            { id: 'c3', name: 'Long wait / delays', rule: 'Assign when the respondent complains about slow responses, long queues, being kept waiting, or repeated follow-ups needed before resolution.' },
        ],
    },
    {
        id: 'n2',
        name: 'Product & Features',
        codes: [
            { id: 'c4', name: 'Ease of use', rule: 'Assign when the respondent mentions that the product is intuitive, simple, or easy to navigate, or contrasts it favorably against harder-to-use alternatives.' },
            { id: 'c5', name: 'Missing features', rule: 'Assign when the respondent asks for functionality that does not exist yet, or says a specific capability is lacking or incomplete.' },
            { id: 'c6', name: 'Reliability / bugs', rule: 'Assign when the respondent reports crashes, errors, downtime, or inconsistent behavior that affected their experience.' },
        ],
    },
    {
        id: 'n3',
        name: 'Price & Value',
        codes: [
            { id: 'c7', name: 'Good value for money', rule: 'Assign when the respondent says the price is fair, worth it, or that they get good value relative to what they pay.' },
            { id: 'c8', name: 'Too expensive', rule: 'Assign when the respondent states the price is high, unaffordable, or not justified by the value received.' },
        ],
    },
];

const TRAINING_STEPS = [
    'Reading manually coded responses…',
    'Analyzing coder decisions…',
    'Generating rules for each code…',
    'Copying nets and codes from the manual coder…',
    'Finalizing the AI codebook…',
];

type WizardStep = 'reference' | 'destination' | 'training' | 'review';

const STEP_ORDER: WizardStep[] = ['reference', 'destination', 'training', 'review'];
const STEP_LABELS: Record<WizardStep, string> = {
    reference: 'Reference',
    destination: 'Destination',
    training: 'Training',
    review: 'Review',
};

interface TrainCodebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceCodebookName: string;
}

function TrainCodebookModal({ isOpen, onClose, sourceCodebookName }: TrainCodebookModalProps) {
    const [step, setStep] = useState<WizardStep>('reference');
    const [selectedStudyIds, setSelectedStudyIds] = useState<string[]>([]);
    const [destinationId, setDestinationId] = useState<string>('d1');
    const [trainingIndex, setTrainingIndex] = useState(0);
    const [tree, setTree] = useState<Net[]>(RESULT_TREE);
    const [collapsedNets, setCollapsedNets] = useState<string[]>([]);
    const [editing, setEditing] = useState<{ codeId: string; field: 'name' | 'rule' } | null>(null);
    const timersRef = useRef<number[]>([]);

    // Reseta todo o estado ao (re)abrir o modal.
    useEffect(() => {
        if (isOpen) {
            setStep('reference');
            setSelectedStudyIds([]);
            setDestinationId('d1');
            setTrainingIndex(0);
            setTree(RESULT_TREE);
            setCollapsedNets([]);
            setEditing(null);
        }
    }, [isOpen]);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Simula o processamento no passo 3 e avança para o review ao terminar.
    useEffect(() => {
        if (step !== 'training') return;
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setTrainingIndex(0);

        TRAINING_STEPS.forEach((_, i) => {
            const t = window.setTimeout(() => setTrainingIndex(i), i * 900);
            timersRef.current.push(t);
        });
        const done = window.setTimeout(() => setStep('review'), TRAINING_STEPS.length * 900 + 700);
        timersRef.current.push(done);

        return () => {
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [step]);

    const selectedStudies = useMemo(
        () => REFERENCE_STUDIES.filter((s) => selectedStudyIds.includes(s.id)),
        [selectedStudyIds],
    );
    const totalResponses = selectedStudies.reduce((sum, s) => sum + s.responses, 0);
    const totalQuestions = selectedStudies.reduce((sum, s) => sum + s.questions, 0);
    const destination = DESTINATION_CODEBOOKS.find((d) => d.id === destinationId) ?? DESTINATION_CODEBOOKS[0];

    if (!isOpen) return null;

    const toggleStudy = (id: string) => {
        setSelectedStudyIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= STUDY_LIMIT) return prev; // respeita o limite
            return [...prev, id];
        });
    };

    const toggleNet = (id: string) => {
        setCollapsedNets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const updateCode = (netId: string, codeId: string, field: 'name' | 'rule', value: string) => {
        setTree((prev) =>
            prev.map((net) =>
                net.id !== netId
                    ? net
                    : { ...net, codes: net.codes.map((c) => (c.id === codeId ? { ...c, [field]: value } : c)) },
            ),
        );
    };

    const canProceed = step === 'reference' ? selectedStudyIds.length > 0 : true;
    const currentStepIndex = STEP_ORDER.indexOf(step);

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
            aria-label="Train Codebook"
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
                    width: '760px',
                    maxWidth: '100%',
                    maxHeight: '88vh',
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
                            <MagicWand size={20} weight="bold" color={color.brand} />
                            <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textStrong }}>
                                Train Codebook
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
                        Source structure: <strong style={{ color: color.text }}>{sourceCodebookName}</strong>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
                        {STEP_ORDER.map((s, i) => {
                            const isActive = i === currentStepIndex;
                            const isDone = i < currentStepIndex;
                            return (
                                <React.Fragment key={s}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: radius.full,
                                                fontSize: font.size.sm,
                                                fontWeight: font.weight.semibold,
                                                backgroundColor: isActive || isDone ? color.brandPrimary : color.tabTrack,
                                                color: isActive || isDone ? color.surface : color.textMuted,
                                            }}
                                        >
                                            {isDone ? '✓' : i + 1}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: font.size.md,
                                                fontWeight: isActive ? font.weight.semibold : font.weight.regular,
                                                color: isActive ? color.textStrong : color.textMuted,
                                            }}
                                        >
                                            {STEP_LABELS[s]}
                                        </span>
                                    </div>
                                    {i < STEP_ORDER.length - 1 && (
                                        <div style={{ flex: 1, height: '1px', backgroundColor: color.border }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: space.xl, overflowY: 'auto', flex: 1 }}>
                    {step === 'reference' && (
                        <ReferenceStep
                            selectedStudyIds={selectedStudyIds}
                            onToggle={toggleStudy}
                            totalResponses={totalResponses}
                            totalQuestions={totalQuestions}
                        />
                    )}
                    {step === 'destination' && (
                        <DestinationStep
                            destinationId={destinationId}
                            onSelect={setDestinationId}
                        />
                    )}
                    {step === 'training' && <TrainingStep activeIndex={trainingIndex} />}
                    {step === 'review' && (
                        <ReviewStep
                            tree={tree}
                            collapsedNets={collapsedNets}
                            onToggleNet={toggleNet}
                            editing={editing}
                            setEditing={setEditing}
                            onUpdateCode={updateCode}
                        />
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
                        {step === 'reference' && `${selectedStudyIds.length} of ${STUDY_LIMIT} studies selected`}
                        {step === 'destination' && (
                            <>Destination: <strong style={{ color: color.text }}>{destination.name}</strong></>
                        )}
                        {step === 'review' && 'Editing as AI Coder — names and rules are editable'}
                    </div>

                    <div style={{ display: 'flex', gap: space.sm }}>
                        {step === 'reference' && (
                            <>
                                <button type="button" style={tertiaryButtonStyle} onClick={onClose}>Cancel</button>
                                <button
                                    type="button"
                                    style={canProceed ? primaryButtonStyle : disabledButtonStyle}
                                    disabled={!canProceed}
                                    onClick={() => setStep('destination')}
                                >
                                    Next
                                    <CaretRight size={16} weight="bold" />
                                </button>
                            </>
                        )}
                        {step === 'destination' && (
                            <>
                                <button type="button" style={tertiaryButtonStyle} onClick={() => setStep('reference')}>Back</button>
                                <button type="button" style={primaryButtonStyle} onClick={() => setStep('training')}>
                                    <MagicWand size={16} weight="bold" />
                                    Train
                                </button>
                            </>
                        )}
                        {step === 'review' && (
                            <button type="button" style={primaryButtonStyle} onClick={onClose}>Done</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Passo 1 — Reference
// ---------------------------------------------------------------------------
function ReferenceStep({
    selectedStudyIds,
    onToggle,
    totalResponses,
    totalQuestions,
}: {
    selectedStudyIds: string[];
    onToggle: (id: string) => void;
    totalResponses: number;
    totalQuestions: number;
}) {
    const limitReached = selectedStudyIds.length >= STUDY_LIMIT;
    return (
        <div>
            <p style={{ margin: 0, fontSize: font.size.md, color: color.text, lineHeight: '20px' }}>
                Training uses <strong>real coded responses</strong>, not just the codebook. Select the studies
                whose manually coded data should teach the AI. What matters is the volume of responses and
                questions — the study count is only a practical limit.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, marginTop: space.lg }}>
                {REFERENCE_STUDIES.map((study) => {
                    const selected = selectedStudyIds.includes(study.id);
                    const disabled = !selected && limitReached;
                    return (
                        <button
                            key={study.id}
                            type="button"
                            onClick={() => onToggle(study.id)}
                            disabled={disabled}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: space.md,
                                width: '100%',
                                textAlign: 'left',
                                padding: space.md,
                                borderRadius: radius.lg,
                                border: `1px solid ${selected ? color.brand : color.border}`,
                                backgroundColor: selected ? color.brandSoft : color.surface,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? 0.5 : 1,
                                fontFamily: font.family,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {selected
                                ? <CheckCircle size={20} weight="fill" color={color.brand} />
                                : <Circle size={20} color={color.textFaint} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textStrong }}>
                                    {study.name}
                                </div>
                                <div style={{ fontSize: font.size.sm, color: color.textMuted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {study.question}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.text }}>
                                    {study.responses.toLocaleString()} responses
                                </div>
                                <div style={{ fontSize: font.size.sm, color: color.textMuted, marginTop: '2px' }}>
                                    {study.questions} {study.questions === 1 ? 'question' : 'questions'} · {study.date}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {limitReached && (
                <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, marginTop: space.md, fontSize: font.size.sm, color: color.warning }}>
                    <Warning size={16} weight="fill" />
                    Up to {STUDY_LIMIT} studies can be selected. Deselect one to choose another.
                </div>
            )}

            {/* Aggregate counter */}
            <div
                style={{
                    display: 'flex',
                    gap: space.xl,
                    marginTop: space.lg,
                    padding: space.md,
                    borderRadius: radius.lg,
                    backgroundColor: color.surfaceSubtle,
                    border: `1px solid ${color.border}`,
                }}
            >
                <Metric label="Responses selected" value={totalResponses.toLocaleString()} />
                <Metric label="Questions selected" value={String(totalQuestions)} />
                <Metric label="Studies selected" value={`${selectedStudyIds.length} / ${STUDY_LIMIT}`} />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.brandPrimary }}>{value}</div>
            <div style={{ fontSize: font.size.sm, color: color.textMuted, marginTop: '2px' }}>{label}</div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Passo 2 — Destination
// ---------------------------------------------------------------------------
function DestinationStep({
    destinationId,
    onSelect,
}: {
    destinationId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div>
            <p style={{ margin: 0, fontSize: font.size.md, color: color.text, lineHeight: '20px' }}>
                Choose the AI codebook that will receive the generated rules. This makes the manual codebook
                available for AI analysis — validated responses are never recoded or changed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, marginTop: space.lg }}>
                {DESTINATION_CODEBOOKS.map((cb) => {
                    const selected = cb.id === destinationId;
                    const isEmpty = cb.codes === 0;
                    return (
                        <button
                            key={cb.id}
                            type="button"
                            onClick={() => onSelect(cb.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: space.md,
                                width: '100%',
                                textAlign: 'left',
                                padding: space.md,
                                borderRadius: radius.lg,
                                border: `1px solid ${selected ? color.brand : color.border}`,
                                backgroundColor: selected ? color.brandSoft : color.surface,
                                cursor: 'pointer',
                                fontFamily: font.family,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {isEmpty
                                ? <Database size={20} weight={selected ? 'fill' : 'regular'} color={selected ? color.brand : color.textMuted} />
                                : <FolderOpen size={20} weight={selected ? 'fill' : 'regular'} color={selected ? color.brand : color.textMuted} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textStrong }}>
                                    {cb.name}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: font.size.sm,
                                    fontWeight: font.weight.medium,
                                    padding: '2px 8px',
                                    borderRadius: radius.full,
                                    backgroundColor: isEmpty ? color.surfaceHover : color.infoSoft,
                                    color: isEmpty ? color.textMuted : color.info,
                                }}
                            >
                                {isEmpty ? 'Empty' : `${cb.codes} codes`}
                            </span>
                            {selected && <CheckCircle size={20} weight="fill" color={color.brand} />}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: space.xs, marginTop: space.lg, fontSize: font.size.sm, color: color.textMuted, lineHeight: '18px' }}>
                <Warning size={16} weight="fill" color={color.textFaint} style={{ flexShrink: 0, marginTop: '1px' }} />
                Nets and codes from the manual coder are copied into the destination behind the scenes. Existing
                content in a populated codebook is kept.
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Passo 3 — Training
// ---------------------------------------------------------------------------
function TrainingStep({ activeIndex }: { activeIndex: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${space.xl} 0` }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    borderRadius: radius.full,
                    backgroundColor: color.brandSoft,
                    marginBottom: space.lg,
                }}
            >
                <Spinner size={28} weight="bold" color={color.brand} className="tcb-spin" />
            </div>
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: color.textStrong }}>
                Training the codebook…
            </div>
            <div style={{ fontSize: font.size.md, color: color.textMuted, marginTop: space.xs }}>
                This may take a moment. Validated responses are not changed.
            </div>

            <div style={{ width: '100%', maxWidth: '420px', marginTop: space.xl, display: 'flex', flexDirection: 'column', gap: space.sm }}>
                {TRAINING_STEPS.map((label, i) => {
                    const done = i < activeIndex;
                    const active = i === activeIndex;
                    return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                            {done
                                ? <CheckCircle size={18} weight="fill" color={color.success} />
                                : active
                                    ? <Spinner size={18} weight="bold" color={color.brand} className="tcb-spin" />
                                    : <Circle size={18} color={color.textFaint} />}
                            <span
                                style={{
                                    fontSize: font.size.md,
                                    color: done ? color.text : active ? color.textStrong : color.textFaint,
                                    fontWeight: active ? font.weight.medium : font.weight.regular,
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <style>{`@keyframes tcb-spin { to { transform: rotate(360deg); } } .tcb-spin { animation: tcb-spin 0.9s linear infinite; }`}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Passo 4 — Review (editável)
// ---------------------------------------------------------------------------
function ReviewStep({
    tree,
    collapsedNets,
    onToggleNet,
    editing,
    setEditing,
    onUpdateCode,
}: {
    tree: Net[];
    collapsedNets: string[];
    onToggleNet: (id: string) => void;
    editing: { codeId: string; field: 'name' | 'rule' } | null;
    setEditing: (v: { codeId: string; field: 'name' | 'rule' } | null) => void;
    onUpdateCode: (netId: string, codeId: string, field: 'name' | 'rule', value: string) => void;
}) {
    const totalCodes = tree.reduce((sum, net) => sum + net.codes.length, 0);
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.lg }}>
                <CheckCircle size={20} weight="fill" color={color.success} />
                <span style={{ fontSize: font.size.md, color: color.text }}>
                    Training complete — <strong>{tree.length} nets</strong> and <strong>{totalCodes} codes</strong> with
                    generated rules, shown in the codebook's original order. Click a name or rule to edit.
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
                {tree.map((net) => {
                    const collapsed = collapsedNets.includes(net.id);
                    return (
                        <div key={net.id} style={{ border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                            <button
                                type="button"
                                onClick={() => onToggleNet(net.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: space.sm,
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: `${space.sm} ${space.md}`,
                                    border: 'none',
                                    backgroundColor: color.surfaceSubtle,
                                    cursor: 'pointer',
                                    fontFamily: font.family,
                                }}
                            >
                                {collapsed ? <CaretRight size={16} weight="bold" color={color.textMuted} /> : <CaretDown size={16} weight="bold" color={color.textMuted} />}
                                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textStrong }}>{net.name}</span>
                                <span style={{ fontSize: font.size.sm, color: color.textMuted }}>· {net.codes.length} codes</span>
                            </button>

                            {!collapsed && (
                                <div>
                                    {net.codes.map((code) => (
                                        <div key={code.id} style={{ padding: space.md, borderTop: `1px solid ${color.borderSubtle}` }}>
                                            {/* Nome do código (editável) */}
                                            <EditableName
                                                value={code.name}
                                                isEditing={editing?.codeId === code.id && editing.field === 'name'}
                                                onStart={() => setEditing({ codeId: code.id, field: 'name' })}
                                                onCommit={(v) => { onUpdateCode(net.id, code.id, 'name', v); setEditing(null); }}
                                            />
                                            {/* Regra (editável) */}
                                            <EditableRule
                                                value={code.rule}
                                                isEditing={editing?.codeId === code.id && editing.field === 'rule'}
                                                onStart={() => setEditing({ codeId: code.id, field: 'rule' })}
                                                onCommit={(v) => { onUpdateCode(net.id, code.id, 'rule', v); setEditing(null); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EditableName({
    value,
    isEditing,
    onStart,
    onCommit,
}: {
    value: string;
    isEditing: boolean;
    onStart: () => void;
    onCommit: (v: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    useEffect(() => { setDraft(value); }, [value, isEditing]);

    if (isEditing) {
        return (
            <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => onCommit(draft)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onCommit(draft);
                    if (e.key === 'Escape') onCommit(value);
                }}
                style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: font.size.md,
                    fontWeight: font.weight.semibold,
                    color: color.textStrong,
                    border: `1px solid ${color.brand}`,
                    borderRadius: radius.sm,
                    outline: 'none',
                    fontFamily: font.family,
                }}
            />
        );
    }

    return (
        <button
            type="button"
            onClick={onStart}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: space.xs,
                padding: '2px 4px',
                margin: '-2px -4px',
                border: 'none',
                background: 'none',
                cursor: 'text',
                fontSize: font.size.md,
                fontWeight: font.weight.semibold,
                color: color.textStrong,
                fontFamily: font.family,
                borderRadius: radius.sm,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
            {value}
            <PencilSimple size={13} color={color.textFaint} />
        </button>
    );
}

function EditableRule({
    value,
    isEditing,
    onStart,
    onCommit,
}: {
    value: string;
    isEditing: boolean;
    onStart: () => void;
    onCommit: (v: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    useEffect(() => { setDraft(value); }, [value, isEditing]);

    if (isEditing) {
        return (
            <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => onCommit(draft)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onCommit(draft);
                    if (e.key === 'Escape') onCommit(value);
                }}
                rows={3}
                style={{
                    width: '100%',
                    marginTop: space.xs,
                    padding: space.sm,
                    fontSize: font.size.md,
                    lineHeight: '20px',
                    color: color.text,
                    border: `1px solid ${color.brand}`,
                    borderRadius: radius.md,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: font.family,
                }}
            />
        );
    }

    return (
        <div
            onClick={onStart}
            style={{
                marginTop: space.xs,
                padding: space.sm,
                fontSize: font.size.md,
                lineHeight: '20px',
                color: color.text,
                backgroundColor: color.surfaceSubtle,
                border: `1px solid ${color.borderSubtle}`,
                borderRadius: radius.md,
                cursor: 'text',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = color.borderStrong; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = color.borderSubtle; }}
        >
            {value}
        </div>
    );
}

export default TrainCodebookModal;

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Minus, Plus, X } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import type { TrainingQuestion } from './RecreateCodebookModal';
import ModalButton from './ModalButton';
import SelectField from './SelectField';
import { FALLBACK_SAMPLE, SAMPLE_RESPONSES, type QcDecision, type QcDerivedResponse } from './qualityCheckV2Data';

// -----------------------------------------------------------------------------
// QualityCheckV3 — layout PROPOSTO do Quality Check, focado em escaneabilidade.
// TEMPORÁRIO: aberto pelo switch "Prototype layout" do QualityCheckPrototype,
// ao lado do layout atual (QualityCheckV2), que continua intacto. Mesmos dados
// (qualityCheckV2Data) e mesmas saídas para o pai.
//
// Diferenças em relação à V2:
//   - Summary compacto numa faixa só (sem cards/barras).
//   - Lista densa em linhas alinhadas em colunas (Response · Differences ·
//     decisão), em vez de um card alto por resposta.
//   - Diferenças no mesmo chip de code da V2, só com a barra lateral na cor
//     da série e um sinal (− missed / + added).
//   - Termos únicos: "Missed by AI" / "Added by AI".
//   - Linhas começam NÃO revisadas: progresso, filtro To review / Reviewed e
//     "Accept remaining as Manual". O botão principal só habilita com tudo
//     revisado.
//   - Toolbar + cabeçalho das colunas fixos (sticky) ao rolar.
//
// Protótipo puramente visual: nada é persistido.
// -----------------------------------------------------------------------------

type StatusFilter = 'all' | 'todo' | 'done';

// Números da amostra (todos derivados dos dados) ------------------------------

const TOTAL = SAMPLE_RESPONSES.length;
const DIFFS = SAMPLE_RESPONSES.filter((r) => r.hasDifference);
const MATCHED = TOTAL - DIFFS.length;
const MISSED_CODES = DIFFS.reduce((n, r) => n + r.onlyManual.length, 0);
const ADDED_CODES = DIFFS.reduce((n, r) => n + r.onlyAI.length, 0);

// Codes envolvidos em alguma diferença, em ordem alfabética (filtro Code).
const DIFF_CODES_ALPHA = Array.from(new Set(DIFFS.flatMap((r) => [...r.onlyManual, ...r.onlyAI]))).sort((a, b) => a.localeCompare(b));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Cores das diferenças (mesmas séries da V2): missed = âmbar, added = azul.
const DIFF = {
    missed: {
        fill: color.amber,
        tint: color.amberSoft,
        Icon: Minus,
        label: 'Missed by AI',
        sign: '−',
        explain: (code: string) => `Manual coding applied "${code}" to this response. AI Coder didn't.`,
    },
    added: {
        fill: color.info,
        tint: color.infoSoft,
        Icon: Plus,
        label: 'Added by AI',
        sign: '+',
        explain: (code: string) => `AI Coder applied "${code}" to this response. Manual coding didn't.`,
    },
} as const;

// Tooltips (title nativo): termo da tela na 1ª linha + explicação do caso.
const tooltip = (...lines: string[]) => lines.join('\n');
type DiffKind = keyof typeof DIFF;

// Estilos compartilhados -------------------------------------------------------

// Cabeçalho das colunas — mesma tipografia/cor do SortHeader da tabela de
// estudos do RecreateCodebookModal (12px semibold, caixa alta, textDark).
const columnHeader: CSSProperties = {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textDark,
    whiteSpace: 'nowrap',
};

const linkButton: CSSProperties = {
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: font.family,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: color.brandDark,
    lineHeight: '20px',
};

const visuallyHidden: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

// Colunas da lista: resposta · diferenças · decisão. Mesmas no cabeçalho e nas
// linhas para tudo alinhar verticalmente.
const LIST_COLUMNS: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 32%) 168px',
    columnGap: space.xl,
};

// -----------------------------------------------------------------------------

interface QualityCheckV3Props {
    isOpen: boolean;
    /** Pergunta escolhida para a amostra (null → FALLBACK_SAMPLE). */
    sampleQuestion: TrainingQuestion | null;
    /** "Update code rules": codes com diferença nas respostas marcadas Manual. */
    onUpdateRules: (codesToRefine: string[]) => void;
    /** "Keep rules and continue": todas as respostas marcadas AI. */
    onKeepRules: () => void;
    onCancel: () => void;
    /** Decisão por resposta (controlada pelo QualityCheckPrototype). Ausente = não revisada. */
    decisions: Record<string, QcDecision>;
    onDecisionsChange: Dispatch<SetStateAction<Record<string, QcDecision>>>;
    /** Slot no header, à esquerda do X (switch de layout do protótipo). */
    headerExtra?: ReactNode;
}

function QualityCheckV3({
    isOpen,
    sampleQuestion,
    onUpdateRules,
    onKeepRules,
    onCancel,
    decisions,
    onDecisionsChange: setDecisions,
    headerExtra,
}: QualityCheckV3Props) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [codeFilter, setCodeFilter] = useState<string>('');

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const reviewedCount = DIFFS.filter((r) => decisions[r.id]).length;
    const remaining = DIFFS.length - reviewedCount;
    const manualRows = DIFFS.filter((r) => decisions[r.id] === 'manual');
    const aiCount = DIFFS.filter((r) => decisions[r.id] === 'ai').length;
    const allAI = remaining === 0 && manualRows.length === 0;

    const visibleRows = DIFFS.filter((r) => {
        const reviewed = Boolean(decisions[r.id]);
        if (statusFilter === 'todo' && reviewed) return false;
        if (statusFilter === 'done' && !reviewed) return false;
        return !codeFilter || r.onlyManual.includes(codeFilter) || r.onlyAI.includes(codeFilter);
    });

    const footerNote =
        remaining > 0
            ? `${plural(remaining, 'response', 'responses')} still to review`
            : allAI
              ? `All ${DIFFS.length} responses marked as AI correct. The rules stay as they are.`
              : `${plural(manualRows.length, 'response', 'responses')} will be used to update the rules` +
                (aiCount > 0 ? ` · ${aiCount} marked as AI correct` : '');

    const handlePrimary = () => {
        if (allAI) {
            onKeepRules();
            return;
        }
        const codes = new Set(manualRows.flatMap((r) => [...r.onlyManual, ...r.onlyAI]));
        onUpdateRules(Array.from(codes));
    };

    const acceptRemainingAsManual = () => {
        setDecisions((prev) => {
            const next = { ...prev };
            DIFFS.forEach((r) => { if (!next[r.id]) next[r.id] = 'manual'; });
            return next;
        });
    };

    const question = sampleQuestion?.text ?? FALLBACK_SAMPLE.text;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Quality check"
            onMouseDown={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.55)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 2100,
                padding: `${space.xl} 0`,
                overflow: 'auto',
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    // Mesma caixa da V2: 85vw × calc(100vh - 110px).
                    width: '85vw',
                    maxWidth: '85vw',
                    margin: '0.5rem',
                    height: 'calc(100vh - 110px)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: color.surface,
                    borderRadius: radius.xl,
                    boxShadow: shadow.modal,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ flexShrink: 0, padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.lg }}>
                    <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>
                        Quality check
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
                        {headerExtra}
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onCancel}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.xs, border: 'none', background: 'none', cursor: 'pointer', borderRadius: radius.sm, color: color.textMuted, flexShrink: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Body — área de rolagem. Toolbar + cabeçalho da lista ficam sticky. */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ padding: `${space.lg} ${space.xl} ${space.xl}`, display: 'flex', flexDirection: 'column', gap: space.lg }}>
                        {/* Summary compacto: uma faixa, sem cards aninhados. */}
                        <section
                            aria-label="Comparison results"
                            style={{ display: 'flex', flexDirection: 'column', gap: space.md, padding: `${space.md} ${space.lg}`, border: `1px solid ${color.border}`, borderRadius: radius.lg, backgroundColor: color.surfaceSubtle }}
                        >
                            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px' }}>
                                <span style={{ color: color.textMuted }}>Question: </span>
                                <span style={{ fontWeight: font.weight.semibold, color: color.textDark }}>{question}</span>
                                <span style={{ color: color.textMuted }}> · {TOTAL} responses sampled (10%)</span>
                            </p>

                            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.sm }}>
                                <Stat value={`${Math.round((MATCHED / TOTAL) * 100)}%`} label="match rate" />
                                <Stat value={DIFFS.length} label={`of ${TOTAL} responses with differences`} />
                                <Stat
                                    value={MISSED_CODES}
                                    label="manual codes missed by AI"
                                    kind="missed"
                                    title={tooltip(DIFF.missed.label, "Codes applied in manual coding that AI Coder didn't apply. Each response counts separately.")}
                                />
                                <Stat
                                    value={ADDED_CODES}
                                    label="extra codes added by AI"
                                    kind="added"
                                    title={tooltip(DIFF.added.label, "Codes AI Coder applied that manual coding didn't. Each response counts separately.")}
                                />
                            </div>
                        </section>

                        {/* Revisão */}
                        <section aria-label="Review the differences" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold, lineHeight: '24px', color: color.textDark }}>
                                Review the differences
                            </h3>
                            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px', color: color.textDark }}>
                                Mark which coding is correct. Responses marked Manual update the code rules.
                            </p>

                            {/* Toolbar + cabeçalho das colunas (sticky) */}
                            <div style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: color.surface, paddingTop: space.md }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: space.md, paddingBottom: space.md }}>
                                    <Segmented<StatusFilter>
                                        label="Review status"
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        options={[
                                            { value: 'all', label: `All (${DIFFS.length})` },
                                            { value: 'todo', label: `To review (${remaining})` },
                                            { value: 'done', label: `Reviewed (${reviewedCount})` },
                                        ]}
                                    />
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.md, color: color.textSubtle }}>
                                        <span aria-hidden="true">Code</span>
                                        <div style={{ width: '240px' }}>
                                            <SelectField
                                                ariaLabel="Code"
                                                size="sm"
                                                placeholder="All codes"
                                                options={[{ value: '', label: 'All codes' }, ...DIFF_CODES_ALPHA.map((c) => ({ value: c, label: c }))]}
                                                value={codeFilter}
                                                onChange={setCodeFilter}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: space.md }}>
                                        <Progress done={reviewedCount} total={DIFFS.length} />
                                        <ModalButton
                                            variant="tertiary"
                                            onClick={acceptRemainingAsManual}
                                            disabled={remaining === 0}
                                            style={{ height: '30px', padding: `0 ${space.md}` }}
                                        >
                                            Accept remaining as Manual
                                        </ModalButton>
                                    </div>
                                </div>

                                <div
                                    role="row"
                                    style={{
                                        ...LIST_COLUMNS,
                                        // Altura de 35px, igual ao header da tabela de estudos.
                                        alignItems: 'center',
                                        minHeight: '35px',
                                        padding: `0 ${space.lg}`,
                                        border: `1px solid ${color.border}`,
                                        borderRadius: `${radius.lg} ${radius.lg} 0 0`,
                                        backgroundColor: color.surfaceSubtle,
                                    }}
                                >
                                    <span role="columnheader" style={columnHeader}>Response</span>
                                    <span role="columnheader" style={columnHeader}>Differences</span>
                                    <span role="columnheader" style={{ ...columnHeader, textAlign: 'right' }}>Correct coding</span>
                                </div>
                            </div>

                            <ul
                                style={{
                                    listStyle: 'none',
                                    margin: 0,
                                    padding: 0,
                                    border: `1px solid ${color.border}`,
                                    borderTop: 'none',
                                    borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
                                    backgroundColor: color.surface,
                                }}
                            >
                                {visibleRows.length === 0 ? (
                                    <li style={{ padding: space.xl, textAlign: 'center', fontSize: font.size.md, color: color.textMuted }}>
                                        No responses match these filters.
                                    </li>
                                ) : (
                                    visibleRows.map((r, i) => (
                                        <ReviewRow
                                            key={r.id}
                                            item={r}
                                            isLast={i === visibleRows.length - 1}
                                            decision={decisions[r.id]}
                                            onDecide={(d) => setDecisions((prev) => ({ ...prev, [r.id]: d }))}
                                        />
                                    ))
                                )}
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Footer (fixo) */}
                <div style={{ flexShrink: 0, padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.lg, backgroundColor: color.surface }}>
                    <span style={{ fontSize: font.size.md, color: color.textMuted, lineHeight: '20px' }}>{footerNote}</span>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: space.sm }}>
                        <ModalButton variant="tertiary" onClick={onCancel}>Cancel</ModalButton>
                        <ModalButton
                            variant="primary"
                            onClick={handlePrimary}
                            disabled={remaining > 0}
                            title={remaining > 0 ? 'Review all responses first' : undefined}
                        >
                            {allAI ? 'Keep rules and continue' : 'Update code rules'}
                        </ModalButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Summary ------------------------------------------------------------------------

// Número do summary. Com `kind`, leva o sinal (−/+) das tags da lista como
// ícone num quadrado tingido — separado do número para não ler "−22".
function Stat({ value, label, kind, title }: { value: ReactNode; label: string; kind?: DiffKind; title?: string }) {
    const d = kind ? DIFF[kind] : null;
    return (
        <span title={title} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap', cursor: title ? 'help' : undefined }}>
            {d && (
                <span
                    aria-hidden="true"
                    style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', marginRight: '2px', borderRadius: radius.sm, backgroundColor: d.tint, color: d.fill, flexShrink: 0 }}
                >
                    <d.Icon size={14} weight="bold" />
                </span>
            )}
            <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textStrong, lineHeight: '24px', fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </span>
            <span style={{ fontSize: font.size.md, color: color.textMuted }}>{label}</span>
        </span>
    );
}


// Toolbar ------------------------------------------------------------------------

function Segmented<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            style={{ display: 'inline-flex', flexShrink: 0, gap: '2px', padding: '2px', backgroundColor: color.tabTrack, borderRadius: radius.lg }}
        >
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.value)}
                        style={{
                            height: '28px',
                            padding: `0 ${space.md}`,
                            border: 'none',
                            borderRadius: radius.md,
                            backgroundColor: active ? color.surface : 'transparent',
                            boxShadow: active ? shadow.control : 'none',
                            color: active ? color.brandPrimary : color.textMuted,
                            fontFamily: font.family,
                            fontSize: font.size.md,
                            fontWeight: active ? font.weight.semibold : font.weight.medium,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function Progress({ done, total }: { done: number; total: number }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.md, color: color.textMuted, whiteSpace: 'nowrap' }}>
            <span>
                <strong style={{ fontWeight: font.weight.semibold, color: color.textStrong, fontVariantNumeric: 'tabular-nums' }}>{done} of {total}</strong> reviewed
            </span>
            <span
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                aria-label={`${done} of ${total} responses reviewed`}
                style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: color.tabTrack, overflow: 'hidden' }}
            >
                <span style={{ display: 'block', width: `${total > 0 ? (done / total) * 100 : 0}%`, height: '100%', backgroundColor: color.brandPrimary, transition: 'width 160ms' }} />
            </span>
        </span>
    );
}

// Linha da lista -----------------------------------------------------------------

function ReviewRow({
    item,
    isLast,
    decision,
    onDecide,
}: {
    item: QcDerivedResponse;
    isLast: boolean;
    decision: QcDecision | undefined;
    onDecide: (d: QcDecision) => void;
}) {
    const textRef = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);

    // "Show more" só quando o texto passa de 2 linhas ou há codes em comum
    // (que aparecem só expandido).
    useLayoutEffect(() => {
        if (expanded) return;
        const el = textRef.current;
        if (!el) return;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [expanded, item.text]);

    const canExpand = expanded || overflows || item.inBoth.length > 0;

    return (
        <li
            style={{
                ...LIST_COLUMNS,
                alignItems: 'start',
                padding: `${space.md} ${space.lg}`,
                borderBottom: isLast ? undefined : `1px solid ${color.border}`,
            }}
        >
            {/* Resposta: 2 linhas + "Show more". */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xs, alignItems: 'flex-start' }}>
                <p
                    ref={textRef}
                    style={{
                        margin: 0,
                        fontSize: font.size.md,
                        lineHeight: '21px',
                        color: color.textVerbatim,
                        ...(expanded ? null : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                    }}
                >
                    {item.text}
                </p>
                {expanded && item.inBoth.length > 0 && (
                    <span style={{ fontSize: font.size.md, lineHeight: '20px', color: color.textMuted }}>
                        Matched in both: {item.inBoth.join(', ')}
                    </span>
                )}
                {canExpand && (
                    <button type="button" style={linkButton} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
                        {expanded ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>

            {/* Diferenças como diff: − missed / + added. */}
            <div style={{ minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
                {item.onlyManual.map((c) => <DiffChip key={`m-${c}`} kind="missed" code={c} />)}
                {item.onlyAI.map((c) => <DiffChip key={`a-${c}`} kind="added" code={c} />)}
                {item.aiCodes.length === 0 && (
                    <span
                        title={tooltip('AI applied no codes', "AI Coder didn't apply any code to this response.")}
                        style={{ fontSize: font.size.md, lineHeight: '30px', color: color.textMuted, cursor: 'help' }}
                    >
                        AI applied no codes
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <DecisionToggle label={`Correct coding for ${item.id}`} value={decision} onChange={onDecide} />
            </div>
        </li>
    );
}

// Chip de code — mesmo visual do Chip da V2 / Ascribe (fundo branco, borda
// cinza sem a lateral esquerda, barra de 3px à esquerda), copiado aqui para
// não acoplar a V3 à V2. Única variação: a cor da barra.
const codeChipStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: 'min(260px, 100%)',
    padding: '4px 10px',
    backgroundColor: color.surface,
    border: `1px solid ${color.borderInput}`,
    borderLeft: 'none',
    borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    lineHeight: '20px',
    color: color.textDark,
    whiteSpace: 'nowrap',
};

const codeChipLabel: CSSProperties = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function CodeChipAccent({ fill }: { fill: string }) {
    return (
        <span
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '3px', backgroundColor: fill, borderRadius: `${radius.sm} 0 0 ${radius.sm}` }}
        />
    );
}

// Diferença na lista: chip de code com a barra na cor da série (âmbar =
// missed, azul = added) + sinal −/+ na mesma cor (reforço além da cor).
function DiffChip({ kind, code }: { kind: DiffKind; code: string }) {
    const d = DIFF[kind];
    return (
        <span title={tooltip(d.label, d.explain(code))} style={{ ...codeChipStyle, gap: '6px', cursor: 'help' }}>
            <CodeChipAccent fill={d.fill} />
            <span aria-hidden="true" style={{ fontWeight: font.weight.semibold, color: d.fill }}>{d.sign}</span>
            <span style={visuallyHidden}>{d.label}: </span>
            <span style={codeChipLabel}>{code}</span>
        </span>
    );
}

// Decisão ("Manual | AI"). Sem valor = não revisada (nenhuma metade marcada).
function DecisionToggle({ label, value, onChange }: { label: string; value: QcDecision | undefined; onChange: (d: QcDecision) => void }) {
    const options: { value: QcDecision; label: string }[] = [
        { value: 'manual', label: 'Manual' },
        { value: 'ai', label: 'AI' },
    ];
    return (
        <div
            role="group"
            aria-label={label}
            style={{
                display: 'inline-grid',
                gridTemplateColumns: '1fr 1fr',
                flexShrink: 0,
                border: `1px solid ${color.borderControl}`,
                borderRadius: radius.lg,
                overflow: 'hidden',
                backgroundColor: color.surface,
            }}
        >
            {options.map((o, i) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.value)}
                        style={{
                            minWidth: '72px',
                            height: '28px',
                            padding: `0 ${space.md}`,
                            border: 'none',
                            borderLeft: i === 0 ? 'none' : `1px solid ${color.borderControl}`,
                            backgroundColor: active ? color.brandPrimarySoft : color.surface,
                            color: active ? color.brandPrimary : color.textSubtle,
                            fontFamily: font.family,
                            fontSize: font.size.md,
                            fontWeight: active ? font.weight.semibold : font.weight.medium,
                            lineHeight: '20px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'background-color 140ms, color 140ms',
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

export default QualityCheckV3;

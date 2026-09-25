import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import { SortHeader, type SortDir, type TrainingQuestion } from './RecreateCodebookModal';
import ModalButton from './ModalButton';
import SelectField from './SelectField';
import { FALLBACK_SAMPLE, SAMPLE_RESPONSES, type QcDerivedResponse } from './qualityCheckV2Data';

// -----------------------------------------------------------------------------
// QualityCheckV2 — nova experiência do Quality Check, construída do zero em
// paralelo à V1 (QualityCheckPanel). TEMPORÁRIO: aberto pelo botão "Run
// quality check V2" do AccountCodebookRulesModal, depois do mesmo seletor de
// amostra (QualityCheckSampleModal).
//
// Desacoplado da V1 de propósito: não importa nada do QualityCheckPanel (nem
// dados mockados nem CSS `qc-*`). Os dados vêm de qualityCheckV2Data.
//
// Conceito: relatório de diferenças. O AI coder roda numa amostra já
// codificada manualmente; a comparação manual × AI é 1:1 por resposta. Só as
// respostas com diferença são listadas, e o usuário decide, por resposta, qual
// codificação está correta (default: Manual).
//
// Corpo (rola): subtítulo → barra da amostra → 3 cards de resumo → painel de
// resultados (toolbar + By response / By code). O footer fica fixo.
//
// Saídas para o pai:
//   - onUpdateRules(codes): há respostas marcadas Manual; devolve os codes com
//     diferença nessas respostas para o refino das regras.
//   - onKeepRules(): todas marcadas AI; nada muda.
//   - onCancel(): fechou sem concluir (ESC / clique-fora / X).
//
// Protótipo puramente visual: nada é persistido.
// -----------------------------------------------------------------------------

type Decision = 'manual' | 'ai';
type View = 'response' | 'code';

// Números da amostra (todos derivados dos dados) ------------------------------

const TOTAL = SAMPLE_RESPONSES.length;
const DIFFS = SAMPLE_RESPONSES.filter((r) => r.hasDifference);
const MATCHED = TOTAL - DIFFS.length;
// Respostas com diferença por tipo, em grupos exclusivos (somam DIFFS.length):
// só faltaram codes, as duas coisas, só sobraram codes.
const RESP_ONLY_MISSED = DIFFS.filter((r) => r.onlyManual.length > 0 && r.onlyAI.length === 0).length;
const RESP_ONLY_ADDED = DIFFS.filter((r) => r.onlyAI.length > 0 && r.onlyManual.length === 0).length;
const RESP_BOTH = DIFFS.length - RESP_ONLY_MISSED - RESP_ONLY_ADDED;

interface CodeStat {
    code: string;
    onlyManual: number;
    onlyAI: number;
    total: number;
}

// Codes envolvidos em alguma diferença, por total de diferenças (desc).
const CODE_STATS: CodeStat[] = (() => {
    const codes = Array.from(new Set(DIFFS.flatMap((r) => [...r.onlyManual, ...r.onlyAI])));
    return codes
        .map((code) => {
            const onlyManual = DIFFS.filter((r) => r.onlyManual.includes(code)).length;
            const onlyAI = DIFFS.filter((r) => r.onlyAI.includes(code)).length;
            return {
                code,
                onlyManual,
                onlyAI,
                total: onlyManual + onlyAI,
            };
        })
        .sort((a, b) => b.total - a.total || a.code.localeCompare(b.code));
})();
const DIFF_CODES_ALPHA = CODE_STATS.map((s) => s.code).sort((a, b) => a.localeCompare(b));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Estilos compartilhados -------------------------------------------------------

const eyebrow: CSSProperties = {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: color.textMuted,
    lineHeight: '16px',
};

const linkButton: CSSProperties = {
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: font.family,
    fontSize: font.size.smd,
    fontWeight: font.weight.semibold,
    color: color.brandDark,
    lineHeight: '18px',
};

// Card de resumo: título do card no topo (largura total, uma linha só) e,
// abaixo, uma linha com o número à esquerda (coluna de largura fixa, igual
// nos dois cards para as barras começarem no mesmo x) e frase + barra(s) à
// direita, alinhadas pela base.
const card: CSSProperties = {
    flex: '1 1 380px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
    padding: space.lg,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
};

const cardTitle: CSSProperties = {
    ...eyebrow,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const cardBody: CSSProperties = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '96px minmax(0, 1fr)',
    columnGap: space.lg,
    alignItems: 'end',
};

const heroNumber: CSSProperties = {
    fontSize: font.size.display,
    fontWeight: font.weight.semibold,
    color: color.textStrong,
    lineHeight: '32px',
    fontVariantNumeric: 'tabular-nums',
};

// Cores das séries: barras dos cards e marcadores dos blocos da linha.
// Tokens existentes, validados como paleta categórica (faixa de
// luminosidade, croma, separação p/ daltonismo, contraste com a superfície).
const SERIES = {
    matched: color.teal,
    onlyManual: color.amber,
    onlyAI: color.info, // azul — não conflita com o roxo primário dos botões
    // Grupo "Different codes" (faltou e sobrou code na mesma resposta): ameixa
    // sólida. Validada com o validate_palette (dataviz) contra teal/âmbar/azul:
    // ΔE CVD 32.8 vs âmbar e 14.7 vs azul (alvo ≥ 8).
    different: color.plum,
} as const;

// -----------------------------------------------------------------------------

interface QualityCheckV2Props {
    isOpen: boolean;
    /** Pergunta escolhida para a amostra (null → FALLBACK_SAMPLE). */
    sampleQuestion: TrainingQuestion | null;
    /** "Update rules": codes com diferença nas respostas marcadas Manual. */
    onUpdateRules: (codesToRefine: string[]) => void;
    /** "Keep rules and continue": todas as respostas marcadas AI. */
    onKeepRules: () => void;
    onCancel: () => void;
}

function QualityCheckV2({
    isOpen,
    sampleQuestion,
    onUpdateRules,
    onKeepRules,
    onCancel,
}: QualityCheckV2Props) {
    const [view, setView] = useState<View>('response');
    const [codeFilter, setCodeFilter] = useState<string>('');
    // Decisão por resposta. Ausente = Manual (default).
    const [decisions, setDecisions] = useState<Record<string, Decision>>({});
    const resultsRef = useRef<HTMLDivElement>(null);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const decisionOf = (id: string): Decision => decisions[id] ?? 'manual';
    const manualRows = DIFFS.filter((r) => decisionOf(r.id) === 'manual');
    const aiCount = DIFFS.length - manualRows.length;
    const allAI = manualRows.length === 0;

    const visibleRows = DIFFS.filter((r) => !codeFilter || r.onlyManual.includes(codeFilter) || r.onlyAI.includes(codeFilter));

    const footerNote = allAI
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

    // By code → By response filtrado pelo code.
    const viewResponsesFor = (code: string) => {
        setView('response');
        setCodeFilter(code);
        resultsRef.current?.scrollIntoView({ block: 'start' });
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
                // Mesmo posicionamento dos outros modais do fluxo (modal de regras
                // e QC V1): alinhado ao topo, 24px de respiro vertical.
                alignItems: 'flex-start',
                justifyContent: 'center',
                // Acima do modal de regras (2000).
                zIndex: 2100,
                padding: `${space.xl} 0`,
                overflow: 'auto',
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    // Mesma caixa do modal de regras e do QC V1
                    // (accountCodebookRulesModal.css / qualityCheckPanel.css):
                    // 85vw × calc(100vh - 110px). Altura fixa: filtros e expansões
                    // de linha nunca redimensionam o modal.
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

                {/* Body — área de rolagem; tudo rola junto (nada fixo no topo). */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ padding: space.xl, display: 'flex', flexDirection: 'column', gap: space.lg }}>
                        {/* Seção de resumo: título + subtítulo (mesmo padrão da
                            seção "Review the differences" abaixo) e o painel. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
                        <SectionHeading
                            title="Comparison results"
                            description="We ran AI Coder on 10% of the selected question responses and compared the results with manual coding, response by response."
                        />

                        {/* Painel de resumo (fundo cinza claro, cards brancos): a
                            pergunta da amostra funciona como título do bloco. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md, padding: space.lg, border: `1px solid ${color.border}`, borderRadius: radius.lg, backgroundColor: color.surfaceSubtle }}>
                            {/* 2. Amostra (só a pergunta e o nº de respostas) */}
                            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px' }}>
                                <span style={{ fontWeight: font.weight.semibold, color: color.textDark }}>{question}</span>
                                <span style={{ color: color.textMuted }}> · {TOTAL} responses</span>
                            </p>

                            {/* 3. Cards de resumo (KPI tiles): número em destaque +
                                visual. Cores com significado fixo em todo o modal:
                                matched = teal · only in manual = amber · only in AI =
                                azul (validadas p/ daltonismo). */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.md }}>
                                {/* Card 1 — taxa de concordância (barra) */}
                                <div style={card}>
                                    <span style={cardTitle}>Match rate</span>
                                    <div style={cardBody}>
                                        <span style={heroNumber}>{Math.round((MATCHED / TOTAL) * 100)}%</span>
                                        {/* Frase abaixo da barra (mesma posição das frases
                                            das barras do card ao lado). */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
                                            <ShareBar value={MATCHED} total={TOTAL} fill={SERIES.matched} label={`${MATCHED} of ${TOTAL} responses matched`} />
                                            <span style={{ fontSize: font.size.sm, color: color.textMuted, lineHeight: '18px' }}>
                                                AI coder matched the manual coding on{' '}
                                                <strong style={{ fontWeight: font.weight.semibold, color: color.textStrong }}>
                                                    {MATCHED} of {TOTAL}
                                                </strong>{' '}
                                                responses
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2 — respostas com diferença + tipo de diferença.
                                    Duas barras independentes (base = respostas com
                                    diferença): uma resposta pode ter os dois tipos. Batem
                                    com o filtro "Show: Only in manual / Only in AI". */}
                                <div style={card}>
                                    <span style={cardTitle}>Responses with differences</span>
                                    <div style={cardBody}>
                                        <span style={{ display: 'flex', alignItems: 'baseline', gap: space.sm }}>
                                            <span style={heroNumber}>{DIFFS.length}</span>
                                            <span style={{ fontSize: font.size.md, color: color.textMuted }}>of {TOTAL}</span>
                                        </span>
                                        {/* Uma barra só, dividida em grupos exclusivos das
                                            respostas com diferença, com legenda abaixo. */}
                                        <SegmentedBar
                                            total={DIFFS.length}
                                            segments={[
                                                { label: 'AI missed codes', value: RESP_ONLY_MISSED, fill: SERIES.onlyManual },
                                                { label: 'Different codes', value: RESP_BOTH, fill: SERIES.different },
                                                { label: 'AI added codes', value: RESP_ONLY_ADDED, fill: SERIES.onlyAI },
                                            ]}
                                        />
                                    </div>
                                </div>                            </div>
                        </div>
                        </div>

                        {/* 4. Resultados: toolbar + lista de cards (sem moldura
                            própria — cada resposta é um card, como no QC V1). */}
                        <div ref={resultsRef} style={{ scrollMarginTop: 0, marginTop: space.sm }}>
                            {/* Título da seção de revisão: separa "o que aconteceu"
                                (resumo) de "o que fazer" (lista). Mesmo texto nas duas
                                visões (By response / By code). */}
                            <SectionHeading
                                title="Review the differences"
                                description="Choose which coding is correct for each response. Responses marked as Manual will be used to update the code rules for AI Coder."
                            />

                            {/* Toolbar */}
                            <div
                                style={{
                                    // Esquerda: views. Direita: filtro de Code.
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: space.md,
                                    padding: `${space.lg} 0 0`,
                                    backgroundColor: color.surface,
                                }}
                            >
                                <Segmented<View>
                                    label="Results view"
                                    value={view}
                                    onChange={setView}
                                    options={[
                                        { value: 'response', label: `By response (${DIFFS.length})` },
                                        { value: 'code', label: `By code (${CODE_STATS.length})` },
                                    ]}
                                />
                                {view === 'response' && (
                                    <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.md, color: color.textSubtle }}>
                                        <span aria-hidden="true">Code</span>
                                        {/* Mesmo SelectField do seletor de amostra; label inline. */}
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
                                )}
                            </div>

                            {/* Conteúdo */}
                            {view === 'response' ? (
                                visibleRows.length === 0 ? (
                                    <div style={{ padding: space.xl, textAlign: 'center', fontSize: font.size.md, color: color.textMuted }}>
                                        No responses match this code.
                                    </div>
                                ) : (
                                    // Lista num painel cinza claro (mesmo tratamento do
                                    // painel de resumo): os cards brancos se destacam.
                                    <ul style={{ listStyle: 'none', margin: `${space.md} 0 0`, padding: space.lg, display: 'flex', flexDirection: 'column', gap: space.sm, border: `1px solid ${color.border}`, borderRadius: radius.lg, backgroundColor: color.surfaceSubtle }}>
                                        {visibleRows.map((r) => (
                                            <ResponseRow
                                                key={r.id}
                                                item={r}
                                                decision={decisionOf(r.id)}
                                                onDecide={(d) => setDecisions((prev) => ({ ...prev, [r.id]: d }))}
                                            />
                                        ))}
                                    </ul>
                                )
                            ) : (
                                <div style={{ marginTop: space.md, border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.surface }}>
                                    <CodeTable stats={CODE_STATS} onViewResponses={viewResponsesFor} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer (fixo) */}
                <div style={{ flexShrink: 0, padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.lg, backgroundColor: color.surface }}>
                    <span style={{ fontSize: font.size.md, color: color.textMuted, lineHeight: '20px' }}>{footerNote}</span>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: space.sm }}>
                        {/* Cancel fecha o QC e volta ao codebook, sem mudanças. */}
                        <ModalButton variant="tertiary" onClick={onCancel}>Cancel</ModalButton>
                        <ModalButton variant="primary" onClick={handlePrimary}>
                            {allAI ? 'Keep rules and continue' : 'Update rules'}
                        </ModalButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Segmented control -------------------------------------------------------------

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
                            fontSize: font.size.smd,
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

// Visuais dos cards de resumo ----------------------------------------------------

// Barra de proporção (value / total) sobre trilho neutro. Série única: sem
// legenda, o texto ao redor nomeia o valor. Usada nos dois cards.
function ShareBar({ value, total, fill, label }: { value: number; total: number; fill: string; label: string }) {
    const share = total > 0 ? value / total : 0;
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={value}
            aria-label={label}
            title={label}
            style={{ height: '10px', borderRadius: '4px', backgroundColor: color.tabTrack, overflow: 'hidden' }}
        >
            <div style={{ width: `${share * 100}%`, height: '100%', borderRadius: '4px', backgroundColor: fill }} />
        </div>
    );
}

// Barra do card de diferenças: uma barra dividida em grupos exclusivos (2px de
// respiro entre segmentos, mesma altura/raio da ShareBar) e legenda de uma
// linha abaixo, com as contagens em tinta de texto.
function SegmentedBar({ total, segments }: { total: number; segments: { label: string; value: number; fill: string }[] }) {
    const visible = segments.filter((s) => s.value > 0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
            <div
                role="img"
                aria-label={segments.map((s) => `${s.label}: ${s.value} of ${total} responses with differences`).join(', ')}
                style={{ display: 'flex', gap: '2px', height: '10px' }}
            >
                {visible.map((s) => (
                    <span
                        key={s.label}
                        title={`${s.label}: ${s.value} of ${total} responses with differences`}
                        style={{ flex: `${s.value} 0 0`, minWidth: '4px', borderRadius: '4px', background: s.fill }}
                    />
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: space.md, rowGap: '2px' }}>
                {segments.map((s) => (
                    <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: font.size.sm, color: color.textMuted, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                        <SeriesSwatch fill={s.fill} />
                        {s.label}
                        <strong style={{ fontWeight: font.weight.semibold, color: color.textStrong, fontVariantNumeric: 'tabular-nums' }}>{s.value}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
}

// Badge do tipo de diferença no cabeçalho do card da resposta. Mesmo estilo da
// Tag de status do RecreateCodebookModal (borda e dot na cor da série, fundo
// em tom claro, raio de 8px, 24px de altura), com tipografia mais leve: 12px
// medium em vez de 14px semibold.
function DiffBadge({ fill, tint, children }: { fill: string; tint: string; children: ReactNode }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: space.sm,
                height: '24px',
                padding: '4px 10px',
                boxSizing: 'border-box',
                borderRadius: radius.lg,
                border: `1px solid ${fill}`,
                backgroundColor: tint,
                fontSize: font.size.sm,
                fontWeight: font.weight.medium,
                lineHeight: '16px',
                letterSpacing: '0.24px',
                color: color.textDark,
                whiteSpace: 'nowrap',
            }}
        >
            <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: radius.full, backgroundColor: fill, flexShrink: 0 }} />
            {children}
        </span>
    );
}

// Decisão por resposta ("Manual | AI"): toggle de duas metades iguais numa
// caixa com borda e divisória vertical. Selecionado = fundo roxo claro e texto
// roxo semibold; o outro = branco com texto cinza-azulado. Visual próprio,
// diferente do Segmented dos filtros/abas. A borda fica só no container (as
// metades não têm borda própria), então o overflow:hidden só arredonda o
// fundo da metade selecionada — nada é cortado.
function DecisionToggle({ label, value, onChange }: { label: string; value: Decision; onChange: (d: Decision) => void }) {
    const options: { value: Decision; label: string }[] = [
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
                            minWidth: '80px',
                            height: '32px',
                            padding: `0 ${space.lg}`,
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

function SeriesSwatch({ fill }: { fill: string }) {
    // Círculo, mesmo conceito do dot das tags (DiffBadge).
    return <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: radius.full, background: fill, flexShrink: 0 }} />;
}

// Chips -----------------------------------------------------------------------

type ChipKind = 'onlyManual' | 'onlyAI' | 'both';

// Mesmo visual do chip de code do QC V1 (.qc-code-chip em
// qualityCheckPanel.css), reproduzido aqui para não acoplar ao CSS da V1:
// só o texto, fundo branco, borda cinza sem a lateral esquerda e uma barra
// roxa de 3px à esquerda. Mesmo estilo nos três grupos — o bloco onde o chip
// está já diz se é "only in manual", "only in AI" ou "in both".
function Chip({ code }: { code: string }) {
    return (
        <span
            title={code}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                maxWidth: '260px',
                padding: '4px 10px',
                backgroundColor: color.surface,
                border: `1px solid ${color.borderInput}`,
                borderLeft: 'none',
                borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
                fontSize: font.size.sm,
                fontWeight: font.weight.medium,
                lineHeight: '18px',
                color: color.textDark,
            }}
        >
            <span
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '3px', backgroundColor: color.codeChipAccent, borderRadius: `${radius.sm} 0 0 ${radius.sm}` }}
            />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code}</span>
        </span>
    );
}

function ChipList({ children }: { children: ReactNode }) {
    return <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>{children}</div>;
}

// Linha da visão By response ------------------------------------------------------

function ResponseRow({
    item,
    decision,
    onDecide,
}: {
    item: QcDerivedResponse;
    decision: Decision;
    onDecide: (d: Decision) => void;
}) {
    const [showBoth, setShowBoth] = useState(false);

    const block = (title: string, codes: string[], kind: ChipKind, emptyLabel: string) => (
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.sm, padding: space.md, border: `1px solid ${color.border}`, borderRadius: radius.lg, backgroundColor: color.surface }}>
            <span style={{ ...eyebrow, color: color.textSubtle, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SeriesSwatch fill={kind === 'onlyManual' ? SERIES.onlyManual : SERIES.onlyAI} />
                {title}
            </span>
            {codes.length > 0 ? (
                <ChipList>{codes.map((c) => <Chip key={c} code={c} />)}</ChipList>
            ) : (
                <span style={{ fontSize: font.size.smd, color: color.textFaint, lineHeight: '24px' }}>{emptyLabel}</span>
            )}
        </div>
    );

    return (
        <li
            style={{
                // Card da resposta — mesma caixa do card do QC V1 (.qc-item):
                // borda, raio de 8px e padding 12px 14px.
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '12px 14px',
                border: `1px solid ${color.borderCard}`,
                borderRadius: radius.lg,
                // O card não muda de estilo com a decisão (Manual ou AI).
                backgroundColor: color.surface,
            }}
        >
            {/* Header da linha */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: space.md }}>
                {/* Resumo da diferença em badges — mesmas cores e termos do
                    card "Responses with differences". */}
                <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: space.xs }}>
                    {item.onlyManual.length > 0 && (
                        <DiffBadge fill={SERIES.onlyManual} tint={color.amberSoft}>
                            AI missed {plural(item.onlyManual.length, 'code', 'codes')}
                        </DiffBadge>
                    )}
                    {item.onlyAI.length > 0 && (
                        <DiffBadge fill={SERIES.onlyAI} tint={color.infoSoft}>
                            AI added {plural(item.onlyAI.length, 'code', 'codes')}
                        </DiffBadge>
                    )}
                </span>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: space.sm }}>
                    <span style={{ fontSize: font.size.md, color: color.textSubtle }}>Which coding is correct?</span>
                    <DecisionToggle
                        label={`Which coding is correct for ${item.id}?`}
                        value={decision}
                        onChange={onDecide}
                    />
                </span>
            </div>

            <ResponseText text={item.text} />

            {/* Diferenças */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: space.md }}>
                {block('Only in manual coding', item.onlyManual, 'onlyManual', 'None')}
                {block('Only in AI coding', item.onlyAI, 'onlyAI', item.aiCodes.length === 0 ? 'AI applied no codes' : 'None')}
            </div>


            {/* Codes nos dois lados (colapsado) */}
            {item.inBoth.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, alignItems: 'flex-start' }}>
                    <button type="button" style={linkButton} aria-expanded={showBoth} onClick={() => setShowBoth((v) => !v)}>
                        {showBoth ? 'Hide' : 'Show'} {plural(item.inBoth.length, 'code', 'codes')} in both
                    </button>
                    {showBoth && <ChipList>{item.inBoth.map((c) => <Chip key={c} code={c} />)}</ChipList>}
                </div>
            )}
        </li>
    );
}

// Título + subtítulo das seções do corpo (Comparison results / Review the differences).
function SectionHeading({ title, description }: { title: string; description: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold, lineHeight: '24px', color: color.textDark }}>
                {title}
            </h3>
            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px', color: color.textDark }}>
                {description}
            </p>
        </div>
    );
}

// Texto da resposta: 3 linhas + "Show full response" só quando transborda.
function ResponseText({ text }: { text: string }) {
    const ref = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);

    useLayoutEffect(() => {
        if (expanded) return;
        const el = ref.current;
        if (!el) return;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [expanded, text]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs, alignItems: 'flex-start' }}>
            <p
                ref={ref}
                // Mesmo estilo do texto de resposta do QC V1 (.qc-answer-text):
                // 14px / 21px, regular, cor de verbatim.
                style={{
                    margin: 0,
                    fontSize: font.size.md,
                    lineHeight: '21px',
                    fontWeight: font.weight.regular,
                    color: color.textVerbatim,
                    ...(expanded
                        ? null
                        : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                }}
            >
                {text}
            </p>
            {(overflows || expanded) && (
                <button type="button" style={linkButton} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Show less' : 'Show full response'}
                </button>
            )}
        </div>
    );
}

// Tabela da visão By code (diagnóstico, sem ações em lote) -------------------------

// Mesmo modelo de data grid da lista de estudos do RecreateCodebookModal:
// header cinza em caixa alta, linhas de 35px, linhas de grade verticais e
// horizontais, texto textDark. Sem as colunas de expander e checkbox.
type CodeSortKey = 'code' | 'onlyManual' | 'onlyAI' | 'total';

function CodeTable({ stats, onViewResponses }: { stats: CodeStat[]; onViewResponses: (code: string) => void }) {
    // "View responses" só aparece no hover (ou foco por teclado) da linha — mesmo
    // padrão da coluna de ações da tabela Coder. Fica com opacity 0 (e não
    // visibility) para continuar alcançável via Tab.
    const [activeCode, setActiveCode] = useState<string | null>(null);
    // Sem sort ativo, mantém a ordem padrão (total de diferenças desc). Clicar
    // alterna asc/desc — mesmo comportamento da tabela de estudos do Recreate.
    const [sort, setSort] = useState<{ key: CodeSortKey; dir: SortDir } | null>(null);
    const toggleSort = (key: CodeSortKey) => {
        setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
    };
    const sortedStats = sort
        ? [...stats].sort((a, b) => {
            const sign = sort.dir === 'asc' ? 1 : -1;
            const diff = sort.key === 'code' ? a.code.localeCompare(b.code) : a[sort.key] - b[sort.key];
            return sign * diff || a.code.localeCompare(b.code);
        })
        : stats;
    const header = (label: string, key: CodeSortKey, align: 'left' | 'right' = 'right') => (
        <span role="columnheader" aria-sort={sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ display: 'flex', minWidth: 0 }}>
            <SortHeader label={label} align={align} borderRight active={sort?.key === key} dir={sort?.key === key ? sort.dir : 'asc'} onClick={() => toggleSort(key)} />
        </span>
    );

    // Code limitado a 440px; o espaço restante vai para as colunas numéricas.
    // Mínimos das colunas numéricas = largura do título sem truncar.
    const gridCols = 'minmax(0, 440px) minmax(135px, 1fr) minmax(220px, 1fr) minmax(190px, 1fr) 150px'; // Code · Differences · Only manual · Only AI · Actions
    const gridLine = `1px solid ${color.border}`;
    const rowMinHeight = '35px';

    const row: CSSProperties = { display: 'grid', gridTemplateColumns: gridCols, alignItems: 'stretch', minHeight: rowMinHeight };
    const th = (align: 'left' | 'right', last = false): CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        minWidth: 0,
        padding: '8px 12px',
        borderRight: last ? undefined : gridLine,
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: color.textDark,
        whiteSpace: 'nowrap',
    });
    const td = (align: 'left' | 'right', last = false): CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        minWidth: 0,
        padding: `${space.sm} ${space.md}`,
        borderRight: last ? undefined : gridLine,
        fontSize: font.size.md,
        color: color.textDark,
        fontVariantNumeric: 'tabular-nums',
    });
    const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

    return (
        <div role="table" aria-label="Differences by code">
            <div role="row" style={{ ...row, backgroundColor: color.surfaceSubtle, borderBottom: gridLine }}>
                {header('Code', 'code', 'left')}
                {header('Differences', 'total')}
                {header('Only in manual coding', 'onlyManual')}
                {header('Only in AI coding', 'onlyAI')}
                <span role="columnheader" style={th('left', true)}>
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Actions</span>
                </span>
            </div>
            {sortedStats.map((s, i) => (
                <div
                    key={s.code}
                    role="row"
                    style={{ ...row, backgroundColor: color.surface, borderBottom: i === sortedStats.length - 1 ? undefined : gridLine }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; setActiveCode(s.code); }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = color.surface; setActiveCode((c) => (c === s.code ? null : c)); }}
                    onFocus={() => setActiveCode(s.code)}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActiveCode((c) => (c === s.code ? null : c)); }}
                >
                    <span role="cell" style={td('left')}><span title={s.code} style={ellipsis}>{s.code}</span></span>
                    <span role="cell" style={td('right')}>{s.total}</span>
                    <span role="cell" style={td('right')}>{s.onlyManual}</span>
                    <span role="cell" style={td('right')}>{s.onlyAI}</span>
                    <span role="cell" style={{ ...td('right', true), padding: `${space.xs} ${space.md}` }}>
                        <ModalButton
                            variant="tertiary"
                            onClick={() => onViewResponses(s.code)}
                            style={{ height: '28px', padding: `0 ${space.md}`, fontSize: font.size.smd, opacity: activeCode === s.code ? 1 : 0 }}
                        >
                            View responses
                        </ModalButton>
                    </span>
                </div>
            ))}
        </div>
    );
}

export default QualityCheckV2;

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Info, Minus, Plus, X } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import { SortHeader, type SortDir, type TrainingQuestion } from './RecreateCodebookModal';
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
//   - Manual vem selecionado por padrão em todas as respostas (feedback da
//     PM): o usuário só troca para AI nas exceções. Sem estado "não revisada".
//   - Mesma toolbar da V1: visões By response / By code (tabela por code,
//     copiada da V1) e filtro Code (só em By response).
//   - Uma rolagem só (a do modal): ao rolar, o título da revisão, a toolbar
//     e o cabeçalho da tabela ficam fixos (sticky) no topo.
//
// `codeColumns` escolhe como os codes aparecem na lista (switch do protótipo):
//   - 'diff'  (layout "V2"): uma coluna Differences com as tags −/+.
//   - 'split' (layout "V3"): três colunas — Matched in both · Only in manual
//     coding · Only in AI coding — com todos os codes da resposta, sem sinal
//     (a coluna já diz o tipo); a barra do chip segue roxa / âmbar / azul.
//   - 'stacked' (layout "V4"): os mesmos três grupos do split, mas abaixo do
//     texto da resposta, empilhados (rótulo à esquerda, chips ao lado). A
//     tabela fica só com Response · Correct coding.
//
// Só no split (V3), por feedback do design director:
//   - Summary: pergunta à esquerda (sem "Question:", amostra embaixo) e, à direita, 4 indicadores estilo
//     dashboard (número em cima, texto de apoio embaixo, 14px, divisórias
//     finas); sem espaço, o bloco de indicadores desce inteiro para a 2ª linha.
//   - A instrução da revisão sobe para o header do modal (sem o título
//     "Review the differences"; o
//     bloco sticky fica só com a toolbar).
//   - Menos espaço em volta do modal: 95vw × calc(100vh - 48px).
//
// Protótipo puramente visual: nada é persistido.
// -----------------------------------------------------------------------------

export type CodeColumns = 'diff' | 'split' | 'stacked';
type View = 'response' | 'code';

// Números da amostra (todos derivados dos dados) ------------------------------

const TOTAL = SAMPLE_RESPONSES.length;
const DIFFS = SAMPLE_RESPONSES.filter((r) => r.hasDifference);
const MATCHED = TOTAL - DIFFS.length;
const MISSED_CODES = DIFFS.reduce((n, r) => n + r.onlyManual.length, 0);
const ADDED_CODES = DIFFS.reduce((n, r) => n + r.onlyAI.length, 0);

interface CodeStat {
    code: string;
    matched: number;
    onlyManual: number;
    onlyAI: number;
    total: number;
}

// Codes envolvidos em alguma diferença, por total de diferenças (desc) — visão
// By code (mesmo cálculo da V1).
const CODE_STATS: CodeStat[] = (() => {
    const codes = Array.from(new Set(DIFFS.flatMap((r) => [...r.onlyManual, ...r.onlyAI])));
    return codes
        .map((code) => {
            const onlyManual = DIFFS.filter((r) => r.onlyManual.includes(code)).length;
            const onlyAI = DIFFS.filter((r) => r.onlyAI.includes(code)).length;
            // Matched in both (coluna da V3): respostas da amostra INTEIRA em que
            // manual e AI aplicaram o code — referência de acerto do code.
            const matched = SAMPLE_RESPONSES.filter((r) => r.inBoth.includes(code)).length;
            return { code, matched, onlyManual, onlyAI, total: onlyManual + onlyAI };
        })
        .sort((a, b) => b.total - a.total || a.code.localeCompare(b.code));
})();
// Mesmos codes em ordem alfabética (filtro Code).
const DIFF_CODES_ALPHA = CODE_STATS.map((s) => s.code).sort((a, b) => a.localeCompare(b));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Cores das diferenças (mesmas séries da V2): missed = âmbar, added = azul.
const DIFF = {
    missed: {
        fill: color.amber,
        tint: color.amberSoft,
        Icon: Minus,
        label: 'Missed by AI',
        // Termo da V4 (stacked) no summary e nas tooltips: "AI Coder" quando é
        // quem age.
        v4Label: 'Missed by AI Coder',
        sign: '−',
        // Chips: nome da coluna (leitor de tela) e tooltip curta, sem título.
        column: 'Only in manual coding',
        chipTooltip: "Manual coding applied this code, but AI Coder didn't.",
    },
    added: {
        fill: color.info,
        tint: color.infoSoft,
        Icon: Plus,
        label: 'Added by AI',
        v4Label: 'Added by AI Coder',
        sign: '+',
        column: 'Only in AI coding',
        chipTooltip: "AI Coder applied this code, but manual coding didn't.",
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

// Célula do cabeçalho da lista: texto centralizado na vertical (a célula
// estica na altura toda para a divisória vertical ir de ponta a ponta).
const headerCell: CSSProperties = { ...columnHeader, display: 'flex', alignItems: 'center', minWidth: 0 };

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

// Tabelas com cabeçalho sticky (By response e By code). A borda de cima e os
// cantos arredondados do topo são do CABEÇALHO, não do contorno: assim, quando
// o cabeçalho gruda sob a toolbar, a borda superior vai junto (se fosse do
// contorno, ela subiria com a rolagem e o cabeçalho ficaria "aberto").
//   - tableFrame: contorno sem borda superior (laterais + base arredondada).
//   - stickyHeaderShell: casca sticky com fundo branco, 1px além de cada lado
//     para cobrir as laterais do contorno; o fundo branco esconde as linhas
//     que passam atrás dos cantos arredondados do cabeçalho.
//   - headerFrame: borda completa + raio no topo do próprio cabeçalho.
const tableFrame: CSSProperties = {
    border: `1px solid ${color.border}`,
    borderTop: 'none',
    borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
    backgroundColor: color.surface,
};
const stickyHeaderShell = (top: number): CSSProperties => ({ position: 'sticky', top, zIndex: 1, margin: '0 -1px', backgroundColor: color.surface });
const headerFrame: CSSProperties = { border: `1px solid ${color.border}`, borderRadius: `${radius.lg} ${radius.lg} 0 0`, backgroundColor: color.surfaceSubtle };

// Colunas da lista (mesmas no cabeçalho e nas linhas para tudo alinhar):
//   diff  → resposta · diferenças · decisão
//   split → resposta · matched · only manual · only AI · decisão
//   stacked → resposta (com os grupos de codes abaixo) · decisão
// diff/split têm linhas divisórias verticais (mesmo padrão da tabela de
// estudos do RecreateCodebookModal): sem gap entre colunas; cada célula tem
// padding 8px 12px e borda à direita (ver gridCell). Stacked segue com gap.
const listColumns = (mode: CodeColumns): CSSProperties => {
    if (mode === 'split') return { display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(3, minmax(160px, 1fr)) 168px' };
    if (mode === 'stacked') return { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 168px', columnGap: space.xl };
    return { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 32%) 168px' };
};

const hasGridLines = (mode: CodeColumns) => mode !== 'stacked';

// Célula com divisória (diff/split): padding da tabela de estudos + borda à
// direita, exceto na última coluna. No stacked não aplica nada.
const gridCell = (mode: CodeColumns, last = false): CSSProperties =>
    hasGridLines(mode) ? { padding: '8px 12px', borderRight: last ? undefined : `1px solid ${color.border}` } : {};

// Grupos de codes, na ordem de exibição de cada modo. No stacked as
// diferenças vêm primeiro e "Matched in both" (contexto) fica por último.
type CodeGroup = 'Matched in both' | 'Only in manual coding' | 'Only in AI coding';
const CODE_GROUPS: CodeGroup[] = ['Matched in both', 'Only in manual coding', 'Only in AI coding'];
const STACKED_GROUPS: CodeGroup[] = ['Only in manual coding', 'Only in AI coding', 'Matched in both'];

// Instrução da revisão (acima da toolbar; no split, no header do modal).
const REVIEW_INSTRUCTION = "For each response below, choose which coding is correct. Keep Manual (default) to adjust AI Coder's rules to match it, or pick AI if AI Coder got it right.";

// Tooltip do ícone de info ao lado do título (V3): o que é o Quality Check e
// o que cada coluna da tabela mostra. O "como revisar" fica no subtítulo.
const QC_INFO_TOOLTIP =
    'The quality check measures how closely AI Coder matches your manual coding. It codes a sample of manually coded responses and shows how codes were applied across manual and AI coding, so you can see where they differ and decide which is correct.';

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
    /** Decisão por resposta (controlada pelo QualityCheckPrototype). Ausente = Manual (default). */
    decisions: Record<string, QcDecision>;
    onDecisionsChange: Dispatch<SetStateAction<Record<string, QcDecision>>>;
    /** Slot no header, à esquerda do X (switch de layout do protótipo). */
    headerExtra?: ReactNode;
    /** Como os codes aparecem na lista (ver comentário do topo). Default 'diff'. */
    codeColumns?: CodeColumns;
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
    codeColumns = 'diff',
}: QualityCheckV3Props) {
    const [view, setView] = useState<View>('response');
    const [codeFilter, setCodeFilter] = useState<string>('');
    // Altura do bloco sticky (título + toolbar) = `top` do cabeçalho sticky da tabela.
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarH, setToolbarH] = useState(0);

    useLayoutEffect(() => {
        if (!isOpen) return;
        const el = toolbarRef.current;
        if (!el) return;
        const measure = () => setToolbarH(el.offsetHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [isOpen]);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const stacked = codeColumns === 'stacked';
    const split = codeColumns === 'split';
    // Split (V3): títulos das colunas podem quebrar em 2 linhas quando falta
    // espaço (em vez de um invadir o outro); nas outras versões, uma linha só.
    const listHeaderCell: CSSProperties = split ? { ...headerCell, whiteSpace: 'normal' } : headerCell;
    const decisionOf = (id: string): QcDecision => decisions[id] ?? 'manual';
    const manualRows = DIFFS.filter((r) => decisionOf(r.id) === 'manual');
    const aiCount = DIFFS.length - manualRows.length;
    const allAI = manualRows.length === 0;

    const filteredRows = DIFFS.filter((r) => !codeFilter || r.onlyManual.includes(codeFilter) || r.onlyAI.includes(codeFilter));
    // Split (V3): ordem padrão da mais para a menos divergente (total de codes
    // só no manual + só na AI); empates mantêm a ordem da amostra (sort estável).
    const diffCount = (r: QcDerivedResponse) => r.onlyManual.length + r.onlyAI.length;
    const visibleRows = split ? [...filteredRows].sort((a, b) => diffCount(b) - diffCount(a)) : filteredRows;

    const question = sampleQuestion?.text ?? FALLBACK_SAMPLE.text;

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
                // Split (V3): 'safe center' — com o modal mais largo que a tela
                // (minWidth), o overlay rola na horizontal sem cortar a esquerda.
                justifyContent: split ? 'safe center' : 'center',
                zIndex: 2100,
                padding: `${space.xl} 0`,
                overflow: 'auto',
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    // Mesma caixa da V2: 85vw × calc(100vh - 110px). No split
                    // (V3), menos respiro: 95vw × calc(100vh - 48px) — os 48px
                    // são o padding vertical do overlay (24px em cima e embaixo).
                    width: split ? '95vw' : '85vw',
                    maxWidth: split ? '95vw' : '85vw',
                    // Split (V3): não encolhe abaixo de 1024px — abaixo disso a
                    // tabela espremeria as colunas; o overlay rola na horizontal.
                    minWidth: split ? '1024px' : undefined,
                    margin: split ? 0 : '0.5rem',
                    height: split ? 'calc(100vh - 48px)' : 'calc(100vh - 110px)',
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
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xs }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>
                            Quality check
                            {/* Split (V3): ícone de info com a explicação da feature
                                (tooltip nativa, mesmo padrão do protótipo). */}
                            {split && (
                                <span
                                    role="img"
                                    tabIndex={0}
                                    aria-label={QC_INFO_TOOLTIP}
                                    title={QC_INFO_TOOLTIP}
                                    style={{ display: 'inline-flex', color: color.textDark, cursor: 'help' }}
                                >
                                    <Info size={18} />
                                </span>
                            )}
                        </span>
                        {/* Split (V3): a instrução da revisão fica no header. */}
                        {split && (
                            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px', color: color.textDark }}>
                                {REVIEW_INSTRUCTION}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: space.md, flexShrink: 0 }}>
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

                {/* Body — uma rolagem só (a do modal). Ao rolar, o título da
                    revisão, a toolbar (tabs + filtro Code) e o cabeçalho da
                    tabela ficam fixos no topo; só o resumo sai de cena. */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ padding: `${space.lg} ${space.xl} 0` }}>
                        {split ? (
                            /* Split (V3): pergunta à esquerda e resultados à direita,
                               numa linha. Se não couberem juntos, o bloco de resultados
                               desce INTEIRO para a 2ª linha (a quebra acontece antes
                               dele, não no meio). Só se nem a 2ª linha comportar o
                               bloco é que o 2º par (missed + added) quebra. A pergunta
                               ganha "…" apenas se nem sozinha couber (texto no hover). */
                            <section
                                aria-label="Comparison results"
                                style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    columnGap: space.xl,
                                    rowGap: space.sm,
                                    padding: `${space.md} ${space.lg}`,
                                    border: `1px solid ${color.border}`,
                                    borderRadius: radius.lg,
                                    backgroundColor: color.surfaceSubtle,
                                }}
                            >
                                {/* Pergunta no mesmo padrão dos indicadores: texto
                                    principal em cima (com "…" se não couber; completo no
                                    hover) e a amostra como texto de apoio embaixo. */}
                                <div style={{ flex: '9999 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', fontSize: font.size.md, lineHeight: '20px' }}>
                                    <span
                                        title={question}
                                        style={{ fontWeight: font.weight.medium, color: color.textDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {question}
                                    </span>
                                    <span style={{ color: color.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {TOTAL} responses sampled (10%)
                                    </span>
                                </div>

                                <div
                                    style={{
                                        // Cresce só quando está sozinho na 2ª linha (aí os indicadores se
                                        // distribuem pela largura toda). Na mesma linha da pergunta, ela
                                        // leva o espaço livre (flex-grow 9999) e os indicadores mantêm a
                                        // largura natural, à direita.
                                        flex: '1 1 auto',
                                        minWidth: 0,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        columnGap: space.xl,
                                        rowGap: space.sm,
                                    }}
                                >
                                    {/* Indicadores estilo dashboard: número em cima, texto
                                        de apoio embaixo, divisória fina entre eles. */}
                                    <Kpi value={`${Math.round((MATCHED / TOTAL) * 100)}%`} label="Match rate" />
                                    <Kpi value={`${DIFFS.length} / ${TOTAL}`} label="Responses with differences" divider />
                                    <Kpi
                                        value={MISSED_CODES}
                                        label="Codes missed by AI Coder"
                                        kind="missed"
                                        divider
                                        title={tooltip(DIFF.missed.v4Label, "Codes applied in manual coding that AI Coder didn't apply.")}
                                    />
                                    <Kpi
                                        value={ADDED_CODES}
                                        label="Codes added by AI Coder"
                                        kind="added"
                                        divider
                                        title={tooltip(DIFF.added.v4Label, "Codes AI Coder applied that manual coding didn't.")}
                                    />
                                </div>
                            </section>
                        ) : (
                        /* Summary compacto: uma faixa, sem cards aninhados. */
                        <section
                            aria-label="Comparison results"
                            style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: space.md, padding: `${space.md} ${space.lg}`, border: `1px solid ${color.border}`, borderRadius: radius.lg, backgroundColor: color.surfaceSubtle }}
                        >
                            <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px' }}>
                                <span style={{ color: color.textMuted }}>Question: </span>
                                <span style={{ fontWeight: font.weight.semibold, color: color.textDark }}>{question}</span>
                                <span style={{ color: color.textMuted }}> · {TOTAL} responses sampled (10%)</span>
                            </p>

                            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.sm }}>
                                <Stat value={`${Math.round((MATCHED / TOTAL) * 100)}%`} label="match rate" />
                                <Stat value={DIFFS.length} label={`of ${TOTAL} responses with differences`} />
                                {/* V4 (stacked): "codes missed/added by AI Coder" — número
                                    → o que se conta → verbo → autor; o verbo já implica
                                    a comparação com o manual. */}
                                <Stat
                                    value={MISSED_CODES}
                                    label={stacked ? 'codes missed by AI Coder' : 'manual codes missed by AI'}
                                    kind="missed"
                                    title={tooltip(stacked ? DIFF.missed.v4Label : DIFF.missed.label, "Codes applied in manual coding that AI Coder didn't apply.")}
                                />
                                <Stat
                                    value={ADDED_CODES}
                                    label={stacked ? 'codes added by AI Coder' : 'extra codes added by AI'}
                                    kind="added"
                                    title={tooltip(stacked ? DIFF.added.v4Label : DIFF.added.label, "Codes AI Coder applied that manual coding didn't.")}
                                />
                            </div>
                        </section>
                        )}
                    </div>

                        {/* Revisão */}
                        <section aria-label="Review the differences" style={{ padding: `0 ${space.xl} ${space.xl}`, display: 'flex', flexDirection: 'column' }}>
                            {/* Bloco sticky no topo do modal: título + subtítulo +
                                toolbar (mesma da V1: visões à esquerda, filtro Code à
                                direita, só em By response). A rolagem "trava" a
                                partir do título; a altura do bloco (toolbarH) é o
                                `top` do cabeçalho da tabela, que gruda logo abaixo.
                                No split (V3) o título/instrução estão no header do
                                modal, então o bloco fica só com a toolbar. */}
                            <div
                                ref={toolbarRef}
                                style={{ position: 'sticky', top: 0, zIndex: 2, padding: `${space.lg} 0 ${space.md}`, backgroundColor: color.surface }}
                            >
                            {!split && (
                                <>
                                    <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold, lineHeight: '24px', color: color.textDark }}>
                                        Review the differences
                                    </h3>
                                    {/* Instrução + ação de cada opção do toggle, num parágrafo só. */}
                                    <p style={{ margin: 0, fontSize: font.size.md, lineHeight: '20px', color: color.textDark }}>
                                        {REVIEW_INSTRUCTION}
                                    </p>
                                </>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: space.md, paddingTop: split ? 0 : space.lg }}>
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
                                    // Split (V3): filtro colado às abas (16px = gap 12 + 4), como
                                    // parte do grupo da visão; nas outras versões, à direita.
                                    <div style={{ marginLeft: split ? space.xs : 'auto', display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.md, color: color.textSubtle }}>
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
                                )}
                            </div>
                            </div>

                            {/* Tabelas sem overflow próprio (senão o sticky do
                                cabeçalho não funciona); o raio fica no cabeçalho. */}
                            {view === 'code' ? (
                                <div style={tableFrame}>
                                    <CodeTable stats={CODE_STATS} stickyTop={toolbarH} hoverable={split} striped={split} withMatched={split} />
                                </div>
                            ) : (
                            <div style={tableFrame}>
                                {/* Cabeçalho das colunas — sticky logo abaixo da toolbar,
                                    com a própria borda superior (ver tableFrame). */}
                                <div style={stickyHeaderShell(toolbarH)}>
                                <div
                                    role="row"
                                    style={{
                                        ...listColumns(codeColumns),
                                        ...headerFrame,
                                        // Altura de 35px, igual ao header da tabela de estudos.
                                        alignItems: hasGridLines(codeColumns) ? 'stretch' : 'center',
                                        minHeight: '35px',
                                        padding: hasGridLines(codeColumns) ? 0 : `0 ${space.lg}`,
                                    }}
                                >
                                    {/* No stacked a linha traz a resposta e os grupos de codes. */}
                                    <span role="columnheader" style={{ ...listHeaderCell, ...gridCell(codeColumns) }}>
                                        {codeColumns === 'stacked' ? 'Response and codes' : 'Response'}
                                    </span>
                                    {codeColumns === 'split' &&
                                        CODE_GROUPS.map((g) => <span key={g} role="columnheader" style={{ ...listHeaderCell, ...gridCell(codeColumns) }}>{g}</span>)}
                                    {codeColumns === 'diff' && <span role="columnheader" style={{ ...listHeaderCell, ...gridCell(codeColumns) }}>Differences</span>}
                                    <span role="columnheader" style={{ ...listHeaderCell, justifyContent: 'flex-end', ...gridCell(codeColumns, true) }}>Correct coding</span>
                                </div>
                                </div>

                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {visibleRows.length === 0 ? (
                                    <li style={{ padding: space.xl, textAlign: 'center', fontSize: font.size.md, color: color.textMuted }}>
                                        No responses match this code.
                                    </li>
                                ) : (
                                    visibleRows.map((r, i) => (
                                        <ReviewRow
                                            key={r.id}
                                            item={r}
                                            isLast={i === visibleRows.length - 1}
                                            codeColumns={codeColumns}
                                            striped={split && i % 2 === 1}
                                            decision={decisionOf(r.id)}
                                            onDecide={(d) => setDecisions((prev) => ({ ...prev, [r.id]: d }))}
                                        />
                                    ))
                                )}
                            </ul>
                            </div>
                            )}
                        </section>
                </div>

                {/* Footer (fixo) */}
                <div style={{ flexShrink: 0, padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.lg, backgroundColor: color.surface }}>
                    <span style={{ fontSize: font.size.md, color: color.textDark, lineHeight: '20px' }}>{footerNote}</span>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: space.sm }}>
                        <ModalButton variant="tertiary" onClick={onCancel}>Cancel</ModalButton>
                        <ModalButton variant="primary" onClick={handlePrimary}>
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
    return (
        <span title={title} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap', cursor: title ? 'help' : undefined }}>
            {kind && <DiffIcon kind={kind} />}
            <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark, lineHeight: '24px', fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </span>
            <span style={{ fontSize: font.size.md, color: color.textSecondary }}>{label}</span>
        </span>
    );
}

// Indicador do summary da V3 (estilo dashboard): número em cima (com o ícone
// −/+ ao lado, quando há `kind`) e texto de apoio embaixo. Mesmos tamanhos da
// linha da pergunta (14px). `divider`: linha fina à esquerda, separando-o do
// indicador anterior.
function Kpi({ value, label, kind, title, divider = false }: { value: ReactNode; label: string; kind?: DiffKind; title?: string; divider?: boolean }) {
    return (
        <span
            title={title}
            style={{
                // Partes iguais do espaço do bloco (nunca menores que o conteúdo).
                flex: '1 1 0',
                minWidth: 'max-content',
                boxSizing: 'border-box',
                display: 'inline-flex',
                flexDirection: 'column',
                whiteSpace: 'nowrap',
                paddingLeft: divider ? space.xl : 0,
                borderLeft: divider ? `1px solid ${color.borderInput}` : undefined,
                cursor: title ? 'help' : undefined,
            }}
        >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {kind && <DiffIcon kind={kind} />}
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: color.textDark, lineHeight: '20px', fontVariantNumeric: 'tabular-nums' }}>
                    {value}
                </span>
            </span>
            <span style={{ fontSize: font.size.md, lineHeight: '20px', color: color.textMuted }}>{label}</span>
        </span>
    );
}

// Sinal (−/+) das tags da lista como ícone num quadrado tingido.
function DiffIcon({ kind }: { kind: DiffKind }) {
    const d = DIFF[kind];
    return (
        <span
            aria-hidden="true"
            style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', marginRight: '2px', borderRadius: radius.sm, backgroundColor: d.tint, color: d.fill, flexShrink: 0 }}
        >
            <d.Icon size={14} weight="bold" />
        </span>
    );
}

// Toolbar ------------------------------------------------------------------------

// Segmented das visões (By response / By code) — mesmo visual do da V1, com
// texto em 14px (a V1 usa 13px, que o projeto não usa mais).
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

// Visão By code --------------------------------------------------------------------

// Tabela da visão By code — cópia da CodeTable da V1 (diagnóstico, sem
// ações): header cinza em caixa alta, linhas de 35px, grade vertical e
// horizontal e sort por coluna.
type CodeSortKey = 'code' | 'matched' | 'onlyManual' | 'onlyAI' | 'total';

// `hoverable` (V3): linha destacada em controlHover ao passar o mouse.
// `striped` (V3): zebra — linhas ímpares em surfaceMuted, como a By response.
// `withMatched` (V3): coluna Matched in both e ordem igual à By response
// (Code · Matched in both · Only in manual coding · Only in AI coding ·
// Differences, com Differences no fim como total).
function CodeTable({ stats, stickyTop, hoverable = false, striped = false, withMatched = false }: { stats: CodeStat[]; stickyTop: number; hoverable?: boolean; striped?: boolean; withMatched?: boolean }) {
    const [hoveredCode, setHoveredCode] = useState<string | null>(null);
    // Sem sort ativo, mantém a ordem padrão (total de diferenças desc).
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
    const header = (label: string, key: CodeSortKey, align: 'left' | 'right' = 'right', last = false) => (
        <span role="columnheader" aria-sort={sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ display: 'flex', minWidth: 0 }}>
            <SortHeader label={label} align={align} borderRight={!last} active={sort?.key === key} dir={sort?.key === key ? sort.dir : 'asc'} onClick={() => toggleSort(key)} />
        </span>
    );

    // Code · Differences · Only manual · Only AI
    // (withMatched: Code · Matched in both · Only manual · Only AI · Differences)
    const gridCols = withMatched
        ? 'minmax(0, 440px) minmax(170px, 1fr) minmax(220px, 1fr) minmax(190px, 1fr) minmax(135px, 1fr)'
        : 'minmax(0, 440px) minmax(135px, 1fr) minmax(220px, 1fr) minmax(190px, 1fr)';
    const gridLine = `1px solid ${color.border}`;
    const row: CSSProperties = { display: 'grid', gridTemplateColumns: gridCols, alignItems: 'stretch', minHeight: '35px' };
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

    return (
        <div role="table" aria-label="Differences by code">
            {/* Header sticky logo abaixo da toolbar (stickyTop), com a própria
                borda superior e raio no topo (ver tableFrame). */}
            <div style={stickyHeaderShell(stickyTop)}>
                <div role="row" style={{ ...row, ...headerFrame }}>
                    {header('Code', 'code', 'left')}
                    {withMatched ? (
                        <>
                            {header('Matched in both', 'matched')}
                            {header('Only in manual coding', 'onlyManual')}
                            {header('Only in AI coding', 'onlyAI')}
                            {header('Differences', 'total', 'right', true)}
                        </>
                    ) : (
                        <>
                            {header('Differences', 'total')}
                            {header('Only in manual coding', 'onlyManual')}
                            {header('Only in AI coding', 'onlyAI', 'right', true)}
                        </>
                    )}
                </div>
            </div>
            {sortedStats.map((s, i) => (
                <div
                    key={s.code}
                    role="row"
                    onMouseEnter={hoverable ? () => setHoveredCode(s.code) : undefined}
                    onMouseLeave={hoverable ? () => setHoveredCode((c) => (c === s.code ? null : c)) : undefined}
                    style={{
                        ...row,
                        backgroundColor: hoverable && hoveredCode === s.code ? color.controlHover : striped && i % 2 === 1 ? color.surfaceMuted : color.surface,
                        borderBottom: i === sortedStats.length - 1 ? undefined : gridLine,
                        // Última linha acompanha o raio do contorno (o fundo do hover
                        // não vaza nos cantos).
                        borderRadius: i === sortedStats.length - 1 ? `0 0 ${radius.lg} ${radius.lg}` : undefined,
                    }}
                >
                    <span role="cell" style={td('left')}><span title={s.code} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.code}</span></span>
                    {withMatched ? (
                        <>
                            <span role="cell" style={td('right')}>{s.matched}</span>
                            <span role="cell" style={td('right')}>{s.onlyManual}</span>
                            <span role="cell" style={td('right')}>{s.onlyAI}</span>
                            <span role="cell" style={td('right', true)}>{s.total}</span>
                        </>
                    ) : (
                        <>
                            <span role="cell" style={td('right')}>{s.total}</span>
                            <span role="cell" style={td('right')}>{s.onlyManual}</span>
                            <span role="cell" style={td('right', true)}>{s.onlyAI}</span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

// Linha da lista -----------------------------------------------------------------

function ReviewRow({
    item,
    isLast,
    codeColumns,
    striped = false,
    decision,
    onDecide,
}: {
    item: QcDerivedResponse;
    isLast: boolean;
    codeColumns: CodeColumns;
    /** Zebra (V3): linha ímpar com fundo surfaceMuted, como a tabela do Coder. */
    striped?: boolean;
    decision: QcDecision;
    onDecide: (d: QcDecision) => void;
}) {
    const diff = codeColumns === 'diff';
    // Split (V3) e stacked (V4): resposta sempre completa, sem clamp nem
    // "Show more". Só o diff (V2) mantém o clamp de 2 linhas.
    const fullText = codeColumns === 'split' || codeColumns === 'stacked';
    // Células do corpo: padding da tabela (gridCell); no split (V3), 12px no topo.
    const bodyCell = (last = false): CSSProperties => ({
        ...gridCell(codeColumns, last),
        ...(codeColumns === 'split' ? { paddingTop: '12px' } : null),
    });
    const textRef = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const hovered = codeColumns === 'split' && isHovered;
    const [overflows, setOverflows] = useState(false);

    // "Show more" só quando o texto passa de 2 linhas ou, no modo diff, há
    // codes em comum (que aparecem só expandido; no split/stacked têm grupo
    // próprio).
    useLayoutEffect(() => {
        if (expanded || fullText) return;
        const el = textRef.current;
        if (!el) return;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [expanded, fullText, item.text]);

    const canExpand = !fullText && (expanded || overflows || (diff && item.inBoth.length > 0));

    const noAICodes = item.aiCodes.length === 0 && (
        <span
            title={tooltip('AI applied no codes', "AI Coder didn't apply any code to this response.")}
            style={{ fontSize: font.size.md, lineHeight: '30px', color: color.textMuted, cursor: 'help' }}
        >
            AI applied no codes
        </span>
    );

    // Conteúdo dos três grupos (split e stacked): todos os codes da resposta,
    // sem sinal (o grupo já diz o tipo).
    const groupContents: Record<CodeGroup, ReactNode> = {
        'Matched in both': item.inBoth.length > 0 ? item.inBoth.map((c) => <MatchedChip key={c} code={c} />) : <EmptyCell />,
        'Only in manual coding': item.onlyManual.length > 0 ? item.onlyManual.map((c) => <DiffChip key={c} kind="missed" code={c} showSign={false} />) : <EmptyCell />,
        'Only in AI coding': item.onlyAI.length > 0 ? item.onlyAI.map((c) => <DiffChip key={c} kind="added" code={c} showSign={false} />) : noAICodes || <EmptyCell />,
    };

    return (
        <li
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                ...listColumns(codeColumns),
                // diff/split: células esticam na altura toda (divisória de ponta
                // a ponta) e o padding fica em cada célula (gridCell).
                alignItems: hasGridLines(codeColumns) ? 'stretch' : 'start',
                padding: hasGridLines(codeColumns) ? 0 : space.lg,
                borderBottom: isLast ? undefined : `1px solid ${color.border}`,
                // Split (V3): hover em controlHover (mesmo das outras tabelas),
                // um tom acima da zebra; a linha em si não é clicável.
                backgroundColor: hovered ? color.controlHover : striped ? color.surfaceMuted : undefined,
                // A lista não corta o overflow (sticky): a última linha acompanha
                // o raio do container para o fundo zebrado não vazar nos cantos.
                borderRadius: isLast ? `0 0 ${radius.lg} ${radius.lg}` : undefined,
            }}
        >
            {/* Resposta: 2 linhas + "Show more" (no split/stacked, sempre completa). */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xs, alignItems: 'flex-start', ...bodyCell() }}>
                <p
                    ref={textRef}
                    style={{
                        margin: 0,
                        fontSize: font.size.md,
                        lineHeight: '21px',
                        color: color.textVerbatim,
                        ...(expanded || fullText ? null : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                    }}
                >
                    {item.text}
                </p>
                {diff && expanded && item.inBoth.length > 0 && (
                    // Codes em comum (só expandido): rótulo em cima, tags embaixo.
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
                        <span style={{ fontSize: font.size.md, lineHeight: '20px', color: color.textMuted }}>Matched in both:</span>
                        <ChipCell>{item.inBoth.map((c) => <MatchedChip key={c} code={c} />)}</ChipCell>
                    </div>
                )}
                {canExpand && (
                    <button type="button" style={linkButton} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
                        {expanded ? 'Show less' : 'Show more'}
                    </button>
                )}

                {/* Stacked: os três grupos abaixo do texto, rótulo numa coluna
                    fixa à esquerda (alinhado entre respostas) e chips ao lado. */}
                {codeColumns === 'stacked' && (
                    <div
                        style={{
                            alignSelf: 'stretch',
                            display: 'grid',
                            gridTemplateColumns: '184px minmax(0, 1fr)',
                            columnGap: space.md,
                            rowGap: space.xs,
                            marginTop: space.sm,
                        }}
                    >
                        {STACKED_GROUPS.map((g) => (
                            <Fragment key={g}>
                                <span style={{ ...columnHeader, lineHeight: '30px', fontWeight: font.weight.medium, color: color.textDark }}>{g}</span>
                                <ChipCell>{groupContents[g]}</ChipCell>
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>

            {codeColumns === 'split' && CODE_GROUPS.map((g) => <ChipCell key={g} style={bodyCell()}>{groupContents[g]}</ChipCell>)}

            {diff && (
                // Diferenças como diff: − missed / + added.
                <ChipCell style={gridCell(codeColumns)}>
                    {item.onlyManual.map((c) => <DiffChip key={`m-${c}`} kind="missed" code={c} />)}
                    {item.onlyAI.map((c) => <DiffChip key={`a-${c}`} kind="added" code={c} />)}
                    {noAICodes}
                </ChipCell>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', ...bodyCell(true) }}>
                <DecisionToggle label={`Correct coding for ${item.id}`} value={decision} onChange={onDecide} />
            </div>
        </li>
    );
}

// Chip de code — mesmo visual do Chip da V2 / Ascribe (fundo branco, borda
// cinza sem a lateral esquerda, barra de 3px à esquerda), copiado aqui para
// não acoplar a V3 à V2. Única variação: a cor da barra. O nome nunca é
// cortado: sem espaço, o chip quebra em mais linhas.
const codeChipStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'flex-start',
    maxWidth: '100%',
    padding: '4px 10px',
    backgroundColor: color.surface,
    border: `1px solid ${color.borderInput}`,
    borderLeft: 'none',
    borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    lineHeight: '20px',
    color: color.textDark,
};

const codeChipLabel: CSSProperties = { minWidth: 0, overflowWrap: 'anywhere' };

function CodeChipAccent({ fill }: { fill: string }) {
    return (
        <span
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '3px', backgroundColor: fill, borderRadius: `${radius.sm} 0 0 ${radius.sm}` }}
        />
    );
}

// Diferença na lista: chip de code com a barra na cor da série (âmbar =
// missed, azul = added) + sinal −/+ na mesma cor (reforço além da cor). No
// modo split o sinal sai (`showSign={false}`): a coluna já diz o tipo.
// Tooltip: uma frase curta, sem título, dizendo quem aplicou o code. O texto
// para leitor de tela usa o nome da coluna ("Only in manual coding: …").
function DiffChip({ kind, code, showSign = true }: { kind: DiffKind; code: string; showSign?: boolean }) {
    const d = DIFF[kind];
    return (
        <span title={d.chipTooltip} style={{ ...codeChipStyle, gap: '6px', cursor: 'help' }}>
            <CodeChipAccent fill={d.fill} />
            {showSign && <span aria-hidden="true" style={{ fontWeight: font.weight.semibold, color: d.fill }}>{d.sign}</span>}
            <span style={visuallyHidden}>{d.column}: </span>
            <span style={codeChipLabel}>{code}</span>
        </span>
    );
}

// Code aplicado pelos dois lados (split/stacked): chip padrão, barra roxa.
function MatchedChip({ code }: { code: string }) {
    return (
        <span
            title="Manual coding and AI Coder both applied this code."
            style={{ ...codeChipStyle, cursor: 'help' }}
        >
            <CodeChipAccent fill={color.codeChipAccent} />
            <span style={codeChipLabel}>{code}</span>
        </span>
    );
}

// alignContent: as linhas de chips ficam no topo mesmo quando a célula estica
// na altura da linha da tabela (modo com divisórias).
function ChipCell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    return <div style={{ minWidth: 0, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: space.xs, ...style }}>{children}</div>;
}

// Célula sem codes (modo split).
function EmptyCell() {
    return (
        <span aria-label="None" style={{ fontSize: font.size.md, lineHeight: '30px', color: color.textFaint }}>
            —
        </span>
    );
}

// Decisão ("Manual | AI"). Manual vem selecionado por padrão.
function DecisionToggle({ label, value, onChange }: { label: string; value: QcDecision; onChange: (d: QcDecision) => void }) {
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

import { useEffect, useState, type ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';
import './qualityCheckPanel.css';
import type { TrainingQuestion } from './RecreateCodebookModal';

// -----------------------------------------------------------------------------
// QualityCheckPanel — relatório de diferenças do "Quality Check" do fluxo de
// treino.
//
// Contexto: dentro do AccountCodebookRulesModal (o "Validator" de codes/regras
// da Account Codebooks) o usuário roda um Quality Check sobre uma pergunta que
// já foi codificada manualmente. Como no treino os codes são os MESMOS (só as
// regras são geradas), o QC é uma comparação automática: para cada resposta,
// os codes aplicados pelo humano vs. os aplicados pelo AI Coder seguindo as
// regras. Não há LLM-as-judge — é casamento direto de codes. Os nomes dos codes
// nunca diferem: a única diferença possível é ONDE um code foi aplicado.
//
// O resultado é um relatório de erros (não um nível de confiança): um resumo no
// topo e, abaixo, as diferenças para o usuário validar. "Apply decisions" só
// habilita com tudo decidido (exceto no Answer key, que refina por padrão) e
// devolve ao pai os codes cujas regras devem ser refeitas (aqueles em que a AI
// errou).
//
// PROTÓTIPO: quatro versões para teste, alternadas no header (removível quando
// uma for escolhida). Cada versão tem sua própria unidade de decisão:
//   - Columns / Table — por resposta: duas colunas (Human | AI) ou mini-tabela
//     code × Human/AI; "Who is right?" (humano → refina; AI → aceita).
//   - Per difference — cada diferença vira uma frase ("AI missed X" / "AI added
//     X") com "Does it apply?" Yes/No; o trecho do verbatim que justifica o
//     code fica destacado e os codes que os dois aplicaram têm linha própria.
//   - By code — diferenças agrupadas pelo code (a regra é por code): exemplos
//     de verbatim do grupo + "Refine rule" / "Keep rule".
//   - Lanes — por resposta: faixas Human / AI com os codes alinhados na mesma
//     coluna e um espaço vazio tracejado onde um lado não aplicou.
//   - Venn — por resposta: três colunas Human only | Both | AI only.
//   - Answer key — o humano é o gabarito: uma linha com a codificação da AI
//     corrigida (tracejado = faltou, riscado = sobrou). Refina por padrão; o
//     usuário só marca a exceção "AI is right".
//
// A aparência segue a convenção da família de modais de codes da Account
// Codebooks (accountCodebookRulesModal.css): raw rgb() + Figtree, para casar
// 1:1 com o modal onde ele é aberto, em vez de importar tokens.ts.
//
// Protótipo: dados mockados, sem backend nem chamada real de IA.
// -----------------------------------------------------------------------------

interface DiffItem {
    id: string;
    /** Verbatim da resposta na source data (mock). */
    answer: string;
    /** Codes aplicados pelo coder humano. */
    human: string[];
    /** Codes aplicados pelo AI Coder seguindo as regras treinadas. */
    ai: string[];
    /** Trecho do verbatim que justifica cada code com diferença (destaque). */
    evidence: Record<string, string>;
}

// Respostas com diferença entre a codificação humana e a da AI (mock). As
// diferenças são só de presença: a AI aplicou um code que o humano não aplicou,
// ou deixou de aplicar um que o humano aplicou. Todos os codes existem no
// CODEBOOK_ROWS do modal pai, então o refino tem um alvo real.
const DIFF_ITEMS: DiffItem[] = [
    {
        id: 'd1',
        answer: 'mostly ubereats, sometimes doordash',
        human: ['Uber Eats', 'DoorDash'],
        ai: ['Uber Eats'],
        evidence: { DoorDash: 'doordash' },
    },
    {
        id: 'd2',
        answer:
            'I do most of my weekly shopping at Walmart because it is the closest and cheapest, but for produce and specialty items I will drive out to Whole Foods or Trader Joe’s on the weekend. When I am too busy to go in person I order through Instacart, and honestly Amazon Fresh has been a lifesaver for the heavy stuff like water and paper towels. Once a month we still do a big bulk run at Costco for the whole family.',
        human: ['Walmart', 'Whole Foods', "Trader Joe's", 'Instacart', 'Amazon Fresh', 'Costco'],
        ai: ['Walmart', 'Whole Foods', "Trader Joe's", 'Amazon Fresh', 'Costco', 'Amazon'],
        evidence: { Instacart: 'Instacart', Amazon: 'Amazon' },
    },
    {
        id: 'd3',
        answer: 'I order food through Greetings',
        human: ['GrubHub'],
        ai: [],
        evidence: { GrubHub: 'Greetings' },
    },
    {
        id: 'd4',
        answer: 'Trader joes and whole foods on amazon',
        human: ["Trader Joe's", 'Whole Foods'],
        ai: ["Trader Joe's", 'Whole Foods', 'Amazon'],
        evidence: { Amazon: 'amazon' },
    },
    {
        id: 'd5',
        answer: 'just uber',
        human: ['Uber'],
        ai: ['Uber', 'Uber Eats'],
        evidence: { 'Uber Eats': 'uber' },
    },
    {
        id: 'd6',
        answer: 'Costco all the way, plus BJ’s for bulk',
        human: ['Costco', "BJ's"],
        ai: ['Costco'],
        evidence: { "BJ's": 'BJ’s' },
    },
    {
        id: 'd7',
        answer: 'sams club and aldi mostly',
        human: ["Sam's Club", 'Aldi'],
        ai: ['Aldi'],
        evidence: { "Sam's Club": 'sams club' },
    },
    {
        id: 'd8',
        answer: 'Target, and sometimes the dollar store down the street',
        human: ['Target'],
        ai: ['Target', 'Dollar Tree'],
        evidence: { 'Dollar Tree': 'dollar store' },
    },
    {
        id: 'd9',
        answer: 'prime delivery for almost everything',
        human: ['Amazon Prime'],
        ai: ['Amazon Prime', 'Amazon'],
        evidence: { Amazon: 'prime delivery' },
    },
    {
        id: 'd10',
        answer:
            'Kroger or Publix depending on which coupons are better that week, and GoPuff late at night when we run out of snacks.',
        human: ['Kroger', 'Publix', 'GoPuff'],
        ai: ['Kroger', 'Publix'],
        evidence: { GoPuff: 'GoPuff' },
    },
];

// OPEN: números reais do resumo (placeholder até a PM definir o relatório).
const TOTAL_COMPARED = 120;
const DIFFERENCE_COUNT = DIFF_ITEMS.length;
const MATCHED_COUNT = TOTAL_COMPARED - DIFFERENCE_COUNT;

// Todos os codes da resposta numa lista só (primeiro os do humano, na ordem
// dele, depois os que só a AI aplicou), com quem aplicou cada um.
const codesOf = (item: DiffItem) => [
    ...item.human.map((code) => ({ code, human: true, ai: item.ai.includes(code) })),
    ...item.ai.filter((code) => !item.human.includes(code)).map((code) => ({ code, human: false, ai: true })),
];

// Codes com diferença na resposta (aplicados só por um dos lados).
const diffCodesOf = (item: DiffItem) => codesOf(item).filter((c) => c.human !== c.ai).map((c) => c.code);

// Cada diferença isolada: "missed" = humano aplicou, AI não; "added" = AI
// aplicou, humano não.
type DiffKind = 'missed' | 'added';
interface Difference {
    key: string;
    item: DiffItem;
    code: string;
    kind: DiffKind;
}

const DIFFERENCES: Difference[] = DIFF_ITEMS.flatMap((item) =>
    codesOf(item)
        .filter((c) => c.human !== c.ai)
        .map((c) => ({ key: `${item.id}::${c.code}`, item, code: c.code, kind: (c.human ? 'missed' : 'added') as DiffKind })),
);

// Diferenças agrupadas por code (versão "By code"), dos grupos maiores para os
// menores.
const CODE_GROUPS: { code: string; diffs: Difference[] }[] = Array.from(
    DIFFERENCES.reduce((map, diff) => map.set(diff.code, [...(map.get(diff.code) ?? []), diff]), new Map<string, Difference[]>()),
    ([code, diffs]) => ({ code, diffs }),
).sort((a, b) => b.diffs.length - a.diffs.length || a.code.localeCompare(b.code));

// Destaca no verbatim os trechos que justificam os codes (case-insensitive;
// trechos sobrepostos são ignorados).
function highlight(text: string, phrases: string[]): ReactNode {
    const ranges = phrases
        .filter((p) => p.length > 0)
        .map((p) => {
            const start = text.toLowerCase().indexOf(p.toLowerCase());
            return start < 0 ? null : { start, end: start + p.length };
        })
        .filter((r): r is { start: number; end: number } => r !== null)
        .sort((a, b) => a.start - b.start)
        .filter((r, i, all) => i === 0 || r.start >= all[i - 1].end);
    const parts: ReactNode[] = [];
    let cursor = 0;
    ranges.forEach((r, i) => {
        if (r.start > cursor) parts.push(text.slice(cursor, r.start));
        parts.push(
            <mark key={i} className="qc-evidence">
                {text.slice(r.start, r.end)}
            </mark>,
        );
        cursor = r.end;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
}

// PROTÓTIPO: versão em teste.
type Layout = 'columns' | 'table' | 'delta' | 'byCode' | 'lanes' | 'venn' | 'answerKey';

// Versões que usam a decisão por resposta ("Who is right?").
const RESPONSE_LAYOUTS: Layout[] = ['columns', 'table', 'lanes', 'venn'];

interface QualityCheckPanelProps {
    isOpen: boolean;
    /** Pergunta usada como amostra (exibida no header). */
    sampleQuestion: TrainingQuestion | null;
    onCancel: () => void;
    /** Conclui a validação. Devolve os codes a refinar (aqueles em que a AI
     *  errou, conforme as decisões); vazio = nada a refinar. */
    onApply: (codesToRefine: string[]) => void;
}

function QualityCheckPanel({ isOpen, sampleQuestion, onCancel, onApply }: QualityCheckPanelProps) {
    // PROTÓTIPO: alterna entre as versões (removível).
    const [layout, setLayout] = useState<Layout>('columns');
    // Decisões de cada versão (unidades diferentes, estados independentes).
    // Columns/Table: quem acertou em cada resposta.
    const [responseDecisions, setResponseDecisions] = useState<Record<string, 'human' | 'ai'>>({});
    // Per difference: o code se aplica àquela resposta?
    const [deltaDecisions, setDeltaDecisions] = useState<Record<string, 'yes' | 'no'>>({});
    // By code: refazer ou manter a regra do code.
    const [codeDecisions, setCodeDecisions] = useState<Record<string, 'refine' | 'keep'>>({});
    // Answer key: respostas marcadas como exceção ("AI is right"). Todo o resto
    // é refinado por padrão.
    const [exceptions, setExceptions] = useState<Record<string, boolean>>({});

    // Cada abertura começa uma validação nova.
    useEffect(() => {
        if (isOpen) {
            setResponseDecisions({});
            setDeltaDecisions({});
            setCodeDecisions({});
            setExceptions({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Progresso e codes a refinar, conforme a versão ativa.
    let reviewed: number;
    let total: number;
    let codesToRefine: string[];
    if (layout === 'delta') {
        total = DIFFERENCES.length;
        reviewed = DIFFERENCES.filter((d) => deltaDecisions[d.key]).length;
        // A AI errou quando a resposta contraria o que ela fez: não aplicou mas
        // o code se aplica, ou aplicou mas o code não se aplica.
        codesToRefine = DIFFERENCES.filter((d) =>
            d.kind === 'missed' ? deltaDecisions[d.key] === 'yes' : deltaDecisions[d.key] === 'no',
        ).map((d) => d.code);
    } else if (layout === 'answerKey') {
        // Sem decisão obrigatória: o humano é o gabarito, então todos os erros
        // são refinados, exceto nas respostas marcadas "AI is right".
        total = 0;
        reviewed = 0;
        codesToRefine = DIFF_ITEMS.filter((item) => !exceptions[item.id]).flatMap(diffCodesOf);
    } else if (layout === 'byCode') {
        total = CODE_GROUPS.length;
        reviewed = CODE_GROUPS.filter((g) => codeDecisions[g.code]).length;
        codesToRefine = CODE_GROUPS.filter((g) => codeDecisions[g.code] === 'refine').map((g) => g.code);
    } else {
        total = DIFF_ITEMS.length;
        reviewed = DIFF_ITEMS.filter((item) => responseDecisions[item.id]).length;
        codesToRefine = DIFF_ITEMS.filter((item) => responseDecisions[item.id] === 'human').flatMap(diffCodesOf);
    }
    const progressUnit = layout === 'byCode' ? ' codes' : layout === 'delta' ? ' differences' : '';
    const refineCount = new Set(codesToRefine).size;

    return (
        <div
            className="quality-check-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Quality check"
            onMouseDown={onCancel}
        >
            <div className="qc-dialog" onMouseDown={(e) => e.stopPropagation()}>
                <div className="qc-content">
                    {/* Header */}
                    <div className="qc-header">
                        <div className="qc-header-titles">
                            <h4 className="qc-title">Quality check</h4>
                            {sampleQuestion && (
                                <p className="qc-subtitle">
                                    AI coding compared with the human coding on “{sampleQuestion.text}” (
                                    {sampleQuestion.studyName}).
                                </p>
                            )}
                        </div>
                        {/* PROTÓTIPO: comparação das versões (removível). */}
                        <div className="qc-layout-toggle" role="group" aria-label="Preview layout">
                            {(
                                [
                                    ['columns', 'Columns'],
                                    ['table', 'Table'],
                                    ['delta', 'Per difference'],
                                    ['byCode', 'By code'],
                                    ['lanes', 'Lanes'],
                                    ['venn', 'Venn'],
                                    ['answerKey', 'Answer key'],
                                ] as [Layout, string][]
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={layout === value ? 'is-active' : ''}
                                    onClick={() => setLayout(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button type="button" className="qc-btn-close" aria-label="Close" onClick={onCancel} />
                    </div>

                    {/* Body — resumo + diferenças na versão ativa */}
                    <div className="qc-body">
                        <div className="qc-summary" role="status">
                            {TOTAL_COMPARED} responses compared · {MATCHED_COUNT} matched · {DIFFERENCE_COUNT}{' '}
                            differences
                        </div>

                        {RESPONSE_LAYOUTS.includes(layout) && (
                            <>
                                {/* Legenda do destaque âmbar (Columns / Table / Venn). */}
                                {layout !== 'lanes' && (
                                    <div className="qc-legend">
                                        <span className="qc-legend-swatch" aria-hidden="true" />
                                        Applied by only one side
                                    </div>
                                )}
                                <ul className="qc-list">
                                    {DIFF_ITEMS.map((item) => (
                                        <li key={item.id} className="qc-item">
                                            <span className="qc-answer-text">{item.answer}</span>
                                            {layout === 'columns' && <CompareColumns item={item} />}
                                            {layout === 'table' && <CompareTable item={item} />}
                                            {layout === 'lanes' && <CompareLanes item={item} />}
                                            {layout === 'venn' && <CompareVenn item={item} />}
                                            <div className="qc-decision-row">
                                                <span className="qc-decision-label">Who is right?</span>
                                                <Segment
                                                    ariaLabel="Who is right?"
                                                    value={responseDecisions[item.id]}
                                                    options={[
                                                        ['human', 'Human is right'],
                                                        ['ai', 'AI is right'],
                                                    ]}
                                                    onChange={(v) =>
                                                        setResponseDecisions((prev) => ({ ...prev, [item.id]: v }))
                                                    }
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {layout === 'delta' && (
                            <ul className="qc-list">
                                {DIFF_ITEMS.map((item) => (
                                    <DeltaCard
                                        key={item.id}
                                        item={item}
                                        decisions={deltaDecisions}
                                        onDecide={(key, v) => setDeltaDecisions((prev) => ({ ...prev, [key]: v }))}
                                    />
                                ))}
                            </ul>
                        )}

                        {layout === 'answerKey' && (
                            <>
                                <p className="qc-instruction">
                                    Rules for these codes will be refined. Mark any response where the AI was
                                    actually right.
                                </p>
                                {/* Legenda dos dois estilos de erro (controle de alterações). */}
                                <div className="qc-legend">
                                    <span className="qc-legend-item">
                                        <span className="qc-code-chip qc-code-chip--missed qc-legend-chip">Code</span>
                                        Missed by AI
                                    </span>
                                    <span className="qc-legend-item">
                                        <span className="qc-code-chip qc-code-chip--added qc-legend-chip">Code</span>
                                        Added by AI
                                    </span>
                                </div>
                                <ul className="qc-list">
                                    {DIFF_ITEMS.map((item) => (
                                        <AnswerKeyCard
                                            key={item.id}
                                            item={item}
                                            excepted={!!exceptions[item.id]}
                                            onToggle={(v) => setExceptions((prev) => ({ ...prev, [item.id]: v }))}
                                        />
                                    ))}
                                </ul>
                            </>
                        )}

                        {layout === 'byCode' && (
                            <ul className="qc-list">
                                {CODE_GROUPS.map((group) => (
                                    <CodeGroupCard
                                        key={group.code}
                                        code={group.code}
                                        diffs={group.diffs}
                                        decision={codeDecisions[group.code]}
                                        onDecide={(v) => setCodeDecisions((prev) => ({ ...prev, [group.code]: v }))}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer — progresso + conclusão (só com tudo decidido). No
                        Answer key não há progresso: o botão mostra o efeito real. */}
                    <div className="qc-footer">
                        <span className="qc-footer-progress">
                            {layout !== 'answerKey' && (
                                <>
                                    {reviewed} of {total}
                                    {progressUnit} reviewed
                                </>
                            )}
                        </span>
                        <div className="qc-footer-actions">
                            <button
                                type="button"
                                className="qc-btn qc-btn--primary"
                                disabled={reviewed < total}
                                onClick={() => onApply(Array.from(new Set(codesToRefine)))}
                            >
                                {layout !== 'answerKey'
                                    ? 'Apply decisions'
                                    : refineCount > 0
                                      ? `Refine ${refineCount} ${refineCount === 1 ? 'rule' : 'rules'}`
                                      : 'Keep rules as they are'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Segmented control de decisão (duas opções), usado por todas as versões.
function Segment<T extends string>({
    ariaLabel,
    value,
    options,
    onChange,
}: {
    ariaLabel: string;
    value: T | undefined;
    options: [T, string][];
    onChange: (value: T) => void;
}) {
    return (
        <div className="qc-segment" role="group" aria-label={ariaLabel}>
            {options.map(([option, label]) => (
                <button
                    key={option}
                    type="button"
                    className={`qc-decision${value === option ? ' is-active' : ''}`}
                    aria-pressed={value === option}
                    onClick={() => onChange(option)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

// Versão "Columns": duas colunas lado a lado (Human coding | AI coding). Os
// codes que não existem no outro lado ficam destacados.
function CompareColumns({ item }: { item: DiffItem }) {
    const column = (title: string, codes: string[], other: string[]) => (
        <div className="qc-compare-col">
            <span className="qc-compare-title">{title}</span>
            {codes.length > 0 ? (
                <div className="qc-chips">
                    {codes.map((code) => (
                        <span
                            key={code}
                            className={`qc-code-chip${other.includes(code) ? '' : ' qc-code-chip--diff'}`}
                        >
                            {code}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="qc-compare-empty">No codes applied</span>
            )}
        </div>
    );
    return (
        <div className="qc-compare">
            {column('Human coding', item.human, item.ai)}
            {column('AI coding', item.ai, item.human)}
        </div>
    );
}

// Versão "Table": uma linha por code da resposta, com ✓ / — em Human e AI. A
// linha com diferença fica destacada.
function CompareTable({ item }: { item: DiffItem }) {
    const mark = (applied: boolean) =>
        applied ? (
            <Check size={14} weight="bold" aria-label="Applied" />
        ) : (
            <span className="qc-code-table-none" aria-label="Not applied">
                —
            </span>
        );
    return (
        <table className="qc-code-table">
            <thead>
                <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Human</th>
                    <th scope="col">AI</th>
                </tr>
            </thead>
            <tbody>
                {codesOf(item).map(({ code, human, ai }) => (
                    <tr key={code} className={human !== ai ? 'is-diff' : ''}>
                        <td>{code}</td>
                        <td>{mark(human)}</td>
                        <td>{mark(ai)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Versão "Lanes": duas faixas (Human / AI) com cada code na MESMA coluna nas
// duas. Onde um lado não aplicou, fica um espaço vazio tracejado alinhado ao
// code do outro lado — a ausência aparece sem precisar ler. Codes em comum
// primeiro, diferenças depois.
function CompareLanes({ item }: { item: DiffItem }) {
    const codes = [...codesOf(item)].sort((a, b) => Number(b.human && b.ai) - Number(a.human && a.ai));
    const lane = (label: string, applied: (c: (typeof codes)[number]) => boolean) => (
        <>
            <span className="qc-lanes-label">{label}</span>
            {codes.map((c) =>
                applied(c) ? (
                    <span key={c.code} className="qc-code-chip">
                        {c.code}
                    </span>
                ) : (
                    <span key={c.code} className="qc-lane-empty" aria-label={`${c.code} not applied`} />
                ),
            )}
        </>
    );
    return (
        <div className="qc-lanes-scroll">
            <div className="qc-lanes" style={{ gridTemplateColumns: `auto repeat(${codes.length}, max-content)` }}>
                {lane('Human', (c) => c.human)}
                {lane('AI', (c) => c.ai)}
            </div>
        </div>
    );
}

// Versão "Venn": cada code cai em exatamente uma coluna — Human only | Both |
// AI only. O centro é acordo; as bordas são as diferenças (destacadas).
function CompareVenn({ item }: { item: DiffItem }) {
    const all = codesOf(item);
    const bucket = (title: string, codes: string[], diff: boolean) => (
        <div className="qc-compare-col">
            <span className="qc-compare-title">{title}</span>
            {codes.length > 0 ? (
                <div className="qc-chips">
                    {codes.map((code) => (
                        <span key={code} className={`qc-code-chip${diff ? ' qc-code-chip--diff' : ''}`}>
                            {code}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="qc-compare-empty">—</span>
            )}
        </div>
    );
    return (
        <div className="qc-compare qc-compare--venn">
            {bucket('Human only', all.filter((c) => c.human && !c.ai).map((c) => c.code), true)}
            {bucket('Both', all.filter((c) => c.human && c.ai).map((c) => c.code), false)}
            {bucket('AI only', all.filter((c) => !c.human && c.ai).map((c) => c.code), true)}
        </div>
    );
}

// Versão "Answer key": a codificação humana é o gabarito. Cada resposta mostra
// uma linha só — a codificação da AI corrigida pelo gabarito, no vocabulário do
// controle de alterações: chip normal = a AI acertou; tracejado = a AI deveria
// ter aplicado e não aplicou; riscado = a AI aplicou e não deveria. Os erros
// são refinados por padrão; o usuário só age na exceção ("AI is right").
function AnswerKeyCard({
    item,
    excepted,
    onToggle,
}: {
    item: DiffItem;
    excepted: boolean;
    onToggle: (excepted: boolean) => void;
}) {
    const codes = codesOf(item);
    return (
        <li className={`qc-item${excepted ? ' qc-item--excepted' : ''}`}>
            <span className="qc-answer-text">{highlight(item.answer, diffCodesOf(item).map((code) => item.evidence[code] ?? ''))}</span>
            <div className="qc-answer-key-row">
                <span className="qc-answer-key-label">AI coding</span>
                <div className="qc-chips">
                    {codes.map(({ code, human, ai }) => (
                        <span
                            key={code}
                            className={`qc-code-chip${human && !ai ? ' qc-code-chip--missed' : ''}${!human && ai ? ' qc-code-chip--added' : ''}`}
                            aria-label={human && !ai ? `${code} (missed by AI)` : !human && ai ? `${code} (added by AI)` : undefined}
                        >
                            {code}
                        </span>
                    ))}
                </div>
                <label className="qc-exception">
                    <input type="checkbox" checked={excepted} onChange={(e) => onToggle(e.target.checked)} />
                    AI is right
                </label>
            </div>
        </li>
    );
}

// Versão "Per difference": verbatim com o trecho de cada diferença destacado,
// uma linha com os codes que os dois aplicaram ("Both applied", sem decisão) e
// uma linha por diferença ("AI missed X" / "AI added X") com "Does it apply?".
function DeltaCard({
    item,
    decisions,
    onDecide,
}: {
    item: DiffItem;
    decisions: Record<string, 'yes' | 'no'>;
    onDecide: (key: string, value: 'yes' | 'no') => void;
}) {
    const diffs = DIFFERENCES.filter((d) => d.item.id === item.id);
    const agreed = codesOf(item).filter((c) => c.human && c.ai).map((c) => c.code);
    return (
        <li className="qc-item">
            <span className="qc-answer-text">{highlight(item.answer, diffs.map((d) => item.evidence[d.code] ?? ''))}</span>
            <div className="qc-delta-list">
                {/* Codes que humano e AI aplicaram (contexto, sem decisão). */}
                {agreed.length > 0 && (
                    <div className="qc-delta-row">
                        <span className="qc-delta-statement">
                            <span className="qc-delta-kind">Both applied</span>
                            <span className="qc-chips">
                                {agreed.map((code) => (
                                    <span key={code} className="qc-code-chip">
                                        {code}
                                    </span>
                                ))}
                            </span>
                        </span>
                    </div>
                )}
                {diffs.map((d) => (
                    <div key={d.key} className="qc-delta-row">
                        <span className="qc-delta-statement">
                            <span className="qc-delta-kind">{d.kind === 'missed' ? 'AI missed' : 'AI added'}</span>
                            <span className="qc-code-chip">{d.code}</span>
                        </span>
                        <span className="qc-decision-label">Does it apply?</span>
                        <Segment
                            ariaLabel={`Does ${d.code} apply?`}
                            value={decisions[d.key]}
                            options={[
                                ['yes', 'Yes'],
                                ['no', 'No'],
                            ]}
                            onChange={(v) => onDecide(d.key, v)}
                        />
                    </div>
                ))}
            </div>
        </li>
    );
}

// Versão "By code": um card por code com diferença, com os exemplos de
// verbatim (trecho destacado) e a decisão sobre a regra.
function CodeGroupCard({
    code,
    diffs,
    decision,
    onDecide,
}: {
    code: string;
    diffs: Difference[];
    decision: 'refine' | 'keep' | undefined;
    onDecide: (value: 'refine' | 'keep') => void;
}) {
    const missed = diffs.filter((d) => d.kind === 'missed').length;
    const added = diffs.length - missed;
    const plural = (n: number) => `${n} ${n === 1 ? 'response' : 'responses'}`;
    const summary = [missed > 0 && `AI missed it in ${plural(missed)}`, added > 0 && `AI added it in ${plural(added)}`]
        .filter(Boolean)
        .join(' · ');
    const mixed = missed > 0 && added > 0;
    return (
        <li className="qc-item">
            <div className="qc-group-header">
                <span className="qc-code-chip">{code}</span>
                <span className="qc-group-summary">{summary}</span>
            </div>
            <ul className="qc-group-examples">
                {diffs.map((d) => (
                    <li key={d.key}>
                        {/* Só quando o grupo mistura os dois tipos de diferença. */}
                        {mixed && (
                            <span className="qc-delta-kind">{d.kind === 'missed' ? 'Missed' : 'Added'}</span>
                        )}
                        <span className="qc-answer-text">{highlight(d.item.answer, [d.item.evidence[code] ?? ''])}</span>
                    </li>
                ))}
            </ul>
            <div className="qc-decision-row">
                <Segment
                    ariaLabel={`${code} rule`}
                    value={decision}
                    options={[
                        ['refine', 'Refine rule'],
                        ['keep', 'Keep rule'],
                    ]}
                    onChange={onDecide}
                />
            </div>
        </li>
    );
}

export default QualityCheckPanel;

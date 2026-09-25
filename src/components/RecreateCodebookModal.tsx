import { useEffect, useMemo, useState } from 'react';
import {
    X,
    MagicWand,
    MagnifyingGlass,
    Plus,
    Minus,
    CheckSquare,
    Square,
    MinusSquare,
    CaretUp,
    CaretDown,
    ArrowsDownUp,
    Info,
} from '@phosphor-icons/react';
import { color, font, radius, space, shadow, getStatusColors, ALL_STATUSES, type Status, type StatusColors } from '../tokens';
import ModalButton from './ModalButton';

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

type QuestionType = 'Open' | 'Other specify';

interface StudyQuestion {
    id: string;
    text: string;
    responses: number;
    type: QuestionType;
}

interface Study {
    id: string;
    name: string;
    date: string;
    status: Status;
    questions: StudyQuestion[];
}

// ---------------------------------------------------------------------------
// Mock data (fictício, apenas para validar a UI). Plataforma de research geral
// (não só NPS): brand tracking, ad/concept testing, pricing, U&A, segmentação,
// CSAT/CES/NPS, packaging, message testing, employee, etc.
//
// As perguntas são geradas por genQuestions() a partir de um pool amplo, para
// simular estudos reais (5–15 perguntas cada). Tudo determinístico.
// ---------------------------------------------------------------------------

// Pool amplo de perguntas abertas (inglês), cobrindo vários tipos de estudo.
const QUESTION_POOL: string[] = [
    // Brand
    'What comes to mind when you think of this brand?',
    'How would you describe this brand in your own words?',
    'What makes this brand different from the others?',
    'Which brands did you consider before this one?',
    // Advertising / creative
    'What do you think is the main message of this ad?',
    'How did this ad make you feel?',
    'What did you like or dislike about the ad?',
    'What would make this ad more relevant to you?',
    // Concept
    'What do you like most about this concept?',
    'What concerns, if any, do you have about this concept?',
    'How could we improve this concept?',
    'How likely would you be to buy this, and why?',
    // Pricing
    'At what price would this be so expensive you would not consider it?',
    'At what price would this feel like a great deal?',
    'How does this price compare to what you expected?',
    // Product / U&A
    'How do you currently solve this problem?',
    'What frustrates you most about the solutions you use today?',
    'Which features matter most to you, and why?',
    'Walk us through the last time you used a product like this.',
    // Satisfaction / loyalty
    'Why did you give that score?',
    'What is the one thing we should improve?',
    'How easy was it to get what you needed?',
    'What would make you a more loyal customer?',
    // Packaging / naming / message
    'What does this packaging communicate to you?',
    'Which name do you prefer, and why?',
    'Which message resonates most with you, and why?',
    // Habits / lifestyle / segmentation
    'What influences your purchase decisions the most?',
    'Tell us about a typical day and where this fits in.',
    // Employee
    'What do you value most about working here?',
    'What would make this a better place to work?',
    // Catch-all
    'Tell us more about your answer.',
    'Anything else you would like to share with us?',
];

// Pool em francês para o estudo francês.
const QUESTION_POOL_FR: string[] = [
    'Pourquoi cette note ?',
    'Que pouvons-nous améliorer ?',
    "Qu'avez-vous le plus apprécié ?",
    'Que faudrait-il changer en priorité ?',
    'Comment nous décririez-vous à un collègue ?',
    "Qu'est-ce qui a failli vous freiner ?",
    'Quelles fonctionnalités vous manquent aujourd’hui ?',
    'Comment pouvons-nous mieux répondre à vos besoins ?',
    'Quel a été le point le plus frustrant ?',
    'Souhaitez-vous ajouter autre chose ?',
];

// Gera `count` perguntas para um estudo, ciclando pelo pool a partir de `offset`.
// responses e type são determinísticos (sem aleatoriedade) para estabilidade.
function genQuestions(studyId: string, count: number, pool: string[], offset: number): StudyQuestion[] {
    return Array.from({ length: count }, (_, q) => {
        const text = pool[(offset + q) % pool.length];
        const responses = 480 + (((offset + q) * 743 + 211) % 92) * 100; // ~480–9.6k
        // Espalha algumas "Open" no meio das "Other specify".
        const type: QuestionType = q % 4 === 0 ? 'Open' : 'Other specify';
        return { id: `${studyId}-q${q + 1}`, text, responses, type };
    });
}

// Estudos variados de uma plataforma de research geral. Nomes de curtos a bem
// longos (para exercitar truncamento) e 5–15 perguntas cada. `fr` usa o pool
// francês.
const STUDY_SEEDS: Array<{ name: string; date: string; qCount: number; fr?: boolean }> = [
    { name: 'Brand Health Tracker 2025 — Global Awareness, Consideration & Equity (Wave 3)', date: '12/08/2025', qCount: 12 },
    { name: 'Q3 Brand Tracking — Unaided & Aided Awareness', date: '05/08/2025', qCount: 9 },
    { name: 'Ad Effectiveness Test — Spring Campaign “Made for Mornings” (30s Video, Monadic)', date: '30/05/2025', qCount: 14 },
    { name: 'Creative Pre-Test — Social Static vs. Motion', date: '18/05/2025', qCount: 7 },
    { name: 'Concept Test — Next-Gen Subscription Bundle', date: '28/04/2025', qCount: 10 },
    { name: 'Concept & Claims Test — Plant-Based Line Extension (Sequential Monadic)', date: '02/05/2025', qCount: 13 },
    { name: 'Pricing Study — Van Westendorp Price Sensitivity Meter', date: '15/04/2025', qCount: 6 },
    { name: 'Gabor–Granger Pricing — Premium Tier Willingness to Pay', date: '03/04/2025', qCount: 8 },
    { name: 'Usage & Attitudes (U&A) — Home Coffee Category (Nationally Representative)', date: '22/03/2025', qCount: 15 },
    { name: 'Customer Satisfaction (CSAT) — Post-Purchase Follow-Up', date: '10/03/2025', qCount: 5 },
    { name: 'Customer Effort Score (CES) — Support Center Interactions', date: '28/02/2025', qCount: 6 },
    { name: 'Relationship NPS — EMEA Enterprise & Mid-Market Accounts (Annual Benchmark 2025)', date: '18/04/2025', qCount: 12 },
    { name: 'Transactional NPS — Onboarding Experience Follow-Up (First 90 Days)', date: '19/02/2025', qCount: 11 },
    { name: 'Product Feedback — Mobile App v4.0 Beta', date: '08/02/2025', qCount: 9 },
    { name: 'Feature Prioritization — MaxDiff Across 18 Potential Features', date: '25/01/2025', qCount: 10 },
    { name: 'Packaging Test — Shelf Impact & Purchase Intent (A/B/C)', date: '15/01/2025', qCount: 8 },
    { name: 'Naming Test — Candidate Names for a New Energy Drink', date: '20/12/2024', qCount: 7 },
    { name: 'Message Testing — Value Proposition Resonance Across 5 Territories', date: '10/12/2024', qCount: 11 },
    { name: 'Market Segmentation — Attitudinal & Needs-Based Clustering Study', date: '28/11/2024', qCount: 15 },
    { name: 'Market Sizing & Opportunity — SMB Fintech (US, UK & DE)', date: '14/11/2024', qCount: 9 },
    { name: 'Shopper Journey — Path to Purchase in Grocery Retail', date: '30/10/2024', qCount: 12 },
    { name: 'Customer Churn Drivers — Cancelled Subscriptions (Last 6 Months)', date: '18/10/2024', qCount: 8 },
    { name: 'Win-Back Study — Re-Engaging Lapsed Customers', date: '05/10/2024', qCount: 6 },
    { name: 'Employee Engagement Survey 2025 — Annual Pulse', date: '20/09/2024', qCount: 13 },
    { name: 'Voice of Customer — Cross-Channel Sentiment (Web, Email & In-App)', date: '02/09/2024', qCount: 10 },
    { name: 'Advertising Tracking — Category Media & Recall (Quarterly)', date: '20/08/2024', qCount: 7 },
    { name: 'Customer Sentiment Pulse — Post-Launch Reactions', date: '05/08/2024', qCount: 5 },
    { name: 'Habits & Occasions — Snacking Throughout the Day', date: '18/07/2024', qCount: 11 },
    { name: 'Loyalty Program Evaluation — Perceived Value & Redemption Barriers', date: '03/07/2024', qCount: 8 },
    { name: 'New Product Development — Iterative Concept Screen (Sprint 2)', date: '15/06/2024', qCount: 9 },
    { name: 'Étude client France 2025 — Enquête de satisfaction relationnelle (tous segments)', date: '05/03/2025', qCount: 8, fr: true },
];

const STUDIES: Study[] = STUDY_SEEDS.map((seed, i) => ({
    id: `study-${i + 1}`,
    name: seed.name,
    date: seed.date,
    // Status fictício — varia entre os estudos só para exercitar as tags.
    status: ALL_STATUSES[i % ALL_STATUSES.length],
    questions: genQuestions(`study-${i + 1}`, seed.qCount, seed.fr ? QUESTION_POOL_FR : QUESTION_POOL, i * 3),
}));

// ---------------------------------------------------------------------------
// Ordenação (sort) — chaves por coluna e comparadores.
// ---------------------------------------------------------------------------
export type SortDir = 'asc' | 'desc';
type StudySortKey = 'name' | 'status' | 'questions' | 'responses';
type QuestionSortKey = 'text' | 'type' | 'responses';

const sumResponses = (s: Study) => s.questions.reduce((n, q) => n + q.responses, 0);

function compareStudies(a: Study, b: Study, key: StudySortKey): number {
    switch (key) {
        case 'name': return a.name.localeCompare(b.name);
        case 'status': return ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
        case 'questions': return a.questions.length - b.questions.length;
        case 'responses': return sumResponses(a) - sumResponses(b);
    }
}

// "Open" sempre antes de "Other specify"; desempate alfabético pelo texto.
const TYPE_RANK: Record<QuestionType, number> = { 'Open': 0, 'Other specify': 1 };
function compareQuestions(a: StudyQuestion, b: StudyQuestion, key: QuestionSortKey): number {
    switch (key) {
        case 'text': return a.text.localeCompare(b.text);
        case 'type': {
            const r = TYPE_RANK[a.type] - TYPE_RANK[b.type];
            return r !== 0 ? r : a.text.localeCompare(b.text);
        }
        case 'responses': return a.responses - b.responses;
    }
}

// Cabeçalho clicável com indicador de ordenação. Colunas não ordenáveis
// (checkbox/expander) continuam usando <span>. Reusado pela tabela By code
// do QualityCheckV2.
export function SortHeader({
    label,
    align = 'left',
    active,
    dir,
    borderRight = false,
    onClick,
}: {
    label: string;
    align?: 'left' | 'right';
    active: boolean;
    dir: SortDir;
    borderRight?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
                gap: 4,
                width: '100%',
                minWidth: 0,
                padding: '8px 12px',
                border: 'none',
                borderRight: borderRight ? `1px solid ${color.border}` : undefined,
                background: 'none',
                cursor: 'pointer',
                fontFamily: font.family,
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: color.textDark,
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            {active
                ? (dir === 'asc'
                    ? <CaretUp size={12} weight="bold" color={color.textDark} style={{ flexShrink: 0 }} />
                    : <CaretDown size={12} weight="bold" color={color.textDark} style={{ flexShrink: 0 }} />)
                : <ArrowsDownUp size={12} color={color.textFaint} style={{ flexShrink: 0 }} />}
        </button>
    );
}

// Altura do modal de Instructions. A etapa de processamento
// (GenerateRulesProcessingModal) importa esta constante para ter exatamente a
// mesma altura, de modo que a transição não mude o tamanho do modal.
export const INSTRUCTIONS_MODAL_HEIGHT = 360;

/** Pergunta selecionada no Recreate. Segue adiante no fluxo: é a base do
 *  seletor de amostra do Quality Check (só as perguntas usadas no treino). */
export interface TrainingQuestion {
    id: string;
    text: string;
    studyName: string;
    responses: number;
}

interface RecreateCodebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Chamado ao confirmar "Generate" no modal de Instructions, com as
     *  perguntas selecionadas. O pai abre a etapa de processamento por cima;
     *  este modal permanece aberto atrás, visível pelo overlay do processamento. */
    onGenerate: (questions: TrainingQuestion[]) => void;
    sourceCodebookName: string;
}

function RecreateCodebookModal({ isOpen, onClose, onGenerate, sourceCodebookName }: RecreateCodebookModalProps) {
    const [expandedStudyIds, setExpandedStudyIds] = useState<string[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [instructions, setInstructions] = useState('');
    const [query, setQuery] = useState('');
    // Sort do grid pai: null = ordem natural. Sort do sub-grid: default "type"
    // asc = Open primeiro, depois alfabético (aplica-se a todos os sub-grids).
    const [studySort, setStudySort] = useState<{ key: StudySortKey; dir: SortDir } | null>(null);
    const [questionSort, setQuestionSort] = useState<{ key: QuestionSortKey; dir: SortDir }>({ key: 'type', dir: 'asc' });
    // Etapa 2: modal de Instructions, aberto ao clicar "Generate codebook rules".
    const [showInstructions, setShowInstructions] = useState(false);

    // Protótipo: todos os codebooks exibem a mesma lista completa de estudos
    // (research geral). O sourceCodebookName aparece só no cabeçalho.
    const studies = useMemo(() => STUDIES, []);

    // Filtro de busca — casa por nome do estudo ou texto das perguntas.
    const visibleStudies = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return studies;
        // Busca apenas no nível de studies (pelo nome), não nas perguntas.
        return studies.filter((s) => s.name.toLowerCase().includes(q));
    }, [studies, query]);

    // Aplica o sort do grid pai (se houver) sobre a lista filtrada.
    const sortedStudies = useMemo(() => {
        if (!studySort) return visibleStudies;
        const sign = studySort.dir === 'asc' ? 1 : -1;
        return [...visibleStudies].sort((a, b) => sign * compareStudies(a, b, studySort.key));
    }, [visibleStudies, studySort]);

    // Reseta o estado ao (re)abrir. Default: tudo colapsado e nada selecionado;
    // se houver exatamente um estudo, expande-o.
    useEffect(() => {
        if (isOpen) {
            setSelectedQuestionIds([]);
            setInstructions('');
            setQuery('');
            setExpandedStudyIds(studies.length === 1 ? [studies[0].id] : []);
            setStudySort(null);
            setQuestionSort({ key: 'type', dir: 'asc' });
            setShowInstructions(false);
        }
    }, [isOpen, studies]);

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // Na etapa de Instructions, ESC volta para a seleção; senão fecha.
            if (showInstructions) setShowInstructions(false);
            else onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, showInstructions]);

    if (!isOpen) return null;

    const selectedSet = new Set(selectedQuestionIds);

    const toggleExpanded = (id: string) => {
        setExpandedStudyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // Clique no header: mesma coluna alterna asc/desc; coluna nova começa em asc.
    const toggleStudySort = (key: StudySortKey) => {
        setStudySort((prev) => (prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
    };
    const toggleQuestionSort = (key: QuestionSortKey) => {
        setQuestionSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
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

    // Botões de footer: ver ModalButton (sistema de botões do Figma).

    // Master-detail grid — templates de coluna. O grid pai (estudos) e o
    // grid filho (perguntas) têm colunas próprias, alinhadas cada um ao seu
    // header (emula "grid dentro do grid", não a lib real).
    const parentGridCols = '40px 40px minmax(0, 1fr) 195px 96px 120px'; // +/- · checkbox · Study · Status · Questions · Responses
    const childGridCols = '40px minmax(0, 1fr) 160px 150px';      // checkbox · Question · Type · Responses
    const gridLine = `1px solid ${color.border}`;                 // linha de grade (verticais/horizontais)
    const rowMinHeight = '35px';                                  // altura do header e das linhas

    return (
        <>
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
                    // Mesmas dimensões do modal do Validator (AccountCodebookRulesModal):
                    // largura 85vw e altura calc(100vh - 110px).
                    width: '85vw',
                    maxWidth: '85vw',
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
                <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>
                            Recreate and train Codebook
                        </span>
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
                </div>

                {/* Body — fixed flex column; only the study list scrolls. */}
                <div style={{ padding: space.xl, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {studies.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EmptyState codebookName={sourceCodebookName} />
                        </div>
                    ) : (
                        <>
                            {/* Instrução principal (topo). O search fica na linha do escopo,
                                logo acima da tabela — mantendo sua posição original. */}
                            <p style={{ flexShrink: 0, margin: 0, fontSize: font.size.md, color: color.textDark, lineHeight: '20px' }}>
                                Select the studies and questions to recreate this codebook as an AI Coder codebook.
                                <span
                                    title={"We'll use your selection to generate the new codebook's codes and rules.\nSelecting a study includes all of its questions."}
                                    aria-label="We'll use your selection to generate the new codebook's codes and rules. Selecting a study includes all of its questions."
                                    style={{ display: 'inline-flex', verticalAlign: 'text-bottom', marginLeft: space.xs, cursor: 'help', color: color.textMuted }}
                                >
                                    <Info size={16} weight="bold" />
                                </span>
                            </p>

                            {/* Escopo da lista + search na mesma linha, logo acima da tabela —
                                deixando claro que os estudos abaixo são exatamente os que usam
                                este codebook. */}
                            <div style={{ flexShrink: 0, marginTop: space.sm, marginBottom: space.sm, display: 'flex', alignItems: 'center', gap: space.lg }}>
                                <span style={{ flex: 1, minWidth: 0, fontSize: font.size.md, color: color.textMuted }}>
                                    Showing all studies and questions where <strong style={{ color: color.textDark }}>{sourceCodebookName}</strong> is applied.
                                </span>
                                <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
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
                                        placeholder="Search studies…"
                                        aria-label="Search studies"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px 8px 32px',
                                            fontSize: font.size.md,
                                            color: color.textDark,
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
                            </div>

                            {/* Master-detail grid — estilo "data grid" (como a lib de referência):
                                linhas de grade verticais/horizontais, header cinza, coluna
                                expander +/- à esquerda e linha aberta destacada. */}
                            <div style={{ flex: 1, minHeight: 0, border: gridLine, borderRadius: radius.lg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Scroll body — o header fica DENTRO do scroll e "grudado" no
                                    topo (sticky). Assim header e linhas dividem exatamente a
                                    mesma largura de coluna, sem o desalinhamento causado pela
                                    scrollbar (que só afeta a área rolável). */}
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                    {/* Parent header — sticky no topo da área de scroll */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: parentGridCols,
                                            alignItems: 'stretch',
                                            minHeight: rowMinHeight,
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 1,
                                            backgroundColor: color.surfaceSubtle,
                                            borderBottom: gridLine,
                                        }}
                                    >
                                        <span aria-hidden="true" style={{ borderRight: gridLine }} />{/* expander */}
                                        <span aria-hidden="true" style={{ borderRight: gridLine }} />{/* checkbox */}
                                        <SortHeader label="Study ID" borderRight active={studySort?.key === 'name'} dir={studySort?.key === 'name' ? studySort.dir : 'asc'} onClick={() => toggleStudySort('name')} />
                                        <SortHeader label="Status" borderRight active={studySort?.key === 'status'} dir={studySort?.key === 'status' ? studySort.dir : 'asc'} onClick={() => toggleStudySort('status')} />
                                        <SortHeader label="Questions" align="right" borderRight active={studySort?.key === 'questions'} dir={studySort?.key === 'questions' ? studySort.dir : 'asc'} onClick={() => toggleStudySort('questions')} />
                                        <SortHeader label="Responses" align="right" active={studySort?.key === 'responses'} dir={studySort?.key === 'responses' ? studySort.dir : 'asc'} onClick={() => toggleStudySort('responses')} />
                                    </div>

                                    {visibleStudies.length === 0 && (
                                        <div style={{ padding: `${space.xl} 0`, textAlign: 'center', fontSize: font.size.md, color: color.textDark }}>
                                            No studies match “{query.trim()}”.
                                        </div>
                                    )}
                                    {sortedStudies.map((study) => {
                                        const qIds = study.questions.map((q) => q.id);
                                        const selectedCount = qIds.filter((id) => selectedSet.has(id)).length;
                                        const totalResponses = study.questions.reduce((sum, q) => sum + q.responses, 0);
                                        // Perguntas ordenadas conforme o sort do sub-grid.
                                        const qSign = questionSort.dir === 'asc' ? 1 : -1;
                                        const sortedQuestions = [...study.questions].sort((a, b) => qSign * compareQuestions(a, b, questionSort.key));
                                        const state: CheckState =
                                            selectedCount === 0 ? 'unchecked' : selectedCount === qIds.length ? 'checked' : 'indeterminate';
                                        const expanded = expandedStudyIds.includes(study.id);
                                        // Expandir NÃO muda a cor da linha. A cor reflete só a
                                        // seleção: branca por padrão, tint quando há perguntas
                                        // selecionadas. (onDark mantido = false para os ramos abaixo.)
                                        const onDark = false;
                                        const rowBg = state === 'unchecked' ? color.surface : color.brandSoft;
                                        const nameColor = color.textDark;
                                        const metaColor = color.textDark;
                                        return (
                                            <div key={study.id}>
                                                {/* Parent row (study) */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-expanded={expanded}
                                                    onClick={() => toggleExpanded(study.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpanded(study.id); }
                                                    }}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: parentGridCols,
                                                        alignItems: 'stretch',
                                                        minHeight: rowMinHeight,
                                                        cursor: 'pointer',
                                                        borderBottom: gridLine,
                                                        backgroundColor: rowBg,
                                                    }}
                                                    onMouseEnter={(e) => { if (!onDark && state === 'unchecked') e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowBg; }}
                                                >
                                                    {/* Expander cell — coluna cinza à esquerda com +/- */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: gridLine, backgroundColor: onDark ? 'transparent' : color.surfaceSubtle }}>
                                                        {expanded
                                                            ? <Minus size={16} weight="bold" color={onDark ? color.surface : color.textMuted} />
                                                            : <Plus size={16} weight="bold" color={color.textMuted} />}
                                                    </div>
                                                    {/* Checkbox cell — não deve expandir/colapsar */}
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: gridLine }}
                                                    >
                                                        <TriStateCheckbox
                                                            state={state}
                                                            tone={onDark ? 'onDark' : 'default'}
                                                            ariaLabel={`Select all questions in ${study.name}`}
                                                            onToggle={() => toggleStudy(study)}
                                                        />
                                                    </div>
                                                    {/* Study name + badge de seleção */}
                                                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: space.sm, padding: `${space.sm} ${space.md}`, borderRight: gridLine }}>
                                                        <span style={{ flex: 1, minWidth: 0, fontSize: font.size.md, fontWeight: font.weight.regular, color: nameColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {study.name}
                                                        </span>
                                                    </div>
                                                    {/* Status tag */}
                                                    <div style={{ display: 'flex', alignItems: 'center', padding: `${space.xs} ${space.md}`, borderRight: gridLine, minWidth: 0 }}>
                                                        <StatusTag status={study.status} />
                                                    </div>
                                                    {/* Questions count (alinhado à direita) */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `${space.sm} ${space.md}`, borderRight: gridLine, fontSize: font.size.md, color: metaColor }}>
                                                        {study.questions.length}
                                                    </div>
                                                    {/* Responses total (alinhado à direita, última coluna) */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `${space.sm} ${space.md}`, fontSize: font.size.md, color: metaColor }}>
                                                        {totalResponses.toLocaleString()}
                                                    </div>
                                                </div>

                                                {/* Detail row — sub-grid de perguntas */}
                                                {expanded && (
                                                    <div style={{ backgroundColor: color.surface, padding: space.md, paddingLeft: '80px', borderBottom: gridLine }}>
                                                        <div style={{ border: gridLine, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.surface }}>
                                                            {/* Child header */}
                                                            <div
                                                                style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: childGridCols,
                                                                    alignItems: 'stretch',
                                                                    minHeight: rowMinHeight,
                                                                    backgroundColor: color.surfaceSubtle,
                                                                    borderBottom: gridLine,
                                                                }}
                                                            >
                                                                <span aria-hidden="true" style={{ borderRight: gridLine }} />{/* checkbox */}
                                                                <SortHeader label="Question ID" borderRight active={questionSort.key === 'text'} dir={questionSort.key === 'text' ? questionSort.dir : 'asc'} onClick={() => toggleQuestionSort('text')} />
                                                                <SortHeader label="Type" borderRight active={questionSort.key === 'type'} dir={questionSort.key === 'type' ? questionSort.dir : 'asc'} onClick={() => toggleQuestionSort('type')} />
                                                                <SortHeader label="Responses" align="right" active={questionSort.key === 'responses'} dir={questionSort.key === 'responses' ? questionSort.dir : 'asc'} onClick={() => toggleQuestionSort('responses')} />
                                                            </div>
                                                            {/* Child rows */}
                                                            {sortedQuestions.map((q, idx) => {
                                                                const checked = selectedSet.has(q.id);
                                                                const childBg = checked ? color.brandSoft : color.surface;
                                                                return (
                                                                    <div
                                                                        key={q.id}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        aria-pressed={checked}
                                                                        onClick={() => toggleQuestion(q.id)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleQuestion(q.id); }
                                                                        }}
                                                                        style={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: childGridCols,
                                                                            alignItems: 'stretch',
                                                                            minHeight: rowMinHeight,
                                                                            cursor: 'pointer',
                                                                            borderTop: idx === 0 ? 'none' : gridLine,
                                                                            backgroundColor: childBg,
                                                                        }}
                                                                        onMouseEnter={(e) => { if (!checked) e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = childBg; }}
                                                                    >
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: gridLine }}>
                                                                            {checked
                                                                                ? <CheckSquare size={20} weight="fill" color={color.brand} />
                                                                                : <Square size={20} color={color.textFaint} />}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, padding: `${space.sm} ${space.md}`, borderRight: gridLine }}>
                                                                            <span style={{ minWidth: 0, fontSize: font.size.md, color: color.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {q.text}
                                                                            </span>
                                                                        </div>
                                                                        {/* Type tag */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, padding: `${space.xs} ${space.md}`, borderRight: gridLine }}>
                                                                            <TypeTag type={q.type} />
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `${space.sm} ${space.md}`, fontSize: font.size.md, color: color.textDark }}>
                                                                            {q.responses.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
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
                        backgroundColor: color.surface,
                    }}
                >
                    <div style={{ fontSize: font.size.md, color: color.textDark }}>
                        {studies.length > 0 && (
                            `${selectedQuestionIds.length} ${selectedQuestionIds.length === 1 ? 'question' : 'questions'} selected` +
                            (selectedStudyCount > 0 ? ` across ${selectedStudyCount} ${selectedStudyCount === 1 ? 'study' : 'studies'}` : '')
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: space.sm }}>
                        <ModalButton variant="tertiary" onClick={onClose}>Cancel</ModalButton>
                        {studies.length > 0 && (
                            <ModalButton
                                variant="primary"
                                disabled={!canProceed}
                                onClick={() => setShowInstructions(true)}
                            >
                                Generate codebook rules
                            </ModalButton>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Etapa 2 — modal de Instructions (abre ao clicar "Generate codebook rules") */}
        {showInstructions && (
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Instructions"
                onMouseDown={() => setShowInstructions(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(17, 24, 39, 0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                        height: `${INSTRUCTIONS_MODAL_HEIGHT}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: color.surface,
                        borderRadius: radius.xl,
                        boxShadow: shadow.modal,
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>Instructions</span>
                        <button
                            type="button"
                            aria-label="Back"
                            onClick={() => setShowInstructions(false)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.xs, border: 'none', background: 'none', cursor: 'pointer', borderRadius: radius.sm, color: color.textMuted }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: space.xl, flex: 1, minHeight: 0 }}>
                        <div style={{ fontSize: font.size.md, color: color.textDark, lineHeight: '20px' }}>
                            Tell the AI how to build the codebook: how to split codes, how to group them, and anything to watch for.{' '}
                            <span style={{ fontStyle: 'italic', color: color.textSubtle }}>(optional)</span>
                        </div>
                        <textarea
                            id="recreate-instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={5}
                            autoFocus
                            placeholder={'Example: "Create separate codes for Helpful staff and Nice staff."'}
                            style={{
                                width: '100%',
                                marginTop: space.md,
                                padding: space.sm,
                                fontSize: font.size.md,
                                lineHeight: '20px',
                                color: color.textDark,
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

                    {/* Footer */}
                    <div style={{ padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: space.md, backgroundColor: color.surface }}>
                        <div style={{ display: 'flex', gap: space.sm }}>
                            <ModalButton variant="tertiary" onClick={() => setShowInstructions(false)}>Cancel</ModalButton>
                            <ModalButton
                                variant="primary"
                                onClick={() => {
                                    // O modal de Instructions dá lugar ao de processamento:
                                    // fecha esta etapa e o RecreateCodebookModal segue aberto
                                    // atrás (visível pelo overlay do processamento).
                                    setShowInstructions(false);
                                    onGenerate(
                                        studies.flatMap((s) =>
                                            s.questions
                                                .filter((q) => selectedSet.has(q.id))
                                                .map((q) => ({ id: q.id, text: q.text, studyName: s.name, responses: q.responses })),
                                        ),
                                    );
                                }}
                            >
                                Generate
                            </ModalButton>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
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
    tone = 'default',
}: {
    state: CheckState;
    ariaLabel: string;
    onToggle: () => void;
    /** 'onDark' = ícone branco, para uso sobre a linha destacada (aberta). */
    tone?: 'default' | 'onDark';
}) {
    const checkColor = tone === 'onDark' ? color.surface : color.brand;
    const emptyColor = tone === 'onDark' ? color.surface : color.textFaint;
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
            {state === 'checked' && <CheckSquare size={20} weight="fill" color={checkColor} />}
            {state === 'indeterminate' && <MinusSquare size={20} weight="fill" color={checkColor} />}
            {state === 'unchecked' && <Square size={20} color={emptyColor} />}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Tag base — chip com dot colorido. Cores vêm de StatusColors (tokens.ts).
// ---------------------------------------------------------------------------
function Tag({ label, colors }: { label: string; colors: StatusColors }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 24,
                padding: '4px 10px',
                boxSizing: 'border-box',
                borderRadius: radius.lg,
                fontSize: font.size.md,
                fontWeight: font.weight.semibold,
                lineHeight: '16px',
                letterSpacing: '0.24px',
                whiteSpace: 'nowrap',
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontFamily: font.family,
            }}
        >
            <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: radius.full, background: colors.dot }} />
            {label}
        </span>
    );
}

// Tag de status do estudo (grid pai).
function StatusTag({ status }: { status: Status }) {
    return <Tag label={status} colors={getStatusColors(status)} />;
}

// Tag de tipo da pergunta (sub-grid). Reaproveita o estilo de status pedido:
// Open → "In Progress"; Other specify → "Under Construction".
const TYPE_TAG_STATUS: Record<QuestionType, Status> = {
    'Open': 'In Progress',
    'Other specify': 'Under Construction',
};
function TypeTag({ type }: { type: QuestionType }) {
    return <Tag label={type} colors={getStatusColors(TYPE_TAG_STATUS[type])} />;
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
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: color.textDark }}>
                No studies available
            </div>
            <div style={{ fontSize: font.size.md, color: color.textDark, marginTop: space.xs, lineHeight: '20px' }}>
                No studies contain a codebook named <strong style={{ color: color.textDark }}>{codebookName}</strong>.
            </div>
        </div>
    );
}

export default RecreateCodebookModal;

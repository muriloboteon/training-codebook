import { useState } from 'react';
import './qualityCheckPanel.css';

// -----------------------------------------------------------------------------
// QualityCheckPanel — visor de revisão do "Quality Check" do fluxo de treino.
//
// Contexto: dentro do AccountCodebookRulesModal (o "Validator" de codes/regras
// da Account Codebooks) o usuário pode rodar um Quality Check. O codebook
// treinado é aplicado a uma AMOSTRA (~10%, mockada) da source data; um veredito
// de qualidade (LLM-as-judge) avalia a codificação da AI. Este painel mostra
// esse sample para o usuário aprovar/rejeitar cada item. As rejeições
// realimentam o refinamento das regras (feito pelo modal pai) antes da carga
// completa.
//
// Componente NOVO (aprovado pelo PM): não existia no projeto uma UI de
// code-review/confidence-scoring para reaproveitar. A aparência segue a
// convenção da família de modais de codes da Account Codebooks
// (accountCodebookRulesModal.css): raw rgb() + Figtree, para casar 1:1 com o
// modal onde ele é aberto, em vez de importar tokens.ts.
//
// Protótipo: dados mockados, estados simulados, sem backend nem chamada real de
// IA/LLM.
// -----------------------------------------------------------------------------

// Veredito do LLM-as-judge para uma resposta codificada da AI.
//  - 'agree' → o juiz concorda com o código atribuído;
//  - 'flag'  → o juiz sinaliza uma possível codificação incorreta.
type JudgeVerdict = 'agree' | 'flag';

// Decisão do usuário sobre cada item do sample.
type Decision = 'approve' | 'reject';

interface SampleItem {
    id: string;
    /** Identificador anônimo do respondente (mock). */
    respondent: string;
    /** Verbatim da resposta na source data (mock). */
    answer: string;
    /** Net + code atribuídos pela AI ao aplicar o codebook treinado. */
    assignedNet: string;
    assignedCode: string;
    /** Veredito do LLM-as-judge sobre essa codificação. */
    verdict: JudgeVerdict;
    /** Confiança do juiz (0–100), exibida como pill colorida. */
    confidence: number;
    /** Justificativa curta do juiz. */
    rationale: string;
}

// Sample mockado: ~10% da source data. Mistura codificações claras (agree, alta
// confiança) com casos que o juiz sinaliza (flag, baixa confiança) para o
// usuário revisar. Todos os codes referenciados existem no CODEBOOK_ROWS do
// modal pai, então a rejeição tem um alvo real para refinar.
const SAMPLE_ITEMS: SampleItem[] = [
    {
        id: 's1',
        respondent: 'R-0142',
        answer: 'I usually get my groceries delivered from Amazon Fresh.',
        assignedNet: 'Amazon Shopping And Delivery Services',
        assignedCode: 'Amazon Fresh',
        verdict: 'agree',
        confidence: 96,
        rationale: 'Explicit mention of Amazon Fresh as a grocery destination.',
    },
    {
        id: 's2',
        respondent: 'R-0187',
        answer: 'mostly ubereats, sometimes doordash',
        assignedNet: 'Food And Restaurant Delivery Services',
        assignedCode: 'Uber Eats',
        verdict: 'flag',
        confidence: 58,
        rationale: 'Two delivery services mentioned; only Uber Eats was coded — DoorDash was missed.',
    },
    {
        id: 's3',
        respondent: 'R-0203',
        answer: 'I order food through Greetings',
        assignedNet: 'Food And Restaurant Delivery Services',
        assignedCode: 'GrubHub',
        verdict: 'flag',
        confidence: 41,
        rationale: '"Greetings" is an unusual alias for GrubHub; likely a mis-transcription rather than a real match.',
    },
    {
        id: 's4',
        respondent: 'R-0231',
        answer: 'Walmart, and sometimes Wolmart when the app autocorrects',
        assignedNet: 'Major National Grocery Retailers',
        assignedCode: 'Walmart',
        verdict: 'agree',
        confidence: 91,
        rationale: 'Walmart (and misspelling Wolmart) correctly consolidated under Walmart.',
    },
    {
        id: 's5',
        respondent: 'R-0258',
        answer: 'just uber',
        assignedNet: 'Food And Restaurant Delivery Services',
        assignedCode: 'Uber',
        verdict: 'flag',
        confidence: 52,
        rationale: 'Ambiguous: bare "uber" could mean Uber (rideshare) or Uber Eats. Rule does not disambiguate.',
    },
    {
        id: 's6',
        respondent: 'R-0276',
        answer: 'Trader joes and whole foods on amazon',
        assignedNet: 'Specialty And Natural Food Stores',
        assignedCode: "Trader Joe's",
        verdict: 'flag',
        confidence: 60,
        rationale: 'A second destination ("Whole Foods on Amazon") in the same answer was not captured.',
    },
    {
        id: 's7',
        respondent: 'R-0299',
        answer: 'asdfgh',
        assignedNet: 'No Preference Or Unable To Specify',
        assignedCode: 'Non-response or unclear',
        verdict: 'agree',
        confidence: 89,
        rationale: 'Gibberish correctly routed to the non-response code.',
    },
    {
        id: 's8',
        respondent: 'R-0314',
        answer: 'netflix',
        assignedNet: 'Other Codes',
        assignedCode: 'Netflix',
        verdict: 'flag',
        confidence: 38,
        rationale: 'Streaming service, not a shopping/grocery destination — likely off-topic for this study.',
    },
    {
        id: 's9',
        respondent: 'R-0338',
        answer: 'Costco all the way, plus BJ’s for bulk',
        assignedNet: 'Warehouse And Bulk Retailers',
        assignedCode: 'Costco',
        verdict: 'agree',
        confidence: 94,
        rationale: 'Costco correctly coded (BJ’s also present but Costco is the primary destination).',
    },
];

// OPEN: percentual da amostra (5–10%). Default do protótipo: 10%.
const SAMPLE_PERCENT = 10;
// Total de respostas na source data (mock), usado só para exibir "N de M (10%)".
const TOTAL_RESPONSES = Math.round(SAMPLE_ITEMS.length / (SAMPLE_PERCENT / 100));

// Ícones (inline, mesma convenção FontAwesome dos outros modais de codes) ------

const IconCheck = () => (
    <svg viewBox="0 0 448 512" role="img" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
    </svg>
);

const IconXmark = () => (
    <svg viewBox="0 0 384 512" role="img" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
    </svg>
);

interface QualityCheckPanelProps {
    isOpen: boolean;
    onCancel: () => void;
    /** Concluir a revisão. Devolve ao modal pai os labels dos codes cujas regras
     *  precisam ser refinadas (codes distintos entre os itens rejeitados). */
    onApply: (refinedCodes: string[]) => void;
}

function QualityCheckPanel({ isOpen, onCancel, onApply }: QualityCheckPanelProps) {
    // Decisão por item. Pré-preenchida com a sugestão do juiz (agree → approve,
    // flag → reject); o usuário pode sobrescrever. Modela o padrão
    // LLM-as-judge propõe / humano confirma.
    const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
        Object.fromEntries(
            SAMPLE_ITEMS.map((item) => [item.id, item.verdict === 'flag' ? 'reject' : 'approve']),
        ),
    );

    if (!isOpen) return null;

    const setDecision = (id: string, decision: Decision) =>
        setDecisions((prev) => ({ ...prev, [id]: decision }));

    const rejectedItems = SAMPLE_ITEMS.filter((item) => decisions[item.id] === 'reject');
    const rejectedCount = rejectedItems.length;
    // Codes distintos entre os itens rejeitados — alvos do refinamento de regras.
    const refinedCodes = Array.from(new Set(rejectedItems.map((item) => item.assignedCode)));

    // OPEN: fallback quando quase toda a amostra é rejeitada (novo loop de treino
    // vs. ajuste manual). Aqui só sinalizamos; a ação continua a mesma.
    const mostlyRejected = rejectedCount >= Math.ceil(SAMPLE_ITEMS.length * 0.7);

    const confidenceLevel = (confidence: number) =>
        confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';

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
                            <p className="qc-subtitle">
                                Trained codebook applied to a {SAMPLE_PERCENT}% sample —{' '}
                                {SAMPLE_ITEMS.length} of {TOTAL_RESPONSES} responses. Review the AI
                                coding below; rejections refine the matching rules.
                            </p>
                        </div>
                        <button type="button" className="qc-btn-close" aria-label="Close" onClick={onCancel} />
                    </div>

                    {/* Body — lista de itens do sample */}
                    <div className="qc-body">
                        {mostlyRejected && (
                            <div className="qc-warning" role="status">
                                Most of the sample was rejected. Refining rules may not be enough —
                                consider retraining. {/* OPEN: loop de re-treino vs. ajuste manual */}
                            </div>
                        )}
                        <ul className="qc-list">
                            {SAMPLE_ITEMS.map((item) => {
                                const decision = decisions[item.id];
                                return (
                                    <li
                                        key={item.id}
                                        className={`qc-item qc-item--${decision}`}
                                    >
                                        <div className="qc-item-main">
                                            <div className="qc-item-answer">
                                                <span className="qc-respondent">{item.respondent}</span>
                                                <span className="qc-answer-text">{item.answer}</span>
                                            </div>
                                            <div className="qc-item-coding">
                                                <span className="qc-coded-as">Coded as</span>
                                                <span className="qc-code-chip">
                                                    <span className="qc-code-net">{item.assignedNet}</span>
                                                    <span className="qc-code-sep"> · </span>
                                                    <span className="qc-code-label">{item.assignedCode}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="qc-item-judge">
                                            <span
                                                className={`qc-confidence qc-confidence--${confidenceLevel(item.confidence)}`}
                                                title="LLM judge confidence"
                                            >
                                                {item.confidence}%
                                            </span>
                                            <span className={`qc-verdict qc-verdict--${item.verdict}`}>
                                                {item.verdict === 'agree' ? 'Judge agrees' : 'Judge flagged'}
                                            </span>
                                            <p className="qc-rationale">{item.rationale}</p>
                                        </div>

                                        <div className="qc-item-actions" role="group" aria-label="Approve or reject coding">
                                            <button
                                                type="button"
                                                className={`qc-decision qc-decision--approve${decision === 'approve' ? ' is-active' : ''}`}
                                                aria-pressed={decision === 'approve'}
                                                title="Approve this coding"
                                                onClick={() => setDecision(item.id, 'approve')}
                                            >
                                                <IconCheck />
                                                <span>Approve</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`qc-decision qc-decision--reject${decision === 'reject' ? ' is-active' : ''}`}
                                                aria-pressed={decision === 'reject'}
                                                title="Reject — refine this rule"
                                                onClick={() => setDecision(item.id, 'reject')}
                                            >
                                                <IconXmark />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="qc-footer">
                        <div className="qc-footer-summary">
                            {rejectedCount === 0 ? (
                                <span>All coding approved — no rules to refine.</span>
                            ) : (
                                <span>
                                    {rejectedCount} rejected · {refinedCodes.length} rule
                                    {refinedCodes.length === 1 ? '' : 's'} to refine
                                </span>
                            )}
                        </div>
                        <div className="qc-footer-actions">
                            <button type="button" className="qc-btn qc-btn--secondary" onClick={onCancel}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="qc-btn qc-btn--primary"
                                onClick={() => onApply(refinedCodes)}
                            >
                                {rejectedCount === 0 ? 'Confirm & continue' : 'Apply & refine rules'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QualityCheckPanel;

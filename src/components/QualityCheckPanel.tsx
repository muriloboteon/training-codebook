import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import './qualityCheckPanel.css';

// -----------------------------------------------------------------------------
// QualityCheckPanel — visor de revisão do "Quality Check" do fluxo de treino.
//
// Contexto: dentro do AccountCodebookRulesModal (o "Validator" de codes/regras
// da Account Codebooks) o usuário pode rodar um Quality Check. O codebook
// treinado é aplicado a uma AMOSTRA (~10%, mockada) da source data e cada
// resposta aparece com os codes que a AI aplicou. O usuário lê o verbatim +
// os codes e decide aprovar ou rejeitar a codificação daquela resposta. Ao
// rejeitar, pode (opcionalmente) escrever o motivo. As rejeições realimentam o
// refinamento das regras (feito pelo modal pai) antes da carga completa.
//
// Revisão 100% humana: NÃO há LLM-as-judge (confidence/veredito/rationale) —
// o sinal de qualidade é a decisão do usuário e o motivo que ele escreve.
//
// A aparência segue a convenção da família de modais de codes da Account
// Codebooks (accountCodebookRulesModal.css): raw rgb() + Figtree, para casar
// 1:1 com o modal onde ele é aberto, em vez de importar tokens.ts.
//
// Protótipo: dados mockados, estados simulados, sem backend nem chamada real de
// IA/LLM.
// -----------------------------------------------------------------------------

// Decisão do usuário sobre cada resposta do sample.
type Decision = 'approve' | 'reject';

// Label especial: a AI não conseguiu codificar a resposta. Renderiza como chip
// vermelho ("Uncoded Idea"), diferente dos codes normais (barra roxa).
const UNCODED = 'Uncoded Idea';

interface SampleItem {
    id: string;
    /** Verbatim da resposta na source data (mock). */
    answer: string;
    /** Labels dos codes que a AI atribuiu a esta resposta. Pode ser mais de um. */
    codes: string[];
}

// Sample mockado: ~10% da source data. Cada resposta traz um ou mais codes que
// a AI aplicou (algumas com vários, como o codes modal do Ascribe). Os tamanhos
// de verbatim variam de uma palavra a um parágrafo longo, para testar o card em
// respostas curtas e longas. Todos os codes existem no CODEBOOK_ROWS do modal
// pai, então a rejeição tem um alvo real para refinar.
const SAMPLE_ITEMS: SampleItem[] = [
    {
        id: 's1',
        answer:
            'I do most of my weekly shopping at Walmart because it is the closest and cheapest, but for produce and specialty items I will drive out to Whole Foods or Trader Joe’s on the weekend. When I am too busy to go in person I order through Instacart, and honestly Amazon Fresh has been a lifesaver for the heavy stuff like water and paper towels. Once a month we still do a big bulk run at Costco for the whole family.',
        codes: ['Walmart', 'Whole Foods', "Trader Joe's", 'Instacart', 'Amazon Fresh', 'Costco'],
    },
    {
        id: 's2',
        answer: 'mostly ubereats, sometimes doordash',
        codes: ['Uber Eats', 'DoorDash'],
    },
    {
        id: 's3',
        answer: 'I order food through Greetings',
        codes: ['GrubHub'],
    },
    {
        id: 's4',
        answer:
            'It depends on the week. For a quick top-up I run into Target or the Dollar General near my house, but the real grocery trip is Kroger or Publix depending on which coupons are better that week. My daughter usually splits a Costco membership with us for the bulk stuff.',
        codes: ['Target', 'Dollar General', 'Kroger', 'Publix', 'Costco'],
    },
    {
        id: 's5',
        answer: 'just uber',
        codes: ['Uber'],
    },
    {
        id: 's6',
        answer: 'Trader joes and whole foods on amazon',
        codes: ["Trader Joe's", 'Whole Foods'],
    },
    {
        id: 's7',
        answer: 'asdfgh',
        codes: [UNCODED],
    },
    {
        id: 's8',
        answer: 'netflix',
        codes: ['Netflix'],
    },
    {
        id: 's9',
        answer: 'Costco all the way, plus BJ’s for bulk',
        codes: ['Costco', "BJ's"],
    },
];

// OPEN: percentual da amostra (5–10%). Default do protótipo: 10%.
const SAMPLE_PERCENT = 10;
// Total de respostas na source data (mock), usado só para exibir "N de M (10%)".
const TOTAL_RESPONSES = Math.round(SAMPLE_ITEMS.length / (SAMPLE_PERCENT / 100));

interface QualityCheckPanelProps {
    isOpen: boolean;
    onCancel: () => void;
    /** Concluir a revisão. Devolve ao modal pai os labels dos codes cujas regras
     *  precisam ser refinadas (codes distintos entre as respostas rejeitadas). */
    onApply: (refinedCodes: string[]) => void;
}

function QualityCheckPanel({ isOpen, onCancel, onApply }: QualityCheckPanelProps) {
    // Decisão por resposta. Começa em estado nulo (nem approve nem reject): o
    // revisor é quem seleciona. Respostas sem decisão ficam como não revisadas.
    const [decisions, setDecisions] = useState<Record<string, Decision>>({});
    // Motivo (opcional) por resposta rejeitada. Sinal humano que substitui a
    // rationale do juiz; fica local ao painel (protótipo, sem backend).
    const [reasons, setReasons] = useState<Record<string, string>>({});
    // PROTÓTIPO: alterna entre versões do card para comparação (removível).
    const [layout, setLayout] = useState<'bottom' | 'rail' | 'stack'>('bottom');

    if (!isOpen) return null;

    const approve = (id: string) => {
        setDecisions((prev) => ({ ...prev, [id]: 'approve' }));
        // Aprovar limpa o motivo daquela resposta.
        setReasons((prev) => {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const reject = (id: string) => setDecisions((prev) => ({ ...prev, [id]: 'reject' }));

    const setReason = (id: string, value: string) =>
        setReasons((prev) => ({ ...prev, [id]: value }));

    const rejectedItems = SAMPLE_ITEMS.filter((item) => decisions[item.id] === 'reject');
    const rejectedCount = rejectedItems.length;
    // Codes distintos entre as respostas rejeitadas — alvos do refinamento de
    // regras. Uma resposta rejeitada contribui com todos os seus codes.
    const refinedCodes = Array.from(new Set(rejectedItems.flatMap((item) => item.codes)));

    // OPEN: fallback quando quase toda a amostra é rejeitada (novo loop de treino
    // vs. ajuste manual). Aqui só sinalizamos; a ação continua a mesma.
    const mostlyRejected = rejectedCount >= Math.ceil(SAMPLE_ITEMS.length * 0.7);

    // Progresso da revisão (respostas que já receberam uma decisão).
    const reviewedCount = SAMPLE_ITEMS.filter((item) => decisions[item.id]).length;

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
                        {/* PROTÓTIPO: comparação de versões do card (removível). */}
                        <div className="qc-layout-toggle" role="group" aria-label="Preview layout">
                            <button
                                type="button"
                                className={layout === 'bottom' ? 'is-active' : ''}
                                onClick={() => setLayout('bottom')}
                            >
                                Bottom bar
                            </button>
                            <button
                                type="button"
                                className={layout === 'rail' ? 'is-active' : ''}
                                onClick={() => setLayout('rail')}
                            >
                                Top right
                            </button>
                            <button
                                type="button"
                                className={layout === 'stack' ? 'is-active' : ''}
                                onClick={() => setLayout('stack')}
                            >
                                Stacked
                            </button>
                        </div>
                        <button type="button" className="qc-btn-close" aria-label="Close" onClick={onCancel} />
                    </div>

                    {/* Body — lista de respostas do sample */}
                    <div className="qc-body">
                        {mostlyRejected && (
                            <div className="qc-warning" role="status">
                                Most of the sample was rejected. Refining rules may not be enough —
                                consider retraining. {/* OPEN: loop de re-treino vs. ajuste manual */}
                            </div>
                        )}
                        <ul className={`qc-list qc-list--${layout}`}>
                            {SAMPLE_ITEMS.map((item) => {
                                const decision = decisions[item.id];
                                const isRejected = decision === 'reject';
                                const codingBlock = (
                                    <div className="qc-item-coding">
                                        <span className="qc-coded-as">Applied codes</span>
                                        <div className="qc-chips">
                                            {item.codes.map((code, i) => (
                                                <span
                                                    key={i}
                                                    className={`qc-code-chip${code === UNCODED ? ' qc-code-chip--uncoded' : ''}`}
                                                >
                                                    {code}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                                const actionsBlock = (
                                    <div
                                        className="qc-item-actions"
                                        role="group"
                                        aria-label="Approve or reject coding"
                                    >
                                        <span className="qc-actions-label">Is the AI coding correct?</span>
                                        <div className="qc-segment">
                                            <button
                                                type="button"
                                                className={`qc-decision qc-decision--approve${decision === 'approve' ? ' is-active' : ''}`}
                                                aria-pressed={decision === 'approve'}
                                                title="The coding looks right"
                                                onClick={() => approve(item.id)}
                                            >
                                                <ThumbsUp size={15} />
                                                <span>Looks right</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`qc-decision qc-decision--reject${isRejected ? ' is-active' : ''}`}
                                                aria-pressed={isRejected}
                                                title="The coding looks wrong"
                                                onClick={() => reject(item.id)}
                                            >
                                                <ThumbsDown size={15} />
                                                <span>Looks wrong</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                                return (
                                    <li
                                        key={item.id}
                                        className={`qc-item${decision ? ` qc-item--${decision}` : ''}`}
                                    >
                                        <div className="qc-item-row">
                                            <div className="qc-item-main">
                                                <div className="qc-item-answer">
                                                    <span className="qc-answer-text">{item.answer}</span>
                                                </div>
                                                {(layout === 'rail' || layout === 'stack') && codingBlock}
                                            </div>

                                            {layout === 'bottom' ? (
                                                <div className="qc-item-footer">
                                                    {codingBlock}
                                                    {actionsBlock}
                                                </div>
                                            ) : (
                                                actionsBlock
                                            )}
                                        </div>

                                        {/* Motivo (opcional) — só quando rejeitado. */}
                                        {isRejected && (
                                            <div className="qc-reason">
                                                <label
                                                    className="qc-reason-label"
                                                    htmlFor={`qc-reason-${item.id}`}
                                                >
                                                    What looks wrong?{' '}
                                                    <span className="qc-reason-optional">Optional</span>
                                                </label>
                                                <textarea
                                                    id={`qc-reason-${item.id}`}
                                                    className="qc-reason-input"
                                                    rows={2}
                                                    placeholder="e.g. a brand is missing, or a code doesn’t match what the respondent said"
                                                    value={reasons[item.id] ?? ''}
                                                    onChange={(e) => setReason(item.id, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="qc-footer">
                        <span className="qc-footer-progress">
                            {reviewedCount} of {SAMPLE_ITEMS.length} reviewed
                        </span>
                        <div className="qc-footer-actions">
                            <button type="button" className="qc-btn qc-btn--secondary" onClick={onCancel}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="qc-btn qc-btn--primary"
                                onClick={() => onApply(refinedCodes)}
                                disabled={reviewedCount === 0}
                            >
                                Finish quality check
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QualityCheckPanel;

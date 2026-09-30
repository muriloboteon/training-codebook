import React, { useEffect, useMemo, useState } from 'react';
import { X, UploadSimple } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import ModalButton from './ModalButton';
import SelectField from './SelectField';

// -----------------------------------------------------------------------------
// NewAICodebookModal — modal "New Codebook" da aba AI Coder.
//
// Aberto ao clicar no botão "New Codebook" do sub-header APENAS quando a aba
// ativa é AI Coder (na aba Coder o comportamento será outro, ainda não definido).
//
// Campos: Codebook ID + "Nets and codes", com duas origens (segmented control):
//   - "Enter nets and codes": textarea em formato indentado (net sem recuo,
//     codes recuados) + preview ao vivo ao lado.
//   - "Copy from existing codebook": dropdown de codebooks do projeto (mock)
//     + o mesmo preview.
// Trocar de modo não limpa os dados do outro; só o modo ativo vale no create.
//
// "Import from Excel" e "Download template" são apenas visuais (a importação
// ainda não foi implementada).
//
// "Create codebook" entrega a estrutura ao pai (que grava o registro na tabela
// do AI Coder) e fecha o modal. Protótipo: nada é persistido.
// -----------------------------------------------------------------------------

export interface CodebookCode {
    inputId?: string;
    name: string;
}

export interface CodebookNet {
    name: string;
    codes: CodebookCode[];
}

export interface CodebookStructure {
    /** Codes que aparecem antes de qualquer net (só no modo texto). */
    orphans: CodebookCode[];
    nets: CodebookNet[];
}

type SourceMode = 'text' | 'copy';

// Origem do codebook copiado (radio acima do dropdown no modo cópia).
type CodebookSource = 'coder' | 'ai-coder';

const CODEBOOK_SOURCE_OPTIONS: { value: CodebookSource; label: string }[] = [
    { value: 'coder', label: 'Coder Codebooks' },
    { value: 'ai-coder', label: 'AI coder Codebooks' },
];

interface ExistingCodebook {
    id: string;
    source: CodebookSource;
    name: string;
    nets: CodebookNet[];
}

// Mock: codebooks existentes do projeto (o protótipo não tem a estrutura de
// nets/codes dos codebooks reais).
const EXISTING_CODEBOOKS: ExistingCodebook[] = [
    {
        id: 'cb-1',
        source: 'coder',
        name: 'Customer Satisfaction — Core',
        nets: [
            { name: 'Price', codes: [{ inputId: '10', name: 'Price / value' }, { inputId: '11', name: 'Too expensive' }, { inputId: '12', name: 'Good deals / promotions' }] },
            { name: 'Service', codes: [{ inputId: '20', name: 'Friendly staff' }, { inputId: '21', name: 'Slow service' }, { inputId: '22', name: 'Helpful support' }] },
            { name: 'Product', codes: [{ inputId: '30', name: 'Quality' }, { inputId: '31', name: 'Variety' }] },
        ],
    },
    {
        id: 'cb-2',
        source: 'coder',
        name: 'NPS Reasons',
        nets: [
            { name: 'Promoters', codes: [{ inputId: '1', name: 'Easy to use' }, { inputId: '2', name: 'Reliable' }, { inputId: '3', name: 'Great support' }] },
            { name: 'Detractors', codes: [{ inputId: '4', name: 'Bugs / errors' }, { inputId: '5', name: 'Missing features' }, { inputId: '6', name: 'Price increase' }, { inputId: '7', name: 'Poor onboarding' }] },
        ],
    },
    {
        id: 'cb-3',
        source: 'coder',
        name: 'Brand Associations',
        nets: [
            { name: 'Positive', codes: [{ inputId: '100', name: 'Trustworthy' }, { inputId: '101', name: 'Innovative' }, { inputId: '102', name: 'Modern' }] },
            { name: 'Negative', codes: [{ inputId: '200', name: 'Expensive' }, { inputId: '201', name: 'Old-fashioned' }] },
            { name: 'Neutral', codes: [{ inputId: '300', name: 'Well known' }] },
        ],
    },
    {
        id: 'cb-4',
        source: 'ai-coder',
        name: 'Ad Recall — Spring Campaign',
        nets: [
            { name: 'Message', codes: [{ inputId: '10', name: 'Made for mornings' }, { inputId: '11', name: 'Energy / boost' }] },
            { name: 'Execution', codes: [{ inputId: '20', name: 'Music' }, { inputId: '21', name: 'Characters' }, { inputId: '22', name: 'Humor' }] },
            { name: 'Brand', codes: [{ inputId: '30', name: 'Logo recall' }] },
        ],
    },
    {
        id: 'cb-5',
        source: 'ai-coder',
        name: 'Employee Engagement',
        nets: [
            { name: 'Culture', codes: [{ inputId: '1', name: 'Team spirit' }, { inputId: '2', name: 'Recognition' }] },
            { name: 'Growth', codes: [{ inputId: '3', name: 'Career path' }, { inputId: '4', name: 'Training' }] },
            { name: 'Work-life', codes: [{ inputId: '5', name: 'Flexibility' }, { inputId: '6', name: 'Workload' }] },
        ],
    },
];

// Opções do dropdown do modo "Copy from existing codebook", por origem.
const codebookOptionsFor = (source: CodebookSource) =>
    EXISTING_CODEBOOKS.filter((c) => c.source === source).map((c) => ({ value: c.id, label: c.name }));

// ---------------------------------------------------------------------------
// Parsing do formato de texto
// ---------------------------------------------------------------------------

// Regras: linhas vazias são ignoradas; sem recuo = net; com recuo (espaço ou
// tab) = code da última net acima. Com useInputIds, "10 Price / value" vira
// Input ID 10 + code "Price / value". Codes antes de qualquer net vão para
// orphans.
function parseNetsAndCodes(text: string, useInputIds: boolean): CodebookStructure {
    const result: CodebookStructure = { orphans: [], nets: [] };
    for (const line of text.split(/\r?\n/)) {
        if (line.trim() === '') continue;
        if (!/^\s/.test(line)) {
            result.nets.push({ name: line.trim(), codes: [] });
            continue;
        }
        const raw = line.trim();
        const match = useInputIds ? raw.match(/^(\d+)\s+(.+)$/) : null;
        const code: CodebookCode = match ? { inputId: match[1], name: match[2] } : { name: raw };
        const lastNet = result.nets[result.nets.length - 1];
        if (lastNet) lastNet.codes.push(code);
        else result.orphans.push(code);
    }
    return result;
}

const countCodes = (s: CodebookStructure) => s.orphans.length + s.nets.reduce((n, net) => n + net.codes.length, 0);
const countLabel = (nets: number, codes: number) => `${nets} nets · ${codes} codes`;

const TEXT_PLACEHOLDER = 'Net 1\n    code 1\nNet 2\n    code 2\n    code 3';

// ---------------------------------------------------------------------------

interface NewAICodebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Chamado ao clicar "Create codebook" com a estrutura do modo ativo. */
    onCreate: (codebookId: string, structure: CodebookStructure) => void;
}

function NewAICodebookModal({ isOpen, onClose, onCreate }: NewAICodebookModalProps) {
    const [codebookId, setCodebookId] = useState('');
    const [mode, setMode] = useState<SourceMode>('text');
    const [text, setText] = useState('');
    const [useInputIds, setUseInputIds] = useState(true);
    const [codebookSource, setCodebookSource] = useState<CodebookSource>('coder');
    const [selectedCodebookId, setSelectedCodebookId] = useState<string | null>(null);

    // Reseta tudo a cada abertura.
    useEffect(() => {
        if (isOpen) {
            setCodebookId('');
            setMode('text');
            setText('');
            setUseInputIds(true);
            setCodebookSource('coder');
            setSelectedCodebookId(null);
        }
    }, [isOpen]);

    // Trocar a origem limpa a seleção (o codebook escolhido não está na nova lista).
    const handleCodebookSourceChange = (source: CodebookSource) => {
        setCodebookSource(source);
        setSelectedCodebookId(null);
    };

    // Fecha com ESC.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const parsed = useMemo(() => parseNetsAndCodes(text, useInputIds), [text, useInputIds]);
    const selectedCodebook = EXISTING_CODEBOOKS.find((c) => c.id === selectedCodebookId) ?? null;

    if (!isOpen) return null;

    // Estrutura exibida no preview / usada no create, conforme o modo ativo.
    const activeStructure: CodebookStructure | null = mode === 'text'
        ? parsed
        : selectedCodebook
            ? { orphans: [], nets: selectedCodebook.nets }
            : null;

    const canCreate = codebookId.trim() !== '' && (
        mode === 'text' ? countCodes(parsed) > 0 : selectedCodebook !== null
    );

    const handleCreate = () => {
        if (!canCreate || !activeStructure) return;
        // Cópia: o novo codebook não compartilha referência com o original.
        const copy: CodebookStructure = {
            orphans: activeStructure.orphans.map((c) => ({ ...c })),
            nets: activeStructure.nets.map((n) => ({ name: n.name, codes: n.codes.map((c) => ({ ...c })) })),
        };
        onCreate(codebookId.trim(), copy);
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="New Codebook"
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
                    width: '1300px',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: color.surface,
                    borderRadius: radius.xl,
                    boxShadow: shadow.modal,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>New Codebook</span>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.xs, border: 'none', background: 'none', cursor: 'pointer', borderRadius: radius.sm, color: color.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: space.xl, display: 'flex', flexDirection: 'column', gap: space.xl, overflowY: 'auto', minHeight: 0 }}>
                    <div style={fieldStyle}>
                        <label htmlFor="new-ai-codebook-name" style={labelStyle}>
                            Codebook ID<span style={requiredMarkStyle}>*</span>
                        </label>
                        <input
                            id="new-ai-codebook-name"
                            type="text"
                            value={codebookId}
                            onChange={(e) => setCodebookId(e.target.value)}
                            autoFocus
                            style={{ ...controlStyle, height: '40px', width: '400px', maxWidth: '100%' }}
                        />
                    </div>

                    <div style={fieldStyle}>
                        <span id="new-ai-codebook-nets-codes-label" style={labelStyle}>
                            Nets and codes<span style={requiredMarkStyle}>*</span>
                        </span>

                        {/* Seletor de origem + ações do modo texto */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.md }}>
                            <SourceSegmented value={mode} onChange={setMode} />
                            {mode === 'text' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
                                    {/* Visual apenas — download do template ainda não implementado. */}
                                    <button type="button" style={linkButtonStyle}>Download template</button>
                                    {/* Visual apenas — importação do Excel ainda não implementada. */}
                                    <ModalButton variant="secondary">
                                        <UploadSimple size={16} weight="bold" />
                                        Import from Excel
                                    </ModalButton>
                                </div>
                            )}
                        </div>

                        <div style={helperStyle}>
                            {mode === 'text'
                                ? 'One net per line. Indent the codes under their net.'
                                : 'Choose a codebook from this project. Its nets, codes and Input IDs are copied into the new codebook.'}
                        </div>

                        {/* Painel em duas colunas (50/50) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                            height: '420px',
                            border: `1px solid ${color.borderControl}`,
                            borderRadius: radius.lg,
                            overflow: 'hidden',
                        }}>
                            {/* Esquerda */}
                            {mode === 'text' ? (
                                <textarea
                                    aria-labelledby="new-ai-codebook-nets-codes-label"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={TEXT_PLACEHOLDER}
                                    spellCheck={false}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                        padding: `${space.md} ${space.lg}`,
                                        border: 'none',
                                        outline: 'none',
                                        resize: 'none',
                                        fontFamily: font.familyMono,
                                        fontSize: font.size.md,
                                        lineHeight: '20px',
                                        color: color.textDark,
                                        backgroundColor: color.surface,
                                    }}
                                />
                            ) : (
                                <div style={{ padding: space.lg, backgroundColor: color.surface, display: 'flex', flexDirection: 'column', gap: space.md }}>
                                    <div role="radiogroup" aria-label="Codebook source" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: space.xl }}>
                                        {CODEBOOK_SOURCE_OPTIONS.map((o) => (
                                            <label key={o.value} style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.md, lineHeight: '20px', color: color.textDark, cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="new-ai-codebook-source"
                                                    value={o.value}
                                                    checked={codebookSource === o.value}
                                                    onChange={() => handleCodebookSourceChange(o.value)}
                                                    style={{ width: '16px', height: '16px', margin: 0, accentColor: color.brand, cursor: 'pointer' }}
                                                />
                                                {o.label}
                                            </label>
                                        ))}
                                    </div>
                                    <SelectField
                                        ariaLabel="Codebook"
                                        placeholder="Select a codebook"
                                        options={codebookOptionsFor(codebookSource)}
                                        value={selectedCodebookId}
                                        onChange={setSelectedCodebookId}
                                    />
                                </div>
                            )}

                            {/* Direita — preview */}
                            <PreviewPanel
                                structure={activeStructure}
                                emptyText={mode === 'text'
                                    ? 'The structure will appear here as you type or import.'
                                    : 'Select a codebook to see its structure.'}
                                headerAction={mode === 'text' ? (
                                    <label
                                        title="Example: “10 Price / value” becomes Input ID 10, code “Price / value”."
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm, fontSize: font.size.sm, color: color.textDark, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={useInputIds}
                                            onChange={(e) => setUseInputIds(e.target.checked)}
                                            style={{ width: '16px', height: '16px', margin: 0, accentColor: color.brand, cursor: 'pointer' }}
                                        />
                                        Use leading numbers as Input IDs
                                    </label>
                                ) : null}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: `${space.md} ${space.xl}`, borderTop: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: space.sm, flexShrink: 0 }}>
                    <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
                    <ModalButton variant="primary" disabled={!canCreate} onClick={handleCreate}>Create codebook</ModalButton>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Segmented control da origem (mesmo visual do Segmented do Quality Check).
// ---------------------------------------------------------------------------

const SOURCE_OPTIONS: { value: SourceMode; label: string }[] = [
    { value: 'text', label: 'Enter nets and codes' },
    { value: 'copy', label: 'Copy from existing codebook' },
];

function SourceSegmented({ value, onChange }: { value: SourceMode; onChange: (v: SourceMode) => void }) {
    return (
        <div
            role="group"
            aria-label="Nets and codes source"
            style={{ display: 'inline-flex', flexShrink: 0, gap: '2px', padding: '2px', backgroundColor: color.tabTrack, borderRadius: radius.lg }}
        >
            {SOURCE_OPTIONS.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.value)}
                        style={{
                            height: '30px',
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

// ---------------------------------------------------------------------------
// Preview (compartilhado pelos dois modos) — somente leitura.
// ---------------------------------------------------------------------------

function PreviewPanel({
    structure,
    emptyText,
    headerAction,
}: {
    structure: CodebookStructure | null;
    emptyText: string;
    headerAction: React.ReactNode;
}) {
    const nets = structure?.nets.length ?? 0;
    const codes = structure ? countCodes(structure) : 0;
    const isEmpty = !structure || (nets === 0 && codes === 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: color.surfaceSubtle, borderLeft: `1px solid ${color.borderInput}` }}>
            <div style={{ padding: `${space.md} ${space.lg}`, borderBottom: `1px solid ${color.borderInput}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md, minHeight: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm }}>
                    <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: color.textMuted, letterSpacing: '0.05em' }}>PREVIEW</span>
                    <span style={{ fontSize: font.size.sm, color: color.textMuted }}>{countLabel(nets, codes)}</span>
                </div>
                {headerAction}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `${space.md} ${space.lg}` }}>
                {isEmpty ? (
                    <div style={{ fontSize: font.size.md, color: color.textMuted }}>{emptyText}</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
                        {structure!.orphans.length > 0 && (
                            <div>
                                <div style={{ ...previewNetStyle, color: color.warning }}>⚠ Codes without a net</div>
                                {structure!.orphans.map((c, i) => <PreviewCode key={i} code={c} />)}
                            </div>
                        )}
                        {structure!.nets.map((net, i) => (
                            <div key={i}>
                                <div style={previewNetStyle}>{net.name}</div>
                                {net.codes.map((c, j) => <PreviewCode key={j} code={c} />)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PreviewCode({ code }: { code: CodebookCode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm, paddingLeft: space.lg, fontSize: font.size.md, lineHeight: '22px', color: color.text }}>
            {code.inputId && (
                <span style={{ fontFamily: font.familyMono, fontSize: font.size.sm, color: color.textMuted, flexShrink: 0 }}>{code.inputId}</span>
            )}
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{code.name}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------

const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
};

const labelStyle: React.CSSProperties = {
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    lineHeight: '20px',
    color: color.textDark,
};

const requiredMarkStyle: React.CSSProperties = {
    color: color.danger,
    marginLeft: '2px',
};

const helperStyle: React.CSSProperties = {
    fontSize: font.size.sm,
    lineHeight: '18px',
    color: color.textSecondary,
};

const controlStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: `${space.sm} ${space.md}`,
    fontSize: font.size.md,
    lineHeight: '20px',
    color: color.textDark,
    border: `1px solid ${color.borderControl}`,
    borderRadius: radius.lg,
    outline: 'none',
    fontFamily: font.family,
};

const linkButtonStyle: React.CSSProperties = {
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: font.family,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    lineHeight: '20px',
    color: color.brandDark,
};

const previewNetStyle: React.CSSProperties = {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    lineHeight: '22px',
    color: color.textDark,
};

export default NewAICodebookModal;

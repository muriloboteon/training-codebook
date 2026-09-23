import { useEffect, useRef, useState } from 'react';
import { X, MagicWand, CheckCircle, Circle, Spinner } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';

// -----------------------------------------------------------------------------
// GenerateRulesProcessingModal — etapa de "assessment"/processamento do fluxo
// "Generate codebook rules" da Account Codebooks.
//
// Fica ENTRE o RecreateCodebookModal (onde o usuário seleciona estudos/perguntas
// e clica em "Generate codebook rules") e o AccountCodebookRulesModal (o
// validator de codes). Mostra um processamento simulado e, ao terminar, chama
// onComplete — o pai então fecha esta etapa e abre o validator.
//
// Protótipo puramente visual: o tempo é simulado por timers; nada é persistido.
// Estilo em tokens.ts + Phosphor (mesma linguagem do RecreateCodebookModal e do
// passo "Training" do TrainCodebookModal), com o accent TEAL do fluxo Recreate.
// -----------------------------------------------------------------------------

const PROCESSING_STEPS = [
    'Reading the selected responses…',
    'Analyzing answer patterns…',
    'Clustering responses into codes…',
    'Writing a rule for each code…',
    'Assembling your codebook…',
];

const STEP_MS = 900;
const FINISH_MS = 700;

interface GenerateRulesProcessingModalProps {
    isOpen: boolean;
    /** Chamado quando o processamento simulado termina. */
    onComplete: () => void;
    /** Chamado ao abortar (ESC / clique-fora / X). */
    onCancel: () => void;
}

function GenerateRulesProcessingModal({ isOpen, onComplete, onCancel }: GenerateRulesProcessingModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const timersRef = useRef<number[]>([]);

    // Simula o processamento e chama onComplete ao final. Keyed em isOpen: cada
    // (re)abertura reinicia a sequência do zero.
    useEffect(() => {
        if (!isOpen) return;
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setActiveIndex(0);

        PROCESSING_STEPS.forEach((_, i) => {
            const t = window.setTimeout(() => setActiveIndex(i), i * STEP_MS);
            timersRef.current.push(t);
        });
        const done = window.setTimeout(onComplete, PROCESSING_STEPS.length * STEP_MS + FINISH_MS);
        timersRef.current.push(done);

        return () => {
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [isOpen, onComplete]);

    // Fecha com ESC (aborta).
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Generating codebook rules"
            onMouseDown={onCancel}
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
                    width: '560px',
                    maxWidth: '100%',
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
                            <MagicWand size={20} weight="bold" color={color.teal} />
                            <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textStrong }}>
                                Generating codebook rules
                            </span>
                        </div>
                        <button
                            type="button"
                            aria-label="Cancel"
                            onClick={onCancel}
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

                {/* Body — spinner + checklist de etapas */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${space.xl} ${space.xl}` }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: radius.full,
                            backgroundColor: color.tealSoft,
                            marginBottom: space.lg,
                        }}
                    >
                        <Spinner size={28} weight="bold" color={color.teal} className="grp-spin" />
                    </div>
                    <div style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: color.textStrong }}>
                        Analyzing your responses…
                    </div>
                    <div style={{ fontSize: font.size.md, color: color.textMuted, marginTop: space.xs, textAlign: 'center' }}>
                        This may take a moment. We'll open the codebook for review when it's ready.
                    </div>

                    <div style={{ width: '100%', maxWidth: '420px', marginTop: space.xl, display: 'flex', flexDirection: 'column', gap: space.sm }}>
                        {PROCESSING_STEPS.map((label, i) => {
                            const done = i < activeIndex;
                            const active = i === activeIndex;
                            return (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                                    {done
                                        ? <CheckCircle size={18} weight="fill" color={color.success} />
                                        : active
                                            ? <Spinner size={18} weight="bold" color={color.teal} className="grp-spin" />
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

                    <style>{`@keyframes grp-spin { to { transform: rotate(360deg); } } .grp-spin { animation: grp-spin 0.9s linear infinite; }`}</style>
                </div>
            </div>
        </div>
    );
}

export default GenerateRulesProcessingModal;

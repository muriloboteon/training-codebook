import { useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { color, font, radius, space, shadow } from '../tokens';
import { INSTRUCTIONS_MODAL_HEIGHT } from './RecreateCodebookModal';

// -----------------------------------------------------------------------------
// GenerateRulesProcessingModal — etapa de "assessment"/processamento do fluxo
// "Generate codebook rules" da Account Codebooks.
//
// Fica ENTRE o RecreateCodebookModal (onde o usuário seleciona estudos/perguntas
// e clica em "Generate codebook rules") e o AccountCodebookRulesModal (o
// validator de codes). Mostra um processamento simulado e, ao terminar, chama
// onComplete — o pai então fecha esta etapa e abre o validator.
//
// Layout: mesmo chrome do modal de Instructions — mesma largura (560px), mesma
// altura (INSTRUCTIONS_MODAL_HEIGHT) e um header com título + fechar. Assim a
// transição Instructions → processamento não muda o tamanho do modal. O corpo
// mostra só o spinner, o título e o subtítulo (sem checklist nem textos de
// status que ficam trocando). O RecreateCodebook permanece aberto atrás, visível
// pelo overlay.
//
// Protótipo puramente visual: o tempo é simulado por um timer; nada é persistido.
// -----------------------------------------------------------------------------

// Duração simulada até abrir o validator de codes.
const PROCESS_MS = 10000;

interface GenerateRulesProcessingModalProps {
    isOpen: boolean;
    /** Chamado quando o processamento simulado termina. */
    onComplete: () => void;
    /** Chamado ao abortar (ESC / clique-fora / X). */
    onCancel: () => void;
}

function GenerateRulesProcessingModal({ isOpen, onComplete, onCancel }: GenerateRulesProcessingModalProps) {
    // Simula o processamento e chama onComplete ao final. Keyed em isOpen: cada
    // (re)abertura reinicia a contagem do zero.
    useEffect(() => {
        if (!isOpen) return;
        const done = window.setTimeout(onComplete, PROCESS_MS);
        return () => clearTimeout(done);
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
                // Acima do RecreateCodebookModal (2000), que segue aberto atrás.
                zIndex: 2100,
                padding: space.xl,
                fontFamily: font.family,
            }}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    // Mesma largura e altura do modal de Instructions — a
                    // transição não muda o tamanho do modal.
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
                {/* Header — mesmo chrome do modal de Instructions */}
                <div style={{ padding: `${space.lg} ${space.xl}`, borderBottom: `1px solid ${color.border}`, backgroundColor: color.surfaceSubtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textDark }}>Generating codebook rules</span>
                    <button
                        type="button"
                        aria-label="Cancel"
                        onClick={onCancel}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.xs, border: 'none', background: 'none', cursor: 'pointer', borderRadius: radius.sm, color: color.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surfaceHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body — spinner + título + subtítulo, centralizados */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: space.xl }}>
                    {/* Spinner do Figma (Claude-export, node 260:578): círculo roxo
                        suave com anel de trilha (30%) + arco girando, ambos em
                        #6C16C7 (color.brandHover). Paths inlinados do SVG
                        exportado; a trilha é simétrica, então giramos o SVG inteiro. */}
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
                        <svg
                            className="grp-spin"
                            width="28"
                            height="28"
                            viewBox="0 0 28 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                            style={{ display: 'block' }}
                        >
                            {/* Trilha — anel completo em 30% */}
                            <path
                                opacity="0.3"
                                d="M28 14C28 21.732 21.732 28 14 28C6.26801 28 0 21.732 0 14C0 6.26801 6.26801 0 14 0C21.732 0 28 6.26801 28 14ZM4.36544 14C4.36544 19.321 8.67898 23.6346 14 23.6346C19.321 23.6346 23.6346 19.321 23.6346 14C23.6346 8.67898 19.321 4.36544 14 4.36544C8.67898 4.36544 4.36544 8.67898 4.36544 14Z"
                                fill={color.brandHover}
                            />
                            {/* Arco — segmento que indica o giro */}
                            <path
                                d="M2.18272 14C0.977237 14 -0.017421 14.9831 0.169765 16.174C0.626829 19.0818 1.99302 21.792 4.1005 23.8995C6.20799 26.007 8.91821 27.3732 11.826 27.8302C13.0169 28.0174 14 27.0228 14 25.8173V25.8173C14 24.6118 13.0105 23.6592 11.8358 23.3884C10.0895 22.9858 8.47494 22.1003 7.18733 20.8127C5.89973 19.5251 5.01422 17.9105 4.61161 16.1642C4.3408 14.9895 3.3882 14 2.18272 14V14Z"
                                fill={color.brandHover}
                            />
                        </svg>
                    </div>

                    <div style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: color.textStrong }}>
                        Analyzing your responses…
                    </div>
                    <div style={{ fontSize: font.size.md, color: color.textStrong, marginTop: space.sm, lineHeight: '20px', maxWidth: '360px' }}>
                        We are reviewing your selected data to generate the codebook rules.
                    </div>
                </div>

                <style>{`@keyframes grp-spin { to { transform: rotate(360deg); } } .grp-spin { animation: grp-spin 0.9s linear infinite; }`}</style>
            </div>
        </div>
    );
}

export default GenerateRulesProcessingModal;

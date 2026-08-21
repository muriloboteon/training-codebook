import React from 'react';
import { color, font, radius } from '../tokens';

// -----------------------------------------------------------------------------
// PrototypeNav — barra de navegação SÓ de protótipo (validação).
//
// NÃO faz parte do produto real: serve apenas para alternar entre as telas do
// protótipo enquanto validamos hipóteses com o PM. Fica no topo, acima de tudo,
// e replica o visual do "PROTOTYPE NAV" usado em outros protótipos (barra
// escura, label à esquerda e abas com a ativa destacada em amarelo).
//
// Para remover no futuro, basta deixar de renderizar este componente no App.
// -----------------------------------------------------------------------------

export type PrototypeView = 'account-codebooks' | 'validator';

interface PrototypeNavProps {
    activeView: PrototypeView;
    onChange: (view: PrototypeView) => void;
}

const TABS: { id: PrototypeView; label: string }[] = [
    { id: 'account-codebooks', label: 'Account Codebooks' },
    { id: 'validator', label: 'Validator' },
];

function PrototypeNav({ activeView, onChange }: PrototypeNavProps) {
    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '4px 12px',
        borderRadius: radius.sm,
        border: 'none',
        fontFamily: font.family,
        fontSize: font.size.md,
        fontWeight: isActive ? font.weight.semibold : font.weight.medium,
        lineHeight: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        backgroundColor: isActive ? color.protoAccent : 'transparent',
        color: isActive ? color.protoAccentText : color.protoNavTabText,
    });

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                height: '40px',
                flexShrink: 0,
                padding: '0 16px',
                backgroundColor: color.protoNavBg,
                // Textura listrada diagonal sutil (igual ao print de referência)
                backgroundImage: `repeating-linear-gradient(45deg, ${color.protoNavStripe} 0, ${color.protoNavStripe} 1px, transparent 1px, transparent 8px)`,
            }}
        >
            <span
                style={{
                    fontFamily: font.family,
                    fontSize: font.size.sm,
                    fontWeight: font.weight.semibold,
                    letterSpacing: '0.5px',
                    color: color.protoNavLabel,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                }}
            >
                Prototype Nav →
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        style={tabStyle(activeView === tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default PrototypeNav;

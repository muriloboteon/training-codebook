import React, { useState } from 'react';
import { color, font, radius, space } from '../tokens';

// -----------------------------------------------------------------------------
// ModalButton — botão de footer compartilhado pelos modais do fluxo de
// codebooks (RecreateCodebookModal e TrainCodebookModal).
//
// Implementa o sistema de botões do Figma "Claude-export" (node 261:579):
// tipos Primary, Secondary e Tertiary, com os estados default / hover / active /
// disabled. Todas as cores vêm de tokens.ts (button state colors).
//
// Specs do Figma:
//   - Label: Figtree SemiBold 14 / lineHeight 20 (font.size.md + semibold)
//   - Radius: 8px (radius.lg) · Altura: 34px · Padding horizontal: 16px · gap 8px
//   - Primary  : bg #55198a → hover #681eab → active #4b1679 · texto #fff
//                disabled: bg #d6dde1, texto #889ea8
//   - Secondary: bg #fff, borda/texto #55198a
//                hover bg #faf5ff · active bg #faf5ff, borda/texto #4b1679
//                disabled: bg #fff, borda #d6dde1, texto #889ea8
//   - Tertiary : bg #fff, borda #889ea8, texto #232a2e
//                hover bg #eceff1 · active bg #d6dde1
//                disabled: bg #fff, borda #d6dde1, texto #889ea8
// -----------------------------------------------------------------------------

type ModalButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ModalButtonProps {
    variant: ModalButtonVariant;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
    title?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}

function ModalButton({ variant, children, onClick, disabled = false, type = 'button', style, ...rest }: ModalButtonProps) {
    const [hover, setHover] = useState(false);
    const [active, setActive] = useState(false);

    const base: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        height: '34px',
        padding: `0 ${space.lg}`,
        boxSizing: 'border-box',
        borderRadius: radius.lg,
        fontFamily: font.family,
        fontSize: font.size.md,
        fontWeight: font.weight.semibold,
        lineHeight: '20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
    };

    let variantStyle: React.CSSProperties;
    if (variant === 'primary') {
        const bg = disabled
            ? color.borderInput            // #D6DDE1 — button/primary/bg/disabled
            : active
                ? color.brandPrimaryActive // #4B1679
                : hover
                    ? color.brandPrimaryHover // #681EAB
                    : color.brandPrimary;  // #55198A
        variantStyle = {
            backgroundColor: bg,
            border: 'none',
            color: disabled ? color.borderControl : color.surface, // #889EA8 : #FFFFFF
        };
    } else if (variant === 'secondary') {
        variantStyle = {
            backgroundColor: disabled
                ? color.surface
                : (hover || active)
                    ? color.brandPrimarySoft // #FAF5FF
                    : color.surface,
            border: `1px solid ${disabled ? color.borderInput : active ? color.brandPrimaryActive : color.brandPrimary}`, // #D6DDE1 : #4B1679 : #55198A
            color: disabled ? color.borderControl : active ? color.brandPrimaryActive : color.brandPrimary, // #889EA8 : #4B1679 : #55198A
        };
    } else {
        const bg = disabled
            ? color.surface
            : active
                ? color.controlActive  // #D6DDE1 — button/tertiary/bg/active
                : hover
                    ? color.controlHover // #ECEFF1 — button/tertiary/bg/hover
                    : color.surface;
        variantStyle = {
            backgroundColor: bg,
            border: `1px solid ${disabled ? color.borderInput : color.borderControl}`, // #D6DDE1 : #889EA8
            color: disabled ? color.borderControl : color.textDark, // #889EA8 : #232A2E
        };
    }

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            style={{ ...base, ...variantStyle, ...style }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => { setHover(false); setActive(false); }}
            onMouseDown={() => setActive(true)}
            onMouseUp={() => setActive(false)}
            {...rest}
        >
            {children}
        </button>
    );
}

export default ModalButton;

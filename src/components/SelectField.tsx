import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { color, font, radius, space, shadow } from '../tokens';
import caretDown from '../assets/caret-down.svg';

// -----------------------------------------------------------------------------
// SelectField — dropdown de seleção única (Figma "Claude-export" › Select Field,
// node 268:681): label + trigger com caret + lista flutuante abaixo, e helper
// text opcional sob o trigger.
//
// A lista é posicionada em absoluto sob o trigger, então o container pai não
// pode ter overflow: hidden. Teclado: ↑/↓ navegam, Enter/Espaço escolhem, Esc
// fecha a lista sem propagar (não fecha o modal que hospeda o campo).
// -----------------------------------------------------------------------------

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    /** Label acima do trigger. Omitido quando o label fica fora do campo
     *  (ex.: inline numa toolbar) — nesse caso, passe ariaLabel. */
    label?: string;
    ariaLabel?: string;
    placeholder: string;
    options: SelectOption[];
    value: string | null;
    onChange: (value: string) => void;
    /** Texto de apoio abaixo do trigger (a lista aberta flutua sobre ele). */
    helperText?: string;
    /** 'md' (padrão, Figma) = 40px de altura; 'sm' = 32px, para toolbars. */
    size?: 'md' | 'sm';
}

function SelectField({ label, ariaLabel, placeholder, options, value, onChange, helperText, size = 'md' }: SelectFieldProps) {
    const [open, setOpen] = useState(false);
    // Item destacado por hover/teclado enquanto a lista está aberta.
    const [activeIndex, setActiveIndex] = useState(-1);
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const id = useId();

    const selected = options.find((o) => o.value === value) ?? null;

    // Fecha ao clicar fora. Captura: o modal pai para a propagação no mousedown.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown, true);
        return () => document.removeEventListener('mousedown', onDown, true);
    }, [open]);

    // Mantém o item destacado visível ao navegar pelo teclado.
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    const openList = () => {
        setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
    };

    const choose = (v: string) => {
        onChange(v);
        setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openList();
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(0, i - 1));
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (options[activeIndex]) choose(options[activeIndex].value);
        } else if (e.key === 'Tab') {
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: space.sm, fontFamily: font.family }}>
            {label && (
                <label id={`${id}-label`} htmlFor={`${id}-trigger`} style={{ fontSize: font.size.md, fontWeight: font.weight.medium, lineHeight: '20px', color: color.textDark }}>
                    {label}
                </label>
            )}

            {/* Trigger + helper text (4px entre eles, como o gap do Figma). */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
                {/* Âncora da lista: fica presa ao trigger, flutuando sobre o helper. */}
                <div style={{ position: 'relative' }}>
                    {/* Trigger — borda 1.5px roxa (input/border/focus) quando aberto. O
                        padding compensa a diferença de borda para não deslocar o texto. */}
                    <button
                        id={`${id}-trigger`}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        aria-controls={`${id}-list`}
                        aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
                        aria-label={label ? undefined : ariaLabel}
                        aria-describedby={helperText ? `${id}-helper` : undefined}
                        onClick={() => (open ? setOpen(false) : openList())}
                        onKeyDown={onKeyDown}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: space.sm,
                            width: '100%',
                            // Vertical: 'md' 10px → 40px; 'sm' 5px → 32px (texto de 20px + bordas).
                            padding: size === 'sm'
                                ? (open ? `4.5px ${space.md}` : '5px 12.5px')
                                : (open ? `10px ${space.md}` : '10.5px 12.5px'),
                            border: open ? `1.5px solid ${color.brandHover}` : `1px solid ${color.borderControl}`,
                            borderRadius: radius.lg,
                            backgroundColor: color.surface,
                            cursor: 'pointer',
                            fontFamily: font.family,
                            textAlign: 'left',
                            outline: 'none',
                        }}
                    >
                        <span
                            title={selected?.label}
                            style={{
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: font.size.md,
                                lineHeight: '20px',
                                color: selected ? color.textDark : color.textPlaceholder,
                            }}
                        >
                            {selected ? selected.label : placeholder}
                        </span>
                        <img src={caretDown} alt="" width={16} height={16} style={{ flexShrink: 0, display: 'block' }} />
                    </button>
        
                    {/* Lista flutuante — 4px abaixo do trigger, altura máx. 248px com rolagem. */}
                    {open && (
                        <div
                            id={`${id}-list`}
                            ref={listRef}
                            role="listbox"
                            aria-labelledby={label ? `${id}-label` : undefined}
                            aria-label={label ? undefined : ariaLabel}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: space.xs,
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                maxHeight: '248px',
                                overflowX: 'hidden',
                                overflowY: 'auto',
                                padding: space.xs,
                                border: `1px solid ${color.borderInput}`,
                                borderRadius: radius.lg,
                                backgroundColor: color.surface,
                                boxShadow: shadow.menu,
                                scrollbarWidth: 'thin',
                                scrollbarColor: `${color.borderInput} transparent`,
                            }}
                        >
                            {options.map((o, i) => {
                                const isSelected = o.value === value;
                                const isActive = i === activeIndex;
                                return (
                                    <div
                                        key={o.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => choose(o.value)}
                                        style={{
                                            flexShrink: 0,
                                            padding: `${space.sm} ${space.md}`,
                                            borderRadius: radius.md,
                                            backgroundColor: isSelected || isActive ? color.controlHover : 'transparent',
                                            fontSize: font.size.md,
                                            lineHeight: '20px',
                                            fontWeight: isSelected ? font.weight.medium : font.weight.regular,
                                            color: isSelected ? color.textDark : color.textSecondary,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {o.label}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {helperText && (
                    <span id={`${id}-helper`} style={{ fontSize: font.size.md, lineHeight: '20px', color: color.textSubtle }}>
                        {helperText}
                    </span>
                )}
            </div>
        </div>
    );
}

export default SelectField;

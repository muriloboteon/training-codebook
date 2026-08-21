import React, { useState, useRef, useEffect } from 'react';
import {
    List,
    CaretDown,
    Question,
    Plus,
    FileXls,
    Faders,
    ArrowsClockwise,
} from '@phosphor-icons/react';
import { color, font, radius, shadow } from '../tokens';
import CoderCodebooksTable from './CoderCodebooksTable';
import AICodebooksTable from './AICodebooksTable';

// -----------------------------------------------------------------------------
// AccountCodebooksPage — compõe o protótipo de Account Codebooks:
//   1. Barra superior escura (nav)
//   2. Sub-header com abas (Coder / AI Coder) + Actions + New Codebook
//   3. Toolbar compartilhada de busca + ícones
//   4. Tabelas específicas de Coder e AI Coder
//
// Observações:
// - O logo "ascribe" é renderizado como texto (o projeto original usava uma
//   imagem em /assets/attachments/vector.png). Troque por <img> se tiver o asset.
// - Os botões sem fluxo conectado são hipóteses visuais do protótipo.
// - O próximo passo após Train Codebook ainda não foi definido.
// -----------------------------------------------------------------------------

type Tab = 'coder' | 'ai-coder';

function AccountCodebooksPage() {
    const [activeTab, setActiveTab] = useState<Tab>('coder');
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [coderSearchQuery, setCoderSearchQuery] = useState('');
    const [aiCodebooksSearchQuery, setAICodebooksSearchQuery] = useState('');
    const [, setAICodebooksSelectedCount] = useState(0);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    const activeSearchQuery = activeTab === 'coder' ? coderSearchQuery : aiCodebooksSearchQuery;

    const updateActiveSearchQuery = (value: string) => {
        if (activeTab === 'coder') {
            setCoderSearchQuery(value);
        } else {
            setAICodebooksSearchQuery(value);
        }
    };

    // Fecha o menu Actions ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setIsActionsMenuOpen(false);
            }
        }
        if (isActionsMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActionsMenuOpen]);

    const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        borderRadius: radius.md,
        border: "none",
        fontSize: font.size.md,
        fontWeight: font.weight.medium,
        lineHeight: "20px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        backgroundColor: isActive ? color.surface : "transparent",
        color: isActive ? color.brandPrimary : color.textTab,
        boxShadow: isActive ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)" : "none",
        fontFamily: font.family,
    });

    const iconButtonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        backgroundColor: color.surface,
        border: `1px solid ${color.borderControl}`,
        borderRadius: radius.lg,
        cursor: "pointer",
    };

    // Interactive state handlers (hover / active), mapeados dos tokens
    // button/{type}/bg/{state} do Figma. Só o background muda entre estados.
    const setBg = (el: HTMLButtonElement, c: string) => { el.style.backgroundColor = c; };

    // Primary (New Codebook): default #55198A, hover #681EAB, active #4B1679
    const primaryStateHandlers = {
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.brandPrimaryHover),
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.brandPrimary),
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.brandPrimaryActive),
        onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.brandPrimaryHover),
    };

    // Tertiary (Actions, icon buttons): default white, hover #ECEFF1, active #D6DDE1
    const tertiaryStateHandlers = {
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.controlHover),
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.surface),
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.controlActive),
        onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => setBg(e.currentTarget, color.controlHover),
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            fontFamily: font.family,
            backgroundColor: color.surface,
        }}>
            {/* 1. Barra superior (nav) */}
            <nav
                style={{
                    height: "50px",
                    backgroundColor: color.navBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 16px",
                    flexShrink: 0,
                    position: "relative",
                }}
            >
                {/* Esquerda */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <List size={24} color={color.surface} style={{ cursor: "pointer" }} />
                    <span style={{ color: color.surface, fontSize: font.size.lg, fontFamily: font.family }}>Account Codebooks</span>
                </div>

                {/* Centro - Logo */}
                <div style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                }}>
                    <span style={{
                        color: color.surface,
                        fontSize: font.size.lg,
                        fontWeight: font.weight.semibold,
                        letterSpacing: "0.5px",
                        fontFamily: font.family,
                    }}>
                        ascribe
                    </span>
                </div>

                {/* Direita */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                        <span style={{ color: color.surface, fontSize: font.size.md, fontFamily: font.family }}>account.name</span>
                        <CaretDown size={14} color={color.surface} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                        <span style={{ color: color.surface, fontSize: font.size.md, fontFamily: font.family }}>user.name</span>
                        <CaretDown size={14} color={color.surface} />
                    </div>
                    <Question size={20} color={color.surface} style={{ cursor: "pointer" }} />
                </div>
            </nav>

            {/* 2. Sub-header: abas + Actions + New Codebook */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "12px 24px",
                    borderBottom: `1px solid ${color.borderInput}`,
                    backgroundColor: color.surfaceHeader,
                    flexShrink: 0,
                }}
            >
                {/* Abas */}
                <div style={{
                    display: "inline-flex",
                    padding: "4px",
                    backgroundColor: color.tabTrack,
                    borderRadius: radius.lg,
                    gap: "4px",
                }}>
                    <button type="button" onClick={() => setActiveTab('coder')} style={tabButtonStyle(activeTab === 'coder')}>
                        Coder
                    </button>
                    <button type="button" onClick={() => setActiveTab('ai-coder')} style={tabButtonStyle(activeTab === 'ai-coder')}>
                        AI Coder
                    </button>
                </div>

                {/* Actions + New Codebook */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    <div ref={actionsMenuRef} style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                            {...tertiaryStateHandlers}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                backgroundColor: color.surface,
                                border: `1px solid ${color.borderControl}`,
                                borderRadius: radius.lg,
                                fontSize: font.size.md,
                                fontWeight: font.weight.semibold,
                                lineHeight: "20px",
                                color: color.textDark,
                                cursor: "pointer",
                                fontFamily: font.family,
                            }}
                        >
                            Actions
                            <CaretDown size={16} color={color.textDark} />
                        </button>
                        {isActionsMenuOpen && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                marginTop: "4px",
                                backgroundColor: color.surface,
                                borderRadius: radius.lg,
                                boxShadow: shadow.dropdown,
                                border: `1px solid ${color.border}`,
                                zIndex: 1000,
                                minWidth: "190px",
                                padding: "4px 0",
                            }}>
                                <button type="button" onClick={() => setIsActionsMenuOpen(false)} style={menuItemStyle}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.surfaceHover; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                                >
                                    <FileXls size={16} color={color.text} />
                                    Export to Excel
                                </button>
                            </div>
                        )}
                    </div>
                    {/* New Codebook (CTA primário) */}
                    <button
                        type="button"
                        {...primaryStateHandlers}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            backgroundColor: color.brandPrimary,
                            border: "none",
                            borderRadius: radius.lg,
                            fontSize: font.size.md,
                            fontWeight: font.weight.semibold,
                            lineHeight: "20px",
                            color: color.surface,
                            cursor: "pointer",
                            fontFamily: font.family,
                        }}
                    >
                        <Plus size={16} color={color.surface} weight="bold" />
                        New Codebook
                    </button>
                </div>
            </div>

            {/* 3. Toolbar de filtros */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "12px 24px",
                    backgroundColor: color.surface,
                    flexShrink: 0,
                }}
            >
                {/* Search + ícones */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "6px 12px",
                        backgroundColor: color.surface,
                        border: `1px solid ${color.borderControl}`,
                        borderRadius: radius.lg,
                        width: "250px",
                    }}>
                        <input
                            className="tb-search"
                            type="text"
                            placeholder="Search"
                            value={activeSearchQuery}
                            onChange={(e) => updateActiveSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                padding: 0,
                                border: "none",
                                backgroundColor: "transparent",
                                fontSize: font.size.md,
                                lineHeight: "20px",
                                color: color.text,
                                fontFamily: font.family,
                                outline: "none",
                            }}
                        />
                        {activeSearchQuery && (
                            <button
                                type="button"
                                onClick={() => updateActiveSearchQuery('')}
                                aria-label="Clear search"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "16px",
                                    height: "20px",
                                    padding: 0,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    color: color.textDark,
                                    fontSize: font.size.lg,
                                    lineHeight: "20px",
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <button type="button" {...tertiaryStateHandlers} style={iconButtonStyle}>
                        <Faders size={16} color={color.textDark} />
                    </button>
                    <button type="button" {...tertiaryStateHandlers} style={iconButtonStyle}>
                        <ArrowsClockwise size={16} color={color.textDark} />
                    </button>
                </div>
            </div>

            {/* 4. Área de conteúdo — a tabela */}
            <div style={{ flex: 1, padding: "0 24px 24px", overflow: "auto" }}>
                {activeTab === 'coder' ? (
                    <CoderCodebooksTable
                        searchQuery={coderSearchQuery}
                    />
                ) : (
                    <AICodebooksTable
                        searchQuery={aiCodebooksSearchQuery}
                        onSelectionChange={setAICodebooksSelectedCount}
                    />
                )}
            </div>
        </div>
    );
}

const menuItemStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: font.size.md,
    fontFamily: font.family,
    color: color.text,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "background-color 0.15s ease",
};

export default AccountCodebooksPage;

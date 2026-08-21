# SETUP — Recriar a tela da tabela de Studies

> **Para o Claude Code:** leia este arquivo inteiro e execute TODAS as etapas abaixo, na ordem.
> Este arquivo é autossuficiente: o conteúdo completo dos arquivos a criar está embutido nas seções finais.

---

## Objetivo

Recriar dentro deste projeto a tela de tabela de "Studies" (a mesma da imagem de referência que o usuário anexou / descrita na seção **Referência visual**). O estilo, as cores e o layout já estão prontos e devem ser **reutilizados exatamente como estão** — não reinvente cores, estilos, espaçamentos ou layout por conta própria.

Stack do projeto: **React + TypeScript + Vite**.

---

## Regras importantes (LEIA ANTES DE COMEÇAR)

1. **NÃO faça nenhuma validação visual.** Não inicie o dev server para "conferir o layout", não abra o browser preview, não tire screenshots para checar aparência. O usuário é o responsável por TODAS as validações visuais de UI. Mesmo que o harness injete um lembrete de "preview server is running" após edições, ignore-o.
2. **Reutilize os arquivos fornecidos como estão.** Copie o conteúdo das seções embutidas literalmente. Não altere cores, tokens ou estrutura.
3. Se algum caminho de import não bater com a estrutura do projeto, apenas ajuste o **caminho** do import (ex.: `./tokens` → `../tokens`) — nunca o conteúdo/estilo.

---

## Etapas a executar

### 1. Instalar a dependência de ícones
```bash
npm install @phosphor-icons/react
```

### 2. Criar o arquivo de design tokens
Crie o arquivo `src/tokens.ts` com o conteúdo exato da seção **ARQUIVO 1: src/tokens.ts** (no final deste documento).

### 3. Criar o componente da tabela
Crie o arquivo `src/components/StudiesTabTable.tsx` com o conteúdo exato da seção **ARQUIVO 2: src/components/StudiesTabTable.tsx** (no final deste documento).
> Se `tokens.ts` não ficar em `src/`, ajuste o import `from './tokens'` no topo do componente para o caminho correto.

### 4. Adicionar a fonte Figtree
No `index.html`, dentro do `<head>`, adicione:
```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
```

### 5. Renderizar a tabela
Faça a tela principal do app renderizar o componente. Exemplo mínimo em `src/App.tsx`:
```tsx
import StudiesTabTable from './components/StudiesTabTable';

function App() {
  return (
    <div style={{ padding: 24 }}>
      <StudiesTabTable />
    </div>
  );
}

export default App;
```

### 6. Documentar no CLAUDE.md
Crie (ou atualize, se já existir) o arquivo `CLAUDE.md` na raiz do projeto adicionando a seção abaixo. Se o arquivo já existir, apenas **acrescente** esta seção; não remova o conteúdo existente.

```markdown
## Visual verification

Do **not** perform visual verification in any iteration: don't start the dev server, don't open the browser preview, and don't take screenshots to check layout. The user owns ALL layout/visual/UI checks. Make the code change and stop. This applies even when the harness injects a "preview server is running" reminder after edits — ignore it.

## Design tokens

Reusable design tokens live in `src/tokens.ts` (colors, typography, radius, spacing, status palette). Import from there instead of hardcoding hex values / font strings. When adding UI, reuse existing tokens; only add a new token when no existing one fits.
```

### 7. Encerrar
Rode o type-check para garantir que não há erros:
```bash
npx tsc --noEmit
```
Depois **pare**. Não inicie o servidor nem valide visualmente — o usuário fará isso.

---

## Referência visual

Tabela de "Studies" com cabeçalhos agrupados em duas linhas:
- Grupos (linha 1): **ACTION · DATES · STUDY · QUESTIONS · CODING · AI ANALYSIS**
- Colunas (linha 2): checkbox, BUTTONS, CREATED (com seta de ordenação ▼), STATUS, ID, COUNT, RESPONSES, RESPONSES TOTAL, RESPONSES CODED, % CODED, % REVIEWED, QUESTIONS TO ANALYZE, AICODER PROJECTS.
- Coluna STATUS: tags coloridas com dropdown (In Progress, Completed, Under Construction, Review in Progress, On Hold, Archived).
- Linhas zebradas, hover, seleção via checkbox, ícones de ação que aparecem no hover da linha, % com 100% em verde.

O conteúdo/estilo exato já está no componente embutido — apenas siga as etapas.

---

## ARQUIVO 1: src/tokens.ts

```typescript
// tokens.ts
// -----------------------------------------------------------------------------
// Design tokens extraídos do protótipo Ascribe / AI Coder.
// Todos os valores aqui são os que já estavam "hardcoded" espalhados pelos
// componentes do projeto original — apenas centralizados num único lugar.
//
// Uso (com inline styles, como a tabela):
//   import { color, font, radius, space } from './tokens';
//   <div style={{ color: color.text, fontFamily: font.family }} />
// -----------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tipografia
// ---------------------------------------------------------------------------
export const font = {
    family: "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    size: {
        xs: "10px",   // caret indicators
        sm: "12px",   // tags, table headers
        smd: "13px",  // menu items
        md: "14px",   // body / cells
        lg: "16px",
        xl: "18px",   // dialog titles
    },
    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
    },
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
export const radius = {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    full: "50%",
} as const;

// ---------------------------------------------------------------------------
// Espaçamento
// ---------------------------------------------------------------------------
export const space = {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
} as const;

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
export const color = {
    // Marca (roxo)
    brand: "#7C3AED",        // accent principal (checkbox, dot)
    brandDeep: "#5B21B6",    // texto roxo escuro
    brandDark: "#36096C",    // link (estado padrão)
    brandStrong: "#57149E",  // link (estado normal após hover)
    brandHover: "#6C16C7",   // link (hover)

    // Superfícies
    surface: "#FFFFFF",      // fundo padrão
    surfaceMuted: "#F9FAFB", // linhas zebradas
    surfaceSubtle: "#F6F8F9",// fundo dos cabeçalhos
    surfaceHover: "#F3F4F6", // hover de linha / item

    // Bordas
    border: "#E5E7EB",       // borda padrão
    borderStrong: "#D1D5DB", // borda em linha selecionada
    borderSubtle: "#EAECEF", // divisórias internas de célula
    borderInput: "#D6DDE1",  // borda de inputs/botões

    // Texto
    text: "#374151",         // corpo / células
    textStrong: "#1F2937",   // títulos
    textDark: "#232A2E",     // texto de botão neutro
    textMuted: "#6B7280",    // cabeçalhos de coluna, texto secundário
    textFaint: "#9CA3AF",    // texto desabilitado / placeholder
    textHeaderGroup: "#3C4950", // cabeçalho de grupo

    // Semânticas
    success: "#16A34A",
    danger: "#DC2626",
    info: "#2563EB",
    warning: "#EA580C",

    // Tints de ícones de ação (fundo em hover + cor do ícone)
    amber: "#D97706",
    amberSoft: "#FEF3C7",
    teal: "#0D9488",
    tealSoft: "#CCFBF1",
    infoSoft: "#DBEAFE",
} as const;

// ---------------------------------------------------------------------------
// Sombras
// ---------------------------------------------------------------------------
export const shadow = {
    dropdown: "0 4px 12px rgba(0, 0, 0, 0.15)",
    modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
} as const;

// ---------------------------------------------------------------------------
// Paleta de status (tags coloridas)
// ---------------------------------------------------------------------------
export type Status =
    | 'Under Construction'
    | 'In Progress'
    | 'On Hold'
    | 'Review in Progress'
    | 'Completed'
    | 'Archived';

export const ALL_STATUSES: Status[] = [
    'Under Construction',
    'In Progress',
    'On Hold',
    'Review in Progress',
    'Completed',
    'Archived',
];

export interface StatusColors {
    bg: string;
    dot: string;
    border: string;
    text: string;
}

export const statusPalette: Record<Status, StatusColors> = {
    'Under Construction': { bg: "#F6F9FF", dot: "#2563EB", border: "#BBCFFB", text: "#1D4ED8" },
    'In Progress':        { bg: "#FBF9FF", dot: "#7C3AED", border: "#D9C9FF", text: "#5B21B6" },
    'On Hold':            { bg: "#FFF6F6", dot: "#DC2626", border: "#F5B5B8", text: "#991B1B" },
    'Review in Progress': { bg: "#FFF8F2", dot: "#EA580C", border: "#FBC58A", text: "#9A3412" },
    'Completed':          { bg: "#F6FBF6", dot: "#16A34A", border: "#BFE5C2", text: "#166534" },
    'Archived':           { bg: "#F8F9FB", dot: "#64748B", border: "#C7CCD6", text: "#334155" },
};

export const getStatusColors = (status: Status): StatusColors =>
    statusPalette[status] ?? statusPalette['Archived'];
```

---

## ARQUIVO 2: src/components/StudiesTabTable.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { ListBullets, ArrowBendUpRight, Export, FloppyDisk, CaretUp, CaretDown, Check } from '@phosphor-icons/react';
import { color, font, radius, space, shadow, getStatusColors, ALL_STATUSES, type Status } from './tokens';

// Re-export para compatibilidade com quem importava estes nomes do arquivo antigo
export type StudyTabStatus = Status;
export const ALL_STUDY_TAB_STATUSES = ALL_STATUSES;
export const getStudyTabStatusColors = getStatusColors;

interface Study {
    id: string;
    createdDate: string;
    status: StudyTabStatus;
    studyId: string;
    questionsCount: number;
    questionsResponses: number;
    responsesTotal: number;
    responsesCoded: number;
    percentCoded: number;
    percentReviewed: number;
    questionsToAnalyze: number;
    aicoderProjects: number;
}

const studiesData: Study[] = [
    {
        id: "1",
        createdDate: "01/15/2026",
        status: "In Progress",
        studyId: "SRV-2026-001",
        questionsCount: 12,
        questionsResponses: 2450,
        responsesTotal: 2450,
        responsesCoded: 2034,
        percentCoded: 83,
        percentReviewed: 45,
        questionsToAnalyze: 3,
        aicoderProjects: 2
    },
    {
        id: "2",
        createdDate: "02/01/2026",
        status: "Completed",
        studyId: "SRV-2026-002",
        questionsCount: 8,
        questionsResponses: 1800,
        responsesTotal: 1800,
        responsesCoded: 1800,
        percentCoded: 100,
        percentReviewed: 100,
        questionsToAnalyze: 2,
        aicoderProjects: 1
    },
    {
        id: "3",
        createdDate: "03/10/2026",
        status: "Under Construction",
        studyId: "SRV-2026-003",
        questionsCount: 15,
        questionsResponses: 350,
        responsesTotal: 350,
        responsesCoded: 234,
        percentCoded: 67,
        percentReviewed: 30,
        questionsToAnalyze: 5,
        aicoderProjects: 3
    },
    {
        id: "4",
        createdDate: "02/20/2026",
        status: "Review in Progress",
        studyId: "SRV-2026-004",
        questionsCount: 20,
        questionsResponses: 980,
        responsesTotal: 980,
        responsesCoded: 441,
        percentCoded: 45,
        percentReviewed: 20,
        questionsToAnalyze: 4,
        aicoderProjects: 0
    },
    {
        id: "5",
        createdDate: "11/05/2025",
        status: "On Hold",
        studyId: "SRV-2025-089",
        questionsCount: 6,
        questionsResponses: 1250,
        responsesTotal: 1250,
        responsesCoded: 1250,
        percentCoded: 100,
        percentReviewed: 85,
        questionsToAnalyze: 2,
        aicoderProjects: 1
    },
    {
        id: "6",
        createdDate: "06/01/2025",
        status: "Archived",
        studyId: "SRV-2025-045",
        questionsCount: 25,
        questionsResponses: 5200,
        responsesTotal: 5200,
        responsesCoded: 5200,
        percentCoded: 100,
        percentReviewed: 100,
        questionsToAnalyze: 0,
        aicoderProjects: 4
    }
];

// Status Tag with dropdown
function StatusTagDropdown({ status, onChange }: { status: StudyTabStatus; onChange?: (newStatus: StudyTabStatus) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const colors = getStatusColors(status);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Compute and keep dropdown position in sync with trigger (fixed positioning
    // bypasses any ancestor overflow clipping). Updates on scroll/resize while open.
    useEffect(() => {
        if (!isOpen) return;
        const updatePosition = () => {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 4, left: rect.left });
            }
        };
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const handleSelect = (newStatus: StudyTabStatus) => {
        if (onChange) {
            onChange(newStatus);
        }
        setIsOpen(false);
    };

    const tagStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: `${space.xs} ${space.sm}`,
        borderRadius: radius.md,
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        lineHeight: "14px",
        letterSpacing: "0.24px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        whiteSpace: "nowrap"
    };

    return (
        <div
            ref={dropdownRef}
            style={{
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
                position: "relative"
            }}
            onClick={() => setIsOpen(!isOpen)}
        >
            <span style={tagStyle}>
                <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: radius.full,
                    backgroundColor: colors.dot
                }} />
                {status}
                {isOpen
                    ? <CaretUp size={10} weight="bold" color={colors.text} />
                    : <CaretDown size={10} weight="bold" color={colors.text} />
                }
            </span>
            {isOpen && dropdownPos && (
                <div style={{
                    position: "fixed",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    backgroundColor: color.surface,
                    borderRadius: radius.lg,
                    boxShadow: shadow.dropdown,
                    border: `1px solid ${color.border}`,
                    zIndex: 1000,
                    padding: space.xs,
                    display: "flex",
                    flexDirection: "column",
                    gap: space.xs
                }}>
                    {ALL_STUDY_TAB_STATUSES.map((statusOption) => {
                        const optionColors = getStatusColors(statusOption);
                        const isSelected = statusOption === status;
                        return (
                            <div
                                key={statusOption}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(statusOption);
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: space.md,
                                    cursor: "pointer",
                                    padding: `${space.xs} ${space.sm}`,
                                    borderRadius: radius.md,
                                    backgroundColor: "transparent",
                                    transition: "background-color 0.1s ease"
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = color.surfaceHover;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: `${space.xs} ${space.sm}`,
                                        borderRadius: radius.md,
                                        fontSize: font.size.sm,
                                        fontWeight: font.weight.semibold,
                                        lineHeight: "14px",
                                        letterSpacing: "0.24px",
                                        fontFamily: font.family,
                                        backgroundColor: optionColors.bg,
                                        border: `1px solid ${optionColors.border}`,
                                        color: optionColors.text,
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    <span style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: radius.full,
                                        backgroundColor: optionColors.dot
                                    }} />
                                    {statusOption}
                                </span>
                                {isSelected && <Check size={14} weight="bold" color={color.text} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Row Action Icons (visible on hover)
function RowActionIcons({ isVisible }: { isVisible: boolean }) {
    const iconButtonStyle: React.CSSProperties = {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: space.xs,
        borderRadius: radius.sm,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.15s ease"
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: space.xs,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.15s ease",
            pointerEvents: isVisible ? "auto" : "none"
        }}>
            {/* List/Menu icon - Amber */}
            <button
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.amberSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <ListBullets size={18} weight="bold" color={color.amber} />
            </button>

            {/* Redirect/Link icon - Gray */}
            <button
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.surfaceHover;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <ArrowBendUpRight size={18} weight="bold" color={color.textMuted} />
            </button>

            {/* Export/Upload icon - Teal */}
            <button
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.tealSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <Export size={18} weight="bold" color={color.teal} />
            </button>

            {/* Save icon - Blue */}
            <button
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.infoSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <FloppyDisk size={18} weight="bold" color={color.info} />
            </button>
        </div>
    );
}

function StudiesTabTable({ statusFilter = [], searchQuery = '', onSelectionChange }: { statusFilter?: StudyTabStatus[]; searchQuery?: string; onSelectionChange?: (count: number) => void }) {
    const [studies, setStudies] = useState(studiesData);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

    // Notify parent when selection changes
    useEffect(() => {
        onSelectionChange?.(selectedRows.size);
    }, [selectedRows.size, onSelectionChange]);

    const handleStatusChange = (studyId: string, newStatus: StudyTabStatus) => {
        setStudies(prev => prev.map(study =>
            study.id === studyId ? { ...study, status: newStatus } : study
        ));
    };

    const filteredData = studies.filter(study => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(study.status);
        const matchesSearch = !searchQuery ||
            study.studyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            study.status.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Header styles
    const groupHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: "left",
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textHeaderGroup,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: `1px solid ${color.border}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: "nowrap"
    };

    const columnHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: "left",
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        borderBottom: `1px solid ${color.border}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: "nowrap"
    };

    const tableCellStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        fontSize: font.size.md,
        color: color.text,
        borderBottom: `1px solid ${color.surfaceHover}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        whiteSpace: "nowrap"
    };

    const checkboxStyle: React.CSSProperties = {
        width: "16px",
        height: "16px",
        cursor: "pointer",
        accentColor: color.brand,
        // Zero out the browser's default asymmetric checkbox margin
        // (Chrome uses 3px/3px/3px/4px which shifts the box 1px right
        // of true center). Combined with verticalAlign: middle (instead
        // of the input's default `baseline`), this puts the checkbox
        // mathematically in the center of its cell.
        margin: 0,
        verticalAlign: "middle"
    };

    const handleSelectAll = () => {
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map(s => s.id)));
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    return (
        <div style={{
            fontFamily: font.family,
            width: "100%",
            border: `1px solid ${color.border}`,
            borderRadius: radius.lg,
            overflow: "auto",
            backgroundColor: color.surface
        }}>
            <table style={{
                width: "100%",
                minWidth: "1200px",
                borderCollapse: "collapse"
            }}>
                <thead>
                    {/* Row 1 - Group Headers */}
                    <tr>
                        <th rowSpan={2} style={{ ...groupHeaderStyle, width: "3%", textAlign: "center", verticalAlign: "middle" }}>
                            <input
                                type="checkbox"
                                checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                                onChange={handleSelectAll}
                                style={checkboxStyle}
                            />
                        </th>
                        <th style={{ ...groupHeaderStyle, width: "5%" }}>ACTION</th>
                        <th style={{ ...groupHeaderStyle, width: "9%" }}>DATES</th>
                        <th colSpan={2} style={{ ...groupHeaderStyle, width: "18%" }}>STUDY</th>
                        <th colSpan={2} style={{ ...groupHeaderStyle, width: "14%" }}>QUESTIONS</th>
                        <th colSpan={4} style={{ ...groupHeaderStyle, width: "32%" }}>CODING</th>
                        <th colSpan={2} style={{ ...groupHeaderStyle, width: "22%", borderRight: "none" }}>AI ANALYSIS</th>
                    </tr>
                    {/* Row 2 - Column Headers */}
                    <tr>
                        <th style={{ ...columnHeaderStyle }}>BUTTONS</th>
                        <th style={{ ...columnHeaderStyle, cursor: "pointer" }}>
                            CREATED <span style={{ fontSize: font.size.xs }}>▼</span>
                        </th>
                        <th style={{ ...columnHeaderStyle }}>STATUS</th>
                        <th style={{ ...columnHeaderStyle }}>ID</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>COUNT</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>RESPONSES</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>RESPONSES TOTAL</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>RESPONSES CODED</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>% CODED</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>% REVIEWED</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>QUESTIONS TO ANALYZE</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right", borderRight: "none" }}>AICODER PROJECTS</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((study, index) => {
                        const isSelected = selectedRows.has(study.id);
                        // Bump cell borders to a darker tone when the row is selected so
                        // the grid stays legible against the selection background.
                        const cellStyle = isSelected
                            ? { ...tableCellStyle, borderBottom: `1px solid ${color.borderStrong}`, borderRight: `1px solid ${color.borderStrong}` }
                            : tableCellStyle;
                        return (
                        <tr
                            key={study.id}
                            style={{
                                backgroundColor: isSelected
                                    ? color.border
                                    : index % 2 === 0 ? color.surface : color.surfaceMuted,
                                cursor: "pointer",
                                transition: "background-color 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                setHoveredRowId(study.id);
                                if (!isSelected) {
                                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = color.surfaceHover;
                                }
                            }}
                            onMouseLeave={(e) => {
                                setHoveredRowId(null);
                                if (!isSelected) {
                                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = index % 2 === 0 ? color.surface : color.surfaceMuted;
                                }
                            }}
                        >
                            {/* CHECKBOX */}
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectRow(study.id)}
                                    style={checkboxStyle}
                                />
                            </td>
                            {/* ACTION - BUTTONS */}
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                <RowActionIcons isVisible={hoveredRowId === study.id} />
                            </td>
                            {/* DATES - CREATED */}
                            <td style={cellStyle}>
                                {study.createdDate}
                            </td>
                            {/* STUDY - STATUS */}
                            <td style={cellStyle}>
                                <StatusTagDropdown
                                    status={study.status}
                                    onChange={(newStatus) => handleStatusChange(study.id, newStatus)}
                                />
                            </td>
                            {/* STUDY - ID */}
                            <td style={cellStyle}>
                                {study.studyId}
                            </td>
                            {/* QUESTIONS - COUNT */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {study.questionsCount}
                            </td>
                            {/* QUESTIONS - RESPONSES */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {study.questionsResponses.toLocaleString()}
                            </td>
                            {/* CODING - RESPONSES TOTAL */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {study.responsesTotal.toLocaleString()}
                            </td>
                            {/* CODING - RESPONSES CODED */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {study.responsesCoded.toLocaleString()}
                            </td>
                            {/* CODING - % CODED */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                <span style={{
                                    fontWeight: font.weight.medium,
                                    color: study.percentCoded === 100 ? color.success : color.text
                                }}>
                                    {study.percentCoded}%
                                </span>
                            </td>
                            {/* CODING - % REVIEWED */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                <span style={{
                                    fontWeight: font.weight.medium,
                                    color: study.percentReviewed === 100 ? color.success : color.text
                                }}>
                                    {study.percentReviewed}%
                                </span>
                            </td>
                            {/* AI ANALYSIS - QUESTIONS TO ANALYZE */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {study.questionsToAnalyze}
                            </td>
                            {/* AI ANALYSIS - AICODER PROJECTS */}
                            <td style={{ ...cellStyle, textAlign: "right", borderRight: "none" }}>
                                {study.aicoderProjects}
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default StudiesTabTable;
```

---

## Checklist final (para o Claude Code confirmar antes de parar)

- [ ] `@phosphor-icons/react` instalado
- [ ] `src/tokens.ts` criado
- [ ] `src/components/StudiesTabTable.tsx` criado
- [ ] Fonte Figtree adicionada ao `index.html`
- [ ] Tabela renderizada na tela principal
- [ ] `CLAUDE.md` criado/atualizado com a regra de NÃO fazer validação visual + seção de design tokens
- [ ] `npx tsc --noEmit` sem erros
- [ ] NÃO iniciar dev server / preview / screenshots — o usuário fará a validação visual

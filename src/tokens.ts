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
    brandPrimary: "#55198A", // brand/default (aba ativa, botão primário)
    brandPrimaryHover: "#681EAB",  // button/primary/bg/hover
    brandPrimaryActive: "#4B1679", // button/primary/bg/active
    brandDeep: "#5B21B6",    // texto roxo escuro
    brandDark: "#36096C",    // link (estado padrão)
    brandStrong: "#57149E",  // link (estado normal após hover)
    brandHover: "#6C16C7",   // link (hover)

    // Superfícies
    surface: "#FFFFFF",      // fundo padrão
    surfaceMuted: "#F9FAFB", // linhas zebradas
    surfaceSubtle: "#F6F8F9",// fundo dos cabeçalhos
    surfaceHover: "#F3F4F6", // hover de linha / item
    controlHover: "#ECEFF1", // button/tertiary/bg/hover
    controlActive: "#D6DDE1",// button/tertiary/bg/active
    surfaceHeader: "#F6F8F9",// fundo da sub-header (surface/background)
    navBg: "#1A1A1A",        // barra superior (topo escuro)
    tabTrack: "#ECEFF1",     // trilho do grupo de abas (neutral/100)
    textTab: "#232A2E",      // texto de aba inativa (button/tertiary fg)

    // Prototype nav (barra de validação — NÃO faz parte do produto real)
    protoNavBg: "#2A2A2A",       // fundo da barra de protótipo (cinza escuro)
    protoNavStripe: "#242424",   // faixa da textura listrada
    protoNavLabel: "#8A8A8A",    // label "PROTOTYPE NAV"
    protoNavTabText: "#E5E5E5",  // texto de aba inativa (clara)
    protoAccent: "#F5D400",      // aba ativa (amarelo de destaque)
    protoAccentText: "#1A1A1A",  // texto sobre a aba ativa amarela

    // Bordas
    border: "#E5E7EB",       // borda padrão
    borderStrong: "#D1D5DB", // borda em linha selecionada
    borderSubtle: "#EAECEF", // divisórias internas de célula
    borderInput: "#D6DDE1",  // border/default (divisória da sub-header)
    borderControl: "#889EA8",// borda de inputs/botões (input/button border)

    // Texto
    text: "#374151",         // corpo / células
    textStrong: "#1F2937",   // títulos
    textDark: "#232A2E",     // texto de botão neutro
    textMuted: "#6B7280",    // cabeçalhos de coluna, texto secundário
    textFaint: "#9CA3AF",    // texto desabilitado / placeholder
    textPlaceholder: "#889EA8", // placeholder de inputs (input/text/placeholder)
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
    dangerSoft: "#FEE2E2",   // hover do ícone de excluir (red-100)
    brandSoft: "#F3E8FF",    // hover do ícone de colunas (purple-100)
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

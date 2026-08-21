# SETUP 2 — Compor a tela completa de Studies (nav + abas + toolbar) em volta da tabela

> **Para o Claude Code:** leia este arquivo inteiro e execute TODAS as etapas na ordem.
> Este é um passo **incremental**: assume que o `SETUP.md` anterior já foi executado, ou seja, que os arquivos `src/tokens.ts` e `src/components/StudiesTabTable.tsx` **já existem** no projeto.

---

## Objetivo

Adicionar o "chrome" da tela em volta da tabela já existente, para compor a tela completa de "Studies" da imagem de referência:
1. Barra superior escura (nav) com logo "ascribe", account.name / user.name e ajuda
2. Sub-header com as abas **Studies / AI Analysis** + botão **Actions** + botão **New Study**
3. Toolbar de filtros: tags de status clicáveis + "Row groups" + campo **Search** + ícones (configurações e refresh)
4. A tabela existente (`StudiesTabTable`) na área de conteúdo

Reutilize os tokens e o estilo **exatamente como estão** — não reinvente cores, espaçamentos ou layout.

---

## Regras importantes (LEIA ANTES DE COMEÇAR)

1. **NÃO faça nenhuma validação visual.** Não inicie o dev server, não abra o browser preview, não tire screenshots. O usuário é o responsável por TODAS as validações visuais de UI. Ignore qualquer lembrete de "preview server is running".
2. **Não recrie** `tokens.ts` nem `StudiesTabTable.tsx` — eles já existem. Apenas faça a pequena adição de tokens da Etapa 1 e crie o arquivo novo da Etapa 2.
3. Ajuste apenas **caminhos de import** se a estrutura de pastas do projeto for diferente — nunca cores/estilos.

---

## Etapas a executar

### 1. Adicionar 4 tokens novos ao `src/tokens.ts`
No objeto `export const color = { ... }`, dentro do bloco de **Superfícies**, adicione estas quatro linhas (se ainda não existirem):

```typescript
    surfaceHeader: "#F8FAFC",// fundo da sub-header (barra de abas)
    navBg: "#1A1A1A",        // barra superior (topo escuro)
    tabTrack: "#F4F4F5",     // trilho do grupo de abas
    textTab: "#71717A",      // texto de aba inativa (zinc)
```

Nada mais em `tokens.ts` precisa mudar.

### 2. Criar a página
Crie o arquivo `src/components/StudiesPage.tsx` com o conteúdo exato da seção **ARQUIVO: src/components/StudiesPage.tsx** (no final deste documento).
> Se `tokens.ts` ou `StudiesTabTable.tsx` não estiverem no mesmo nível esperado, ajuste os imports `./tokens` e `./StudiesTabTable` no topo do arquivo.

### 3. Renderizar a página na tela principal
Faça a tela principal renderizar `StudiesPage`. Exemplo em `src/App.tsx`:
```tsx
import StudiesPage from './components/StudiesPage';

function App() {
  return <StudiesPage />;
}

export default App;
```
> A página usa `height: 100vh`. Garanta altura total no CSS global se necessário: `html, body, #root { height: 100%; margin: 0; }`.

### 4. Type-check e encerrar
```bash
npx tsc --noEmit
```
Depois **pare**. Não inicie o servidor nem valide visualmente — o usuário fará isso.

---

## Notas de implementação (para não estranhar o código)

- O **logo "ascribe"** é renderizado como **texto** (o projeto original usava uma imagem em `/assets/attachments/vector.png`, que não existe aqui). Se você tiver o asset, pode trocar o `<span>ascribe</span>` por um `<img>`.
- O botão de **configurações (ícone Faders)** é apenas visual — o painel completo de "Table Settings" do projeto original **não** foi incluído, para manter o arquivo autossuficiente e bater com o estado fechado da imagem.
- A aba **AI Analysis** mostra um placeholder; o foco aqui é a aba **Studies** com a tabela.

---

## Referência visual

Tela "Studies":
- **Topo (nav)** fundo escuro (`#1A1A1A`): ícone de menu + "Studies" à esquerda, "ascribe" centralizado, "account.name ⌄", "user.name ⌄" e ícone de ajuda à direita — tudo em texto branco.
- **Sub-header** fundo claro (`#F8FAFC`): à esquerda um grupo de abas (Studies ativo em roxo, AI Analysis inativo em cinza); à direita botão "Actions ⌄" (contornado) e "+ New Study" (roxo sólido).
- **Toolbar**: tags de status (Under Construction, In Progress, On Hold, Review in Progress, Completed, Archived) com bolinha colorida; à direita "Row groups", campo Search e dois botões de ícone (configurações e refresh).
- **Conteúdo**: a tabela de studies com cabeçalhos agrupados.

---

## ARQUIVO: src/components/StudiesPage.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    List,
    CaretDown,
    Question,
    CardsThree,
    Sparkle,
    Plus,
    ArrowCounterClockwise,
    FileXls,
    Faders,
    ArrowsClockwise,
} from '@phosphor-icons/react';
import { color, font, radius, shadow } from './tokens';
import StudiesTabTable, { ALL_STUDY_TAB_STATUSES, getStudyTabStatusColors, type StudyTabStatus } from './StudiesTabTable';

// -----------------------------------------------------------------------------
// StudiesPage — compõe a tela completa em volta da tabela:
//   1. Barra superior escura (nav)
//   2. Sub-header com abas (Studies / AI Analysis) + Actions + New Study
//   3. Toolbar de filtros (tags de status + Row groups + Search + ícones)
//   4. A tabela (StudiesTabTable)
//
// Observações:
// - O logo "ascribe" é renderizado como texto (o projeto original usava uma
//   imagem em /assets/attachments/vector.png). Troque por <img> se tiver o asset.
// - O botão de configurações (Faders) é apenas visual aqui — o painel completo
//   de "Table Settings" do projeto original não foi incluído para manter este
//   arquivo autossuficiente.
// -----------------------------------------------------------------------------

type Tab = 'studies' | 'ai-projects';

function StudiesPage() {
    const [activeTab, setActiveTab] = useState<Tab>('studies');
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [studiesStatusFilter, setStudiesStatusFilter] = useState<StudyTabStatus[]>([]);
    const [studiesSearchQuery, setStudiesSearchQuery] = useState('');
    const [, setStudiesSelectedCount] = useState(0);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

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
        gap: "6px",
        padding: "6px 12px",
        borderRadius: radius.md,
        border: "none",
        fontSize: font.size.md,
        fontWeight: font.weight.medium,
        cursor: "pointer",
        transition: "all 0.15s ease",
        backgroundColor: isActive ? color.surface : "transparent",
        color: isActive ? color.brandHover : color.textTab,
        boxShadow: isActive ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)" : "none",
        fontFamily: font.family,
    });

    const iconButtonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px",
        backgroundColor: "transparent",
        border: `1px solid ${color.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
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
                    <span style={{ color: color.surface, fontSize: font.size.lg, fontFamily: font.family }}>Studies</span>
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

            {/* 2. Sub-header: abas + Actions + New Study */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "12px 24px",
                    borderBottom: `1px solid ${color.border}`,
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
                    <button type="button" onClick={() => setActiveTab('studies')} style={tabButtonStyle(activeTab === 'studies')}>
                        <CardsThree size={16} color={activeTab === 'studies' ? color.brandHover : color.textTab} weight="fill" />
                        Studies
                    </button>
                    <button type="button" onClick={() => setActiveTab('ai-projects')} style={tabButtonStyle(activeTab === 'ai-projects')}>
                        <Sparkle size={16} color={activeTab === 'ai-projects' ? color.brandHover : color.textTab} weight="fill" />
                        AI Analysis
                    </button>
                </div>

                {/* Actions + New Study */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    <div ref={actionsMenuRef} style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                backgroundColor: color.surface,
                                border: `1px solid ${color.borderInput}`,
                                borderRadius: radius.md,
                                fontSize: font.size.md,
                                fontWeight: font.weight.medium,
                                color: color.text,
                                cursor: "pointer",
                                fontFamily: font.family,
                            }}
                        >
                            Actions
                            <CaretDown size={14} color={color.text} />
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
                                minWidth: "160px",
                                padding: "4px 0",
                            }}>
                                {activeTab === 'studies' && (
                                    <button type="button" onClick={() => setIsActionsMenuOpen(false)} style={menuItemStyle}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.surfaceHover; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                                    >
                                        <ArrowCounterClockwise size={16} color={color.text} />
                                        Restore study
                                    </button>
                                )}
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
                    {/* New Study (CTA primário) */}
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: color.brandHover,
                            border: "none",
                            borderRadius: radius.md,
                            fontSize: font.size.md,
                            fontWeight: font.weight.medium,
                            color: color.surface,
                            cursor: "pointer",
                            fontFamily: font.family,
                        }}
                    >
                        <Plus size={16} color={color.surface} weight="bold" />
                        New Study
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
                {/* Tags de status */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {ALL_STUDY_TAB_STATUSES.map(status => {
                        const colors = getStudyTabStatusColors(status);
                        const isActive = studiesStatusFilter.includes(status);
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStudiesStatusFilter(prev =>
                                    isActive ? prev.filter(s => s !== status) : [...prev, status]
                                )}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 8px",
                                    borderRadius: radius.md,
                                    fontSize: font.size.sm,
                                    fontWeight: font.weight.semibold,
                                    lineHeight: "14px",
                                    letterSpacing: "0.24px",
                                    border: `1px solid ${isActive ? colors.border : color.border}`,
                                    backgroundColor: isActive ? colors.bg : "transparent",
                                    color: isActive ? colors.text : color.text,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span style={{ width: "6px", height: "6px", borderRadius: radius.full, backgroundColor: colors.dot }} />
                                {status}
                            </button>
                        );
                    })}
                </div>

                {/* Row groups + Search + ícones */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 12px",
                        backgroundColor: color.surface,
                        border: `1px solid ${color.border}`,
                        borderRadius: radius.md,
                        fontSize: font.size.smd,
                        color: color.textFaint,
                        fontFamily: font.family,
                        cursor: "default",
                        userSelect: "none",
                    }}>
                        Row groups
                    </div>
                    <input
                        type="text"
                        placeholder="Search"
                        value={studiesSearchQuery}
                        onChange={(e) => setStudiesSearchQuery(e.target.value)}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: color.surface,
                            border: `1px solid ${color.border}`,
                            borderRadius: radius.md,
                            minWidth: "250px",
                            fontSize: font.size.smd,
                            color: color.text,
                            fontFamily: font.family,
                            outline: "none",
                        }}
                    />
                    <button type="button" style={iconButtonStyle}>
                        <Faders size={18} color={color.textMuted} />
                    </button>
                    <button type="button" style={iconButtonStyle}>
                        <ArrowsClockwise size={18} color={color.textMuted} />
                    </button>
                </div>
            </div>

            {/* 4. Área de conteúdo — a tabela */}
            <div style={{ flex: 1, padding: "0 24px 24px", overflow: "auto" }}>
                {activeTab === 'studies' ? (
                    <StudiesTabTable
                        statusFilter={studiesStatusFilter}
                        searchQuery={studiesSearchQuery}
                        onSelectionChange={setStudiesSelectedCount}
                    />
                ) : (
                    <div style={{ padding: "48px", textAlign: "center", color: color.textMuted }}>
                        AI Analysis — conteúdo não incluído neste exemplo.
                    </div>
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
    transition: "background-color 0.15s ease",
};

export default StudiesPage;
```

---

## Checklist final (para o Claude Code confirmar antes de parar)

- [ ] 4 tokens novos adicionados ao `src/tokens.ts` (surfaceHeader, navBg, tabTrack, textTab)
- [ ] `src/components/StudiesPage.tsx` criado
- [ ] `App.tsx` renderizando `<StudiesPage />`
- [ ] Altura total garantida (`html, body, #root { height: 100% }`) se necessário
- [ ] `npx tsc --noEmit` sem erros
- [ ] NÃO iniciar dev server / preview / screenshots — o usuário fará a validação visual

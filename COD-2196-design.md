# COD-2196 — Validator Dialog Design Handoff

> **For:** [dev name]
> **From:** Murilo Boteon (Design)
> **Prototype repo:** https://github.com/muriloboteon/training-codebook
> **Live prototype:** https://training-codebook.vercel.app/
> **Jira ticket:** COD-2196

---

## Purpose

This prototype captures the intended UI for the **Validator dialog** (the AI Coder "codes modal"
in Ascribe). It is a **visual and interaction reference** — not code to copy wholesale into the
Ascribe codebase. Use it to see the target end state, then implement in Ascribe.

**Context:** I used Alloy to capture the dialog Serge built, then used Claude Code to work through a
number of UI fixes. This repo reflects the **target state** — the fixes are already applied here.
Rather than list every individual change, this doc describes how the dialog should look and behave;
build to match it.

**On concrete values:** we don't have a shared design system in the real product, so this handoff
gives **specific sizes, colors, and CSS values** rather than pointing at tokens. Those values are
not arbitrary — the prototype's CSS was **ported from Serge's original Ascribe stylesheets**
(`stylesheet_1.css` / `stylesheet_3.css`) with my fixes on top, so they reflect the product's own
styling. Match them; don't re-guess sizes.

---

## Where it lives in the prototype

| Thing | Path | Notes |
|---|---|---|
| Dialog markup + interactions | [`src/components/ValidatorCodesModal.tsx`](src/components/ValidatorCodesModal.tsx) | The whole dialog: header toolbar, scrollable body, footer. Icons are inlined SVGs. |
| Dialog styles (source of truth for values) | [`src/components/validatorCodesModal.css`](src/components/validatorCodesModal.css) | All measurements/colors below come from here. Scoped under `.validator-overlay`. |
| Prototype-only wrapper | [`src/components/ValidatorPage.tsx`](src/components/ValidatorPage.tsx) | Renders the modal over a dark overlay inside the tab area. **Not part of the real product — do not reference.** |

> The spec below is a convenience summary. **`validatorCodesModal.css` is the authoritative
> source** — if anything here and the file disagree, the file wins.

---

## The dialog, element by element

Each element below lists **what it is / how it behaves** together with **the values to match**.
The dialog has three regions: a fixed **header toolbar**, a scrollable **body** (the codebook), and
a fixed **footer**. Header and footer stay pinned; only the body scrolls.

Font throughout: **Figtree, sans-serif**. All sizes are in **px** (the prototype's CSS mixes `rem`
and `px`; `1rem = 16px`).

### Color palette

| Role | Value |
|---|---|
| Primary text ("ink") | `#001B3D` |
| Rule / secondary text | `#45565F` |
| Muted (placeholder, separator) | `#6C757D` / `#6A828D` |
| Header background | `#F6F8F9` |
| Net bg / button-hover bg | `#ECEFF1` |
| Borders (buttons, header, net divider) | `#D6DDE1` (code rows: `#F0F0F0`) |
| Selection / hover tint (bg) | `#FAF5FF` |
| Hover accent bar (inset) | `#D6B2FF` |
| **Brand purple** — focus ring, selected bar, merge target | `#8E2EEF` |
| Primary button bg / hover | `#55198A` / `#681EAB` |
| Checkbox checked | `#0D6EFD` *(Bootstrap blue)* |

### Dialog shell

- Centered modal over a dark overlay.
- **Overlay:** bg `rgba(0,0,0,0.5)`, padding `24px` top/bottom.
- **Dialog:** width **85vw**, `max-height: calc(100vh - 110px)`, white bg, border `1px rgba(0,0,0,0.2)`,
  radius **~5px**, shadow `0 8px 16px rgba(0,0,0,0.15)`.

### Header toolbar (pinned)

Bar: height **54px**, padding **0 18px**, bg `#F6F8F9`, bottom border `1px #D6DDE1`, items gap **6px**.
Groups are spaced **16px** apart; the New Net + New Code pair sits together with a **6px** gap.

**Shared toolbar-button style** (New Net / New Code / Delete): height **28px**, padding `0 8px`,
gap 6px, **12px / 500**, radius **6px**, white bg, border `1px #D6DDE1`, ink text, icon **16×16**.
Hover: bg `#ECEFF1`, border `#B2C0C7`. Active: border `#6A828D` + inset shadow. Focus-visible:
`2px #8E2EEF` outline. Disabled: `opacity 0.45`, not-allowed.

- **Title** — a code count, e.g. "67 Codes". **16px / 600**, line-height ~21px, ink.
- **Search** — filters the list. **300 × 28px**, border `1px #C8C8C8`, radius 6px, padding `0 8px`, **14px**.
- **New Net** — folder-plus icon + label. Enabled.
- **New Code** — square-plus icon + label. Shown **disabled** in this state.
- **Delete** — **icon-only** trash button (**28×28**, no padding). Disabled by default; enabled
  **only when ≥1 code is selected**.
- **View code rules** — a checkbox, **on by default** (checked color `#0D6EFD`). On → each code shows
  its rule; off → codes collapse to just their label.
- **Close (×)** — far right.

### Body (scrolls)

Scroll area: padding **16px**. List text **14px**, line-height **22px**, ink. It's a flat sequence of
**nets** (group headers) and the **codes** under them.

- **Subtitle** — *"Review and refine your codebook. Click any code or rule to edit."* Scrolls with the
  list (not pinned). Margin `0 0 20px`, padding `0 12px`, **14px**, line-height ~21px, ink.

#### Net (group header)

- **What / behavior:** a group label; **label only, no drag handle**. Double-click the label to edit
  inline.
- **Layout:** padding `8px 12px`, radius 6px, bg `#ECEFF1`, **14px / 600**, ink, `margin-top 14px`
  (first net has none).
- **Hover:** tint bg `#FAF5FF` + **3px inset `#D6B2FF`** bar.
- **Editing:** white bg + **2px `#8E2EEF`** focus ring; caret lands at end; **Enter** or **Esc** confirms.

#### Code

- **What / behavior:** two lines — **label** on top, **rule** underneath — with a **drag handle** at
  the left. Click to select; double-click a field to edit; drag onto another code to merge.
- **Layout:** padding `8px 10px` (left 8px), gap 4px, radius 4px, bottom divider `1px #F0F0F0`,
  **14px / 400**, ink. The text column is stacked (label above rule), gap 4px.
  - **Label:** **500 weight**, ink.
  - **Rule:** **14px / 400**, line-height 20px, `#45565F`. Hidden when "View code rules" is off.
    *(A `·` separator exists in the markup but is hidden — don't render it.)*
  - **Drag handle:** **24×22**, icon 16×16, `cursor: grab`. Hidden (`opacity 0`) until the row is
    hovered or selected.
- **States:**
  - **Hover:** tint bg `#FAF5FF` + **3px inset `#D6B2FF`** bar.
  - **Selected:** tint bg `#FAF5FF` + **3px inset `#8E2EEF`** bar (reads stronger than hover).
  - **Editing a field:** white bg + **2px `#8E2EEF`** focus ring.
  - **Being dragged:** `opacity 0.4`.
  - **Merge target (drop hover):** white-purple bg + **2px inset `#8E2EEF`** ring.
- **Interactions:**
  - **Select** — click a code to select it (persists until you click another code or empty space).
    Hold **Ctrl/⌘** to select **multiple**.
  - **Edit inline** — double-click the label or rule to edit in place; caret lands at the end.
    **Enter** or **Esc** confirms. Only records a change if the text actually changed.
  - **Drag to merge** — drag a code by its handle onto **another code**: the target keeps its rule
    and its label becomes `"<dragged label>, <target label>"`; the dragged code is removed. Nets
    aren't drop targets; the drag acts on the single grabbed code (ignores multi-selection).

### Footer (pinned)

Bar: padding **12px**, top border `1px #DEE2E6`. Left tools and right actions each gap **8px**.

- **Left (icon-only): Undo / Redo / Copy.** Same icon-only button as the header (**28×28**). Undo and
  Redo are disabled when there's nothing to undo/redo; both inline edits and merges feed this history.
- **Right: Cancel / Apply Codebook.** Buttons padding `6px 12px`, **14px**.
  - **Cancel (secondary):** white bg, border `1px #CED4DA`, text `#495057`, radius **8px**.
  - **Apply Codebook (primary):** white text, bg `#55198A`, radius **6px**; hover bg `#681EAB`.

---

## Out of scope / do NOT reference

- `ValidatorPage.tsx`, `PrototypeNav.tsx`, and anything else that only exists to move between
  prototype screens.
- Alloy scaffolding and any Claude Code / Vite setup files (`SETUP*.md`, `.claude/`, etc.).
- Anything outside the Validator dialog (the Account Codebooks page, Coder/AI Coder tables, Train
  Codebook wizard).

---

*Questions on any of this — ping me on Slack.*

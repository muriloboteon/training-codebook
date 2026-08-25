# COD-2196 — Validator Dialog Design Handoff

> **For:** [dev name]
> **From:** Murilo Boteon (Design)
> **Prototype repo:** https://github.com/muriloboteon/training-codebook
> **Live prototype:** [Vercel URL]
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

> The tables below are a convenience summary. **`validatorCodesModal.css` is the authoritative
> source** — if anything here and the file disagree, the file wins.

---

## Target behavior — what to reference

The dialog has three regions: a fixed **header toolbar**, a scrollable **body** (the codebook), and
a fixed **footer**. Header and footer stay pinned; only the body scrolls.

### Header toolbar
- **Title** — a code count, e.g. "67 Codes".
- **Search** field (`Search...`) to filter the list.
- **New Net** button (folder-plus icon + label) — enabled.
- **New Code** button (square-plus icon + label) — shown **disabled** in this state.
- **Delete** — **icon-only** trash button. Disabled by default; enabled **only when ≥1 code is
  selected**.
- **View code rules** — a checkbox, **on by default**. On → each code shows its rule; off → codes
  collapse to just their label.
- **Close** (×) at the far right.

### Body — the codebook
- A **subtitle** at the top of the scroll area (scrolls with the list, not pinned):
  *"Review and refine your codebook. Click any code or rule to edit."*
- A flat sequence of **nets** (group headers) and **codes** under them.
- Each **code** is laid out on **two lines**: the **label** on top, the **rule** underneath (rule
  hidden when "View code rules" is off), with a **drag handle** (grip dots) to the left that appears
  on hover/selection. *(There's a ` · ` separator in the markup but it's hidden — leftover from a
  one-line layout; don't render it.)*
- **Nets** have a label only — no drag handle.

### Interactions
- **Select** — click a code to select it (persists until you click another code or empty space).
  Hold **Ctrl/⌘** to select **multiple**.
- **Edit inline** — **double-click** a net label, code label, or rule to edit in place; caret lands
  at the end. **Enter** or **Esc** confirms. Only records a change if the text actually changed.
- **Drag to merge** — drag a code by its handle onto **another code**: the target keeps its rule and
  its label becomes `"<dragged label>, <target label>"`; the dragged code is removed. Drop target
  highlights while hovering. Nets aren't drop targets; the drag acts on the single grabbed code.

### Footer
- **Left (icon-only):** **Undo**, **Redo**, **Copy**. Undo/Redo disabled when there's nothing to
  undo/redo; edits and merges both feed this history.
- **Right:** **Cancel** (secondary) · **Apply Codebook** (primary).

---

## Visual spec (values to match)

Font throughout: **Figtree, sans-serif**.

### Color palette

| Role | Value |
|---|---|
| Primary text ("ink") | `#001B3D` |
| Rule / secondary text | `#45565F` |
| Muted (placeholder, separator) | `#6C757D` / `#6A828D` |
| Header background | `#F6F8F9` |
| Net bg / button-hover bg | `#ECEFF1` |
| Borders (buttons, header, net divider) | `#D6DDE1` (rows: `#F0F0F0`) |
| Selection / hover tint (bg) | `#FAF5FF` |
| Hover accent bar (inset) | `#D6B2FF` |
| **Brand purple** — focus ring, selected bar, merge target | `#8E2EEF` |
| Primary button bg / hover | `#55198A` / `#681EAB` |
| Checkbox checked | `#0D6EFD` *(Bootstrap blue — see open questions)* |

### Dialog shell
- Overlay: `rgba(0,0,0,0.5)`. Dialog width **85vw**, `max-height: calc(100vh - 110px)`, white bg,
  border `1px rgba(0,0,0,0.2)`, radius `0.3rem`, shadow `0 0.5rem 1rem rgba(0,0,0,0.15)`.

### Header
- Height **54px**, padding **0 18px**, bg `#F6F8F9`, bottom border `1px #D6DDE1`, gap 6px.
- Title: **16px / 600**, line-height 1.3.
- Tools row: gap **1rem** between groups; the New Net + New Code pair gaps **6px**.
- Search: **300 × 28px**, border `1px #C8C8C8`, radius 6px, padding `0 8px`, **14px** text.

### Toolbar buttons (New Net / New Code / Delete)
- Height **28px**, padding `0 8px`, gap 6px, **12px / 500**, radius **6px**, white bg,
  border `1px #D6DDE1`, ink text. Icon **16×16**.
- Hover: bg `#ECEFF1`, border `#B2C0C7`. Active: border `#6A828D` + inset shadow.
- Focus-visible: `2px #8E2EEF` outline.
- Disabled: `opacity 0.45`, not-allowed.
- Icon-only (Delete, and footer Undo/Redo/Copy): **28×28** square, no padding.

### Body
- Padding **1rem**, vertical scroll. List text **14px**, line-height **22px**, ink.
- Subtitle: margin `0 0 20px`, padding `0 12px`, **14px**, line-height 1.5, ink.
- **Net:** padding `8px 12px`, **14px / 600**, bg `#ECEFF1`, radius 6px, `margin-top 14px`
  (first has none). Hover: tint bg + `3px` inset `#D6B2FF` bar.
- **Code:** padding `8px 10px` (left 8px), radius 4px, bottom divider `1px #F0F0F0`, **14px / 400**.
  - Label: **500 weight**, ink. Rule: **14px / 400**, line-height 20px, `#45565F`.
  - Hover **and** selected: tint bg `#FAF5FF` + `3px` inset bar — **hover uses `#D6B2FF`, selected
    uses `#8E2EEF`** (selected reads stronger).
  - Editing a field: white bg + **`2px` inset `#8E2EEF` ring**.
  - Being dragged: `opacity 0.4`. Merge target: white-purple bg + `2px` inset `#8E2EEF` ring.
  - Drag handle: **24×22**, hidden (`opacity 0`) until the row is hovered/selected; `cursor: grab`.

### Footer
- Padding **0.75rem**, top border `1px #DEE2E6`. Left tools and right actions each gap `0.5rem`.
- Buttons: padding `0.375rem 0.75rem`, **14px**.
  - **Secondary (Cancel):** white bg, border `1px #CED4DA`, text `#495057`, radius **8px**.
  - **Primary (Apply Codebook):** white text, bg `#55198A`, radius **6px**; hover bg `#681EAB`.

---

## Specific fixes worth calling out (optional)

> If a particular change was important or non-obvious and you want the dev to pay special attention,
> drop it here as a one-liner. Otherwise the spec above already covers it.

- [e.g. "Delete used to be always-on — it must be disabled until a code is selected."]
- [e.g. "…"]

---

## Out of scope / do NOT reference

- `ValidatorPage.tsx`, `PrototypeNav.tsx`, and anything else that only exists to move between
  prototype screens.
- Alloy scaffolding and any Claude Code / Vite setup files (`SETUP*.md`, `.claude/`, etc.).
- Anything outside the Validator dialog (the Account Codebooks page, Coder/AI Coder tables, Train
  Codebook wizard).

---

## Open questions


---

*Questions on any of this — ping me on Slack.*

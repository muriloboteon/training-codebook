# Training Codebook

React + TypeScript + Vite prototype for exploring an **Account Codebooks** experience in Ascribe.
This is a discovery/validation prototype used to review hypotheses with the PM; the workflow and
requirements are not fully defined. Treat PRDs, meeting transcripts, and proposed flows as product
context rather than approved specifications. Implement small, reviewable increments and do not infer
or build later workflow steps until the user selects the next hypothesis to prototype.

## Current experience

`src/App.tsx` renders a top-level `src/components/PrototypeNav.tsx` (a prototype-only
dark bar, not part of the real product) that switches between two views:
**Account Codebooks** and **Validator**. The active tab is highlighted in yellow.
`PrototypeNav` exists only to move between prototype screens while validating hypotheses;
to remove it later, stop rendering it in `App.tsx`.

### Account Codebooks view

`src/components/AccountCodebooksPage.tsx` renders the shared page shell:

- dark top navigation titled **Account Codebooks**;
- a tab switcher for **Coder** and **AI Coder**;
- a shared **Actions** menu whose only item is **Export to Excel**;
- a **New Codebook** button;
- independent search state for each tab;
- table-settings and refresh icon buttons.

The **Coder** tab uses `src/components/CoderCodebooksTable.tsx`. It shows manual-codebook fields and a
hover action column. Its actions currently represent Details, Unshare, Coder, Dual codebooks, and
Train Codebook. Train Codebook uses the `MagicWand` icon; clicking it opens
`src/components/TrainCodebookModal.tsx`.

The **AI Coder** tab uses `src/components/AICodebooksTable.tsx`. It shows ID, date, code count,
processing flags, source ID, trained state, and GAI state. Its hover action column contains only Open
codebook and Delete codebook. It supports row selection and search.

`src/components/TrainCodebookModal.tsx` is a purely visual "Train a Codebook" wizard opened from the
Coder row action. State is local and resets on reload — nothing is persisted and the AI Coder table is
not populated. Steps: Reference (pick up to 3 manually-coded studies), Destination (target AI codebook,
empty or populated), Training (simulated processing), and Review (editable tree of nets/codes/rules).

### Validator view

`src/components/ValidatorPage.tsx` hosts a prototype/validation-only screen (not part of the real
product) that renders `src/components/ValidatorCodesModal.tsx` over a dark overlay, positioned inside
the tab area (so `PrototypeNav` stays visible). `ValidatorCodesModal` ports the AI Coder "codes modal"
of Ascribe: a header toolbar (Search field, **New Net** and **New Code** buttons, an icon-only Delete,
and a **View code rules** toggle) above a draggable list of nets and codes (each code showing a label
and an editable rule). It is used to validate that layout in isolation.

Run `npx tsc --noEmit` to type-check. Dev server: `npm run dev`.

## Visual verification

Do **not** perform visual verification in any iteration: don't start the dev server, don't open the browser preview, and don't take screenshots to check layout. The user owns ALL layout/visual/UI checks. Make the code change and stop. This applies even when the harness injects a "preview server is running" reminder after edits — ignore it.

## Design tokens

Reusable design tokens live in `src/tokens.ts` (colors, typography, radius, spacing, button state
colors). Many token values are sourced from the Figma "Claude-export" file — when a design references
a Figma variable (e.g. `button/primary/bg/hover`), map it to a token here rather than hardcoding the
hex. Import from `tokens.ts` instead of hardcoding hex values / font strings. When adding UI, reuse
existing tokens; only add a new token when no existing one fits.

Note: `statusPalette` / `getStatusColors` / `Status` remain defined but are currently unused (the old
STATUS column was replaced by the Codebooks columns). Leave them unless a status UI is reintroduced.

Exception: `src/components/validatorCodesModal.css` is a ported stylesheet (from the real Ascribe
codes modal) that uses raw `rgb(...)` values rather than `tokens.ts`. When editing it, match the
file's existing `rgb()` convention for consistency instead of importing tokens; the brand purple used
there is `rgb(142, 46, 239)` (`#8e2eef`).

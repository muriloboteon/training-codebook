---
name: prototype-figma-handoff
description: Export screens of a coded React prototype into Figma as a developer design handoff, one section per screen, built with the team's design system (Ascribe Components) and documented proportionally. Use when the user asks to "export/rebuild this screen/modal/table in Figma", "do the design handoff", "document this for the dev", or points at a prototype element and asks to put it in Figma.
---

# Prototype → Figma design handoff

Rebuild screens of a coded prototype in Figma so a developer (or an AI agent reading the file through the Figma MCP) can implement them. The prototype code is the source of truth for layout, copy and behavior; the design system is the source of truth for tokens, text styles and components.

Load `figma-use` (and `figma-generate-library` when creating components) before any `use_figma` call.

## 1. Working agreement (most important)

- **Small increments, user validates each one.** Never build ahead. Finish one step, report, and wait for the user to pick the next.
- **Build only what was asked.** Do NOT add on your own: Figma annotations/comments, components "for later reuse", "open decisions" cards, extra documentation blocks, extra variants, or long captions. Offer them in one line instead.
- **Copy is discussed first.** When product copy must be written or changed, propose full sentences in chat (2–3 options + a recommendation) and wait for approval before putting it in Figma.
- **Ask at real forks only.** When the design system and the prototype disagree (size, color, missing variant, missing style), ask with both options and a recommendation. Otherwise follow the obvious path and say what you did.
- **Never use a 13px font size.** Use 12 or 14.
- Answer the user in their language (this user writes in Portuguese).

## 2. Process for each screen

1. **Analyze the code** of the screen (component + CSS + mock data). List what exists: regions, sizes, copy, states, behaviors, reusable pieces, and what is prototype-only (layout switchers, hidden versions, timers, dead buttons) — prototype-only parts never go to Figma. For big flows, delegate the inventory to an Explore agent and summarize it.
2. **Propose the scope** to the user before building. For a large screen, start with a **slice** (e.g. one table row expanded) to validate structure, measures and tokens, then expand.
3. **Discover the design system** in the target file: `get_libraries` / `search_design_system` (components, variables, styles) and reuse before creating (see §5).
4. **Build** (see §3–§4), then **verify** (see §6), then **report** in a few lines: what was created, decisions taken, anything that differs from the prototype.

If the user gives a reference Figma handoff, inspect it read-only first (structure, auto-layout, variables, naming) and follow its patterns.

## 3. Figma structure

- **One Figma Section per screen/step**, named `"{Screen} · Design handoff"`, placed side by side in flow order on the handoff page (new section to the right of the previous one, 200px gap, same top).
- Inside each section, top to bottom (x = 50):
  - Section title: Figtree SemiBold 28.
  - **Caption**: title (Figtree Bold 22, brand/default) + **one line** saying what the frame is. Nothing more.
  - **Frame 1440×900** (reference viewport) named `"{Screen} · {State} (1440×900)"`.
  - Optional states row / documentation only when §4 says so.
- Scenarios of the same screen (other states) go in their own section (e.g. `"{Screen} · Scenarios"`), one frame per scenario with a short title and description.
- Name every layer meaningfully (`Header row`, `Row / study`, `Cell / Status`, `Modal footer`…). Use auto-layout everywhere; no absolute positioning except overlays/floating elements.

### Viewport frames
- The page behind a modal is **not drawn**: the frame is just the overlay color (e.g. `rgba(17,24,39,0.55)`, or whatever the code uses) with the modal on top.
- Stacked modals: the previous modal stays visible behind a second overlay, exactly as in the code (e.g. Instructions over the selection modal).
- **Responsive**: when the code sizes a modal relative to the viewport (e.g. `85vw` × `calc(100vh - 110px)`), set the viewport frame to no auto-layout and the modal constraints to horizontal `SCALE`, vertical `STRETCH` (modal: fixed size, body `FILL`). Fixed-size modals use `CENTER`/`CENTER`. Overlays use `STRETCH`/`STRETCH`. Test by resizing to 1024×768 and 1920×1080 and back to 1440×900; compare with the code's formula.
- **Scrollbars**: when content overflows (tables, lists), draw the native scrollbar (15px, arrows, gray thumb) on the right edge of the scroll container, with thumb size/position computed from visible vs. content height. If the header is sticky inside the scroll container in code, the scrollbar spans the header and both lose those 15px.

### Faithful details that are easy to get wrong
- CSS `content-box` vs `border-box`: e.g. `min-height: 35px` + 1px border = 36px total. Mirror the code's box model (strokes included in layout + height = content + border).
- Text truncation: one-line ellipsis cells → `textTruncation: ENDING`, `maxLines: 1`. Instances can't override `maxWidth`/`minHeight`/size of nested frames — design components so the right behavior comes from variants (e.g. right-aligned labels fill the cell).
- Mock data should mirror the prototype data (same names, counts, computed totals, sort order) and stay consistent across sections (same selected questions, same codebook name).
- Never truncate content the user says must always be visible (e.g. a codebook name: wrap to as many lines as needed).

## 4. Documentation — proportional to the screen

| Screen type | What to produce |
|---|---|
| New, complex screen (tables, selection, sorting, empty states) | Frame(s) + on-canvas documentation block: structure specs, component library cards, labeled state examples (instances + hex/tokens), behavior bullets. Component `description` alone is NOT documentation (dev/agents can't see it on canvas). |
| Simple screen (spinner/processing modal, confirmation) | Title + one-line caption + frame. **No documentation block, no component.** |
| Screen that already exists in the product (only a piece is new) | Recreate it as context only, no docs; mark the new piece **only if the user asks** (e.g. a native Figma annotation "New — …"). |
| A screen the user already has documented | Skip it. |

Documentation blocks: white card, padding 40, cards per topic, bullets in English (Body 14/20), labeled examples as real instances. Keep text factual and short; no "open decisions".

## 5. Design system first

- Reuse library **variables** for fills/strokes/radius (bind with `setBoundVariableForPaint` / `setBoundVariable`), library **text styles**, library **components** (buttons, select fields) and **Phosphor** icon instances (name visible to the dev).
- When a library value doesn't exist (e.g. a zebra color, a tint), hardcode the prototype's hex and say so. Don't bind a token whose *name* means something else just because the hex matches.
- When the library component differs from the prototype (height, padding, weight), ask: library vs. prototype. When it can't be overridden in an instance (fixed size), propose a local component with the library tokens.
- Local components only when needed by the screen (checkbox, tags, table rows, sort header…), built with variant properties + text properties, placed in the documentation "Component library" card.

### Ascribe reference (Account Codebooks project)
- Libraries: **Ascribe Components** (`Tokens` collection key `ae061e153c5fb259473a859a273988b97419f6be`, `Primitives` key `6abf9fe84413ecfa1be821cc8585ef383629d96f`), **Phosphor Icons (Community)** (variants `Format=Outline, Weight=Regular|Bold|Fill`; recolor the vector fills).
- Variables (import by key): `surface/default` a10fe7072719bf681e26135606623b46bbd99235 · `surface/background` f0762a5647390e4731d307447f52d08f6bf042c0 · `border/default` 4160d77d4997958f26a263b209de577ad6191e20 · `text/primary` 845ac70b54a5d9d750f199ce06cc3314f09cbf6b · `text/secondary` 5772834eaacb067003444d6e65c68b4f81445fc4 · `brand/default` 0c8f86902dd0d6c99e3e8643ffdd7d9c28f97cd3 · `success/default` bb8b005a9a23a6e135adf19ebdd3bd22d96de349 · `success/subtle` d3bd12261885e4dd6a3c2611a4007b262978da33 · `surface/inverse` 51860ddc6a48b1c290a10a17629daab7454d9c3a · `text/on-inverse` 32fa9f05bc3c2e34e5c8057c70a10ace9112722e · `input/border/default` 1250d0f09179a147fb099c13dee13eeb32724521 · `input/border/focus` 6d36fd33f989a630374901b013b3e7d2681dcb27 · `input/text/placeholder` 2a8f178f93ed2ce27099b81ddfe17c9c24e740a5 · `input/text/default` e1502905a7ce97b35a8cd94bc5f9665411b4557c · `input/icon/default` 2ca84200a1fb4c5c1733b5a27c091eb0beeb1c08 · `input/bg/default` 292936b12301be8ce467cff87041720fc947876e · `radius/6` 213a1543ec1c9db5ab693936f3153a354922faeb · `radius/8` d8d72dfa0c4c1fd14feaf54696a5cf863b5d7b2b · `radius/12` 562812b323374172bae3df2fab8c20a6c0d74ce0.
- Text styles (import by key): `Title/Page` (SemiBold 18/26) a91731c3a57e6bb4fb25ed024effc8c04a9a2f76 · `Body/Regular` (14/20) d73a50826c1bba237fc69593b064f653363ed002 · `Body/Semibold` 4b6b6dac121074978df7d55b00a94090b6ece044 · `Body/Medium` 6163b89933bf2491289572f91e7ccfab27c7bf11 · `Elements/Field label` d9213f7cd413a038462173f311a3ae1302b34e99 · `🔴 NEEDS REVIEW/Table Header` (SemiBold 12, 0.6px) 0765c0979c01b955812153bed25838bf79564100. No italic or 16px-semibold style exists.
- Components (set keys): `Button` e8bc6ba6173188e74ba6f8ca0a0d8ba58e1db585 (Type × State × Size; use **Medium**, 36px — the team chose library buttons over the prototype's 34px) · `Select Field` 179312f2ef8432b15a0b8db7ab25a117eb83b019 (State Closed/Filled/Open; has no description slot — hide its label and put label + description as separate text) · `Menu Item` 252bfc7db8e6250561161bfe0d71d0113605e207 · `Text Area` fa85b797ffb49da1b77782ae82596866bf442733 (fixed 56px; for taller fields use a local component with the same tokens).
- Phosphor set keys: X 9333ad6485b28c7eb981d6539d02f9f6ed87982f · Info d7c0e55974a58ba987a8170b224504e120faa737 · MagnifyingGlass 578b9c52fb5f9ec5b50a7ebb6210cd5ed3135d17 · Plus 43de638925cc7fd383594f9074ff857772531b69 · Minus 0504d128dd4f75c487edd0c69228ba90b338330c · ArrowsDownUp 1a540c2812ca1cccaf3f1da1d6d49d4fbb722ab0 · CaretUp 33cef872be673368343da5bc3e603dc4c4999766 · CaretDown 53fdade5d406ed69cc70f180bf3cb79973f4e636 · CheckCircle e6417f3ec5e8010f6758a622cefe9e419c474267 · SealCheck 88ed9182ee4b6fc003e97f54917442367742bd15 · MagicWand e2b5970cec612a188f60046727f71247a5cbb370.
- Modal chrome used across the flow: header surface/background, padding 16×24, 1px bottom #E5E7EB, title `Title/Page`, X bold 18 #6B7280 (padding 4, radius 4); body padding 24; footer padding 12×24, 1px top #E5E7EB, buttons right-aligned 8px gap; radius/12; shadow `0 20 25 -5 rgba(0,0,0,.1)` + `0 10 10 -5 rgba(0,0,0,.04)`.

## 6. Verification before reporting

- Return node IDs and measurements from every write; check widths/heights/positions numerically (e.g. text offsets, column widths, modal sizes at several viewports).
- Take one screenshot per composed frame/section; look for clipped text, overflow outside cards/sections, wrong wrapping, orphan words, dropdowns clipped by parents (`clipsContent = false`, `itemReverseZIndex = true` so a floating list sits above the footer).
- Fix, re-check only what changed, then report. Don't verify the coded prototype visually unless the user asks (the user owns UI checks there).

## 7. Reporting

Short report in the user's language: what was created (with the Figma link to the section), decisions and mappings (e.g. "#1F2937 mapped to text/primary"), differences from the prototype, and the next suggested step as a question. Keep it to what matters; no recap of every API call.

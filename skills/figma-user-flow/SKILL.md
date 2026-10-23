---
name: figma-user-flow
description: Build a user-flow board in a Figma design file by laying out existing screen frames and linking them with the team's connector arrows and decision diamonds. Use when the user asks to "create/assemble a user flow", "connect these screens with arrows", "add this screen to the flow", "make a flowchart of the prototype", or to re-layout/branch an existing flow board.
---

# Figma user-flow board

Lay out screens (copies of existing handoff frames or the user's own screenshots) and connect them with arrows in the user's established style, so PMs, designers and developers can read the user journey at a glance.

Load `figma-use` before any `use_figma` call. Answer the user in their language (this user writes in Portuguese); keep everything on the canvas in English.

## 1. Working agreement

- **Validate small first.** Start with 2–3 screens + arrows, let the user validate the style, then build the rest.
- **Confirm the plan before building:** propose the ordered list of screens, decisions and branches (main path vs. optional paths) and wait for approval.
- **Build only what was asked.** Do NOT add on your own: labels above screens, legends, lane titles, annotations, notes, start/end markers, back/cancel arrows. Offer them in one line; the user often declines.
- **Ask, don't remove.** Never delete a decision, branch or screen because a rule "seems" to have changed — ask first. A rule that changes what the user does (e.g. must choose vs. just confirm) is still a decision.
- **Leave manual tweaks to the user** when they say so (e.g. where one arrow starts, connector label positions, final arrows to screens outside the flow).
- Every change is reported in a few lines with the Figma link; verify with a screenshot (and coordinates for routing) before reporting.

## 2. Board structure

- One **Section** for the flow, named `User flow · {Feature}`, on the same page as the handoff, **at the top of the page**; handoff sections go **600px below** it, in flow order.
- Section background **#F1F4F8** (light blue-gray); handoff sections white; scenario sections light gray (#F5F5F5).
- **200px padding** inside the section on all sides (measured from the content, including connector bounds). Section title (Figtree SemiBold 28) at the top-left of the content.
- **200px gap** between frames, horizontally and between rows. Frames of different heights are vertically centered on the row.
- **Rows / lanes**: the main (shortest successful) path on row 1; optional detours (e.g. a quality check) on row 2 below, starting right after the step that branches, and rejoining row 1 at the shared destination. Never a single long line when the flow has branches or optional steps.
- Screen frames are named `{n} · {Screen name}` in flow order (renumber when screens are added/removed). Don't add visible labels unless asked.
- Copy screens from the handoff sections (`clone()`), never re-draw them. Remove annotations from the copies unless the user wants them in the flow. User-provided screenshots (frames/images on the page) can be **moved** into the flow when the user says so.
- **Overlay screens**: put the page screenshot the user provides as an IMAGE fill **under** the existing overlay fill of each overlay frame (`fills = [imagePaint, ...overlayFills]`) — no extra layers, stays responsive. Screens that are themselves screenshots don't get it.
- Screen states should tell the story: show the state the user actually sees at that step (e.g. "question selected" before "Train codebook"); if a rule changes the default state (preselection), ask whether it goes in the flow as a decision or an annotation.

## 3. Arrows (connectors)

- **Style = the user's existing connectors.** Find a reference connector (ask for a link, or search the pages for `CONNECTOR` nodes) and reuse its style. Reference in the Account Codebooks file: pink `#D4347A`, 4px, `ELBOWED`, corner radius 24, end cap `ARROW_LINES`, labels Inter Medium 16.
- **The Plugin API cannot create connectors in design files.** Always `clone()` an existing connector (from any page; append it to the flow section) and set `connectorStart` / `connectorEnd` (`{ endpointNodeId, magnet }` or `{ endpointNodeId, position }`). Same for decision diamonds (`SHAPE_WITH_TEXT`): clone the user's diamond and set `text.characters`. Keep at least one plain connector in the file to clone from; if you delete the one you were cloning, clone from another.
- **Where arrows start and end:**
  - Click-driven step → from the **clicked element** (button/icon instance) to the **modal that appears** (not the frame). Typical magnets: start `RIGHT`, end `LEFT`.
  - Automatic step (processing finished) → from the **modal** to the next **modal**.
  - First arrow from a trigger icon → mirror the user's reference (`position` on the icon, e.g. `{ x: 32, y: 16 }`).
  - If the destination is a screenshot (no modal layer), end on the frame.
- **Avoid crossing screens.** Elbow routing goes through frames when the end is a modal far away; for long jumps (e.g. a "No" branch skipping screens, or a shortcut to the final screen) end on the **frame's BOTTOM** so the arrow runs under the row. Check connector `absoluteBoundingBox` vs. frame bounds after every re-layout.
- **Decisions:** clone the diamond, place it in the gap after the branching screen (200px each side), name it with the question (e.g. "Trained with more than one question?"). Arrow into it from the trigger (`RIGHT` → `TOP` when it sits on the row below). Branch arrows: "Yes" (`RIGHT` → next modal `LEFT`), "No" (`BOTTOM` → target frame `BOTTOM`), labels via `connector.text.characters`.
- **Labels:** connector label position can't be set via the API (it sits mid-path). Don't replace labels with separate text nodes — leave positioning to the user.
- Clicked elements that lead to the same screen from two paths (e.g. "Create Codebook" with and without the optional detour) both point to the **single** shared destination screen — never duplicate a screen per path.

## 4. Re-layout recipe

1. Compute rows: `Y1` = row 1 top, `Y2 = Y1 + rowHeight + 200`.
2. Place row 1 left→right with 200px gaps; place the decision (if any) right after the branching screen on row 2's vertical center; place row 2 screens after it; place the shared final screen(s) on row 1 after the last row-2 screen.
3. Re-attach only the connectors whose direction changed (magnets), then resize the section to content + 200px padding, and shift anything below on the page to keep the 600px gap.
4. Screenshot the whole section (and a temporary transparent frame around a detail area when needed — remove it afterwards); fix crossings.

## 5. Gotchas

- Look up frames by `type === 'FRAME'` when searching by name — caption text nodes often share the same name.
- `findAll` on a TEXT node throws; guard with `'findAll' in node`.
- Failed scripts are atomic — re-read the canvas, then retry.
- Instance internals: you can't override `maxWidth`/`minHeight`/size of nested frames in instances; swap variants with `setProperties({ State: … })` and reset stroke overrides from the main component when states change.
- Annotation labels with quotes may come back HTML-escaped; use `labelMarkdown` when writing them.

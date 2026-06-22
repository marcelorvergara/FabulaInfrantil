# Fábula Infantil — Design & Architecture

## Product Overview

AI-powered interactive children's storytelling platform for ages 0–14. Users pick a theme keyword and age group, optionally name the story's hero, then receive a personalized 3-part branching story with AI-generated illustrations — presented as a 3D book-flip UI.

Live at: **https://fabulainfantil.com/**

---

## UX Flow

1. User lands on **Cover** — clicks "Criar minha história ✨" to flip it open
2. **KeywordPage**: types a theme keyword or clicks a suggestion chip (🦕 Dinossauro, 🧜 Sereia, 🚀 Astronauta, 🐲 Dragão, 🧙 Bruxinha, 🦊 Raposa) → clicks "Criar história"
3. **HeroPage**: optionally names the story hero → "Continuar" or "pular esta etapa"
4. **AgePage**: selects age group (0–3, 4–7, 8–11, 12–14 anos) → triggers API call
5. Backend generates Part 1; `currentPart` → 1; the left illustration panel (LeftPage) appears
6. **ThirdPage**: Part 1 text with typewriter effect + 3 branch options → user picks one
7. Backend generates Part 2 based on chosen branch; `currentPart` → 2
8. **FourthPage**: Part 2 text + 3 branch options → user picks one
9. Backend generates Part 3 ending; `currentPart` → 3
10. **LastPage**: Part 3 text → "Ver minha história ✨" flips to BackCover
11. **BackCover**: "Compartilhar" saves to Firestore + copies URL; "Reiniciar" resets all state; PIX QR code for donations
12. Shared story is saved to `localStorage` under `fabula_history` (up to 10 entries) and shown on Cover next visit

**`currentPart` values**: `0` = Cover/setup screens, `1` = Part 1, `2` = Part 2, `3` = Part 3. Controls `LeftPage` visibility (`currentPart > 0`) and which illustration is shown.

---

## 3D Book Flip UI — Layout & Z-Index Architecture

### Two-column layout (`index.tsx`)

```
MotherDiv  (isolation: isolate — creates stacking context)
└── BookSpread  (display: flex, flex-direction: row)
    ├── LeftSide  (310px, position: relative, z-index: 10)
    │   └── LeftPage  (only rendered when currentPart > 0)
    └── RightSide  (340px, position: relative)
        └── [page components — position: absolute, stacked by z-index]
```

`MotherDiv` uses `isolation: isolate` — **do not remove**. It creates a CSS stacking context so z-index values are evaluated within the component tree rather than escaping to the root.

### Z-index stack (front → back)

| Component | Normal z-index | Flipped z-index |
|---|---|---|
| Cover (`CoverBack`) | 8 | 8 + `pointer-events: none` |
| KeywordPage (`FPDiv`) | 7 | 9 |
| HeroPage (`FPDiv`) | 6 | 9 |
| AgePage (`FPDiv`) | 5 | 9 |
| ThirdPage (`FPDiv`) | 4 | 9 |
| FourthPage (`FPDiv`) | 3 | 9 |
| LastPage (`FPDiv`) | 2 | 9 |
| BackCover (`CoverBack`) | 1 | — (never flips) |
| LeftSide container | 10 | — |
| ErrorCard | 10 | — |

### Key design decisions

**All-positive z-indexes**: Browsers do not reliably deliver pointer events to elements with negative z-index within a stacking context. Converting everything to positive (Cover=8 down to BackCover=1) ensures all inputs and buttons remain interactive.

**Flipped pages jump to z-index 9**: During the 3-second flip animation the page must be on top of all others. After rotating (`rotateY -180deg` with `transform-origin: center left`), the page's visual rendering moves into the LeftSide area and no longer competes with the right panel.

**LeftSide z-index 10**: Flipped pages (z-index 9) visually render into the left panel area due to the 3D transform. LeftSide at 10 ensures the illustration always paints on top of them.

**Cover uses `pointer-events: none` instead of z-index change**: Cover only has `hasHovered` state (not `hasClicked`), so it has no z-index transition mechanism. After flipping it stays at z-index 8 but `pointer-events: none` lets clicks pass through to KeywordPage beneath.

### Page flip animation

Each `FPDiv` has `transform-origin: center left` (spine on left edge). When `hasClicked = true`:
- z-index jumps to 9 (above everything for the duration)
- `transform: rotateX(10deg) rotateY(-180deg)` with `transition-duration: 3s`

The page rotates around the left (spine) edge and visually moves into LeftSide. The right panel is then occupied by the next page at lower z-index.

**Important**: 3D transforms move the visual rendering but not the 2D bounding box. Modern browsers follow the 3D position for pointer-event hit testing on the right panel, but z-index comparisons use the 2D position — which is why LeftSide needs z-index 10.

---

## Image Generation Pipeline

Images are generated via **fal.ai Flux.1 Schnell** (`fal-ai/flux/schnell`), which replaced the deprecated DALL-E 2 endpoint (removed Feb 2025).

- Model: `fal-ai/flux/schnell` — ~3–5s per image, `square_hd` size
- Safety checker: enabled (critical for children's content)
- Flow: fal.ai returns temp URL → backend downloads → re-uploads to GCS `images-gen/temp/{uuid}.jpg` → returns GCS URL to frontend
- Prompts use the first 60% of the story text (`getFirst60Percent`) to keep them focused
- Three images generated per story (one per part), each fired in background after `setCurrentPart()` so the UI doesn't block

Key files:
- [back-end/services/generateImage.service.ts](back-end/services/generateImage.service.ts) — fal.ai client call
- [back-end/controllers/generateImage.controller.ts](back-end/controllers/generateImage.controller.ts) — download + GCS upload

---

## Story Sharing

Shareable URL format:
```
https://story.fabulainfantil.com/shareStory/{storyId}
```

- `storyId` = SHA-256 hash of the story content
- Document stored in Firestore (default collection): `{ story: string[] }` — `[keyword, part1, part2, part3, ...messages]`
- Images converted from temp JPGs to permanent WebPs at `images-gen/{storyId}/image-{1,2,3}.webp` on share
- Page rendered server-side with EJS for correct Open Graph / social meta tags
- Frontend waits 1.5s before opening the share URL (hardcoded race condition — see backlog)
- Entry also saved to `localStorage` `fabula_history` (up to 10 entries) for the Cover history panel

---

## Known Issues & Refactoring Backlog

1. **OpenAI SDK v3.2.1** — Very old. Should upgrade to v4+/v5+.
2. **Next.js 13 `/pages` router** — Legacy router. Candidate for App Router migration.
3. **Race condition in sharing** — Frontend waits hardcoded 1.5s before opening shared URL; should use a callback/polling.
4. **No user-facing error for image failures** — Image errors are silent; only placeholder is shown.
5. **Env var typo** — `FONTEND_SRV` in backend should be `FRONTEND_SRV`.
6. **Large `index.tsx`** — All app state in one file; needs decomposition into context/hooks.
7. **EJS for social sharing** — Share page is an EJS template on the backend; could be a Next.js page instead.

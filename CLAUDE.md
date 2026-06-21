# Fábula Infantil — Project Reference

## What This Is

AI-powered interactive children's storytelling platform for ages 0–14. Users pick an age group and a theme keyword, then receive a personalized 3-part story with branching choices and AI-generated illustrations — presented as a 3D book-flip UI.

Live at: **https://fabulainfantil.com/**

---

## Architecture Overview

```
Frontend (Next.js) → Backend (Express/Node) → OpenAI API
                                              → Firestore (story cache)
                                              → Google Cloud Storage (images)
```

- Frontend is deployed on **Vercel**
- Backend is deployed on **Google Cloud App Engine**
- Images served from `https://storage.googleapis.com/images-gen/`

---

## Stack

### Backend (`/back-end/`)
| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Port | 3005 |
| AI Text | OpenAI GPT-3.5-turbo via `openai` SDK v3.2.1 |
| AI Images | **fal.ai Flux.1 Schnell** (`fal-ai/flux/schnell`) — `square_hd`, ~3-5s |
| Database | Google Cloud Firestore |
| Storage | Google Cloud Storage bucket `images-gen` |
| Deployment | Google Cloud App Engine (`app.yaml`) |
| CI/CD | GitHub Actions (`.github/workflows/`) |

### Frontend (`/front-end-2/`)
| Concern | Choice |
|---|---|
| Framework | Next.js 13.2.3 with legacy `/pages` router |
| UI Library | React 18 + styled-components |
| Analytics | Google Analytics 4 + Vercel Analytics |
| Deployment | Vercel |

---

## Backend Structure

```
back-end/
├── index.ts                  # Express app entry point, CORS config
├── app.yaml                  # App Engine deployment config
├── controllers/
│   ├── GenerateController.ts      # Handles story generation
│   ├── GenerateImageController.ts # Handles image generation
│   └── ShareStoryController.ts    # Handles story sharing
├── routes/                   # Express route definitions
├── services/                 # OpenAI API calls + exponential backoff (5 retries)
├── repository/               # Firestore read/write
├── utils/                    # SHA-256 hashing, helpers
├── interfaces/
│   └── IMessage.ts           # { role: "system"|"user"|"assistant", content: string }
└── public/                   # EJS template for social share pages
```

## Frontend Structure

```
front-end-2/
├── pages/
│   ├── index.tsx             # Main app (all state as local React state, large file)
│   └── api/hello.ts          # Unused API route
├── components/
│   ├── Cover.tsx             # Book front cover — flips to reveal KeywordPage; shows story history
│   ├── KeywordPage.tsx       # Page 2: keyword input + suggestion chips (z-index 7)
│   ├── HeroPage.tsx          # Page 3: hero name input (z-index 6)
│   ├── AgePage.tsx           # Page 4: age selection cards; triggers API call (z-index 5)
│   ├── ThirdPage.tsx         # Page 5: story Part 1 + branch options (z-index 4)
│   ├── FourthPage.tsx        # Page 6: story Part 2 + branch options (z-index 3)
│   ├── LastPage.tsx          # Page 7: story Part 3 ending (z-index 2)
│   ├── BackCover.tsx         # Page 8: share + reset + PIX QR (z-index 1)
│   ├── LeftPage.tsx          # Left panel — shows story illustration for current part
│   ├── SpinnerAnimation.tsx  # Loading with random Portuguese motivational phrases
│   ├── Modal.tsx             # Fullscreen image viewer
│   ├── TTSButton.tsx         # Text-to-speech button on story pages
│   └── GoogleAnalytics.tsx   # GA4 tracking
├── helpers/
│   ├── fetchHelper.ts        # API call wrappers (getText, generateImage, shareStoryHelper)
│   ├── generalFunctions.ts   # getFirst60Percent (trims prompt for image generation)
│   └── useTypewriter.ts      # Hook: types out story text character by character
├── styles/                   # Global styles
└── next.config.js            # Next.js config
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate/:kw/:age` | GPT-3.5-turbo story generation (3-part, branching) |
| `POST` | `/generateImage` | fal.ai Flux.1 Schnell image generation (`square_hd`) |
| `POST` | `/shareStory` | Save story to Firestore, returns `storyId` |
| `GET` | `/shareStory/:storyId` | Retrieve shared story (EJS rendered for social sharing) |

---

## Data Models

### Firestore Document
```typescript
// Document ID: SHA-256 hash of story content
// Collection: (default)
{ story: string[] }  // [keyword, textPart1, textPart2, textPart3, ...messages]
```

### IMessage Interface
```typescript
interface IMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

### Image Storage Pattern
```
https://storage.googleapis.com/images-gen/temp/{uuid}.jpg   # generated images (fal.ai → GCS)
https://storage.googleapis.com/images-gen/{storyId}/image-{1,2,3}.webp  # shared story images
```

---

## CORS Configuration

Allowed origins (configured in `back-end/index.ts`):
- `http://localhost:3000`
- `https://fabulainfantil.com`
- `https://fabulainfantil.com.br`

Public routes (no CORS restriction):
- `/shareStory/*`

---

## Story Sharing

Stories are shareable via:
```
https://story.fabulainfantil.com/shareStory/{storyId}
```

Rendered server-side with EJS for proper Open Graph/social meta tags.

---

## Environment Variables

### Backend
```
OPENAI_API_KEY          # OpenAI API key
FAL_KEY                 # fal.ai API key (image generation)
FONTEND_SRV             # Frontend URL (note: typo in codebase, should be FRONTEND_SRV)
GOOGLE_CLOUD_PROJECT    # GCP project ID (for Firestore + Storage)
```

### Frontend
```
NEXT_PUBLIC_BACKEND_URL # Backend URL
NEXT_PUBLIC_GA_ID       # Google Analytics 4 measurement ID
```

---

## UX Flow

1. User lands on Cover page — clicks "Criar minha história ✨" to flip the cover
2. **KeywordPage**: types a theme keyword or clicks a suggestion chip (🦕 Dinossauro, 🧜 Sereia, 🚀 Astronauta, 🐲 Dragão, 🧙 Bruxinha, 🦊 Raposa) → clicks "Criar história"
3. **HeroPage**: optionally names the story hero → clicks "Continuar" or "pular esta etapa"
4. **AgePage**: selects age group (0–3, 4–7, 8–11, 12–14 anos) → triggers API call
5. Backend generates Part 1 (GPT-3.5-turbo); `currentPart` → 1; LeftPage illustration panel appears
6. **ThirdPage**: story Part 1 text (typewriter effect) + 3 branch options → user picks one
7. Backend generates Part 2 based on chosen branch; `currentPart` → 2
8. **FourthPage**: story Part 2 text + 3 branch options → user picks one
9. Backend generates Part 3 (ending); `currentPart` → 3
10. **LastPage**: story Part 3 text → user clicks to flip to BackCover
11. **BackCover**: "Compartilhar" saves story to Firestore + copies shareable URL; "Reiniciar" resets all state; PIX QR code for donations
12. Shared story saved to `localStorage` under `fabula_history` (up to 10 entries); displayed on Cover next visit

**`currentPart` state**: 0 = Cover/setup screens, 1 = Part 1, 2 = Part 2, 3 = Part 3. Controls LeftPage visibility (`currentPart > 0`) and which illustration is shown.

---

## 3D Book Flip UI — Layout & Z-Index Architecture

### Two-column layout (index.tsx)

```
MotherDiv (isolation: isolate — critical stacking context container)
└── BookSpread (display: flex, flex-direction: row)
    ├── LeftSide (310px wide, position: relative, z-index: 10)
    │   └── LeftPage (rendered only when currentPart > 0)
    └── RightSide (340px wide, position: relative)
        └── [all page components — position: absolute, stacked by z-index]
```

`MotherDiv` uses `isolation: isolate` to create a CSS stacking context. This is **critical** — without it, negative z-index elements escape to the root stacking context and are painted behind the `<body>` background, making them invisible and unclickable. Do not remove `isolation: isolate` from `MotherDiv`.

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

**Why all-positive z-indexes**: Browsers do not reliably deliver pointer events to elements with negative z-index within a stacking context. All pages use positive z-indexes so inputs and buttons remain interactive.

**Why flipped pages use z-index 9**: Pages need to be on top during the 3-second flip animation. After flipping (rotateY -180deg with `transform-origin: center left`), their visual rendering moves into the `LeftSide` area and no longer overlaps the right panel.

**Why LeftSide uses z-index 10**: Flipped pages (z-index 9) visually render into the left panel area. `LeftSide` at z-index 10 ensures the illustration panel always paints on top of any flipped pages in that area.

**Why Cover uses `pointer-events: none` instead of z-index change**: Cover has no `hasClicked` state — it only has `hasHovered`. After flipping, it stays at z-index 8 but receives `pointer-events: none` so clicks pass through to the pages behind it.

### Page flip animation

Each page `FPDiv` has `transform-origin: center left` (spine on the left). When `hasClicked = true`:
- z-index jumps to 9 (above all pages for the animation)
- `transform: rotateX(10deg) rotateY(-180deg)` with `transition-duration: 3s`

The page rotates around the left (spine) edge and visually moves into the LeftSide area. The right panel is then occupied by the next lower z-index page.

---

## Known Issues & Refactoring Backlog

1. **OpenAI SDK v3.2.1** — Very old. Should upgrade to v4+ or v5+.
2. **Next.js 13 `/pages` router** — Legacy router. Candidate for migration to App Router.
3. **Race condition in sharing** — Frontend waits a hardcoded 3s before fetching the shared story URL; should use proper state/callback.
4. **No user-facing error for image failures** — Silent failures when image generation fails.
5. **Env var typo** — `FONTEND_SRV` should be `FRONTEND_SRV`.
6. **Large `index.tsx`** — All state is local React state in one file; needs decomposition.
7. **EJS for social sharing** — The share page is an EJS template on the backend; could be a Next.js page instead.

---

## Image Generation

Images are generated via **fal.ai Flux.1 Schnell** (`fal-ai/flux/schnell`), replacing the deprecated DALL-E 2 endpoint (removed Feb 2025).

- Model: `fal-ai/flux/schnell` — ~3–5s per image
- Size: `square_hd`
- Safety checker: enabled (important for children's content)
- Flow: fal.ai returns a temporary URL → backend downloads it → re-uploads to GCS bucket `images-gen/temp/` → returns GCS URL to frontend

Key files:
- `back-end/services/generateImage.service.ts` — fal.ai client call
- `back-end/controllers/generateImage.controller.ts` — download + GCS upload

---

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PR to `main` | Type-checks backend (`tsc --noEmit`), builds frontend |
| `deploy-backend.yml` | Push to `main` (back-end changes) | Compiles TS → deploys to App Engine |

### App Engine Deployer SA (`fabula-deployer@generate-380122.iam.gserviceaccount.com`)

Required IAM roles:
- `roles/appengine.appAdmin` — deploy + promote traffic
- `roles/cloudbuild.builds.editor` — App Engine uses Cloud Build internally
- `roles/storage.admin` — staging artifacts
- `roles/iam.serviceAccountUser` on `generate-380122@appspot.gserviceaccount.com` — actAs App Engine default SA

### GitHub Secrets required
```
GCP_SA_KEY       # JSON key for fabula-deployer SA
OPENAI_API_KEY   # injected into app.yaml at deploy time
FAL_KEY          # injected into app.yaml at deploy time
```

Env vars are injected into `app.yaml` at deploy time (not committed to the repo).

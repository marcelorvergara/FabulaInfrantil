# Fábula Infantil — Claude Reference

> Full product design, UX flow, and z-index architecture rationale → [DESIGN.md](DESIGN.md)

AI-powered children's storytelling platform. Live at **https://fabulainfantil.com/**

---

## Architecture

```
Frontend (Next.js/Vercel) → Backend (Express/App Engine) → OpenAI GPT-3.5-turbo
                                                          → fal.ai Flux.1 Schnell (images)
                                                          → Firestore (story cache)
                                                          → GCS bucket `images-gen` (images)
```

---

## Stack

### Backend (`/back-end/`)
| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express · port 3005 |
| AI Text | OpenAI GPT-3.5-turbo · `openai` SDK v6.44.0 |
| AI Images | fal.ai `fal-ai/flux/schnell` · `square_hd` · ~3–5s |
| Database | Google Cloud Firestore |
| Storage | GCS bucket `images-gen` |
| Deployment | App Engine (`app.yaml`) |

### Frontend (`/front-end-2/`)
| Concern | Choice |
|---|---|
| Framework | Next.js 13.2.3 · legacy `/pages` router |
| UI | React 18 + styled-components |
| Analytics | Vercel Analytics + Google Ads (`AW-1032977240`) |
| Cookie consent | `CookieBanner.tsx` — consent stored in `localStorage` key `cookie_consent`; Google Ads script loads only after acceptance (LGPD) |

---

## File Map

### Backend
```
back-end/
├── index.ts                       # Express entry, CORS config
├── app.yaml                       # App Engine config
├── controllers/
│   ├── GenerateController.ts      # Story generation
│   ├── GenerateImageController.ts # Image download → GCS upload
│   └── ShareStoryController.ts    # Story sharing
├── services/                      # OpenAI + fal.ai calls, exponential backoff (5 retries)
├── repository/                    # Firestore read/write
├── utils/                         # SHA-256 hashing
└── public/                        # EJS template for share pages
```

### Frontend
```
front-end-2/
├── pages/index.tsx                # App shell; orchestrates state and routing between pages; reads ?keyword= param → passes to KeywordPage
├── hooks/
│   └── useStoryImages.ts          # Image state + generation logic (firstImage/secondImage/thirdImage, loading, errors)
├── components/
│   ├── Cover.tsx                  # z-index 8; pointer-events:none after flip
│   ├── KeywordPage.tsx            # z-index 7; keyword input + suggestion chips; accepts initialKeyword prop to pre-fill from URL
│   ├── HeroPage.tsx               # z-index 6; hero name input
│   ├── AgePage.tsx                # z-index 5; age cards; triggers API call
│   ├── ThirdPage.tsx              # z-index 4; Part 1 + branch options
│   ├── FourthPage.tsx             # z-index 3; Part 2 + branch options
│   ├── LastPage.tsx               # z-index 2; Part 3 ending
│   ├── BackCover.tsx              # z-index 1; share + reset + PIX QR; shareStatus: "idle"|"sharing"|"copied"|"error"
│   ├── LeftPage.tsx               # Illustration panel (only when currentPart > 0); shows error state per image
│   ├── SpinnerAnimation.tsx       # Loading with Portuguese phrases
│   ├── Modal.tsx                  # Fullscreen image viewer
│   ├── TTSButton.tsx              # Text-to-speech on story pages
│   └── CookieBanner.tsx           # z-index 9999; fixed bottom; shows until user accepts/declines; LGPD consent gate for Google Ads
└── helpers/
    ├── fetchHelper.ts             # getText, generateImage, shareStoryHelper, pollShareReady
    ├── generalFunctions.ts        # getFirst60Percent (trims image prompts)
    └── useTypewriter.ts           # Typewriter effect hook
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate/:kw/:age` | GPT-3.5-turbo story (3-part, branching) |
| `POST` | `/generateImage` | fal.ai image generation |
| `POST` | `/shareStory` | Save story to Firestore → returns `storyId` |
| `GET` | `/shareStory/:storyId/ready` | Returns `{ ready: bool }` — true once all 3 GCS images exist |
| `GET` | `/shareStory/:storyId` | Retrieve + EJS-render shared story |

---

## Data Models

```typescript
// Firestore doc ID: SHA-256 of story content
{ story: string[] }  // [keyword, part1text, part2text, part3text, ...messages]

interface IMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

Image URL patterns:
```
images-gen/temp/{uuid}.jpg            # temp (generated, not yet shared)
images-gen/{storyId}/image-{1,2,3}.webp  # permanent (after share)
```

---

## Z-Index Quick Reference

`MotherDiv` has `isolation: isolate` — **do not remove** (creates stacking context).

| Layer | z-index |
|---|---|
| CookieBanner | 9999 |
| LeftSide / ErrorCard | 10 |
| Cover (after flip: + `pointer-events: none`) | 8 |
| KeywordPage → BackCover (7 → 1) | 7–1 |
| Any page during flip animation | 9 |

`LeftSide` must be 10 so it paints over flipped pages (z-index 9) that visually rotate into the left panel area.

---

## Tracking & Consent

Google Ads tag `AW-1032977240` is loaded via `next/script` (`strategy="afterInteractive"`) in `pages/_app.tsx`, **only when the user has accepted cookies**.

Consent flow (`_app.tsx`):
1. On mount, read `localStorage.getItem("cookie_consent")` → `null` (first visit) | `"true"` | `"false"`
2. `null` → render `<CookieBanner>` at bottom of page
3. User clicks **Aceitar** → store `"true"`, mount Google Ads `<Script>` tags
4. User clicks **Recusar** → store `"false"`, no tracking scripts load

To add future consent-gated scripts, follow the same pattern: render inside `{consent === true && …}`.

---

## Google Ads — Keyword Pre-fill (Sitelinks)

Sitelinks for the **Família** audience segment use `?keyword=` to pre-fill the story theme on landing, giving users a faster path to story creation.

| Sitelink | URL |
|---|---|
| Conto para Seu Filho | `/?keyword=filho` |
| Hora de Dormir | `/?keyword=sono` |
| Fábula com Moral | `/?keyword=amizade` |
| Crie com Seu Filho | `/?keyword=família` |
| Presente Criativo | `/?keyword=presente` |

**How it works:** `pages/index.tsx` reads `router.query.keyword` (once `router.isReady`) and sets `initialKeyword` state, which is passed as a prop to `KeywordPage`. `KeywordPage` syncs it into the `kw` input via `useEffect`. Reset clears the pre-fill.

---

## Environment Variables

```
# Backend
OPENAI_API_KEY          # OpenAI
FAL_KEY                 # fal.ai
GOOGLE_CLOUD_PROJECT    # GCP project

# Frontend
NEXT_PUBLIC_BACKEND_SRV          # Backend base URL (e.g. http://localhost:3005)
NEXT_PUBLIC_GA4_TRACKING_ID      # Google Analytics 4 measurement ID
```

---

## CORS

Allowed origins (`back-end/index.ts`): `localhost:3000`, `fabulainfantil.com`, `fabulainfantil.com.br`  
Public (no restriction): `/shareStory/*`

---

## CI/CD

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | PR → `main` | `tsc --noEmit` + frontend build |
| `deploy-backend.yml` | Push → `main` (back-end changes) | Compile TS → App Engine deploy |

Secrets: `GCP_SA_KEY`, `OPENAI_API_KEY`, `FAL_KEY` — injected into `app.yaml` at deploy time (not committed).

Deployer SA: `fabula-deployer@generate-380122.iam.gserviceaccount.com`  
Roles needed: `appengine.appAdmin`, `cloudbuild.builds.editor`, `storage.admin`, `iam.serviceAccountUser` on `generate-380122@appspot.gserviceaccount.com`

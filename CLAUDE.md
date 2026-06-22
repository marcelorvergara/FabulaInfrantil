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
| AI Text | OpenAI GPT-3.5-turbo · `openai` SDK v3.2.1 (old — don't upgrade without testing) |
| AI Images | fal.ai `fal-ai/flux/schnell` · `square_hd` · ~3–5s |
| Database | Google Cloud Firestore |
| Storage | GCS bucket `images-gen` |
| Deployment | App Engine (`app.yaml`) |

### Frontend (`/front-end-2/`)
| Concern | Choice |
|---|---|
| Framework | Next.js 13.2.3 · legacy `/pages` router |
| UI | React 18 + styled-components |
| Analytics | GA4 + Vercel Analytics |

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
├── pages/index.tsx                # All app state lives here (large file)
├── components/
│   ├── Cover.tsx                  # z-index 8; pointer-events:none after flip
│   ├── KeywordPage.tsx            # z-index 7; keyword input + suggestion chips
│   ├── HeroPage.tsx               # z-index 6; hero name input
│   ├── AgePage.tsx                # z-index 5; age cards; triggers API call
│   ├── ThirdPage.tsx              # z-index 4; Part 1 + branch options
│   ├── FourthPage.tsx             # z-index 3; Part 2 + branch options
│   ├── LastPage.tsx               # z-index 2; Part 3 ending
│   ├── BackCover.tsx              # z-index 1; share + reset + PIX QR
│   ├── LeftPage.tsx               # Illustration panel (only when currentPart > 0)
│   ├── SpinnerAnimation.tsx       # Loading with Portuguese phrases
│   ├── Modal.tsx                  # Fullscreen image viewer
│   └── TTSButton.tsx              # Text-to-speech on story pages
└── helpers/
    ├── fetchHelper.ts             # getText, generateImage, shareStoryHelper
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
| LeftSide / ErrorCard | 10 |
| Cover (after flip: + `pointer-events: none`) | 8 |
| KeywordPage → BackCover (7 → 1) | 7–1 |
| Any page during flip animation | 9 |

`LeftSide` must be 10 so it paints over flipped pages (z-index 9) that visually rotate into the left panel area.

---

## Environment Variables

```
# Backend
OPENAI_API_KEY          # OpenAI
FAL_KEY                 # fal.ai
FONTEND_SRV             # Frontend URL (typo — do not rename without updating code)
GOOGLE_CLOUD_PROJECT    # GCP project

# Frontend
NEXT_PUBLIC_BACKEND_URL
NEXT_PUBLIC_GA_ID
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

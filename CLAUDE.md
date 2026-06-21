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
│   ├── SpinnerAnimation.tsx  # Loading with random Portuguese motivational phrases
│   ├── Modal.tsx             # Fullscreen image viewer
│   └── GoogleAnalytics.tsx   # GA4 tracking
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

1. User lands on homepage — selects **age group** (0-2, 3-5, 6-8, 9-11, 12-14) and enters a **theme keyword**
2. Backend generates Part 1 of the story (GPT-3.5-turbo)
3. An illustration is generated for Part 1
4. User is presented with **2 branching choices** → picks one
5. Backend generates Part 2 based on chosen branch
6. Repeat for Part 3 (the ending)
7. Final "book" is assembled with 3 illustrations
8. User can **share** the story (saved to Firestore, returned as a shareable URL)
9. Back cover shows PIX donation QR code

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

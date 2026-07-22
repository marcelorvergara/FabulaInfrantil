# Fábula Infantil — Claude Reference

> Full product design, UX flow, and z-index architecture rationale → [DESIGN.md](DESIGN.md)

AI-powered children's storytelling platform. Live at **https://fabulainfantil.com/**

---

## Architecture

```
Frontend (Next.js/Vercel) → Backend (Express/App Engine) → OpenAI GPT-4o-mini
                                                          → fal.ai Flux.1 Schnell (images)
                                                          → Firestore (story cache + llm_telemetry)
                                                          → GCS bucket `images-gen` (images)
```

---

## Stack

### Backend (`/back-end/`)
| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express · port 3005 |
| AI Text | OpenAI GPT-4o-mini · `openai` SDK v6.44.0 |
| AI Images | fal.ai `fal-ai/flux/schnell` · `square_hd` · ~3–5s |
| Database | Google Cloud Firestore |
| Storage | GCS bucket `images-gen` |
| Deployment | App Engine (`app.yaml`) |

### Frontend (`/front-end-2/`)
| Concern | Choice |
|---|---|
| Framework | Next.js 15.5.19 · `/pages` router |
| UI | React 18 + styled-components |
| Analytics | Vercel Analytics + Google Ads (`AW-1032977240`) |
| Cookie consent | `CookieBanner.tsx` — consent stored in `localStorage` key `cookie_consent`; Google Consent Mode v2 (default denied, cookieless pings, upgraded to granted on acceptance) — LGPD |

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
│   ├── ShareStoryController.ts    # Story sharing
│   └── internal.controller.ts     # GET /internal/llm-metrics — 24h telemetry aggregates
├── services/                      # OpenAI + fal.ai calls, exponential backoff (5 retries)
├── repository/                    # Firestore read/write, incl. llmTelemetry.repo.ts
├── utils/                         # SHA-256 hashing, llmPricing.ts (cost-per-call estimates)
├── scripts/                       # One-off dev/ops scripts — not part of the Express app or deploy path
│   ├── lib/ttsEngines.ts          # Shared Google/OpenAI/ElevenLabs TTS render + WAV assembly, used by both scripts below
│   ├── render-sleep-audio.ts      # Modo Soninho TTS bake-off — blind-renders one story through 2-3 engines for listening comparison
│   └── ship-sleep-audio.ts        # Renders all 4 sleep stories with one or more engines (--engines a,b), transcodes to mp3, uploads one file per story per engine to GCS sleep-audio/ — see "Modo Soninho" below
└── public/                        # EJS template for share pages
```

### Frontend
```
front-end-2/
├── pages/_document.tsx             # Custom Document; hosts the beforeInteractive Consent Mode v2 default-denied snippet (must run before gtag.js)
├── pages/_app.tsx                  # Loads gtag.js unconditionally; fires consent update on accept/mount-if-already-accepted
├── pages/index.tsx                # App shell; orchestrates state and routing between pages; reads ?keyword= param → passes to KeywordPage; fires story_started/share_clicked/story_completed gtag events
├── pages/historia-para-dormir.tsx  # Static SEO/marketing landing page (bedtime theme); no book-flow state, CTA → /?keyword=sono; see "SEO Landing Pages" below
├── pages/modo-soninho.tsx          # Passive bedtime audio MVP (beta, noindex); story picker + SleepNarrationPlayer; see "Modo Soninho" below
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
│   ├── TTSButton.tsx              # Text-to-speech toggle on book-flow story pages (single-utterance, native speechSynthesis)
│   ├── SleepNarrationPlayer.tsx   # <audio>-based narration player for /modo-soninho — separate from TTSButton, see "Modo Soninho" below
│   └── CookieBanner.tsx           # z-index 9999; fixed bottom; shows until user accepts/declines; upgrades Consent Mode v2 signals to granted on accept
├── data/
│   └── sleepStories.ts            # Fixed library of pt-BR bedtime stories (ISleepStory[]) for /modo-soninho — not GPT-generated, repetition is deliberate; voices[] populated by back-end/scripts/ship-sleep-audio.ts
├── interfaces/
│   ├── IResult.ts                 # IMessage / IResult — story generation response shape
│   └── ISleepStory.ts             # slug/title/teaser/estimatedMinutes/paragraphs/voices[] shape for sleepStories.ts — each voice is { engine, label, audioUrl, paragraphTimestamps }
└── helpers/
    ├── fetchHelper.ts             # getText, generateImage, shareStoryHelper, pollShareReady
    ├── generalFunctions.ts        # getFirst60Percent (trims image prompts)
    └── useTypewriter.ts           # Typewriter effect hook
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate/:kw/:age` | GPT-4o-mini story (3-part, branching) |
| `POST` | `/generateImage` | fal.ai image generation |
| `POST` | `/shareStory` | Save story to Firestore → returns `storyId` |
| `GET` | `/shareStory/:storyId/ready` | Returns `{ ready: bool }` — true once all 3 GCS images exist |
| `GET` | `/shareStory/:storyId` | Retrieve + EJS-render shared story |
| `GET` | `/internal/llm-metrics` | 24h telemetry aggregates; gated by `X-Internal-Key` header (see below) |

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

Firestore collection `llm_telemetry` (one doc per `/generate` or `/generateImage` call, written fire-and-forget — never awaited on the response path):
```typescript
interface ILlmTelemetry {
  occurred_at: Date;
  endpoint: string;        // "/generate" | "/generateImage"
  model: string;           // "gpt-4o-mini" | "fal-ai/flux/schnell"
  latency_ms: number;
  input_tokens: number;    // 0 for image calls
  output_tokens: number;   // 0 for image calls
  cost_usd: number;        // gpt-4o-mini: token-based; image: flat fal.ai rate
  success: boolean;
  error_message: string | null;
}
```

`GET /internal/llm-metrics` (`internal.controller.ts` → `LlmTelemetryRepo.getAggregates24h()`) returns:
```typescript
interface ILlmMetricsAggregate {
  requests_24h: number;
  avg_latency_ms: number | null;   // null when requests_24h === 0 — avg over zero samples is undefined, not 0
  tokens_24h: number;
  cost_usd_24h: number;
  error_rate_pct: number | null;   // null when requests_24h === 0, same reasoning
}
```
`requests_24h`, `tokens_24h`, `cost_usd_24h` are always numbers — 0 is correct for "no activity." Only the two averaged/derived fields go `null`, so the public `llm_health` status block (polled by Monitoring Links) can distinguish "no data this window" from "0ms avg latency, 0% errors" (which would misleadingly read as "responds instantly, never fails").

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

Google Ads tag `AW-1032977240` uses **Google Consent Mode v2**. `gtag.js` and `gtag('config', ...)` load unconditionally via `next/script` (`strategy="afterInteractive"`) in `pages/_app.tsx` — they are no longer gated behind cookie acceptance. What changes with consent is the *signal* gtag sends, not whether it loads.

Consent default (`pages/_document.tsx`, `strategy="beforeInteractive"` — must run before `gtag.js`, so it lives in `_document`, not `_app`):
```js
gtag('consent', 'default', {
  ad_storage: 'denied', analytics_storage: 'denied',
  ad_user_data: 'denied', ad_personalization: 'denied'
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
```
With all signals denied, gtag sends cookieless pings only (no `_gcl_*`/`_ga` cookies written); `ads_data_redaction` strips ad-click identifiers, and `url_passthrough` preserves `gclid` attribution via URL instead of cookies. Google can still model conversions from this traffic — this is what fixed pre-consent conversions being invisible.

Consent flow (`_app.tsx`):
1. On mount, read `localStorage.getItem("cookie_consent")` → `null` (first visit) | `"true"` | `"false"`. If `"true"`, immediately fire `gtag('consent', 'update', {...granted})`.
2. `null` → render `<CookieBanner>` at bottom of page.
3. User clicks **Aceitar** → store `"true"`, fire `gtag('consent', 'update', {...granted})` (cookies now written, full attribution).
4. User clicks **Recusar** → store `"false"`, no update call — signals stay denied (cookieless measurement continues).

Verifying the boundary holds (Tag Assistant / DevTools, against the deployed site — not meaningful in local dev):
- Fresh incognito, don't touch the banner → Application → Cookies: no `_gcl_au`/`_ga`/`_gid` on `fabulainfantil.com`.
- Tag Assistant `gcd` param reads denied-by-default; `consentStatus.default` is `true`.
- Click Aceitar → `gcd` flips to granted-via-update; cookies now appear.
- Trigger `story_completed` in a fresh (no-consent) session → the conversion ping still fires, cookieless.

### Conversion events (`pages/index.tsx`)
Fired via a local `fireGtagEvent(name, params?)` helper (guards on `window.gtag` existing — protects against script-blocked browsers, mostly vestigial now that gtag always loads):
| Event | Trigger | gtag call |
|---|---|---|
| `story_started` | `handleAge` — first `/generate` call is triggered | `gtag('event', 'story_started')` |
| `share_clicked` | `shareStory()` — BackCover share button | `gtag('event', 'share_clicked')` |
| `story_completed` | `currentPart === 3` (primary conversion) | `gtag('event', 'conversion', { send_to: 'AW-1032977240/i9TXCI68psccENj2x-wD' })` |

`story_started`/`share_clicked` are custom events, not conversion actions with a `send_to` label yet — set those up in Google Ads → Metas → Conversões → Nova ação de conversão → **Google tag**, which detects them from the existing tag after they've fired a few times in production.

### Modo Soninho funnel events (`historia-para-dormir.tsx` + `SleepNarrationPlayer.tsx`)
Each file has its own local copy of `fireGtagEvent` (intentional duplication, same as `pages/index.tsx` — not a shared helper in this codebase):
| Event | Trigger | gtag call |
|---|---|---|
| `sleep_mode_clicked` | Secondary CTA click on `historia-para-dormir.tsx` → `/modo-soninho` | `gtag('event', 'sleep_mode_clicked')` |
| `sleep_story_started` | First Play tap for a story in `SleepNarrationPlayer`, and again on each voice switch mid-playback (a fresh listen on the new voice) | `gtag('event', 'sleep_story_started', { story: slug, voice: engine })` |
| `sleep_story_progress` | Halfway paragraph reached, on manual Stop (with `listened_minutes`), and on a mid-playback voice switch (with `listened_minutes` for the *abandoned* voice) | `gtag('event', 'sleep_story_progress', { story: slug, voice: engine, listened_minutes? })` |
| `sleep_story_completed` | Natural end of the last paragraph only (not on manual Stop or a voice switch) | `gtag('event', 'sleep_story_completed', { story: slug, voice: engine })` |

These exist because `sleep_mode_clicked` alone only proves the CTA is noticed — `started`/`progress`/`completed` are what actually validate the listening-behavior hypothesis the MVP is testing. The `voice` param (added once stories shipped with more than one engine) segments the funnel by voice — note that a voice switch means `started` counts are per voice-session, not per child-session.

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

## SEO Landing Pages

Standalone, statically-generated marketing pages that target a specific theme/keyword for organic search — separate from the `?keyword=` sitelink pre-fill above (which serves paid traffic landing directly on the book flow). Pattern established by [historia-para-dormir.tsx](front-end-2/pages/historia-para-dormir.tsx) (bedtime/"sono" theme):

- Single file under `pages/`, no book-flow state — just hero + benefits + ~300-word indexable copy + FAQ.
- CTA is a plain `next/link` to `/?keyword=<theme>`, reusing the existing pre-fill mechanism (never reimplement it).
- Own `<Head>` (title/description/canonical/OG/FAQPage JSON-LD) — safe to override `_app.tsx`'s defaults per-page; Next dedupes by tag and the page's own `<Head>` wins.
- Styled-components only; reuse the navy/gold brand palette (`#1a1a5e`/`#0d0d30`/`#ffd700`), variant the tone (e.g. darker/nocturnal for bedtime) rather than introducing a new palette.
- **Gotcha**: don't interpolate a `keyframes` result into a plain template literal or inline `style` — styled-components only injects the `@keyframes` rule when the animation is used inside a tagged `styled`/`css` template. Doing it in an untagged string throws at prerender time (`git.io/JUIaE#12`) and breaks the static build.
- Verify with `npx tsc --noEmit`, `npm run build` (confirm `○ (Static)` in the route summary — no `getServerSideProps`/dynamic data means it should always be SSG), and a Playwright screenshot at mobile + desktop widths.

To add another theme page, copy this pattern with a new keyword/route (e.g. `/historia-de-aniversario` → `/?keyword=aniversário`).

---

## Modo Soninho — Bedtime Audio MVP

Passive, audio-first "bedtime story" experiment at `/modo-soninho` — a deliberate departure from the branching-book flow, testing the hypothesis that a sleep product wants passive listening and repetition, not screen interactivity and novelty. Linked from [historia-para-dormir.tsx](front-end-2/pages/historia-para-dormir.tsx) as a subdued secondary CTA (`🧪 Experimente o Modo Soninho (beta)`) placed under the primary CTA — the primary CTA/copy is untouched and stays the priority path until this MVP shows real return-visit behavior.

**Deliberate MVP scope (revisit only once the funnel events above show demand):**
- Fixed library of 4 stories ([data/sleepStories.ts](front-end-2/data/sleepStories.ts)) — repetition is the point for a sleep product, not a limitation; not GPT-generated per session.
- No PWA / Service Worker / offline caching yet.
- `<meta name="robots" content="noindex, follow">` on the page — unlike `historia-para-dormir.tsx`'s `index, follow` — since this is an unvalidated experiment that may be reworked or pulled.

**Narration: pre-rendered `<audio>`, not live TTS.** The MVP originally shipped on browser-native `speechSynthesis` (zero infra cost, fastest way to validate the passive-listening format). Once the format proved out, narration moved to real pre-rendered audio — a one-time asset-generation problem, not a runtime-cost one, since the library is fixed and rendered once rather than per session:

1. `back-end/scripts/render-sleep-audio.ts` — blind TTS bake-off. Renders one story through 2–3 engines (Google Cloud TTS, OpenAI `gpt-4o-mini-tts`, optionally ElevenLabs), shuffles the output filenames + writes a `key.json`, so you can score voices by ear (night, phone speaker, real bedtime volume) before knowing which is which.
2. `back-end/scripts/ship-sleep-audio.ts` — once winning engine(s) are picked, renders all 4 stories with each (`--engines openai,elevenlabs` — supports one or more; the bake-off turned up two winners, and rendering both for the whole library is still a few cents total, not a real cost concern), transcodes each to **mono 96kbps mp3** (spoken narration doesn't need ffmpeg's stereo/128kbps+ defaults — keeps a 5-minute story to ~2–4MB on bedtime Wi-Fi), and uploads to the existing `images-gen` GCS bucket under `sleep-audio/{slug}-{engine}.mp3` (one file per story per engine; same bucket/project/public-read pattern as `GenerateImageController.ts`, not a new bucket). Uploads set `Cache-Control: public, max-age=31536000, immutable` since these files never change post-ship — **if a story/engine is ever re-rendered, upload under a versioned filename (`{slug}-{engine}-v2.mp3`) instead of overwriting**, or the immutable cache header keeps serving the old voice for up to a year.
3. Both scripts share `back-end/scripts/lib/ttsEngines.ts` (per-paragraph rendering + WAV assembly), so the paragraph/silence-timing math exists in exactly one place.

`ISleepStory.voices` (`ISleepStoryVoice[]`, in `ISleepStory.ts` / `sleepStories.ts`) is what lets multiple engines exist per story. Each voice carries its own `paragraphTimestamps` (cumulative ms offset per paragraph) — **not shared across voices** — because different engines pace speech differently, so `SleepNarrationPlayer.tsx` needs a separate timing map per voice to keep its per-paragraph progress dots + synced text accurate. **Timestamps are measured against the actual assembled PCM stream — including every inserted inter-paragraph silence gap — not the sum of paragraph durations.** Getting this wrong is invisible in a quick spot-check and only shows up later as the progress dots drifting further behind the narration with every paragraph (`assemble()` in `ttsEngines.ts` is where this is computed). `voice.label` is a human-facing string (e.g. "Voz suave") deliberately distinct from `voice.engine` — the UI never needs to say "OpenAI vs ElevenLabs" to a parent at bedtime.

`back-end/tsconfig.json` has a `paths` mapping (`"@/*": ["../front-end-2/*"]`) purely so these scripts — which live in `back-end/` for its OpenAI/GCP credentials, but import `front-end-2/data/sleepStories.ts` for the story content — can resolve that file's `@/interfaces/ISleepStory` alias during typecheck. This does not affect the deployed backend at runtime.

**[SleepNarrationPlayer.tsx](front-end-2/components/SleepNarrationPlayer.tsx)** is a separate component from `TTSButton.tsx` (which is live in the book flow's `ThirdPage`/`FourthPage`/`LastPage` — changing its behavior risked regressing it), built around a single hidden `<audio key={currentVoice.engine} src={currentVoice.audioUrl} />`:
- **No `crossOrigin` attribute** — plain playback doesn't need it, and GCS objects don't send `Access-Control-Allow-Origin` by default even when publicly readable, so adding `crossOrigin="anonymous"` without a matching bucket CORS rule breaks playback outright (hit this directly: shipped with it set once, got a CORS error on every story). The follow-on roadmap (Web Audio API / `MediaElementAudioSourceNode` / a future LiteRT.js adaptive-narration layer) will need both `crossOrigin="anonymous"` here *and* a CORS rule configured on the `images-gen` bucket (GCS CORS is bucket-wide, not scopable to just `sleep-audio/`) added together at that point — don't add one without the other.
- Play/Pause/Stop drive `audio.play()`/`audio.pause()`/`audio.currentTime = 0` directly — no more Chrome/Android `speechSynthesis` pause-resume watchdog, no per-paragraph utterance chaining; `<audio>` doesn't have those bugs.
- Lock-screen controls via the **Media Session API** (`navigator.mediaSession.metadata` + `setActionHandler("play"/"pause"/"stop", ...)`) — for a parent lying in the dark next to an almost-asleep child, pausing without lighting up the phone screen is close to a core requirement for this product, not polish.
- Fixes the MVP's core screen-lock failure mode: `speechSynthesis` did not reliably keep playing once the screen locked; a real `<audio>` element does.

**Voice toggle**: when a story has more than one `voices[]` entry, a small pill button (`🔊 {label}`) appears next to the controls — clicking cycles to the next voice (`(voiceIndex + 1) % voices.length`). Not a picker/dropdown, deliberately — this is meant to be a light, low-key control, not a new feature surface. Preference is remembered in `localStorage` under `modo_soninho_voice`, matched against `voice.engine`. That read happens inside a mount `useEffect`, **never in the `useState` initializer** — `/modo-soninho` is statically generated, so the server-rendered HTML always reflects `voices[0]`, and reading `localStorage` in the initializer would make a returning user's client render disagree with that HTML and trigger a hydration mismatch (same reasoning as `CookieBanner`'s `cookie_consent` read).

Switching voice **restarts the story from the beginning on the new voice** rather than resuming at an equivalent position — different engines pace speech differently, so "the same position" isn't meaningfully defined across two voices' separate `paragraphTimestamps` arrays. The `<audio>` element is keyed on `currentVoice.engine`, so React fully remounts it on switch (fresh element, no manual `.load()` calls, no stale-`src` edge cases, starts at `currentTime = 0`/`volume = 1` for free). A short volume fade (~300ms, ramping `audio.volume`) softens the cut on switch. **Known platform limitation**: on iOS Safari, `HTMLMediaElement.volume` is effectively read-only — the OS owns hardware volume there — so the fade is a no-op and switching voice is a hard cut on exactly the iPhone-heavy part of the audience. Acceptable for this version (a cut on a deliberate, user-initiated action reads very differently than an unexpected one); the real fix would be a Web Audio `GainNode`, which needs `crossOrigin` + bucket CORS added together at that point (see note above — not wired yet). The sleep timer (if set) intentionally keeps running across a voice switch — only playback progress resets. The post-switch `play()` call happens async, outside the original click's gesture — if the browser rejects it (iOS Safari is the strictest here), the player settles into a clean paused state on the new voice rather than looking like it's playing while silent.

**Gotcha found while building this**: custom-styled `<button>`/`<select>` elements need `appearance: none` (`-webkit-appearance: none`) explicitly set, or native browser button chrome (light gray) paints over the intended dark/subtle `background` — surfaced via Playwright screenshot testing of the story-picker cards, invisible in casual review since the effect is subtle at small icon-button sizes but glaring on larger card-style buttons.

**Known limitation (pre-existing, app-wide, not introduced here)**: [_document.tsx](front-end-2/pages/_document.tsx) has no `ServerStyleSheet` extraction for styled-components, so CSS injects client-side only — there's a brief unstyled flash on first paint before hydration completes, on every page in this app, not just this one. Surfaced during headless screenshot verification of this page (screenshots taken at `load` before hydration finished the first time showed raw unstyled/native HTML); resolves once React hydrates. Worth fixing app-wide at some point, but out of scope for this feature.

---

## Environment Variables

```
# Backend
OPENAI_API_KEY          # OpenAI
FAL_KEY                 # fal.ai
GOOGLE_CLOUD_PROJECT    # GCP project
INTERNAL_API_KEY        # Shared secret for GET /internal/llm-metrics (X-Internal-Key header)
APP_CRED                # GCS service account keyFilename (images-gen bucket uploads — GenerateImageController + scripts/ship-sleep-audio.ts)

# Backend — scripts/ only (Modo Soninho TTS bake-off/ship scripts; not read by the deployed Express app)
GOOGLE_APPLICATION_CREDENTIALS  # Google Cloud TTS auth (or `gcloud auth application-default login`)
GOOGLE_TTS_VOICE                # optional override, default pt-BR-Neural2-A
OPENAI_TTS_MODEL                # optional override, default gpt-4o-mini-tts
OPENAI_TTS_VOICE                # optional override, default nova
ELEVENLABS_API_KEY              # optional third bake-off candidate; that engine is skipped if unset
ELEVENLABS_VOICE_ID             # required if ELEVENLABS_API_KEY is set
ELEVENLABS_MODEL                # optional override, default eleven_multilingual_v2

# Frontend
NEXT_PUBLIC_BACKEND_SRV          # Backend base URL (e.g. http://localhost:3005)
NEXT_PUBLIC_GA4_TRACKING_ID      # Google Analytics 4 measurement ID
```

---

## CORS

Allowed origins (`back-end/index.ts`): `localhost:3006` (dev, via `CLIENT_URL_DEV`), `fabulainfantil.com`, `fabulainfantil.com.br`  
Public (no restriction): `/shareStory/*`  
Origin-check bypassed (no browser `Origin` header expected — server-to-server): `/internal/*`, gated instead by the `X-Internal-Key` header

---

## CI/CD

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | PR → `main` | `tsc --noEmit` + frontend build |
| `deploy-backend.yml` | Push → `main` (back-end changes) | Compile TS → App Engine deploy |

Secrets: `GCP_SA_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `INTERNAL_API_KEY` — injected into `app.yaml` at deploy time (not committed).

Deployer SA: `fabula-deployer@generate-380122.iam.gserviceaccount.com`  
Roles needed: `appengine.appAdmin`, `cloudbuild.builds.editor`, `storage.admin`, `iam.serviceAccountUser` on `generate-380122@appspot.gserviceaccount.com`

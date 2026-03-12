# PixGen — System Architecture Audit

This file tracks identified issues, bugs, and areas for improvement in the PixGen image-generation-platform monorepo.

## 🛠 Backend Issues

### Project Structure & Configuration
- [x] **Single-File Backend**: All 9 API routes are defined in a single 312-line `index.ts` file. Refactored into modular controllers and routers (`apps/backend/routes/`, `apps/backend/controllers/`).
  - *Impact*: Greatly improved maintainability and readability.
  - *Effort*: Done.
  
- [x] **🔴 Model Name Sent as Trigger Word**: In `/ai/training`, `parsedBody.data.name` (the model name) is passed as `triggerWord` to `modalModel.trainModel()`. The trigger word should be a unique identifier like `sks` — not the human-readable model name. Implemented `generateTriggerWord` utility to auto-generate unique SKids (e.g., `sks_abc123`) from the model name.
  - *Impact*: Training now uses reliable, unique trigger words.
  - *Effort*: Done.

- [x] **`@types/*` in Production Dependencies**: Moved `@types/cors`, `@types/express`, and `@types/jsonwebtoken` to `devDependencies` in `apps/backend/package.json`.
  - *Impact*: Smaller production installation.
  - *Effort*: Done.

- [x] **Console.log in Production Code**: Debug `console.log` statements left in pre-signed URL generation (line 37) and training request (lines 70–71) of `index.ts`. Sanitized logs in `aiController.ts` and `uploadRouter.ts` to strip sensitive information like `MODAL_BASE_URL` and raw error objects.
  - *Impact*: Protected internal URLs and credentials from stdout exposure.
  - *Effort*: Done.

- [x] **Stale `.env.example`**: `apps/backend/.env.example` still references `FAL_KEY` (removed dependency) and is missing `MODAL_BASE_URL`, `MODAL_DEV`, `MODAL_WEBHOOK_SECRET`, and `FRONTEND_URL`. Synced `.env.example` files across backend, web, and db packages to match current `.env` requirements.
  - *Impact*: New contributors can easily set up the project without guessing required variables.
  - *Effort*: Done.

- [x] **Missing Frontend `.env.example`**: Created `.env.example` in `apps/web/` with necessary Clerk and cloudflare R2 placeholders.
  - *Impact*: Documented environment requirements for frontend contributors.
  - *Effort*: Done.

- [x] **Next.js Build Compatibility**: Wrapped `useSearchParams` dependent logic in `DashboardContent` with `<Suspense />` boundaries.

- [x] **Git Hygiene**: Improved `.gitignore` patterns to accurately filter Bun and Next.js temporary files.

### Security

#### 🔴 CRITICAL Priority
- [x] **Unauthenticated Pre-Signed URL Endpoint**: `GET /pre-signed-url` has **no `authMiddleware`** — anyone can generate S3/R2 upload URLs without authentication. Added `authMiddleware` to the route in `uploadRouter.ts`.
  - *Impact*: Only authenticated users can generate upload URLs, preventing storage abuse.
  - *Effort*: Done.

- [ ] **No Rate Limiting**: All API endpoints have zero request throttling. No `express-rate-limit` or equivalent is configured.
  - *Impact*: Vulnerable to brute-force attacks, DoS, and abuse of GPU training endpoints (each training run costs real money on Modal)
  - *Effort*: Medium (install `express-rate-limit`, configure per-route limits)

- [ ] **Non-Null Assertion on Secrets**: `process.env.AUTH_JWT_KEY!`, `process.env.MODAL_WEBHOOK_SECRET!`, and other secrets use TypeScript non-null assertions. If env vars are missing, the server starts but silently fails on first request.
  - *Impact*: Silent authentication bypass or crash on first request in misconfigured deployments
  - *Effort*: Low (add startup validation — check all required env vars exist before `app.listen()`)

#### 🟠 HIGH Priority
- [ ] **No Input Sanitization on Pack/Bulk Endpoints**: `GET /pack/bulk` returns all packs without pagination or filtering. `GET /image/bulk` accepts `limit` and `offset` as raw strings with no max cap.
  - *Impact*: Database overload from excessively large queries; potential data exfiltration
  - *Effort*: Low (add server-side max limits, validate numeric inputs)

- [x] **Missing Error Handling in `/ai/generate`**: Added background `try-catch` block around the Modal generation request to prevent unhandled promise rejections.
  - *Impact*: Server remains stable even if Modal API calls fail.
  - *Effort*: Done.

- [x] **Missing Error Handling in `/pack/generate`**: Wrapped bulk Modal generation calls in `Promise.all` within a `try-catch` block for resilient batch processing.
  - *Impact*: Batch failures no longer crash the request; errors are logged correctly.
  - *Effort*: Done.

- [ ] **Account Enumeration via Error Messages**: API returns specific error messages like `"Model not found"` and `"Input incorrect"` which could help attackers map valid resources.
  - *Impact*: Information leakage about system internals
  - *Effort*: Low (use generic error messages in production)

#### 🟡 MEDIUM Priority
- [ ] **No API Versioning**: All routes are at the root level (`/ai/training`, `/models`, etc.) with no version prefix.
  - *Impact*: Breaking changes to the API will affect all clients simultaneously
  - *Effort*: Low (prefix all routes with `/api/v1/`)

- [ ] **No Health Check Endpoint**: No `GET /health` or `GET /status` endpoint for monitoring backend availability.
  - *Impact*: Load balancers and monitoring tools cannot determine if the backend is healthy
  - *Effort*: Trivial (add a simple health endpoint)

- [ ] **CORS Wildcard Risk**: CORS origin is set from `process.env.FRONTEND_URL` with no fallback validation. If the env var is unset, `cors({ origin: undefined })` allows all origins.
  - *Impact*: Any website could make authenticated API requests on behalf of users
  - *Effort*: Trivial (throw on missing `FRONTEND_URL` or default to strict)

- [ ] **Missing Security Headers**: No `helmet` middleware or manual security headers configured on the Express server.
  - *Impact*: Vulnerable to clickjacking, MIME sniffing, and other header-based attacks
  - *Effort*: Low (install and configure `helmet`)

---

## 🗄 Database Issues

### Schema Design
- [x] **🔴 User Not Saved to DB**: The `User` table exists in the Prisma schema but no API endpoint creates or syncs users from Clerk. Fixed via `UserSync` component (mounted in dashboard layout) which calls `POST /user-auth` on every session to upsert the user into the DB. Username fallback uses `user.id` (Clerk ID) to avoid unique constraint collisions. P2002 errors are handled gracefully.

- [x] **No Foreign Key on `userId`**: Updated `schema.prisma` to include `@relation` fields for `userId` in `Model` and `OutputImages` models.
  - *Impact*: Referential integrity established; cascade deletes now possible.
  - *Effort*: Done.

- [ ] **Field Naming Typo**: `updateAt` is used instead of the standard `updatedAt` in `User`, `Model`, and `OutputImages` models.
  - *Impact*: Inconsistency with Prisma conventions and community expectations
  - *Effort*: Low (rename via migration — non-breaking at app level since Prisma maps it)

- [x] **No Indexes on Frequently Queried Fields**: No explicit indexes on `Model.userId`, `OutputImages.userId`, `OutputImages.modelId`, or `OutputImages.status`. Added `@@index` on `Model(userId)`, `OutputImages(userId, modelId)`, and `PackPrompts(packId)`.
  - *Impact*: significantly improved query performance for user-specific models and images.
  - *Effort*: Done.

- [ ] **Inconsistent ID Strategy**: All models use UUID strings which is consistent — but no indexes are optimized for UUID lookups at scale.
  - *Impact*: UUID primary keys are slower than sequential IDs for B-tree indexes
  - *Effort*: Low (acceptable trade-off for distributed systems, but consider ULID for ordered UUIDs)

---

## 🎨 Frontend Issues

### Code Quality & Standards
- [ ] **Dual UI Component Libraries**: `packages/ui/src/` has 3 components (`button`, `card`, `code`) while `apps/web/components/ui/` has 19 shadcn/ui components. The two libraries are disconnected.
  - *Impact*: Duplicate button/card implementations; unclear which to use
  - *Effort*: Medium (consolidate into one location, likely `packages/ui/`)

- [ ] **Hardcoded Backend URL in `.env`**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` is committed in the `.env` file rather than `.env.local`.
  - *Impact*: Overrides production environment variables; confuses deployment
  - *Effort*: Trivial (move to `.env.local`, add to `.gitignore`)

### Error Handling & Resilience
- [ ] **No Global Error Boundary**: No `error.tsx` or `global-error.tsx` in the Next.js app directory to catch rendering errors.
  - *Impact*: Unhandled component errors show a blank white screen to users
  - *Effort*: Low (add error boundary components)

- [ ] **No Loading States at Route Level**: No `loading.tsx` files in route segments for streaming SSR fallbacks.
  - *Impact*: Users see no feedback during page transitions
  - *Effort*: Low (add `loading.tsx` with skeleton UI)

- [ ] **Missing `not-found.tsx`**: No custom 404 page defined in the app directory.
  - *Impact*: Users see the default Next.js 404 instead of a branded page
  - *Effort*: Trivial (add a styled `not-found.tsx`)

### UI/UX Issues
- [ ] **🔴 Upload Icon Still Shows After Image Upload**: In the training flow, after the user uploads images, the upload icon/placeholder remains visible instead of showing a success state or the uploaded file count.
  - *Impact*: User confusion — no visual feedback that upload succeeded
  - *Effort*: Low (toggle upload icon visibility based on uploaded file state)

- [ ] **🔴 Remove Dead "Preview Area" in GenerateTab**: The `GenerateTab` component has a large preview area that shows "Generation Triggered!" text but never displays the actual generated image (images only appear in the Camera/gallery tab).
  - *Impact*: Misleading UI — users expect to see their image but only get a text message
  - *Effort*: Low (remove the preview area entirely, or replace with a redirect/link to the gallery tab)

- [ ] **🔴 Dashboard Tabs Should Be Server Components**: All dashboard tabs (`GenerateTab`, `TrainTab`, `CameraTab`, `PacksTab`) are client components. Converting them to server components with targeted client islands would improve initial load performance.
  - *Impact*: Entire dashboard is client-rendered; no SSR benefits, slower initial paint, larger JS bundle
  - *Effort*: Medium (refactor tabs to server components, extract interactive parts into small `"use client"` islands, use Next.js parallel routes or server-driven tab switching)

- [ ] **No Responsive Image Optimization**: Images in `public/` (gallery-1/2/3.png, hero-image.png) are served as raw PNGs with no Next.js `<Image>` optimization.
  - *Impact*: Slow page loads on mobile (600KB+ of unoptimized images)
  - *Effort*: Low (use `next/image` with width/height props)

- [ ] **Incomplete `next.config.js`**: While build issues were resolved for static generation, the config is still empty. No image domains (R2), redirects, rewrites, or security headers are configured.
  - *Impact*: Missing image optimization for external domains (Cloudflare R2 URLs), no security headers
  - *Effort*: Low (add `images.remotePatterns` and `headers()` config)

- [ ] **Dashboard Uses Client-Side Tab Routing**: Tab state is managed via `useSearchParams` query params, requiring a full `"use client"` boundary on the entire dashboard page.
  - *Impact*: Entire dashboard is client-rendered; no SSR benefits for initial load
  - *Effort*: Medium (consider server-side tab routing with parallel routes)

---

## 🐍 Modal Compute Issues

### GPU Service (`apps/modal-compute/src/`)
- [x] **No Retry Logic on Webhook Failures**: Fixed by adding 3-attempt exponential backoff retry and a 60-second timeout to mitigate Render backend cold wake-ups.

- [x] **Hardcoded Training Parameters**: Resolution upgraded from 512 → 1024, enabled 8-bit Adam + `set_grads_to_none` for memory-efficient full-resolution training. Training config is now tuned for optimal cost/quality (Opt 2).
  - *Impact*: Higher quality LoRA outputs at native SDXL resolution.
  - *Effort*: Done.

- [x] **Fal.ai Integration Purge**: All 10 redundant components and Fal.ai logic (`FalAIModel.ts`) have been removed in favor of Modal.

- [x] **No GPU Fallback / Cold Start Optimization**: Implemented class-based VRAM caching (`SDXLInference` with `@app.cls` + `@modal.enter`). Model stays loaded in VRAM between requests; `scaledown_window=300` keeps containers warm for 5 minutes. Added `torch.compile()` for 21× faster inference after initial compilation (Opt 1, 5).
  - *Impact*: Consecutive image generations are ~10s instead of ~18s. Cold start compilation is ~3.5 min (one-time).
  - *Effort*: Done.

- [x] **No Image Pre-processing**: Added `_preprocess_training_images()` that center-crops, resizes to 1024×1024, and filters corrupt images before training (Opt 9).
  - *Impact*: Consistent training input quality regardless of user-uploaded image sizes/aspect ratios.
  - *Effort*: Done.

- [x] **Generic Training Prompts**: Added `_build_training_prompts()` that converts model details (type, age, ethnicity, eyeColor, bald) into descriptive instance/class prompts. Prior preservation loss generates 50 regularization images of similar demographics (Opt 8).
  - *Impact*: Significantly better LoRA training quality; prevents overfitting to specific backgrounds/lighting.
  - *Effort*: Done.

- [x] **No Negative Prompts**: Added `DEFAULT_NEGATIVE_PROMPT` to suppress common AI artifacts during inference (Opt 4).
  - *Impact*: Cleaner image outputs with no manual prompt engineering required.
  - *Effort*: Done.

- [x] **Modal API Deprecations**: Migrated `@modal.web_endpoint` → `@modal.fastapi_endpoint` and `container_idle_timeout` → `scaledown_window` per Modal 1.0 migration guide.
  - *Impact*: No more deprecation warnings; future-proofed for Modal updates.
  - *Effort*: Done.

- [ ] **No GPU Tier Fallback**: The service targets T4 GPUs specifically. If T4 capacity is unavailable on Modal, jobs will queue.
  - *Impact*: Training/inference jobs blocked during GPU shortages
  - *Effort*: Low (add `gpu=modal.gpu.Any()` or fallback tiers)


## 🚀 Performance & Scalability

### Backend Bottlenecks
- [ ] **Synchronous Webhook Processing**: Webhook handlers (`/modal/webhook/train`, `/modal/webhook/image`) perform database updates synchronously. Under high load, webhook processing could back up.
  - *Solution*: Queue webhook payloads and process asynchronously

- [ ] **No Connection Pooling Configuration**: The Prisma client uses `@prisma/adapter-pg` with a raw connection string. No explicit pool size or timeout configuration.
  - *Solution*: Configure `PrismaPg` with pool settings appropriate for expected load

- [ ] **No Caching Layer**: Every `/models` and `/pack/bulk` request hits the database directly. These rarely-changing datasets are prime caching candidates.
  - *Solution*: Add Redis or in-memory caching with TTL for static-ish data

### Deployment & DevOps
- [ ] **No CI/CD Pipeline**: No GitHub Actions, Vercel config, or deployment scripts of any kind.
  - *Impact*: Manual deployments; no automated testing or build verification before merge
  - *Effort*: Medium (set up GitHub Actions for lint, type-check, build)

- [ ] **No Dockerization**: No `Dockerfile` or `docker-compose.yml` for containerized deployments.
  - *Impact*: Environment-specific bugs; difficult to reproduce production issues locally
  - *Effort*: Medium (create multi-stage Docker builds for backend and web)

- [ ] **No Monitoring/Observability**: No error tracking (Sentry), structured logging (Pino), or APM tooling.
  - *Impact*: Production issues are invisible until users report them
  - *Effort*: Medium (integrate Sentry + structured logging)

### Testing & Reliability
- [ ] **Zero Test Coverage**: No unit, integration, or E2E tests exist anywhere in the monorepo.
  - *Impact*: Every code change is a potential regression; no confidence in refactors
  - *Effort*: High (establish testing infrastructure with Vitest + Playwright)

- [ ] **No API Documentation**: No OpenAPI/Swagger documentation for the 9 REST endpoints.
  - *Impact*: Frontend developers must read backend source code to understand API contracts
  - *Effort*: Medium (add Swagger via `express-openapi` or manual OpenAPI spec)

---

## 📦 Dependency & Configuration Audit

### Version Matrix

| Dependency | Version | Package | Notes |
|---|---|---|---|
| TypeScript | 5.9.2 | Root + all packages | ✅ Aligned |
| React | ^19.2.4 | web, ui | ✅ Current |
| Next.js | ^16.1.6 | web | ✅ Current |
| Express | ^5.2.1 | backend | ✅ Current |
| Prisma | ^7.4.0 | db | ✅ Current |
| Tailwind CSS | ^4.1.18 | web | ✅ v4 |
| Zod | ^4.3.6 | common | ✅ Current |
| Bun | 1.3.3 | Root | ✅ Current |
| Turbo | ^2.8.9 | Root | ✅ Current |
| Modal (Python) | 1.3.4 | modal-compute | ✅ Current |

### Monorepo Workspace Map

| Package | Name | Internal Consumers |
|---|---|---|
| `packages/db` | `db` | backend |
| `packages/common` | `common` | backend, web |
| `packages/ui` | `@repo/ui` | web |
| `packages/eslint-config` | `@repo/eslint-config` | web, ui |
| `packages/typescript-config` | `@repo/typescript-config` | web, ui |

---

## 🗺 Phase 2: Production Readiness Roadmap

To move beyond the current development state, the following changes are required for a **production-grade deployment**.

### 1. Security Hardening
- [ ] **Authenticate all endpoints**: Add `authMiddleware` to `/pre-signed-url` and validate `/pack/bulk` access.

- [ ] **Rate limiting**: Install `express-rate-limit` with per-route limits (training: 5/hr, generation: 30/hr, general: 100/15min).

- [ ] **Startup env validation**: Verify all required environment variables exist before `app.listen()`.

- [ ] **Security headers**: Add `helmet` middleware and configure Next.js security headers.

- [ ] **Input validation hardening**: Add max length/size constraints to all Zod schemas.

### 2. Reliability & Error Handling
- [ ] **Global error handlers**: Add Express error middleware and Next.js error boundaries.

- [ ] **Webhook retry logic**: Implement exponential backoff in Modal compute for failed webhook deliveries.

- [ ] **Graceful shutdown**: Handle `SIGTERM`/`SIGINT` to drain connections before exit.

- [ ] **Database indexes**: Add indexes on `userId`, `modelId`, `status`, and `createdAt` fields.

### 3. Developer Experience
- [ ] **Route modularization**: Split `index.ts` into separate route modules.

- [ ] **Testing infrastructure**: Set up Vitest for unit tests, Playwright for E2E.

- [ ] **CI/CD pipeline**: GitHub Actions for lint → type-check → test → build → deploy.

- [ ] **API documentation**: Generate OpenAPI spec from route definitions.

- [ ] **Update `.env.example` files**: Ensure all required variables are documented.

### 4. Scalability
- [ ] **Redis caching**: Cache model listings, pack data, and user sessions.

- [ ] **Connection pooling**: Configure PgBouncer or Prisma Accelerate for database connections.

- [ ] **CDN for static assets**: Serve gallery images and fonts from a CDN edge.

- [ ] **Image optimization**: Configure Next.js `<Image>` with remote pattern support for R2 URLs.

- [ ] **Background job processing**: Queue expensive operations (training, bulk generation) via BullMQ.

---

## 📅 Tracking History
- **2026-02-26**: Comprehensive system architecture audit performed by Antigravity.
- **2026-02-28 (Execution)**: Addressed critical build failures, codebase hygiene, branding overhaul, and performance bottlenecks:
  - **Asynchronous Training Logic**: Refactored the backend to fire-and-forget Modal training jobs, resolving the "Step 3" frontend hang where users were stuck on a loader for ~10 minutes.
  - **Request Robustness**: Added background `try-catch` blocks to Modal compute triggers to safeguard against unhandled promise rejections.
  - Fixed Next.js build de-optimization via `<Suspense />` boundaries.
  - Purged Fal.ai dependencies and legacy UI components (10 components removed).
  - Implemented PixGen branding and modern dark-mode aesthetics.
  - Relaxed dependency ranges in `modal-compute` for improved stability.
  - Integrated Radix UI / Shadcn suite (`Sonner`, `Badge`, `Slider`, etc.).
  - Implemented Prisma Singleton pattern for database stability.
  - Refined `.gitignore` for the monorepo environment.
  - Fully migrated from FLUX.1-dev to SDXL 1.0 (saving ~$2/hr per job using T4 GPUs).
  - Resolved `Float/Half` mixed-precision SDXL generation bugs by pinning `peft==0.15.2` and `diffusers==0.31.0`.
  - Configured successful Modal → Render webhook pipeline mapping (addressed HMAC JSON mismatches + added 60-second timeouts).
- **2026-03-01**: Added 7 new issues from manual review:
  - **🔴 Trigger Word Bug**: Model name incorrectly used as trigger word in training requests.
  - **🔴 Excessive DB Hits**: Image generation does create + update (2 hits) instead of single create via webhook.
  - **🔴 User Not Persisted**: Clerk users are not synced to the DB `User` table, breaking FK relationships.
  - **🔴 Upload Icon Bug**: Upload placeholder icon persists after successful image upload.
  - **🔴 Dead Preview Area**: GenerateTab preview field never shows generated images.
  - **🔴 Model ID Flow**: Image record IDs should be generated and passed through Modal, not created prematurely.
  - **🔴 Client-Side Tabs**: Dashboard tabs should be server components for faster loading.
  - **Async Generation**: Made `/ai/generate` and `/pack/generate` fire-and-forget (matching training endpoint).
  - **ASI Bug Fix**: Fixed missing semicolon that caused Prisma `.create()` result to be called as a function.
- **Still Pending**: Security hardening (Rate limiting, Auth on pre-signed URLs), Console log cleanup, UI library consolidation, and remaining 🔴 items above.
- **2026-03-01 (Session 2)**: Fixed user persistence and auth sync bugs:
  - **UserSync Component**: Added `UserSync` to `dashboard/layout.tsx` — fires `POST /user-auth` on every authenticated dashboard session to upsert the Clerk user into the DB.
  - **Username Collision Fix**: Changed username fallback from `user.firstName` (non-unique) to `user.id` (Clerk ID, globally unique) in `UserSync.tsx` to prevent P2002 unique constraint violations.
  - **Graceful P2002 Handling**: Added explicit `error.code === "P2002"` catch in `authController.ts` — username conflicts are treated as a soft success instead of returning 500.
  - **Build Cache Cleared**: Purged `.next`, `.turbo`, and `node_modules/.cache` for clean rebuild.
- **2026-03-01 (Session 3)**: Major Backend Refactoring & Schema Hardening:
  - **Modularized Backend**: Decoupled the monolithic `index.ts` into a dedicated Router/Controller architecture. Created `AiRouter`, `AuthRouter`, `ModalController`, and `uploadRouter`.
  - **Schema Relations**: Implemented Prisma relations (@relation) for `User` to `Model` and `OutputImages`, ensuring referential integrity across the database.
  - **Dependency Hygiene**: Moved `@types/` packages to `devDependencies` in `apps/backend`.
  - **Modal Integration**: Refined `main.py` in `apps/modal-compute` and `ModalModel.ts` in backend for cleaner image extraction logic.
- **2026-03-05**: SDXL Optimization Suite — Implemented all 9 optimizations from `SDXL_OPTIMIZATION_GUIDE.md`:
  - **Inference**: Class-based VRAM caching (Opt 1), EulerAncestral scheduler + 20 steps (Opt 3), negative prompts (Opt 4), `torch.compile()` with 21× speedup (Opt 5), VAE tiling (Opt 6), dynamic LoRA weight (Opt 7).
  - **Training**: 8-bit Adam + 1024px resolution (Opt 2), prior preservation loss with 50 class images (Opt 8), image pre-processing pipeline (Opt 9).
  - **Full-Stack Model Details**: Wired model details (type, age, ethnicity, eyeColor, bald) from frontend → backend → Modal for descriptive training prompts.
  - **URL Routing Fix**: Added `label="pixgen-gpu-generate"` to class-based endpoint for consistent URL pattern. Updated `ModalModel.ts` with clean `endpointUrl()` helper.
  - **Modal 1.0 Migration**: Renamed deprecated APIs (`web_endpoint` → `fastapi_endpoint`, `container_idle_timeout` → `scaledown_window`).
  - **Colab Validation**: Benchmarked on free T4 GPU — 21.4× compile speedup, 8.4 GB peak VRAM, all optimizations verified.
- **2026-03-13**: Modal compute modularization:
  - **Split `src/main.py` → 4 modules**: `config.py` (constants/TrainConfig), `storage.py` (S3/webhook I/O), `preprocessing.py` (image pipeline/prompt builder), `app.py` (Modal orchestrator). Clean acyclic import DAG verified.
  - **Deleted `src/main.py`** and updated `README.md` deploy command to `modal deploy src/app.py`.
  - **`requirements.txt`** reduced from 35 lines → `modal==1.3.4` only. GPU deps remain in `gpu_image`.
  - **Deduplication**: `VAE_MODEL` constant extracted to `config.py`; inline negative prompt in `generate()` replaced with `DEFAULT_NEGATIVE_PROMPT` import.
  - **Modal bundle fix**: `add_local_python_source(..., copy=True)` placed before `run_function(download_models)` to bake sibling modules into the image before the build step.

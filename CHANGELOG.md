# Changelog

All notable changes to this project will be documented in this file.


## 2026-03-05

### Added — SDXL Optimization Suite (9 Optimizations)

**Inference Optimizations (`apps/modal-compute/src/main.py`):**
- **Opt 1 — Class-Based VRAM Caching**: Refactored inference from standalone `@app.function` to `SDXLInference` class with `@app.cls()` + `@modal.enter()`. Model stays loaded in VRAM between requests; container stays warm for 5 minutes (`scaledown_window=300`). Eliminates cold-start model loading on consecutive requests.
- **Opt 3 — Fast Scheduler + Fewer Steps**: Replaced default PNDM scheduler with `EulerAncestralDiscreteScheduler`. Reduced inference steps from 30 → 20. ~40% faster generation with no quality loss.
- **Opt 4 — Negative Prompts**: Added `DEFAULT_NEGATIVE_PROMPT` constant to suppress common AI artifacts (blurry, deformed, cartoon, etc.). Applied automatically during generation with user override support.
- **Opt 5 — `torch.compile()`**: Enabled `torch.compile(pipe.unet, mode="reduce-overhead")` in `setup()`. One-time ~3.5 min compilation on container boot, then **21× faster** inference (~10s per image vs ~211s first run). Validated on Colab T4 GPU.
- **Opt 6 — VAE Tiling**: Enabled `pipe.enable_vae_tiling()` in `setup()` to reduce VRAM usage for large resolutions. Peak VRAM: 8.4 GB (well within T4's 15 GB).
- **Opt 7 — Dynamic LoRA Weight**: Made LoRA adapter weight configurable via `loraWeight` parameter (default: 0.85). Enables per-request tuning of subject likeness vs. creative freedom.

**Training Optimizations (`apps/modal-compute/src/main.py`):**
- **Opt 2 — 8-bit Adam + 1024px Training**: Updated `TrainConfig` to `resolution=1024` (native SDXL), `use_8bit_adam=True`, `set_grads_to_none=True`. Reduces optimizer VRAM by ~70%, enabling full-resolution training on T4.
- **Opt 8 — Prior Preservation Loss**: Added `--with_prior_preservation_loss` with 50 auto-generated class images to prevent DreamBooth overfitting. Class prompt now dynamically built from user's model details.
- **Opt 9 — Image Pre-processing Pipeline**: Added `_preprocess_training_images()` function that center-crops to square, resizes to 1024×1024 via Lanczos, and filters corrupt images before training.

**Model Detail Prompts (Full-Stack):**
- **`apps/modal-compute/src/main.py`**: Added `ETHNICITY_MAP` and `_build_training_prompts()` helper that converts model details (type, age, ethnicity, eyeColor, bald) into descriptive instance/class prompts. Example: `"a photo of sks 25 year old South Asian man, brown eyes"` instead of generic `"a photo of sks person"`.
- **`apps/backend/models/ModalModel.ts`**: Updated `trainModel()` signature to accept and forward `modelDetails` object to Modal.
- **`apps/backend/controllers/aiController.ts`**: Updated `AiTraining` to pass `type`, `age`, `ethnicity`, `eyeColor`, `bald` from the parsed request body to `modalModel.trainModel()`.

### Changed
- **Modal API Migration**: Renamed `@modal.web_endpoint` → `@modal.fastapi_endpoint` and `container_idle_timeout` → `scaledown_window` per Modal 1.0 deprecation warnings.
- **Endpoint URL Routing**: Added `label="pixgen-gpu-generate"` to `SDXLInference.generate` so Modal auto-generates URLs matching the existing `endpointUrl()` pattern (`https://user--pixgen-gpu-generate.modal.run`). No `.env` changes required.
- **Removed old inference code**: Deleted standalone `_run_inference()` function and old `generate()` endpoint that conflicted with the new class-based `SDXLInference`.
- **Updated `SDXL_OPTIMIZATION_GUIDE.md`**: Marked all 9 optimizations as ✅ complete.

### Tested
- **Google Colab Validation**: All inference optimizations benchmarked on Colab's free T4 GPU:
  - `torch.compile` speedup: **21.4×** (211s → 9.9s after compilation)
  - VRAM usage: 6.58 GB used / 8.40 GB peak (safe for T4's 15 GB)
  - 8-bit Adam verified working with `bitsandbytes`
  - Image pre-processing validated with multiple aspect ratios

### Cost Impact
| Metric | Before | After | Savings |
|---|---|---|---|
| Training per model | ~$0.18 | ~$0.21 (with prior preservation) | Better quality |
| Gen time per image | ~18s | ~10s | -45% |
| Cost per image | ~$0.003 | ~$0.002 | -33% |
| Full user session | ~$0.45 | ~$0.35 | -22% |

---

## 2026-03-01

### Added
- **UserSync Component**: Added `UserSync` to `dashboard/layout.tsx` — a headless client component that fires `POST /user-auth` on every authenticated dashboard session to upsert the Clerk user into the DB. Resolves the long-standing audit item of users not being persisted.

### Fixed
- **Username Unique Constraint Crash (P2002)**: `UserSync` was sending `user.firstName` as a username fallback, causing a `P2002` unique constraint violation when two users shared the same first name. Changed fallback to `user.id` (Clerk ID — globally unique) so upserts always succeed during create.
- **Graceful P2002 Handling in `authController`**: Added an explicit `error.code === "P2002"` catch block — username conflicts are now treated as a soft success (`200 OK`) rather than returning a `500` error to the client.
- **Build Cache Cleared**: Purged `.next`, `.turbo`, and `node_modules/.cache` to resolve stale CSS and theme not appearing correctly in local dev.
- **Database Index Optimization**: Added explicit indexes to `Model`, `OutputImages`, and `PackPrompts` tables to accelerate user-specific queries and pack processing.
- **Console Log Sanitation**: Stripped sensitive environment variables and raw error objects from production logs in `aiController.ts` and `uploadRouter.ts` to prevent information leakage.
- **Resilient Pre-Signed URLs**: Added `authMiddleware` to the `/pre-signed-url` endpoint to prevent anonymous uploads to Cloudflare R2.
- **Unique Trigger Word Generation**: Implemented a utility to auto-generate unique identifiers (e.g., `sks_abc123`) from the model name during training. This ensures LoRA models learn distinct concepts and inference prompts are reliable.
- **Backend Resilience**: Added background `try-catch` blocks and `Promise.all` optimizations to generation endpoints. Refined `userId` validation across the backend to prevent unauthenticated or malformed requests.
- **Backend Refactoring (Router/Controller Architecture)**: Modularized the monolithic `index.ts` in `apps/backend`. Extracted logic into `AiRouter.ts`, `AuthRouter.ts`, `webhookRouter.ts`, and `uploadRouter.ts`, with corresponding controllers in `apps/backend/controllers/`. Improved code organization and maintainability.
- **Prisma Schema Relations**: Added `@relation` fields to `Model` and `OutputImages` in `schema.prisma` to establish strict foreign key relationships with the `User` model, ensuring referential integrity.
- **Dependency Optimization**: Moved `@types/cors`, `@types/express`, and `@types/jsonwebtoken` to `devDependencies` in `apps/backend`.
- **Environment Configuration**: Synchronized `.env.example` files across frontend (`apps/web`), backend (`apps/backend`), and database (`packages/db`) to accurately reflect current `.env` requirements and port configurations (e.g., `FRONTEND_URL`, backend port 3001).

---

## 2026-02-28

### Added
- **Premium UI Component Library**: Integrated a comprehensive suite of polished, accessible components in `apps/web/components/ui/`:
  - `Badge`, `Separator`, `Slider`, `Sonner`, `Toast`, `Toaster`, `Toggle`, and `Tooltip`.
  - Expanded `Button` and `Textarea` capabilities with enhanced variant support.
- **Enhanced Visual Assets**: Added high-quality showcase images and branding assets for the "PixGen" identity (`apps/web/public/`).
- **Dashboard & Landing Layouts**: Introduced new `landing` and `dashboard` component directories to house modern, feature-rich UI sections.

### Changed
- **AI Model Pipeline**: Successfully migrated from FLUX.1-dev to SDXL 1.0. Set training and inference endpoints to use the T4 GPU, reducing costs significantly ($0.59/hr). Baked SDXL model weights directly into the Modal Docker image for instant container cold starts.
- **Backend API**: Refactored the `/ai/training` endpoint to execute Modal training asynchronously (fire-and-forget task). This prevents frontend UI freezes by responding immediately rather than waiting for long-running compute jobs.
- **Branding & Identity**: Full migration to the **PixGen** brand across `layout.tsx`, `page.tsx`, and site metadata.
- **Global Aesthetics**: Refined `apps/web/app/globals.css` with a modern dark-mode color palette, custom utility classes, and optimized typography.
- **Infrastructure & Dependencies**:
  - Locked core SDXL training dependencies (`diffusers==0.31.0`, `peft==0.15.2`, `transformers==4.48.0`) in `modal-compute/src/main.py` to prevent version clashing and dtype mismatches during mixed-precision training.
  - Relaxed dependency version ranges in `apps/modal-compute/requirements.txt` (Modal, Click, Typer) for better environment compatibility.
  - Refactored `packages/db/index.ts` to implement a robust Prisma Singleton pattern with PostgreSQL adapter support.
  - Updated monorepo dependencies in `package.json` and `bun.lock` for better stability.

### Fixed
- **Modal Compute Reliability**: 
  - Enhanced Modal webhook delivery with a 60-second timeout and a 3-attempt retry logic to handle Render backend cold starts gracefully.
  - Fixed S3/R2 upload logic to return publicly accessible URLs (`S3_PUBLIC_URL`) instead of private AWS API endpoints for generated images.
  - Resolved JSON serialization mismatch between Python's `json.dumps()` and Express's `JSON.stringify()` that was causing HMCA signature validation failures for webhooks.
- **Next.js Build Compatibility**: 
  - Wrapped `useSearchParams` dependent logic in `DashboardContent` with `<Suspense />` boundaries to resolve build-time de-optimization errors.
  - Corrected `next.config.js` to ensure reliable static generation.
- **Git & Environment Hygiene**: 
  - Improved `.gitignore` patterns to accurately filter Bun and Next.js temporary files.
  - Resolved `CORS` and environment variable passthrough issues in backend routing.

### Removed
- **Legacy UI Components**: Performed a major codebase cleanup by deleting 10 redundant top-level components in `apps/web/components/` after verifying full feature parity in the new modular architecture:
  - `AppBar.tsx` & `Hero.tsx` (Replaced by `landing/Navbar` and `landing/HeroSection`).
  - `Train.tsx` (Replaced by the multi-step `dashboard/TrainTab`).
  - `Packs.tsx`, `PacksClient.tsx`, & `PackCard.tsx` (Replaced by `dashboard/PacksTab`).
  - `Camera.tsx`, `GenerateImage.tsx`, `ImageCard.tsx`, & `Model.tsx` (Replaced by optimized `dashboard/` tabs).
- **Fal.ai Integration**: Completely purged all remaining Fal.ai logic, model definitions (`FalAIModel.ts`), and package dependencies in favor of the new Modal compute pipeline.

## 2026-02-14

### Added
- `seed.ts` in `packages/db` for initial database population.
- `Camera` component (`apps/web/components/Camera.tsx`) for captured training images.
- `Upload` component (`apps/web/components/upload.tsx`) with multi-file support and preview logic.
- `PackCard` and `Model` display components (`apps/web/components/PackCard.tsx`, `Model.tsx`).
- `PacksClient` logic (`apps/web/app/dashboard/PacksClient.tsx`) for managing pack interactions.

### Changed
- `Train()` component logic and UI updates (`apps/web/components/Train.tsx`).
- `OutputImageStatusEnum` and enhanced model relations (`packages/db/prisma/schema.prisma`).
- `FalAIModel` integration refactor (`apps/http-backend`, `apps/web`).
- Shared `types` and validator schemas (`packages/common/types.ts`).
- Nav and `Hero()` section improvements.
- `turbo.json` build configuration optimization.

### Improved
- Global styling and UI responsiveness.
- Middleware logic for auth integration (`apps/web/middleware.ts`).
- TypeScript definitions across the monorepo.

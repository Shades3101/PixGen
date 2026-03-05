<div align="center">
  <img src="https://raw.githubusercontent.com/Shades3101/PixGen/main/apps/web/public/turborepo-dark.svg" alt="PixGen Logo" width="120" />
  <h1>PixGen</h1>
  <p><strong>The Ultimate AI Photo Generation & Personalized Model Fine-Tuning Platform</strong></p>

  <p align="center">
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://modal.com"><img src="https://img.shields.io/badge/Modal-000000?style=for-the-badge&logo=data:image/svg+xml;base64,&logoColor=white" alt="Modal" /></a>
    <a href="https://pytorch.org/"><img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" /></a>
  </p>
</div>

---

## 🌟 Overview

**PixGen** represents the next generation of personalized AI creativity. Unlike generic image generators, PixGen empowers users to create **their own digital twins** through SDXL LoRA fine-tuning. By uploading a small dataset of photos, users can train a custom AI model that understands their unique likeness, allowing them to generate hyper-realistic portraits in any setting, style, or outfit imaginable.

Built on a robust, high-performance monorepo architecture, PixGen is designed for scale, speed, and seamless developer experience.

---

## 📸 Project Showcase

<div align="center">
  <img src="apps/web/public/Landing Page.png" alt="PixGen Landing Page" width="800" />
  <p><em>Landing Page — Modern dark-mode UI with premium aesthetics</em></p>
</div>

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="apps/web/public/Training Tab.png" alt="Training Tab" width="400" />
        <br /><em>Model Training — Upload photos & configure AI model</em>
      </td>
      <td align="center">
        <img src="apps/web/public/Generate Tab.png" alt="Generate Tab" width="400" />
        <br /><em>Generate — Create images with custom prompts</em>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="apps/web/public/Camera Tab.png" alt="Camera Tab" width="400" />
        <br /><em>Gallery — View all generated images</em>
      </td>
      <td align="center">
        <img src="apps/web/public/Packs Tab.png" alt="Packs Tab" width="400" />
        <br /><em>Prompt Packs — One-click themed generation</em>
      </td>
    </tr>
    <tr>
      <td align="center" colspan="2">
        <img src="apps/web/public/Models Tab.png" alt="Models Tab" width="400" />
        <br /><em>Models — Manage your fine-tuned AI models</em>
      </td>
    </tr>
  </table>
</div>

---

## 🏗️ Architecture & Flow

PixGen orchestrates a complex workflow involving cloud storage, GPU training clusters, and a responsive frontend.

```mermaid
graph TD
    User[User] -->|Uploads Photos| Frontend[Next.js Frontend]
    Frontend -->|Request Pre-signed URL| Backend[Express Backend]
    Backend -->|Return S3/R2 URL| Frontend
    Frontend -->|Upload Zip| S3[Cloudflare R2 / AWS S3]
    Frontend -->|Trigger Training| Backend
    Backend -->|Start LoRA Training| Modal[Modal.com GPU Cluster]
    Modal -- Webhook: Training Complete --> Backend
    Backend -- Update Status --> DB[(PostgreSQL)]
    
    User -->|Generate Image| Frontend
    Frontend -->|Request Generation| Backend
    Backend -->|Inference Request| Modal
    Modal -- Webhook: Image Ready --> Backend
    Backend -- Store Image URL --> DB
```

1. **Upload & Zip**: User selects 10-20 photos. The frontend zips them and securely uploads to Object Storage (S3/R2) using a pre-signed URL.
2. **Training**: The backend triggers a Modal.com SDXL LoRA training job using the uploaded zip. Model details (age, ethnicity, type) are used to build descriptive training prompts.
3. **Async Webhooks**: Modal notifies the backend via HMAC-signed webhooks when training is done or when images are generated, ensuring non-blocking operations.
4. **Inference**: Users select a trained model and enter a custom prompt or choose a "Prompt Pack" style to generate new images.

---

## 🧠 Core Features

### 1. Personalized AI Training
- **SDXL LoRA Integration**: SDXL 1.0 architecture with DreamBooth LoRA fine-tuning at native 1024×1024 resolution.
- **Smart Training Prompts**: Model details (age, ethnicity, eye color, gender) are automatically converted into descriptive training prompts for higher-quality outputs.
- **Prior Preservation Loss**: Generates 50 regularization images of similar demographics to prevent overfitting.
- **Image Pre-processing**: Automatic center-crop, resize, and quality filtering of uploaded images.
- **Asynchronous Processing**: Background training tasks with real-time status updates via webhooks.

### 2. Intelligent Image Generation
- **Prompt Packs**: Pre-configured creative prompt libraries for instant results (e.g., "Cyberpunk", "Professional Headshots", "Ancient Warrior").
- **Custom Inference**: Full control over text-to-image prompts using your own fine-tuned models.
- **Negative Prompt Engine**: Built-in artifact suppression for consistently clean outputs.
- **Dynamic LoRA Weight**: Per-request tuning of subject likeness vs. creative freedom.

### 3. Optimized AI Pipeline
- **Class-Based VRAM Caching**: Model stays loaded in GPU memory between requests — no cold-start model loading.
- **`torch.compile()` Acceleration**: One-time UNet compilation, then **21× faster** inference (~10s per image).
- **EulerAncestral Scheduler**: 20-step generation with no quality loss (vs. 30 steps default).
- **8-bit Adam Optimizer**: 70% less optimizer VRAM usage, enabling full-resolution training on T4 GPUs.
- **VAE Tiling**: Efficient memory usage for high-resolution outputs (peak VRAM: 8.4 GB on T4's 15 GB).

### 4. Developer-First Architecture
- **Turborepo Monorepo**: Blazing-fast build pipelines and optimized local development using a unified workspace.
- **Type-Safe Ecosystem**: End-to-end TypeScript spanning from the Prisma database schema to the React frontend.
- **Shared Packages**: Common logic, UI components, and TypeScript configurations shared across apps for maximum consistency.

---

## ⚡ Performance Benchmarks

Benchmarked on NVIDIA T4 GPU (16 GB VRAM) with all 9 optimizations enabled:

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| **Cold start** | ~10s every request | ~10s once (then cached) | **-90%** |
| **Generation time** | ~18s per image | ~10s per image | **-45%** |
| **Cost per image** | ~$0.003 | ~$0.002 | **-33%** |
| **Images per $5** | ~500 | ~1,500+ | **3×** |
| **VRAM usage** | ~8.5 GB peak | 8.4 GB peak | Same (safe) |
| **Training cost** | ~$0.18/model | ~$0.21/model | Better quality |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/) | Performance-focused workspace management |
| **Frontend** | [Next.js 16](https://nextjs.org/) | React 19 framework for a fast, SEO-optimized UI |
| **Backend** | [Express.js](https://expressjs.com/) | Scalable API orchestration running on [Bun](https://bun.sh) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Robust relational data storage |
| **ORM** | [Prisma](https://www.prisma.io/) | Modern database toolkit and type-safe client |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS for rapid, modern UI building |
| **AI Model** | [SDXL 1.0](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) | State-of-the-art text-to-image generation |
| **AI Compute** | [Modal.com](https://modal.com) | Serverless GPU-accelerated training & inference |
| **AI Framework** | [PyTorch](https://pytorch.org/) + [Diffusers](https://huggingface.co/docs/diffusers) | Deep learning & diffusion model pipeline |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) | S3-compatible object storage for datasets |
| **Auth** | [Clerk](https://clerk.com/) | Drop-in authentication & user management |

---

## 📂 Project Structure

```bash
PixGen/
├── apps/
│   ├── web/               # Next.js Frontend (React 19)
│   ├── backend/           # API Service (Express + Bun)
│   │   ├── controllers/   # Route handlers (AI, Auth, Modal, Upload)
│   │   ├── models/        # ModalModel — GPU endpoint abstraction
│   │   └── routes/        # Express route definitions
│   ├── modal-compute/     # Modal compute workers (Python)
│   │   └── src/main.py    # SDXL training & inference pipeline
├── packages/
│   ├── common/            # Shared Zod schemas, Types & Constants
│   ├── db/                # Prisma Schema & Database Client
│   ├── ui/                # Premium React Component Library (Radix UI)
│   ├── eslint-config/     # Strict linting standards
│   └── typescript-config/ # Base TS configurations
├── CHANGELOG.md           # Detailed project changelog
├── SYSTEM_AUDIT.md        # Architecture audit & issue tracking
├── turbo.json             # Build cache & pipeline config
└── package.json           # Root workspace configuration
```

---

## 🗄️ Database Schema

The core entities in the PostgreSQL database:

- **User**: Stores user metadata (synced with Clerk via `UserSync` component).
- **Model**: Represents a fine-tuned LoRA model (contains `tensorPath`, `triggerWord`, physical traits like `type`, `age`, `ethnicity`, `eyeColor`, `bald`).
- **OutputImages**: Stores generated images and their status (`Pending`, `Generated`, `Failed`).
- **Packs & PackPrompts**: Curated styles and prompt templates for users to choose from.

---

## 🚀 Getting Started

### Prerequisites
- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **Python 3.10+**: For Modal compute workers
- **PostgreSQL**: Local instance or remote provider (Supabase, Neon)
- **Accounts**: [Clerk](https://clerk.com) (Auth), [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (Storage), [Modal.com](https://modal.com) (AI Workload)

### Step-by-Step Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Shades3101/PixGen.git
   cd PixGen
   bun install
   ```

2. **Environment Configuration**:
   Create `.env` files in `apps/web/`, `apps/backend/`, and `packages/db/`.

   #### `apps/backend/.env`
   ```env
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   # Storage (R2/S3)
   S3_ACCESS_KEY="your-access-key"
   S3_SECRET_KEY="your-secret-key"
   ENDPOINT="your-s3-endpoint"
   BUCKET_NAME="pixgen-models"
   # Auth & AI
   AUTH_JWT_KEY="your-rsa-public-key"
   MODAL_WEBHOOK_SECRET="your-modal-webhook-secret"
   MODAL_BASE_URL="https://your-username--pixgen-gpu"
   WEBHOOK_BASE_URL="your-ngrok-or-prod-url"
   MODAL_DEV="true"  # Set to "true" when using modal serve
   # DB
   DATABASE_URL="postgresql://user:password@localhost:5432/pixgen"
   ```

   #### `apps/web/.env`
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   NEXT_PUBLIC_CLOUDFLARE_URL="https://pub-..."
   ```

3. **Database Setup**:
   ```bash
   cd packages/db
   bunx prisma generate
   bunx prisma db push
   ```

4. **Modal Setup** (Python):
   ```bash
   cd apps/modal-compute
   python -m venv venv
   # Windows: .\venv\Scripts\Activate.ps1
   # Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   modal deploy src/main.py
   ```

5. **Launch the platform**:
   ```bash
   # From root
   bun run dev
   ```

---

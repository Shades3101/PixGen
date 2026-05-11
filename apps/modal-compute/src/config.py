from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────
# Model constants
# ─────────────────────────────────────────────────────────────────

# Base model for SDXL LoRA training
# NOTE: To upgrade to FLUX.1-dev later (better quality, needs A100-40GB):
#   Change to: BASE_MODEL = "black-forest-labs/FLUX.1-dev"
BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
VAE_MODEL  = "madebyollin/sdxl-vae-fp16-fix"
DIFFUSERS_REPO = "https://github.com/huggingface/diffusers.git"
DIFFUSERS_REF = "v0.31.0"  # pinned for reproducibility

MODEL_DIR = "/models"

# Default negative prompt for portrait/headshot LoRA
DEFAULT_NEGATIVE_PROMPT = (
    "blurry, low quality, low resolution, deformed, disfigured, "
    "bad anatomy, wrong proportions, extra limbs, cloned face, ugly, "
    "oversaturated, cartoon, anime, illustration, painting, drawing, "
    "watermark, text, signature, cropped, out of frame"
)

# Map frontend ethnicity values to natural language descriptions
ETHNICITY_MAP = {
    "White": "white",
    "Black": "black",
    "AsianAmerican": "Asian American",
    "EastAsian": "East Asian",
    "SouthEastAsian": "Southeast Asian",
    "SouthAsian": "South Asian",
    "MiddleEastern": "Middle Eastern",
    "Pacific": "Pacific Islander",
    "Hispanic": "Hispanic",
}


# ─────────────────────────────────────────────────────────────────
# Training configuration — tuned for face/person LoRA
# ─────────────────────────────────────────────────────────────────

@dataclass
class TrainConfig:
    """Hyperparameters for SDXL LoRA DreamBooth training on faces.

    Budget-optimized for $5 total:
      - A10G GPU (~$1.10/hr) + 500 steps ≈ 5-8 mins per training run
      - ~30 training runs + inferences within $5
    """
    max_train_steps: int = 500           # ~5-8 min on A10G, enough for 10-20 face images
    learning_rate: float = 1e-4          # standard for LoRA
    lora_rank: int = 8                   # good balance of quality vs speed
    resolution: int = 1024               # Native SDXL resolution (enabled by 8-bit Adam)
    train_batch_size: int = 1            # keep at 1 for stability; use gradient_accumulation for larger effective batch
    gradient_accumulation_steps: int = 2 # effective batch size of 2
    lr_scheduler: str = "constant"       # constant works well for short LoRA runs
    seed: int = 42
    mixed_precision: str = "bf16"        # bf16: native Ampere (A10G) support, prevents NaN loss and scaling issues
    gradient_checkpointing: bool = True  # save VRAM at slight speed cost
    use_8bit_adam: bool = True
    set_grads_to_none: bool = True

from config import ETHNICITY_MAP


def _prepare_training_images(zip_url: str, output_dir: str) -> str:
    """Download and extract training images from a ZIP URL.

    Returns the directory containing the extracted images.
    """
    import requests, zipfile, io
    from pathlib import Path

    img_dir = Path(output_dir)
    img_dir.mkdir(parents=True, exist_ok=True)

    print(f"[TRAIN] Downloading training images from {zip_url}")
    resp = requests.get(zip_url, timeout=120)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        z.extractall(str(img_dir))

    # Flatten: if the zip had a single subdirectory, use that instead
    subdirs = [d for d in img_dir.iterdir() if d.is_dir()]
    if len(subdirs) == 1 and not any(img_dir.glob("*.jpg")) and not any(img_dir.glob("*.png")):
        img_dir = subdirs[0]

    # Count images
    image_files = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.jpeg")) + \
                  list(img_dir.glob("*.png")) + list(img_dir.glob("*.webp"))
                  
    print(f"[TRAIN] Found {len(image_files)} training images in {img_dir}")

    if len(image_files) == 0:
        raise ValueError("No training images found in the uploaded ZIP file")

    return str(img_dir)


def _preprocess_training_images(input_dir: str, output_dir: str, target_size: int = 1024) -> str:
    """Auto-crop faces, resize, and filter training images.

    Center-crops to square, resizes to target resolution, and saves as PNG
    for consistent training quality. Skips corrupt/unreadable images.
    """
    from PIL import Image
    from pathlib import Path

    in_path = Path(input_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    image_files = (
        list(in_path.glob("*.jpg")) + list(in_path.glob("*.jpeg")) +
        list(in_path.glob("*.png")) + list(in_path.glob("*.webp"))
    )

    processed = 0
    for img_file in image_files:
        try:
            img = Image.open(img_file).convert("RGB")

            # Center crop to square
            w, h = img.size
            min_dim = min(w, h)
            left = (w - min_dim) // 2
            top = (h - min_dim) // 2
            img = img.crop((left, top, left + min_dim, top + min_dim))

            # Resize to target resolution
            img = img.resize((target_size, target_size), Image.LANCZOS)

            # Save as PNG for consistent quality
            img.save(out_path / f"{img_file.stem}.png", "PNG")
            processed += 1

        except Exception as e:
            print(f"[PREPROCESS] Skipping {img_file.name}: {e}")

    print(f"[PREPROCESS] Processed {processed}/{len(image_files)} images")
    return str(out_path)


def _build_training_prompts(trigger_word: str, model_details: dict | None) -> tuple[str, str]:
    """Build instance_prompt and class_prompt from model details.

    Returns (instance_prompt, class_prompt).
    - instance_prompt: describes THIS specific person (with trigger word)
    - class_prompt: describes the general category (for prior preservation)
    """
    if not model_details:
        return f"a photo of {trigger_word} person", "a photo of a person"

    # Build a natural description: "a 25 year old South Asian man"
    parts = []
    if model_details.get("age"):
        parts.append(f"{model_details['age']} year old")
    if model_details.get("ethnicity"):
        ethnicity = ETHNICITY_MAP.get(model_details["ethnicity"], model_details["ethnicity"])
        parts.append(ethnicity)

    # Type: Man/Woman/Others → man/woman/person
    type_val = model_details.get("type", "person")
    type_word = {"Man": "man", "Woman": "woman"}.get(type_val, "person")
    parts.append(type_word)

    description = " ".join(parts)  # e.g. "25 year old South Asian man"

    # Add extra traits
    traits = []
    if model_details.get("eyeColor"):
        traits.append(f"{model_details['eyeColor'].lower()} eyes")
    if model_details.get("bald"):
        traits.append("bald")

    trait_str = f", {', '.join(traits)}" if traits else ""

    instance_prompt = f"a photo of {trigger_word} {description}{trait_str}"
    class_prompt = f"a photo of a {description}"

    return instance_prompt, class_prompt

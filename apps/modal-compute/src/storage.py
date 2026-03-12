import os


def _sign_payload(payload: dict) -> str:
    """Create HMAC-SHA256 signature for webhook payload.

    IMPORTANT: The Express backend verifies with:
        crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex")

    JS JSON.stringify produces compact JSON: {"key":"value"} (NO spaces)
    Python json.dumps must match exactly with separators=(",", ":")
    """
    import json, hmac, hashlib
    secret = os.environ["MODAL_WEBHOOK_SECRET"]
    body = json.dumps(payload, separators=(",", ":"))
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()


def _send_webhook(webhook_url: str, payload: dict):
    """Send signed webhook to Express backend (with retry for Render cold starts)."""
    import requests, time
    signature = _sign_payload(payload)

    # Retry up to 3 times — Render free tier can take 30+ seconds to wake up
    for attempt in range(3):
        try:
            resp = requests.post(
                webhook_url,
                json=payload,
                headers={"X-Modal-Signature": signature},
                timeout=60,  # 60s to handle Render cold starts
            )
            print(f"[WEBHOOK] Sent successfully (status {resp.status_code})")
            return
        except Exception as e:
            print(f"[WEBHOOK] Attempt {attempt + 1}/3 failed: {e}")
            if attempt < 2:
                time.sleep(5)  # wait 5s before retry

    print(f"[WEBHOOK ERROR] All 3 attempts failed for {webhook_url}")


def _upload_to_s3(image_bytes: bytes, s3_key: str, content_type: str = "image/png") -> str:
    """Upload bytes to S3/R2 and return the public URL."""
    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["S3_ENDPOINT"],
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    )
    bucket = os.environ["S3_BUCKET_NAME"]
    s3.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=image_bytes,
        ContentType=content_type,
    )
    # Use public URL (S3_ENDPOINT is the private API endpoint, not browser-accessible)
    public_url = os.environ["S3_PUBLIC_URL"]
    return f"{public_url}/{s3_key}"


def _pil_to_bytes(image) -> bytes:
    """Convert a PIL Image to PNG bytes."""
    import io
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()

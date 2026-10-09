"""Pull-only worker. No public ingestion server and no social posting permission."""
import json
import os
import re
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlencode, urlparse
from engine import acquire, fetch_uploaded, transcribe, candidates, render, validate_source


UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)


def safe(error):
    """Short error text for public logs: job/source IDs form media URLs, so mask them."""
    return UUID.sub("<id>", f"{type(error).__name__} {error}")[:300]


def hub_client():
    base = os.environ["HUB_BASE_URL"].rstrip("/")
    if urlparse(base).scheme != "https":
        raise ValueError("HTTPS_REQUIRED")
    secret = os.environ["SOCIAL_RENDER_SECRET"]
    def call(action, data):
        request = urllib.request.Request(base+"/api/social/render/"+action,
            data=json.dumps(data).encode(), headers={"Authorization": "Bearer "+secret, "Content-Type":"application/json",
            "User-Agent": "veronica-shorts-engine/1"})
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                result = json.load(response)
        except urllib.error.HTTPError as error:
            # The Hub answers refusals with a short code (never transcript text).
            try:
                detail = str(json.loads(error.read().decode("utf-8")).get("error", ""))
            except Exception:
                detail = ""
            raise RuntimeError(f"HUB_{action.upper()}_{error.code} {detail}"[:200]) from None
        if not result.get("ok"):
            raise RuntimeError("JOB_STEP_REJECTED")
        return result
    return call


class HubStorage:
    """Clips and originals kept by the Hub in its private R2 buckets: no S3 keys here."""
    LIMIT = 1024 * 1024 * 1024

    def __init__(self):
        self.base = os.environ["HUB_BASE_URL"].rstrip("/")
        self.headers = {"Authorization": "Bearer " + os.environ["SOCIAL_RENDER_SECRET"],
                        "User-Agent": "veronica-shorts-engine/1"}

    def url(self, action, job, **extra):
        query = urlencode({"id": job["id"], "lease": job["lease"], **extra})
        return f"{self.base}/api/social/render/{action}?{query}"

    def fetch_source(self, job, folder):
        """Operator-uploaded original, or None when there is none (YouTube fallback)."""
        request = urllib.request.Request(self.url("source", job), headers=self.headers)
        target = Path(folder) / "source.mp4"
        try:
            with urllib.request.urlopen(request, timeout=60) as response, open(target, "wb") as out:
                total = 0
                while chunk := response.read(1024 * 1024):
                    total += len(chunk)
                    if total > self.LIMIT:
                        raise ValueError("SOURCE_TOO_LARGE")
                    out.write(chunk)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            raise
        return validate_source(target)

    def upload(self, job, index, path):
        size = Path(path).stat().st_size
        with open(path, "rb") as body:
            request = urllib.request.Request(self.url("upload", job, index=index), data=body, method="PUT",
                headers={**self.headers, "Content-Type": "video/mp4", "Content-Length": str(size)})
            with urllib.request.urlopen(request, timeout=300) as response:
                result = json.load(response)
        if not result.get("ok") or result.get("size") != size:
            raise RuntimeError("MEDIA_UPLOAD_UNCONFIRMED")


def storage_client():
    # Hub-stored media needs no S3 credentials; the Hub picks the mode per job.
    if not os.getenv("SHORTS_S3_ENDPOINT"):
        return None, None
    # Validate credentials/storage before claiming any paid/expensive work.
    import boto3
    storage = boto3.client("s3", endpoint_url=os.environ["SHORTS_S3_ENDPOINT"],
        aws_access_key_id=os.environ["SHORTS_S3_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["SHORTS_S3_SECRET_ACCESS_KEY"], region_name="auto")
    bucket = os.environ["SHORTS_S3_BUCKET"]
    storage.head_bucket(Bucket=bucket)
    sources = os.getenv("SHORTS_SOURCE_BUCKET")
    if sources:
        # Fail before claiming work if the key cannot read the private sources bucket.
        storage.head_bucket(Bucket=sources)
    return storage, bucket


def process(call, storage, bucket, job):
    auth = {"id":job["id"], "lease":job["lease"]}
    stopped, lost = threading.Event(), threading.Event()
    stage = ["download"]
    def pulse():
        while not stopped.wait(60):
            try:
                call("heartbeat", {**auth,"stage":stage[0]})
            except Exception:
                lost.set()
                return
    pulse_thread = threading.Thread(target=pulse, daemon=True)
    pulse_thread.start()
    try:
        with tempfile.TemporaryDirectory(prefix="vh-shorts-") as folder:
            print("Job claimed; stage download", flush=True)
            hub = HubStorage() if job.get("storage") == "hub" else None
            if not hub and storage is None:
                raise RuntimeError("S3_STORAGE_NOT_CONFIGURED")
            sources = os.getenv("SHORTS_SOURCE_BUCKET")
            if hub:
                source = hub.fetch_source(job, folder)
            else:
                source = fetch_uploaded(storage, sources, job["url"], folder) if sources else None
            if source:
                print("Source: uploaded original file", flush=True)
            else:
                print("Source: YouTube", flush=True)
                source = acquire(job["url"], folder)
            stage[0] = "transcribe"
            print("Stage transcribe", flush=True)
            segments, words = transcribe(source, os.getenv("WHISPER_MODEL", "small"))
            if lost.is_set():
                raise RuntimeError("LEASE_LOST")
            stage[0] = "select"
            print(f"Stage select ({len(segments)} segments)", flush=True)
            plan = call("plan", {**auth,"candidates":candidates(segments)})["clips"]
            artifacts = []
            for index, clip in enumerate(plan):
                if lost.is_set():
                    raise RuntimeError("LEASE_LOST")
                stage[0] = "render"
                print(f"Stage render clip {index}", flush=True)
                output, meta = render(source, clip, words, folder, index)
                stage[0] = "upload"
                key = f"{job['sourceId']}/{job['id']}/{index}.mp4"
                if lost.is_set():
                    raise RuntimeError("LEASE_LOST")
                if hub:
                    # The Hub confirms the stored size; delivery is via signed admin links.
                    hub.upload(job, index, output)
                else:
                    prefix = os.getenv("SHORTS_S3_PREFIX", urlparse(job["mediaBase"]).path.strip("/")).strip("/")
                    storage_key = f"{prefix}/{key}" if prefix else key
                    storage.upload_file(str(output), bucket, storage_key, ExtraArgs={"ContentType":"video/mp4"})
                    # Confirm delivery is reachable before declaring this clip ready.
                    check = urllib.request.Request(job["mediaBase"]+"/"+key, method="HEAD",
                                                   headers={"User-Agent": "veronica-shorts-engine/1"})
                    with urllib.request.urlopen(check, timeout=20) as delivered:
                        if delivered.status != 200:
                            raise RuntimeError("MEDIA_DELIVERY_FAILED")
                artifacts.append({**meta,"url":job["mediaBase"]+"/"+key})
            call("complete", {**auth,"clips":artifacts})
            print(f"Render completed ({len(artifacts)} clips)", flush=True)
            return True
    except Exception as error:
        issue = {"download":"DOWNLOAD_FAILED","transcribe":"TRANSCRIPTION_FAILED","select":"SELECTION_FAILED",
                 "render":"RENDER_FAILED","upload":"STORAGE_FAILED"}.get(stage[0],"PROCESSING_FAILED")
        try:
            call("fail", {**auth,"issue":issue})
        except Exception:
            pass
        # Error class and short message only: never transcripts, URLs with credentials or keys.
        print(issue, safe(error), flush=True)
        return False
    finally:
        stopped.set()
        pulse_thread.join(timeout=2)


def drain(max_jobs=10):
    """Process queued jobs until the queue is empty, then return (scale-to-zero hosts)."""
    call = hub_client()
    storage, bucket = storage_client()
    summary = {"completed": 0, "failed": 0}
    for _ in range(max_jobs):
        job = call("claim", {}).get("job")
        if not job:
            break
        summary["completed" if process(call, storage, bucket, job) else "failed"] += 1
    return summary


def main():
    """Long-running poll loop for an always-on Docker host."""
    call = hub_client()
    storage, bucket = storage_client()
    while True:
        try:
            job = call("claim", {}).get("job")
        except Exception:
            print("Queue unavailable; retrying in 30 seconds", flush=True)
            time.sleep(30)
            continue
        if not job:
            time.sleep(15)
            continue
        process(call, storage, bucket, job)


if __name__ == "__main__":
    import sys
    if "--drain" in sys.argv:
        # One-shot hosts (GitHub Actions): a failed job turns the run red.
        result = drain()
        print(f"Drain finished: {result['completed']} completed, {result['failed']} failed", flush=True)
        sys.exit(1 if result["failed"] else 0)
    main()

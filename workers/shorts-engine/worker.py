"""Pull-only worker. No public ingestion server and no social posting permission."""
import json
import os
import tempfile
import threading
import time
import urllib.request
from urllib.parse import urlparse
from engine import acquire, transcribe, candidates, render


def main():
    base = os.environ["HUB_BASE_URL"].rstrip("/")
    if urlparse(base).scheme != "https":
        raise ValueError("HTTPS_REQUIRED")
    secret = os.environ["SOCIAL_RENDER_SECRET"]
    def call(action, data):
        request = urllib.request.Request(base+"/api/social/render/"+action,
            data=json.dumps(data).encode(), headers={"Authorization": "Bearer "+secret, "Content-Type":"application/json"})
        with urllib.request.urlopen(request, timeout=40) as response:
            result = json.load(response)
        if not result.get("ok"):
            raise RuntimeError("JOB_STEP_REJECTED")
        return result
    # Validate credentials/storage before claiming any paid/expensive work.
    import boto3
    storage = boto3.client("s3", endpoint_url=os.environ["SHORTS_S3_ENDPOINT"],
        aws_access_key_id=os.environ["SHORTS_S3_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["SHORTS_S3_SECRET_ACCESS_KEY"], region_name="auto")
    bucket = os.environ["SHORTS_S3_BUCKET"]
    storage.head_bucket(Bucket=bucket)
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
                source = acquire(job["url"], folder)
                stage[0] = "transcribe"
                segments, words = transcribe(source, os.getenv("WHISPER_MODEL", "small"))
                if lost.is_set():
                    raise RuntimeError("LEASE_LOST")
                stage[0] = "select"
                plan = call("plan", {**auth,"candidates":candidates(segments)})["clips"]
                artifacts = []
                for index, clip in enumerate(plan):
                    if lost.is_set():
                        raise RuntimeError("LEASE_LOST")
                    stage[0] = "render"
                    output, meta = render(source, clip, words, folder, index)
                    stage[0] = "upload"
                    key = f"{job['sourceId']}/{job['id']}/{index}.mp4"
                    if lost.is_set():
                        raise RuntimeError("LEASE_LOST")
                    prefix = os.getenv("SHORTS_S3_PREFIX", urlparse(job["mediaBase"]).path.strip("/")).strip("/")
                    storage_key = f"{prefix}/{key}" if prefix else key
                    storage.upload_file(str(output), bucket, storage_key, ExtraArgs={"ContentType":"video/mp4"})
                    # Confirm delivery is reachable before declaring this clip ready.
                    check = urllib.request.Request(job["mediaBase"]+"/"+key, method="HEAD")
                    with urllib.request.urlopen(check, timeout=20) as delivered:
                        if delivered.status != 200:
                            raise RuntimeError("MEDIA_DELIVERY_FAILED")
                    artifacts.append({**meta,"url":job["mediaBase"]+"/"+key})
                call("complete", {**auth,"clips":artifacts})
                print("Render completed", flush=True)
        except Exception:
            issue = {"download":"DOWNLOAD_FAILED","transcribe":"TRANSCRIPTION_FAILED","select":"SELECTION_FAILED",
                     "render":"RENDER_FAILED","upload":"STORAGE_FAILED"}.get(stage[0],"PROCESSING_FAILED")
            try:
                call("fail", {**auth,"issue":issue})
            except Exception:
                pass
            print(issue, flush=True)
        finally:
            stopped.set()
            pulse_thread.join(timeout=2)


if __name__ == "__main__":
    main()

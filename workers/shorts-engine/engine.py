"""Veronica Shorts: timestamp-grounded selection and FFmpeg rendering.

Heavy dependencies are imported only for acquisition/transcription. Rendering
and the offline verification suite need Python + FFmpeg alone.
"""
import json
import math
import re
import subprocess
from pathlib import Path


def candidates(segments):
    """Shortlist complete speech windows across the video, not just its opening."""
    windows = []
    for i, first in enumerate(segments):
        start = float(first["start"])
        if start < 0 or not math.isfinite(start):
            continue
        words = []
        for segment in segments[i:]:
            end = float(segment["end"])
            if not math.isfinite(end) or end > 3600 or end - start > 60:
                break
            words.append(segment["text"].strip())
            text = " ".join(words)
            if len(text) > 1800:
                break
            if end - start >= 20 and re.search(r"[.!?]$", text):
                hook = bool(re.search(r"\b(como|por que|porque|erro|segredo|aprend|how|why)\w*", words[0], re.I))
                score = 2 * hook + min(len(text.split()) / (end - start), 3)
                windows.append({"start": start, "end": end, "text": text, "score": score})
                break
    selected = []
    for window in sorted(windows, key=lambda x: (-x["score"], x["start"])):
        if any(max(window["start"], w["start"]) < min(window["end"], w["end"]) for w in selected):
            continue
        if sum(len(w["text"]) for w in selected) + len(window["text"]) > 14000:
            continue
        selected.append(window)
        if len(selected) == 12:
            break
    return [{"id": i, "start": w["start"], "end": w["end"], "text": w["text"]}
            for i, w in enumerate(sorted(selected, key=lambda x: x["start"]))]


def timestamp(seconds):
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    seconds, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"


def write_subtitles(words, start, end, target):
    # Avoid subtitle markup/control sequences from speech recognition output.
    cues, batch = [], []
    for word in words:
        if word["end"] <= start or word["start"] >= end:
            continue
        batch.append(word)
        if len(batch) >= 5 or sum(len(w["word"]) for w in batch) >= 28 or re.search(r"[.!?]$", word["word"].strip()):
            cues.append(batch)
            batch = []
    if batch:
        cues.append(batch)
    blocks = []
    for cue in cues:
        left, right = max(0, cue[0]["start"] - start), min(end-start, cue[-1]["end"] - start)
        text = " ".join(w["word"].strip() for w in cue)
        text = re.sub(r"[{}<>\\\r\n]", "", text)
        if right > left and text.strip():
            blocks.append(f"{len(blocks)+1}\n{timestamp(left)} --> {timestamp(right)}\n{text}\n")
    if not blocks:
        raise ValueError("NO_TIMED_SUBTITLES")
    Path(target).write_text("\n".join(blocks), encoding="utf-8")


def probe(path):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
                            capture_output=True, check=True, timeout=30)
    data = json.loads(result.stdout)
    video = next(s for s in data["streams"] if s["codec_type"] == "video")
    return {"width": video["width"], "height": video["height"], "duration": float(data["format"]["duration"])}


def render(source, clip, words, folder, index):
    start, end = float(clip["start"]), float(clip["end"])
    if not (math.isfinite(start) and math.isfinite(end) and 0 <= start < end <= 3600 and 20 <= end-start <= 60):
        raise ValueError("INVALID_RANGE")
    folder = Path(folder).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    subtitle = folder / f"{index}.srt"
    output = folder / f"{index}.mp4"
    write_subtitles(words, start, end, subtitle)
    # Preserve the entire source frame; blurred background fills 9:16.
    # This initial version deliberately does not claim face tracking.
    filters = (
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=12:1,scale=1080:1920[back];"
        "[fg]scale=1080:1920:force_original_aspect_ratio=decrease[front];"
        "[back][front]overlay=(W-w)/2:(H-h)/2,setsar=1,"
        f"subtitles={index}.srt:force_style='FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00101010,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=55'[out]"
    )
    subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", str(start), "-i", str(Path(source).resolve()), "-t", str(end-start),
                    "-filter_complex_threads", "1", "-filter_complex", filters, "-map", "[out]", "-map", "0:a:0?",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-threads", "2", "-r", "30",
                    "-c:a", "aac", "-b:a", "128k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)],
                   cwd=folder, check=True, timeout=900)
    meta = probe(output)
    if meta["width"] != 1080 or meta["height"] != 1920 or abs(meta["duration"]-(end-start)) > 1:
        raise ValueError("OUTPUT_VERIFICATION_FAILED")
    return output, meta


def video_id(url):
    match = re.fullmatch(r"https://www\.youtube\.com/watch\?v=([\w-]{11})", url)
    if not match:
        raise ValueError("YOUTUBE_ONLY")
    return match.group(1)


def fetch_uploaded(storage, bucket, url, folder):
    """Operator-supplied original file in the private sources bucket, keyed by video ID.

    Returns None when no file was uploaded, so acquisition falls back to YouTube.
    The same limits apply: up to 1 GiB, 1–60 minutes, real video stream.
    """
    key = f"{video_id(url)}.mp4"
    try:
        head = storage.head_object(Bucket=bucket, Key=key)
    except Exception as error:
        # botocore ClientError carries the S3 status; anything else is a real failure.
        code = (getattr(error, "response", None) or {}).get("Error", {}).get("Code")
        if code in ("404", "NoSuchKey", "NotFound"):
            return None
        raise
    if head["ContentLength"] > 1024 * 1024 * 1024:
        raise ValueError("SOURCE_TOO_LARGE")
    target = Path(folder) / "source.mp4"
    storage.download_file(bucket, key, str(target))
    return validate_source(target)


def validate_source(target):
    """Same limits as YouTube acquisition: real video stream, 1–60 minutes, ≤ 1 GiB."""
    if Path(target).stat().st_size > 1024 * 1024 * 1024:
        raise ValueError("SOURCE_TOO_LARGE")
    try:
        meta = probe(target)
    except Exception:
        raise ValueError("SOURCE_NOT_VIDEO")
    if not 60 <= meta["duration"] <= 3600:
        raise ValueError("SOURCE_DURATION_OR_LIVE")
    return Path(target)


def acquire(url, folder):
    from yt_dlp import YoutubeDL
    video_id(url)
    limit = 1024 * 1024 * 1024
    def guard(progress):
        if (progress.get("downloaded_bytes") or 0) > limit:
            raise ValueError("SOURCE_TOO_LARGE")
    options = {"outtmpl": str(Path(folder)/"source.%(ext)s"), "noplaylist": True, "quiet": True,
               "no_warnings": True, "format": "bv*[height<=1080]+ba/b[height<=1080]", "merge_output_format": "mp4",
               "max_filesize": limit, "socket_timeout": 30, "retries": 1, "fragment_retries": 1,
               "progress_hooks": [guard], "cachedir": False}
    with YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=False)
        duration = info.get("duration") or 0
        if not 60 <= duration <= 3600 or info.get("is_live") or info.get("live_status") == "is_upcoming":
            raise ValueError("SOURCE_DURATION_OR_LIVE")
        downloader.download([url])
    files = [p for p in Path(folder).glob("source.*") if p.suffix in (".mp4", ".webm", ".mkv")]
    if len(files) != 1 or files[0].stat().st_size > limit:
        raise ValueError("SOURCE_NOT_AVAILABLE")
    return files[0]


def transcribe(source, model_name="small"):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
    segments, _ = model.transcribe(str(source), word_timestamps=True, vad_filter=True)
    result, words = [], []
    for segment in segments:
        result.append({"start": segment.start, "end": segment.end, "text": segment.text})
        words.extend({"start": w.start, "end": w.end, "word": w.word} for w in (segment.words or []))
    if not result or not words:
        raise ValueError("NO_SPEECH")
    return result, words

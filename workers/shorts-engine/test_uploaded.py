import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from engine import fetch_uploaded

URL = "https://www.youtube.com/watch?v=V1Fq4psulqU"


class Missing(Exception):
    response = {"Error": {"Code": "404"}}


class FakeStorage:
    def __init__(self, file=None, size=None, error=None):
        self.file, self.size, self.error, self.keys = file, size, error, []

    def head_object(self, Bucket, Key):
        self.keys.append(Key)
        if self.error:
            raise self.error
        return {"ContentLength": self.size if self.size is not None else Path(self.file).stat().st_size}

    def download_file(self, bucket, key, target):
        shutil.copy(self.file, target)


def synthetic(folder, seconds, video=True):
    path = Path(folder) / "upload.mp4"
    inputs = (["-f", "lavfi", "-i", f"testsrc=size=320x180:rate=10:duration={seconds}"] if video else []) + \
        ["-f", "lavfi", "-i", f"sine=duration={seconds}"]
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", *inputs, "-shortest", "-c:a", "aac",
                    *(["-c:v", "libx264", "-preset", "ultrafast"] if video else []), str(path)], check=True)
    return path


class FetchUploadedTest(unittest.TestCase):
    def test_missing_file_falls_back_to_youtube(self):
        storage = FakeStorage(error=Missing())
        with tempfile.TemporaryDirectory() as folder:
            self.assertIsNone(fetch_uploaded(storage, "sources", URL, folder))
        self.assertEqual(storage.keys, ["V1Fq4psulqU.mp4"])

    def test_other_storage_errors_are_not_hidden(self):
        with tempfile.TemporaryDirectory() as folder, self.assertRaises(PermissionError):
            fetch_uploaded(FakeStorage(error=PermissionError("denied")), "sources", URL, folder)

    def test_oversized_upload_is_refused_before_download(self):
        with tempfile.TemporaryDirectory() as folder, self.assertRaisesRegex(ValueError, "SOURCE_TOO_LARGE"):
            fetch_uploaded(FakeStorage(file="x", size=2 * 1024 ** 3), "sources", URL, folder)

    def test_only_youtube_watch_links_map_to_uploads(self):
        with tempfile.TemporaryDirectory() as folder, self.assertRaisesRegex(ValueError, "YOUTUBE_ONLY"):
            fetch_uploaded(FakeStorage(), "sources", "https://example.com/v.mp4", folder)

    @unittest.skipUnless(shutil.which("ffmpeg"), "ffmpeg required")
    def test_valid_upload_is_used_and_limits_apply(self):
        with tempfile.TemporaryDirectory() as uploads, tempfile.TemporaryDirectory() as work:
            ok = fetch_uploaded(FakeStorage(file=synthetic(uploads, 61)), "sources", URL, work)
            self.assertEqual(ok.name, "source.mp4")
            with self.assertRaisesRegex(ValueError, "SOURCE_DURATION_OR_LIVE"):
                fetch_uploaded(FakeStorage(file=synthetic(uploads, 30)), "sources", URL, work)
            with self.assertRaisesRegex(ValueError, "SOURCE_NOT_VIDEO"):
                fetch_uploaded(FakeStorage(file=synthetic(uploads, 61, video=False)), "sources", URL, work)


if __name__ == "__main__":
    unittest.main()

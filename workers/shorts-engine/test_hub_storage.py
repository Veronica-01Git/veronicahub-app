import json
import os
import shutil
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest import mock

import worker
from test_uploaded import synthetic

JOB = {"id": "a" * 36, "lease": "b" * 36}


class FakeHub(BaseHTTPRequestHandler):
    source = None
    stored = {}
    lie = False

    def log_message(self, *args):
        pass

    def authorized(self):
        return self.headers.get("Authorization") == "Bearer t"

    def do_GET(self):
        if not self.authorized() or "/api/social/render/source?" not in self.path:
            return self.send_error(401)
        if not FakeHub.source:
            return self.send_error(404)
        data = Path(FakeHub.source).read_bytes()
        self.send_response(200)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_PUT(self):
        if not self.authorized() or "/api/social/render/upload?" not in self.path:
            return self.send_error(401)
        body = self.rfile.read(int(self.headers["Content-Length"]))
        FakeHub.stored[self.path] = body
        reply = json.dumps({"ok": True, "size": len(body) - (1 if FakeHub.lie else 0)}).encode()
        self.send_response(200)
        self.send_header("Content-Length", str(len(reply)))
        self.end_headers()
        self.wfile.write(reply)


class HubStorageTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), FakeHub)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        env = {"HUB_BASE_URL": f"http://127.0.0.1:{cls.server.server_port}", "SOCIAL_RENDER_SECRET": "t"}
        cls.env = mock.patch.dict(os.environ, env)
        cls.env.start()

    @classmethod
    def tearDownClass(cls):
        cls.env.stop()
        cls.server.shutdown()

    def setUp(self):
        FakeHub.source, FakeHub.stored, FakeHub.lie = None, {}, False

    def test_missing_original_falls_back_to_youtube(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertIsNone(worker.HubStorage().fetch_source(JOB, folder))

    @unittest.skipUnless(shutil.which("ffmpeg"), "ffmpeg required")
    def test_original_is_downloaded_and_validated(self):
        with tempfile.TemporaryDirectory() as uploads, tempfile.TemporaryDirectory() as work:
            FakeHub.source = synthetic(uploads, 61)
            path = worker.HubStorage().fetch_source(JOB, work)
            self.assertEqual(path.read_bytes(), Path(FakeHub.source).read_bytes())
            FakeHub.source = synthetic(uploads, 30)
            with self.assertRaisesRegex(ValueError, "SOURCE_DURATION_OR_LIVE"):
                worker.HubStorage().fetch_source(JOB, work)

    def test_upload_is_bound_to_job_lease_and_confirmed_by_size(self):
        with tempfile.TemporaryDirectory() as folder:
            clip = Path(folder) / "0.mp4"
            clip.write_bytes(b"x" * 2048)
            worker.HubStorage().upload(JOB, 0, clip)
            (path, body), = FakeHub.stored.items()
            self.assertIn(f"id={JOB['id']}", path)
            self.assertIn(f"lease={JOB['lease']}", path)
            self.assertIn("index=0", path)
            self.assertEqual(len(body), 2048)
            FakeHub.lie = True
            with self.assertRaisesRegex(RuntimeError, "MEDIA_UPLOAD_UNCONFIRMED"):
                worker.HubStorage().upload(JOB, 0, clip)

    def test_without_s3_settings_no_credentials_are_needed(self):
        with mock.patch.dict(os.environ, {"SHORTS_S3_ENDPOINT": ""}):
            self.assertEqual(worker.storage_client(), (None, None))


if __name__ == "__main__":
    unittest.main()

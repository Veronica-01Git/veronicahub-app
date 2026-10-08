"""Container entrypoint for scale-to-zero hosts (Cloudflare Containers).

Reachable only through the shorts-runner Worker's Durable Object, never from the
internet. POST /tick starts one drain pass in the background and reports whether a
pass is running; the Worker keeps ticking while busy so the instance stays awake,
and stops ticking once idle so the instance sleeps and billing stops.
"""
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from worker import drain

state = {"busy": False, "passes": 0, "lastError": None}
lock = threading.Lock()


def run_pass():
    try:
        drain()
        state["lastError"] = None
    except Exception as error:
        # Startup/queue problems only; per-job failures are reported to the Hub by process().
        state["lastError"] = type(error).__name__
        print("Drain pass stopped:", type(error).__name__, str(error)[:300], flush=True)
    finally:
        with lock:
            state["busy"] = False
            state["passes"] += 1


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            return self.reply(200, {"ok": True, **state})
        return self.reply(404, {"ok": False})

    def do_POST(self):
        if self.path != "/tick":
            return self.reply(404, {"ok": False})
        with lock:
            started = not state["busy"]
            if started:
                state["busy"] = True
                threading.Thread(target=run_pass, daemon=True).start()
        return self.reply(200, {"ok": True, "started": started, **state})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("Shorts runner listening on 8080", flush=True)
    ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()

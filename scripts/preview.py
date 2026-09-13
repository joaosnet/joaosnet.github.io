"""Serve only the generated site, with localized 404 pages and a test-friendly health URL."""

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "dist"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = root / ("en/404.html" if self.path.startswith("/en/") else "404.html")
            if page.exists():
                body = page.read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if not (root / "index.html").exists():
        parser.error("Run build_site.py first")
    server = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"Portfolio preview: http://localhost:{args.port}", flush=True)
    server.serve_forever()

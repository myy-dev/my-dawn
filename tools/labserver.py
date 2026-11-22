"""Local check server: serves the repo and stores PUT /lab/out/<name>.jpg under review/lab/.

Usage: python3 tools/labserver.py <repo> <port>
"""
import functools
import http.server
import os
import re
import sys
import urllib.parse

REPO, PORT = sys.argv[1], int(sys.argv[2])
OUT = os.path.join(REPO, "review", "lab")
os.makedirs(OUT, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = urllib.parse.unquote(path.split("?")[0])
        for prefix, root in (("/lab/out/", OUT), ("/tools/", os.path.join(REPO, "tools"))):
            if clean.startswith(prefix):
                target = os.path.realpath(os.path.join(root, clean[len(prefix):]))
                # stay inside the folder being served: ".." in the request never reaches past it
                return target if target.startswith(os.path.realpath(root) + os.sep) else os.path.join(root, "__missing__")
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_PUT(self):
        match = re.fullmatch(r"/lab/out/([\w.-]+\.(?:jpg|json))", self.path)
        if not match:
            self.send_error(404)
            return
        data = self.rfile.read(int(self.headers["Content-Length"]))
        with open(os.path.join(OUT, match.group(1)), "wb") as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=REPO)).serve_forever()

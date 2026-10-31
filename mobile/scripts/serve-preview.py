from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse

parser = argparse.ArgumentParser(description='Local FinFlow Expo SPA preview')
parser.add_argument('--directory', default='dist')
parser.add_argument('--port', type=int, default=4175)
args = parser.parse_args()
root = (Path(__file__).resolve().parents[1] / args.directory).resolve()
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if not Path(self.translate_path(path)).exists() and not Path(path).suffix:
            self.path = '/'
        super().do_GET()

print(f'FinFlow Expo web preview: http://127.0.0.1:{args.port}/', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root))).serve_forever()

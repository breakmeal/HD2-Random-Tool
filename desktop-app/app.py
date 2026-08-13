"""Standalone Windows GUI launcher for the Super Earth equipment terminal."""

from __future__ import annotations

import ctypes
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import webview


APP_TITLE = "超级地球随机军备终端"
APP_PORT = 41735
APP_HOST = "127.0.0.1"


def packaged_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "web"
    return Path(__file__).resolve().parent / "bundle" / "web"


def storage_root() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    base = Path(local_app_data) if local_app_data else Path.home() / "AppData" / "Local"
    target = base / "SuperEarthArsenal"
    target.mkdir(parents=True, exist_ok=True)
    return target


class AssetHandler(SimpleHTTPRequestHandler):
    """Serve only the files bundled with this executable."""

    def __init__(self, *args, directory: str, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        return


def start_asset_server(root: Path) -> ThreadingHTTPServer:
    handler = lambda *args, **kwargs: AssetHandler(*args, directory=str(root), **kwargs)
    server = ThreadingHTTPServer((APP_HOST, APP_PORT), handler)
    thread = threading.Thread(target=server.serve_forever, name="asset-server", daemon=True)
    thread.start()
    return server


def show_error(message: str) -> None:
    if sys.platform == "win32":
        ctypes.windll.user32.MessageBoxW(0, message, APP_TITLE, 0x10)
    else:
        print(message, file=sys.stderr)


def main() -> int:
    root = packaged_root()
    index_file = root / "index.html"
    if not index_file.is_file():
        show_error(f"桌面资源不完整，找不到：\n{index_file}")
        return 2

    try:
        server = start_asset_server(root)
    except OSError as exc:
        show_error(f"无法启动本地桌面资源服务（端口 {APP_PORT} 可能已被占用）。\n\n{exc}")
        return 3

    window = webview.create_window(
        APP_TITLE,
        f"http://{APP_HOST}:{APP_PORT}/index.html",
        width=1440,
        height=900,
        min_size=(1180, 720),
        resizable=True,
        text_select=True,
        background_color="#080a09",
    )

    try:
        webview.start(
            gui="edgechromium",
            debug=False,
            private_mode=False,
            storage_path=str(storage_root()),
        )
    finally:
        server.shutdown()
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

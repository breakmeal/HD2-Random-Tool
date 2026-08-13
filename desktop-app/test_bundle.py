"""Static validation for the files copied into the desktop bundle."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


TOP_LEVEL_FILES = {
    "index.html",
    "styles.css",
    "codex.css",
    "interface-refresh.css",
    "enemy-dossier.css",
    "mission-dossier.css",
    "data.js",
    "equipment-details.js",
    "enemy-data.js",
    "mission-data.js",
    "stratagem-ratings.js",
    "refreshed-images.js",
    "equipment-descriptions-zh.js",
    "app.js",
    "codex-v2.js",
    "enemy-dossier.js",
    "mission-dossier.js",
}


def validate(bundle: Path) -> dict[str, int | str]:
    missing = sorted(name for name in TOP_LEVEL_FILES if not (bundle / name).is_file())
    assets = bundle / "assets"
    if not assets.is_dir():
        missing.append("assets/")

    historical = assets / "refreshed-images"
    active_batches = sorted(path.name for path in historical.iterdir()) if historical.is_dir() else []
    if active_batches != ["2026-08-08-matched"]:
        missing.append("assets/refreshed-images/2026-08-08-matched-only")

    for extra_dir in ("missions", "enemies"):
        if not (assets / extra_dir).is_dir():
            missing.append(f"assets/{extra_dir}/")

    image_files = [path for path in assets.rglob("*") if path.is_file()]
    result = {
        "bundle": str(bundle),
        "top_level_files": len(TOP_LEVEL_FILES) - len([item for item in missing if not item.startswith("assets/")]),
        "asset_files": len(image_files),
        "active_batches": ",".join(active_batches),
        "errors": len(missing),
    }
    if missing:
        raise SystemExit(json.dumps({**result, "missing": missing}, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle", nargs="?", type=Path, default=Path(__file__).parent / "bundle" / "web")
    args = parser.parse_args()
    print(json.dumps(validate(args.bundle), ensure_ascii=False, indent=2))

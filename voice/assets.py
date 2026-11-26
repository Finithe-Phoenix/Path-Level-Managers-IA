"""Fetch the exact public English voice and model weights listed in model-lock.json."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import urllib.request

LOCK = Path(__file__).with_name("model-lock.json")
DEFAULT_CACHE = Path.home() / ".cache" / "ai-training-voice"


def digest(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def ensure_assets(directory, download=False):
    directory.mkdir(exist_ok=True, parents=True)
    for name, entry in json.loads(LOCK.read_text()).items():
        target = directory / name
        if target.exists() and digest(target) == entry["sha256"]:
            continue
        if not download:
            raise SystemExit(f"Missing or invalid {name}. Run: python voice/assets.py {directory}")
        with tempfile.TemporaryDirectory(dir=directory) as staging:
            temporary = Path(staging) / name
            with urllib.request.urlopen(entry["url"], timeout=120) as source, temporary.open("wb") as dest:
                shutil.copyfileobj(source, dest)
            if digest(temporary) != entry["sha256"]:
                raise ValueError(f"Checksum differs for {name}")
            os.replace(temporary, target)


if __name__ == "__main__":
    ensure_assets(Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_CACHE, True)

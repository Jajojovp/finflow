"""Verify that the release actually embeds the Android symbols fix before upload."""
import hashlib
import json
from pathlib import Path
import sys
from zipfile import ZipFile

mobile = Path(__file__).resolve().parents[1]
apk = Path(sys.argv[1])
receipt = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8-sig"))
app = json.loads((mobile / "app.json").read_text())["expo"]
broken_hash = "b32aea2e3db757280cd87692cfa40dde95e5a0eb5509c8562a8d8f511bada206"
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
assert digest != broken_hash, "Refusing the broken APK"
assert digest == receipt["sha256"], "APK differs from its signed-build receipt"
assert apk.stat().st_size == receipt["bytes"], "APK size differs from receipt"
assert receipt["version"] == app["version"] == "1.0.1", "Wrong release version"
assert receipt["versionCode"] == app["android"]["versionCode"] == 2

with ZipFile(apk) as archive:
    bundle = archive.read("assets/index.android.bundle")
    assert b"MaterialSymbols_400Regular" in bundle, "Symbols implementation absent from bundle"
    assert b"renderToImageAsync" in bundle, "Material icon rendering absent from bundle"
    font = mobile / "node_modules/@expo-google-fonts/material-symbols/400Regular/MaterialSymbols_400Regular.ttf"
    font_hash = hashlib.sha256(font.read_bytes()).hexdigest()
    matches = [item.filename for item in archive.infolist()
               if item.file_size == font.stat().st_size
               and hashlib.sha256(archive.read(item)).hexdigest() == font_hash]
    assert matches, "Material Symbols font is not embedded in APK"

print(json.dumps({"verified": True, "version": receipt["version"],
                  "versionCode": receipt["versionCode"], "sha256": digest,
                  "bytes": receipt["bytes"], "symbolsFont": matches,
                  "bundleBytes": len(bundle)}, indent=2))

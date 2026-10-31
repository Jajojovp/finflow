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
previous_hash = "a53e9d2540312167cbb26642ffed743a853f1e32ec9d395769e7238524e32a70"
if len(sys.argv) > 3:
    assert receipt["sourceRevision"] == sys.argv[3], "APK was built from a different source revision"

digest = hashlib.sha256(apk.read_bytes()).hexdigest()
assert digest != broken_hash, "Refusing the broken APK"
assert digest != "782b66b33b5f45981c47e1a9308f868f101b139613bfe3664ac27ff8650f863e", "Refusing the previous phase-one APK"
assert digest != "1cc26d84376d047c41f447bb97ae58a99d561802708165fd69e97abcdd5a7ede", "Refusing the previous APK without Crecimiento data protection"
assert digest != previous_hash, "Refusing the previous APK without the full currency catalog"
assert digest == receipt["sha256"], "APK differs from its signed-build receipt"
assert apk.stat().st_size == receipt["bytes"], "APK size differs from receipt"
assert receipt["version"] == app["version"], "Wrong release version"
assert receipt["versionCode"] == app["android"]["versionCode"]

with ZipFile(apk) as archive:
    bundle = archive.read("assets/index.android.bundle")
    assert b"MaterialSymbols_400Regular" in bundle, "Symbols implementation absent from bundle"
    assert b"renderToImageAsync" in bundle, "Material icon rendering absent from bundle"
    for code in [b"CLP", b"ARS", b"USD", b"CAD", b"KWD", b"CLF"]:
        assert code in bundle, f"Currency missing from bundle: {code!r}"
    assert (b"Buscar moneda por nombre" in bundle or "Buscar moneda por nombre".encode("utf-16le") in bundle), "New currency selector absent from bundle"
    for text in ["finflow-backup-v2", "Confirmar restauración completa", "Revisar CSV", "Archivar este cliente", "Dale espacio a lo que viene.", "Tu portafolio, por moneda.", "Señales con una explicación.", "Caja de 13 semanas", "collectionDelayDays", "in-app-local", "Seleccionar movimientos existentes", "Origen del cobro o pago"]:
        assert text.encode("utf-8") in bundle or text.encode("utf-16le") in bundle, f"Crecimiento feature missing: {text}"
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

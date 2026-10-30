"""Prepare synthetic-only React workflow QA; never import browser-owned data."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
bootstrap = (root / "tools/workflow-qa-bootstrap.html").read_text(encoding="utf-8")
dev = (root / "react-app/index.html").read_text(encoding="utf-8")
# Vite rewrites its source entry relative to the project root.
dev = dev.replace('src="./src/', 'src="/src/')
qa = root / "react-app/.tmp/workflow.html"
qa.parent.mkdir(parents=True, exist_ok=True)
qa.write_text(dev.replace("<head>", "<head>" + bootstrap, 1), encoding="utf-8")
out = root / ".tmp/workflow-preview"
for source, destination in [
    (root / "react-spike", out / "ManaSpec/react-spike"),
    (root / "react-app/dist-portable", out / "portable"),
]:
    shutil.copytree(source, destination, dirs_exist_ok=True)
    html = (destination / "index.html").read_text(encoding="utf-8")
    (destination / "qa.html").write_text(html.replace("<head>", "<head>" + bootstrap, 1), encoding="utf-8")
print("Dev: http://127.0.0.1:5174/.tmp/workflow.html#/radar")
print("Serve .tmp/workflow-preview on loopback port 8000; Pages: /ManaSpec/react-spike/qa.html; portable: /portable/qa.html")

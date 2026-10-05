"""Seed the running ComplyGeM server with the demo tender and two bidder bids.

Usage:  python scripts/seed_demo.py [base_url]     (default http://127.0.0.1:8000)
Exercises the real API so the seeded data is produced by the actual pipeline.
"""
import sys
import time
import urllib.request
import uuid
from pathlib import Path

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
DOCS = Path(__file__).resolve().parents[1] / "demo_docs"


def multipart(fields: list[tuple[str, str]], files: list[tuple[str, str, bytes]]) -> tuple[bytes, str]:
    b = uuid.uuid4().hex
    parts = []
    for name, value in fields:
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, filename, data in files:
        parts.append(
            f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: application/pdf\r\n\r\n".encode() + data + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={b}"


def call(path: str, fields=None, files=None, expect_json=True):
    if files:
        body, ctype = multipart(fields or [], files)
        req = urllib.request.Request(BASE + path, data=body, headers={"Content-Type": ctype})
    elif fields:
        from urllib.parse import urlencode
        req = urllib.request.Request(BASE + path, data=urlencode(fields).encode(),
                                     headers={"Content-Type": "application/x-www-form-urlencoded"})
    else:
        req = urllib.request.Request(BASE + path)
    with urllib.request.urlopen(req, timeout=120) as r:
        import json
        return json.loads(r.read().decode()) if expect_json else r.read()


def read(name):
    return (DOCS / name).read_bytes()


def main():
    print("1. Uploading tender…")
    t = call("/api/tenders",
             fields=[("title", "IT Infrastructure Procurement 2026"),
                     ("department", "Department of Information Technology"),
                     ("ref_no", "")],
             files=[("file", "Tender_IT_Infrastructure_2026.pdf", read("Tender_IT_Infrastructure_2026.pdf"))])
    print(f"   ✓ Tender #{t['id']} — {len(t['requirements'])} requirements extracted")
    for r in t["requirements"]:
        print(f"     - {r['code']}: {r['title']} ({r['req_type']})")

    for bidder, doc_names in [
        ("ABC Technologies Pvt Ltd", ["Bidder_ABC_Financial_Statement.pdf", "Bidder_ABC_Experience_Certificate.pdf",
                                      "Bidder_ABC_GST_Certificate.pdf", "Bidder_ABC_OEM_Authorization.pdf",
                                      "Bidder_ABC_GeM_Registration.pdf"]),
        ("XYZ Systems Ltd", ["Bidder_XYZ_Financial_Statement.pdf", "Bidder_XYZ_Experience_Statement.pdf",
                             "Bidder_XYZ_GST_Certificate.pdf"]),
    ]:
        print(f"2. Uploading documents for {bidder}…")
        up = call(f"/api/tenders/{t['id']}/documents",
                  fields=[("bidder_name", bidder)],
                  files=[("files", n, read(n)) for n in doc_names])
        print(f"   ✓ {len(up['documents'])} documents processed")
        print(f"3. Running analysis for {bidder}…")
        a = call(f"/api/tenders/{t['id']}/analyze", fields=[("bidder_id", str(up["bidder_id"]))])
        print(f"   ✓ Score {a['score']}% — {a['verdict']}  ({a['n_compliant']} ✓ / {a['n_review']} ⚠ / {a['n_non_compliant']} ✗)")

    print("\nSeeded. Open", BASE)


if __name__ == "__main__":
    main()

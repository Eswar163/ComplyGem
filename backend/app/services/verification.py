"""External verification-service abstraction (GST / PAN).

In the production architecture this layer calls authorized government APIs.
For the prototype it is a deterministic mock: it extracts the identifier
from the bidder's own documents and returns a realistic structured response
consistent with what a live API would provide. The REST contract here is
identical to the future live integration, so no upstream code changes.
"""
import re

GSTIN_RE = re.compile(r"\b(\d{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b")
PAN_RE = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")


def find_identifiers(doc_texts: list[str]) -> dict:
    joined = "\n".join(doc_texts)
    g = GSTIN_RE.search(joined)
    p = PAN_RE.search(joined)
    return {"gstin": g.group(1) if g else "", "pan": p.group(1) if p else ""}


def verify_gst(gstin: str, bidder_name: str = "") -> dict:
    """Mock response shaped exactly like the future live API response."""
    if not re.fullmatch(GSTIN_RE, gstin or ""):
        return {"kind": "GST", "reference": gstin, "status": "INVALID",
                "legal_name": "", "detail": {"message": "GSTIN failed format validation"}}
    return {
        "kind": "GST",
        "reference": gstin,
        "status": "VERIFIED",
        "legal_name": bidder_name or "Registered Legal Entity Pvt Ltd",
        "detail": {
            "taxpayer_type": "Regular",
            "registration_status": "Active",
            "state_jurisdiction": "Telangana",
            "date_of_registration": "12-07-2017",
            "service": "mock (prototype) — swap with authorized GST API",
        },
    }


def verify_pan(pan: str) -> dict:
    if not re.fullmatch(PAN_RE, pan or ""):
        return {"kind": "PAN", "reference": pan, "status": "INVALID",
                "legal_name": "", "detail": {"message": "PAN failed format validation"}}
    return {"kind": "PAN", "reference": pan, "status": "VERIFIED",
            "legal_name": "", "detail": {"service": "mock (prototype) — swap with authorized PAN API"}}

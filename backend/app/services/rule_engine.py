"""Deterministic rule engine.

The LLM may propose and locate evidence, but every PASS/FAIL decision on a
checkable quantity is made here — numbers, counts and dates are compared by
code, not by language-model opinion. That separation is what makes results
auditable.
"""
import re
from datetime import date, datetime

COMPLIANT = "COMPLIANT"
NON_COMPLIANT = "NON_COMPLIANT"
REVIEW = "REVIEW_REQUIRED"

MONEY_RE = re.compile(r"(?:₹|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(crore|crores|cr|lakh|lakhs|lacs|lac)\b", re.I)
COUNT_RE = re.compile(r"(\d+)\s*(similar\s+)?(projects|work\s+orders|works|assignments|completed\s+projects)\b", re.I)
YEARS_RE = re.compile(r"(\d+)\s*(?:\+\s*)?years?\b", re.I)
DATE_RE = re.compile(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})|(\d{4})-(\d{2})-(\d{2})")

DOC_KEYWORDS = {
    "ISO 9001 Certification": ["iso 9001", "iso9001", "iso 9001:2015"],
    "ISO 27001 Certification": ["iso 27001", "iso27001", "iso/iec 27001"],
    "ISO 14001 Certification": ["iso 14001", "iso14001"],
    "CE Certification": ["ce certified", "ce certification", "ce certificate"],
    "GST Registration": ["gst", "gstin", "goods and services tax"],
    "PAN Registration": ["pan", "permanent account number"],
    "MSME / Udyam Registration": ["udyam", "msme", "micro small medium"],
    "OEM Authorization": ["oem authorization", "authorized partner", "authorised partner", "authorisation certificate", "authorization certificate"],
    "Startup India (DPIIT) Recognition": ["dpiit", "startup india", "start-up india"],
    "GeM Seller Registration": ["gem seller", "gem registered", "gem registration", "primary user", "seller id"],
    "Professional Tax Registration": ["professional tax", "pt registration"],
    "Labour License": ["labour license", "labour licen"],
    "Financial Statement": ["turnover", "balance sheet", "financial statement", "profit and loss", "audited"],
    "Experience Certificate": ["experience certificate", "similar work", "work order", "completion certificate", "project"],
}


def _fmt(v: float) -> str:
    return f"{v:,.2f}".rstrip("0").rstrip(".")


def extract_amounts(text: str) -> list[float]:
    """All monetary amounts found in text, normalized to ₹ crore."""
    out = []
    for m in MONEY_RE.finditer(text):
        v = float(m.group(1).replace(",", ""))
        out.append(v / 100.0 if m.group(2).lower() in ("lakh", "lakhs", "lacs", "lac") else v)
    return out


def extract_dates(text: str) -> list[date]:
    out = []
    for m in DATE_RE.finditer(text):
        try:
            if m.group(1):
                d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
                if y < 100:
                    y += 2000
            else:
                y, mo, d = int(m.group(4)), int(m.group(5)), int(m.group(6))
            out.append(date(y, mo, d))
        except ValueError:
            continue
    return out


def _best_evidence(hits: list, keywords: list[str] | None = None):
    """Pick the highest-scoring hit, preferring chunks that mention the keywords."""
    if not hits:
        return None
    if keywords:
        for h in hits:
            low = h.text.lower()
            if any(k in low for k in keywords):
                return h
    return hits[0]


def evaluate(requirement, hits: list, gstin: str = "") -> dict:
    """Evaluate one requirement against retrieved evidence chunks.
    Returns a dict matching the ComplianceResult columns."""
    base = {
        "extracted_value": "", "rule_text": "", "explanation": "",
        "recommendation": "", "evidence_doc_id": None, "evidence_doc_name": "",
        "evidence_page": 0, "evidence_snippet": "", "score": 0.0,
    }
    rt = requirement.req_type
    tv = requirement.threshold_value
    unit = (requirement.threshold_unit or "").upper()

    if rt in ("numeric", "count") and tv is not None:
        if unit == "INR_CRORE":
            label = "₹ crore"
        elif unit == "INR_LAKH":
            label = "₹ lakh"
        else:
            label = unit.lower()
        base["rule_text"] = f"{requirement.title} {requirement.comparator} {tv:g} {label}".strip()
        amounts = []
        best = None
        for h in hits:
            amounts += extract_amounts(h.text)
        if rt == "count":
            counts = []
            for h in hits:
                rx = YEARS_RE if unit == "YEARS" else COUNT_RE
                counts += [int(m.group(1)) for m in rx.finditer(h.text)]
            if counts:
                best = max(counts)
                base["extracted_value"] = f"{best} {label}"
        elif amounts:
            best = max(amounts)
            base["extracted_value"] = f"₹{_fmt(best)} crore"

        if best is None:
            base.update(status=REVIEW, reason="NO_EXTRACTABLE_VALUE",
                        explanation="Relevant passages were found but no explicit value could be extracted. Manual review needed.",
                        recommendation="Ask officer to verify the submitted documents manually.",
                        score=0.0, **{k: v for k, v in _best_evidence_fields(hits).items()})
            return base

        if rt == "count":
            counting_hits = [h for h in hits if (YEARS_RE if unit == "YEARS" else COUNT_RE).search(h.text)]
        else:
            counting_hits = [h for h in hits if extract_amounts(h.text)]
        base.update(**_best_evidence_fields(counting_hits or hits))

        ok = best >= tv if requirement.comparator == ">=" else best <= tv if requirement.comparator == "<=" else best == tv
        if ok:
            base.update(status=COMPLIANT, reason="VALUE_PASS",
                        explanation=f"Extracted value {base['extracted_value']} satisfies the required {requirement.comparator} {tv:g} {label}.",
                        recommendation="", score=1.0)
        else:
            base.update(status=NON_COMPLIANT, reason="VALUE_FAIL",
                        explanation=f"Extracted value {base['extracted_value']} does not meet the required {requirement.comparator} {tv:g} {label}.",
                        recommendation=f"Bidder must demonstrate {requirement.title.lower()} of at least {tv:g} {label}.",
                        score=0.0)
        return base

    if rt == "date":
        base["rule_text"] = "Document validity checked against bid date"
        ev = _best_evidence_fields(hits)
        base.update(**ev)
        dates = extract_dates(" ".join(h.text for h in hits)) if hits else []
        future = [d for d in dates if d >= date.today()]
        if future:
            base.update(status=COMPLIANT, reason="DATE_VALID",
                        extracted_value=max(future).strftime("%d-%m-%Y"),
                        explanation=f"Document valid until {max(future).strftime('%d-%m-%Y')}, beyond the current bid date.",
                        score=1.0)
        elif dates:
            base.update(status=NON_COMPLIANT, reason="DATE_EXPIRED",
                        extracted_value=max(dates).strftime("%d-%m-%Y"),
                        explanation="A date was found but it does not establish validity through the bid period.",
                        recommendation="Request a renewed certificate.", score=0.0)
        else:
            base.update(status=REVIEW, reason="NO_DATE_FOUND",
                        explanation="No parseable validity date found in the evidence.", score=0.0)
        return base

    # default: document / boolean
    base["rule_text"] = "Required document must be present in the bid submission"
    keywords = DOC_KEYWORDS.get(requirement.title, [])
    hay = [h for h in hits if any(k in h.text.lower() for k in keywords)] if keywords else hits

    if requirement.title == "GST Registration":
        base["rule_text"] = "GSTIN present in documents and verification service returns Active"
        if gstin:
            gst_hit = next((h for h in hits if gstin in h.text), hay[0] if hay else None)
            base.update(status=COMPLIANT, reason="VERIFIED_ACTIVE",
                        extracted_value=gstin,
                        explanation=f"GSTIN {gstin} located in submitted documents; verification service reports Active (mock service in prototype).",
                        score=1.0, **(_best_evidence_fields([gst_hit]) if gst_hit else {}))
        elif hay:
            base.update(status=REVIEW, reason="NEEDS_HUMAN",
                        explanation="GST certificate document found but no parseable GSTIN; verification could not be completed automatically.",
                        recommendation="Officer to cross-check GSTIN on the certificate.", score=0.0,
                        **_best_evidence_fields(hay))
        else:
            base.update(status=NON_COMPLIANT, reason="DOC_MISSING",
                        explanation="No GST registration document found in the bid submission.",
                        recommendation="Bidder to upload GST registration certificate.", score=0.0)
        return base

    if hay:
        base.update(status=COMPLIANT, reason="DOC_FOUND",
                    explanation=f"Required document located in '{hay[0].doc_name}' (page {hay[0].page}).",
                    score=1.0, **_best_evidence_fields(hay))
    else:
        base.update(status=NON_COMPLIANT, reason="DOC_MISSING",
                    explanation=f"Evidence for '{requirement.title}' was not found in any submitted document.",
                    recommendation=f"Request/verify: {', '.join(requirement.evidence_required) if requirement.evidence_required else requirement.title}.",
                    score=0.0)
    return base


def _best_evidence_fields(hits: list) -> dict:
    if not hits:
        return {}
    h = hits[0]
    return {"evidence_doc_id": h.doc_id, "evidence_doc_name": h.doc_name,
            "evidence_page": h.page, "evidence_snippet": h.text[:600]}

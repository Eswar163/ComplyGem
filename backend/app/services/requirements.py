"""Requirement extraction from tender text.

Two paths behind one interface:
  1. LLM path  — used when COMPLYGEM_LLM_API_KEY is configured.
  2. Heuristic path — deterministic regex/NLP rules tuned to common GeM
     tender eligibility clauses. Always available, so the demo pipeline
     runs with zero external dependencies.

Both produce the same schema:
  {code, title, description, req_type, comparator, threshold_value,
   threshold_unit, evidence_required, source_clause}
"""
import re

from . import llm

LLM_SYSTEM = """You extract machine-checkable eligibility requirements from Indian government (GeM) tender documents.
Return a JSON object {"requirements": [...]} where each item has:
"code" (REQ-001...), "title" (short name), "description", "req_type" (one of: numeric, count, date, document),
"comparator" (>= or <= or == or present), "threshold_value" (number or null), "threshold_unit"
(INR_CRORE, INR_LAKH, years, projects, days or ""), "evidence_required" (list of document names),
"source_clause" (the exact sentence from the tender). Only include requirements that can be verified from
bidder documents (turnover, experience, certifications, registrations). Maximum 12 items."""

# ---------------------------------------------------------------- heuristics

MONEY = r"(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d+)?)"
UNIT_MAP = {"crore": "INR_CRORE", "crores": "INR_CRORE", "cr": "INR_CRORE",
            "lakh": "INR_LAKH", "lakhs": "INR_LAKH", "lacs": "INR_LAKH", "lac": "INR_LAKH"}


def _sentences(text: str) -> list[str]:
    # all-caps lines (section headers, letterheads) act as sentence boundaries
    bounded = []
    for line in text.split("\n"):
        s = line.strip()
        letters = [c for c in s if c.isalpha()]
        if s and len(s) >= 12 and letters and sum(c.isupper() for c in letters) / len(letters) > 0.8:
            bounded.append(". " + s + ". ")
        else:
            bounded.append(" " + s)
    text = re.sub(r"\s+", " ", "".join(bounded))
    # collapse hard line-wraps into one paragraph first, otherwise wrapped
    # clause lines get treated as standalone sentences
    parts = re.split(r"(?<=[.;])\s+(?=[A-Z0-9(])", text)
    return [p.strip() for p in parts if len(p.strip()) > 15]


def _mk(code, title, req_type, comparator, value, unit, evidence, clause, desc=""):
    return {
        "code": code, "title": title, "description": desc or title,
        "req_type": req_type, "comparator": comparator,
        "threshold_value": value, "threshold_unit": unit,
        "evidence_required": evidence, "source_clause": clause,
    }


def _match_money(sentence: str) -> tuple[float, str] | None:
    m = re.search(MONEY + r"\s*(crore|crores|cr|lakh|lakhs|lacs|lac)\b", sentence, re.I)
    if not m:
        return None
    val = float(m.group(1))
    unit = UNIT_MAP[m.group(2).lower()]
    if unit == "INR_LAKH":
        val, unit = val / 100.0, "INR_CRORE"
    return val, unit


def extract_requirements_heuristic(text: str) -> list[dict]:
    # keep currency abbreviations from being treated as sentence ends
    text = text.replace("Rs.", "Rs ").replace("No.", "No ")
    reqs: list[dict] = []
    seen_titles: set[str] = set()

    def add(*args, **kw):
        r = _mk(*args, **kw)
        if r["title"].lower() not in seen_titles:
            seen_titles.add(r["title"].lower())
            reqs.append(r)

    n = 0
    for s in _sentences(text):
        low = s.lower()

        # --- annual turnover threshold -------------------------------------
        if "turnover" in low and _match_money(s):
            val, unit = _match_money(s)
            n += 1
            add(f"REQ-{n:03d}", "Minimum Annual Turnover", "numeric", ">=", val, unit,
                ["Financial Statement", "CA Certificate"], s,
                f"Bidder's annual turnover must be >= ₹{val:g} {unit.replace('INR_', '').title()}")
            continue

        # --- years of experience -------------------------------------------
        m = re.search(r"(minimum|at least|not less than)\s*(?:of\s*)?(\d+)\s*years?\s*(?:of\s*)?(relevant\s+)?experience", low)
        if m:
            n += 1
            add(f"REQ-{n:03d}", "Years of Relevant Experience", "count", ">=", float(m.group(2)), "years",
                ["Experience Certificate", "Work Orders"], s)
            continue

        # --- number of similar projects -------------------------------------
        m = re.search(r"(minimum|at least|not less than)\s*(\d+)\s*(similar\s+)?(projects|work orders|works|assignments)", low)
        if m:
            n += 1
            add(f"REQ-{n:03d}", "Previous Similar Projects", "count", ">=", float(m.group(2)), "projects",
                ["Experience Certificate", "Work Orders", "Completion Certificates"], s)
            continue

        # --- certifications & registrations ---------------------------------
        cert_rules = [
            (r"ISO\s*9001", "ISO 9001 Certification", ["ISO 9001 Certificate"]),
            (r"ISO\s*27001", "ISO 27001 Certification", ["ISO 27001 Certificate"]),
            (r"ISO\s*14001", "ISO 14001 Certification", ["ISO 14001 Certificate"]),
            (r"CE\s+certif", "CE Certification", ["CE Certificate"]),
            (r"gstin|gst\s+registration|registered\s+under\s+gst", "GST Registration", ["GST Registration Certificate"]),
            (r"pan\s+card|permanent\s+account\s+number", "PAN Registration", ["PAN Card"]),
            (r"udyam|msme\s+regist", "MSME / Udyam Registration", ["Udyam Registration Certificate"]),
            (r"oem\s+authori", "OEM Authorization", ["OEM Authorization Certificate"]),
            (r"dpiit|startup\s+india|start-?up\s+recog", "Startup India (DPIIT) Recognition", ["DPIIT Recognition Certificate"]),
            (r"gem\s+regist|registered\s+(seller|vendor)\s+on\s+(the\s+)?gem|registered\s+on\s+(the\s+)?gem", "GeM Seller Registration", ["GeM Registration Proof"]),
            (r"professional\s+tax|pt\s+regist", "Professional Tax Registration", ["Professional Tax Certificate"]),
            (r"labour\s+licen", "Labour License", ["Labour License"]),
        ]
        matched_cert = False
        # exemption-style sentences (e.g. "MSMEs are exempted from EMD") are not bidder requirements
        for pattern, title, evidence in cert_rules:
            if "exempt" in low:
                break
            if re.search(pattern, low, re.I):
                n += 1
                add(f"REQ-{n:03d}", title, "document", "present", None, "", evidence, s)
                matched_cert = True
                break
        if matched_cert:
            continue

        # --- certificate validity -------------------------------------------
        m = re.search(r"(certificat\w*|licen\w*|accreditation)[^.]{0,80}?valid(?:ity)?[^.]{0,60}?(?:till|upto|up to|until|through)?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}-\d{2}-\d{2})", low)
        if m:
            n += 1
            add(f"REQ-{n:03d}", "Certificate Validity", "date", ">=", None, "date",
                ["Relevant Certificate"], s)
            continue

        # --- generic "shall submit <document>" ------------------------------
        m = re.search(
            r"(?:shall|must|should|has to|required to)\s+(?:submit|furnish|provide|produce|upload)\s+"
            r"[^.]{0,90}?\b(certificate|certification|statement|declaration|authorization|authorisation|licen[cs]e|registration|affidavit|proof)\b", low)
        if m and "turnover" not in low:
            doc_word = m.group(1)
            n += 1
            add(f"REQ-{n:03d}", f"Required Document ({doc_word.title()})", "document", "present",
                None, "", [doc_word.title()], s)
            continue

    # renumber sequentially so codes have no gaps
    for i, r in enumerate(reqs, 1):
        r["code"] = f"REQ-{i:03d}"
    return reqs[:12]


def extract_requirements(text: str) -> tuple[list[dict], str]:
    """Returns (requirements, engine) where engine is 'llm' or 'heuristic'."""
    if llm.CONFIGURED and len(text) > 200:
        data = llm.chat_json(LLM_SYSTEM, text[:12000])
        if data and isinstance(data, dict) and data.get("requirements"):
            reqs = []
            for i, r in enumerate(data["requirements"][:12], 1):
                reqs.append({
                    "code": r.get("code") or f"REQ-{i:03d}",
                    "title": str(r.get("title", f"Requirement {i}"))[:250],
                    "description": str(r.get("description", ""))[:2000],
                    "req_type": r.get("req_type") if r.get("req_type") in ("numeric", "count", "date", "document") else "document",
                    "comparator": r.get("comparator") if r.get("comparator") in (">=", "<=", "==", "present") else "present",
                    "threshold_value": r.get("threshold_value") if isinstance(r.get("threshold_value"), (int, float)) else None,
                    "threshold_unit": str(r.get("threshold_unit") or ""),
                    "evidence_required": [str(e) for e in (r.get("evidence_required") or [])][:6],
                    "source_clause": str(r.get("source_clause", ""))[:2000],
                })
            return reqs, "llm"
    return extract_requirements_heuristic(text), "heuristic"

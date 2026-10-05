"""End-to-end analysis pipeline:

  bidder documents → chunk → TF-IDF retrieve per requirement
                   → external verification (GST/PAN)
                   → deterministic rule engine
                   → scored analysis + audit trail
"""
from datetime import datetime

from sqlalchemy.orm import Session

from . import models
from .services import rule_engine, verification
from .services.rag import TfidfIndex


def log(db: Session, analysis_id, tender_id, event, detail=""):
    db.add(models.AuditEvent(analysis_id=analysis_id, tender_id=tender_id,
                             event=event, detail=detail, ts=datetime.utcnow()))


def analyze(db: Session, tender: models.Tender, bidder: models.Bidder) -> models.Analysis:
    bid_docs = [d for d in bidder.documents if d.role == "BID"]

    analysis = models.Analysis(tender_id=tender.id, bidder_id=bidder.id, status="RUNNING")
    db.add(analysis)
    db.flush()
    log(db, analysis.id, tender.id, "ANALYSIS_STARTED", f"{len(bid_docs)} bid documents from {bidder.name}")

    # ---- index all bid-document chunks for this bidder ---------------------
    chunks = []
    for d in bid_docs:
        for c in d.chunks:
            chunks.append({"doc_id": d.id, "doc_name": d.filename, "page": c.page, "idx": c.idx, "text": c.text})
    index = TfidfIndex(chunks)
    log(db, analysis.id, tender.id, "EVIDENCE_INDEXED", f"{len(chunks)} text chunks indexed")

    # ---- external verification (mock service) ------------------------------
    ids = verification.find_identifiers([d.text for d in bid_docs])
    bidder.gstin = ids.get("gstin") or bidder.gstin
    bidder.pan = ids.get("pan") or bidder.pan
    for kind, ref, fn in (("GST", bidder.gstin, verification.verify_gst), ("PAN", bidder.pan, verification.verify_pan)):
        if ref:
            res = fn(ref, bidder.name) if kind == "GST" else fn(ref)
            db.add(models.VerificationResult(analysis_id=analysis.id, kind=kind, reference=ref,
                                             status=res["status"], legal_name=res.get("legal_name", ""),
                                             detail=res.get("detail", {})))
    log(db, analysis.id, tender.id, "VERIFICATION_COMPLETED",
        f"GSTIN={bidder.gstin or 'not found'} PAN={bidder.pan or 'not found'}")

    # ---- evaluate each requirement -----------------------------------------
    for req in tender.requirements:
        query = " ".join([req.title, req.description, *req.evidence_required])
        hits = index.search(query, k=5)
        verdict = rule_engine.evaluate(req, hits, gstin=bidder.gstin)
        db.add(models.ComplianceResult(
            analysis_id=analysis.id, requirement_id=req.id,
            status=verdict["status"], reason=verdict["reason"],
            extracted_value=verdict.get("extracted_value", ""),
            rule_text=verdict.get("rule_text", ""),
            explanation=verdict.get("explanation", ""),
            recommendation=verdict.get("recommendation", ""),
            evidence_doc_id=verdict.get("evidence_doc_id"),
            evidence_doc_name=verdict.get("evidence_doc_name", ""),
            evidence_page=verdict.get("evidence_page", 0),
            evidence_snippet=verdict.get("evidence_snippet", ""),
            score=verdict.get("score", 0.0),
        ))

    db.flush()
    results = db.query(models.ComplianceResult).filter(models.ComplianceResult.analysis_id == analysis.id).all()
    n_ok = sum(1 for r in results if r.status == rule_engine.COMPLIANT)
    n_rev = sum(1 for r in results if r.status == rule_engine.REVIEW)
    n_fail = sum(1 for r in results if r.status == rule_engine.NON_COMPLIANT)
    total = max(len(results), 1)
    score = (n_ok + 0.5 * n_rev) / total * 100
    verdict = "GOOD" if score >= 85 else "REVIEW" if score >= 60 else "RISK"

    analysis.status = "DONE"
    analysis.score = round(score, 1)
    analysis.verdict = verdict
    analysis.n_compliant, analysis.n_review, analysis.n_non_compliant = n_ok, n_rev, n_fail

    log(db, analysis.id, tender.id, "COMPLIANCE_RULES_EXECUTED",
        f"{len(results)} requirements evaluated: {n_ok} compliant, {n_rev} review, {n_fail} non-compliant")
    log(db, analysis.id, tender.id, "ANALYSIS_COMPLETED", f"Score {analysis.score}% — {verdict}")
    return analysis

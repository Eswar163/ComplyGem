"""ComplyGeM API — FastAPI application."""
import re
from datetime import datetime

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

from .database import Base, engine, get_db
from .models import Analysis, AuditEvent, Bidder, Chunk, ComplianceResult, Document, Requirement, Tender, VerificationResult
from .pipeline import analyze, log
from .services import pdf_extract, verification
from .services.requirements import extract_requirements

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ComplyGeM API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"


# --------------------------------------------------------------- helpers

DOC_TYPE_RULES = [
    (("iso",), "ISO Certificate"),
    (("financial", "turnover", "balance", "statement"), "Financial Statement"),
    (("gst",), "GST Certificate"),
    (("experience", "work-order", "work_order", "workorder", "completion"), "Experience Certificate"),
    (("registration", "incorporation", "company"), "Registration Certificate"),
    (("pan",), "PAN Card"),
    (("udyam", "msme"), "Udyam Registration"),
    (("oem",), "OEM Authorization"),
]


def detect_doc_type(filename: str, text: str) -> str:
    hay = (filename + " " + text[:3000]).lower()
    for keys, label in DOC_TYPE_RULES:
        if any(k in hay for k in keys):
            return label
    return "Supporting Document"


# --------------------------------------------------------------- tenders

@app.post("/api/tenders")
def create_tender(
    file: UploadFile = File(...),
    title: str = Form(...),
    ref_no: str = Form(""),
    department: str = Form(""),
):
    data = file.file.read()
    extracted = pdf_extract.extract_pdf(data)
    if not extracted["text"]:
        raise HTTPException(422, "No text could be extracted from this PDF (scanned file? OCR stage required).")

    reqs, engine_name = extract_requirements(extracted["text"])
    m = re.search(r"GeM/\d{4}/[A-Z]/[A-Za-z0-9\-]+|\bGEM/\d{4}/\S+", extracted["text"])
    with next(get_db()) as db:
        tender = Tender(title=title, ref_no=ref_no or (m.group(0) if m else ""),
                        category="", department=department, status="READY")
        db.add(tender)
        db.flush()
        doc = Document(tender_id=tender.id, role="TENDER", doc_type="Tender Document",
                       filename=file.filename, page_count=extracted["page_count"],
                       char_count=len(extracted["text"]), ocr_needed=extracted["ocr_needed"],
                       text=extracted["text"])
        db.add(doc)
        for r in reqs:
            db.add(Requirement(tender_id=tender.id, **r))
        log(db, None, tender.id, "TENDER_UPLOADED", f"{file.filename} — {extracted['page_count']} pages")
        log(db, None, tender.id, "REQUIREMENTS_EXTRACTED",
            f"{len(reqs)} requirements identified (engine: {engine_name})")
        db.commit()
        return tender_payload(db, tender)


@app.get("/api/tenders")
def list_tenders():
    with next(get_db()) as db:
        out = []
        for t in db.query(Tender).order_by(Tender.created_at.desc()).all():
            done = [a for a in t.analyses if a.status == "DONE"]
            best = max(done, key=lambda a: a.score) if done else None
            last = max(done, key=lambda a: a.created_at) if done else None
            out.append({"id": t.id, "title": t.title, "ref_no": t.ref_no, "status": t.status,
                        "created_at": t.created_at.isoformat(),
                        "n_requirements": len(t.requirements),
                        "n_bidders": len({d.bidder_id for d in t.documents if d.bidder_id}),
                        "n_documents": len(t.documents),
                        "latest_score": best.score if best else None,
                        "latest_verdict": best.verdict if best else "",
                        "last_analysed": last.created_at.isoformat() if last else None})
        return out


def tender_payload(db, t: Tender) -> dict:
    return {
        "id": t.id, "title": t.title, "ref_no": t.ref_no, "department": t.department,
        "status": t.status, "created_at": t.created_at.isoformat(),
        "requirements": [{"id": r.id, "code": r.code, "title": r.title, "description": r.description,
                          "req_type": r.req_type, "comparator": r.comparator,
                          "threshold_value": r.threshold_value, "threshold_unit": r.threshold_unit,
                          "evidence_required": r.evidence_required, "source_clause": r.source_clause}
                         for r in t.requirements],
        "documents": [{"id": d.id, "role": d.role, "doc_type": d.doc_type, "filename": d.filename,
                       "page_count": d.page_count, "char_count": d.char_count, "ocr_needed": d.ocr_needed,
                       "bidder_id": d.bidder_id} for d in t.documents],
        "bidders": [{"id": b.id, "name": b.name, "gstin": b.gstin, "pan": b.pan}
                    for b in db.query(Bidder).all()],
        "analyses": [{"id": a.id, "bidder_id": a.bidder_id, "bidder_name": a.bidder.name, "status": a.status,
                      "score": a.score, "verdict": a.verdict, "n_compliant": a.n_compliant,
                      "n_review": a.n_review, "n_non_compliant": a.n_non_compliant,
                      "created_at": a.created_at.isoformat()} for a in t.analyses],
    }


@app.get("/api/tenders/{tender_id}")
def get_tender(tender_id: int):
    with next(get_db()) as db:
        t = db.get(Tender, tender_id)
        if not t:
            raise HTTPException(404, "Tender not found")
        return tender_payload(db, t)


@app.delete("/api/tenders/{tender_id}")
def delete_tender(tender_id: int):
    with next(get_db()) as db:
        t = db.get(Tender, tender_id)
        if not t:
            raise HTTPException(404, "Tender not found")
        db.delete(t)
        db.commit()
        return {"ok": True}


# --------------------------------------------------------------- bidders & documents

@app.post("/api/tenders/{tender_id}/bidders")
def create_bidder(tender_id: int, name: str = Form(...)):
    with next(get_db()) as db:
        t = db.get(Tender, tender_id)
        if not t:
            raise HTTPException(404, "Tender not found")
        b = Bidder(name=name)
        db.add(b)
        db.commit()
        return {"id": b.id, "name": b.name, "gstin": "", "pan": ""}


@app.post("/api/tenders/{tender_id}/documents")
def upload_documents(
    tender_id: int,
    files: list[UploadFile] = File(...),
    bidder_name: str = Form("Unnamed Bidder"),
):
    with next(get_db()) as db:
        t = db.get(Tender, tender_id)
        if not t:
            raise HTTPException(404, "Tender not found")
        b = Bidder(name=bidder_name)
        db.add(b)
        db.flush()
        log(db, None, tender_id, "BID_UPLOAD", f"Bidder '{bidder_name}' submitted {len(files)} documents")
        added = []
        for f in files:
            data = f.file.read()
            try:
                extracted = pdf_extract.extract_pdf(data)
            except Exception:
                raise HTTPException(422, f"'{f.filename}' could not be read as a PDF.")
            doc = Document(tender_id=tender_id, bidder_id=b.id, role="BID",
                           doc_type=detect_doc_type(f.filename or "", extracted["text"]),
                           filename=f.filename or "document.pdf",
                           page_count=extracted["page_count"], char_count=len(extracted["text"]),
                           ocr_needed=extracted["ocr_needed"], text=extracted["text"])
            db.add(doc)
            db.flush()
            for c in pdf_chunks(extracted, doc.id):
                db.add(Chunk(document_id=doc.id, **c))
            added.append({"id": doc.id, "doc_type": doc.doc_type, "filename": doc.filename,
                          "page_count": doc.page_count, "char_count": doc.char_count,
                          "ocr_needed": doc.ocr_needed})
        db.commit()
        return {"bidder_id": b.id, "documents": added}


def pdf_chunks(extracted: dict, document_id: int) -> list[dict]:
    from .services.rag import chunk_pages
    return chunk_pages(extracted["pages"])


# --------------------------------------------------------------- analysis

@app.post("/api/tenders/{tender_id}/analyze")
def run_analysis(tender_id: int, bidder_id: int = Form(...)):
    with next(get_db()) as db:
        t = db.get(Tender, tender_id)
        b = db.get(Bidder, bidder_id)
        if not t or not b:
            raise HTTPException(404, "Tender or bidder not found")
        if not any(d.bidder_id == bidder_id and d.role == "BID" for d in t.documents):
            raise HTTPException(422, "This bidder has no documents uploaded yet.")
        a = analyze(db, t, b)
        t.status = "ANALYZED"
        db.commit()
        return analysis_payload(db, a)


def analysis_payload(db, a: Analysis) -> dict:
    reqs = {r.id: r for r in a.tender.requirements}
    return {
        "id": a.id, "tender_id": a.tender_id, "tender_title": a.tender.title,
        "tender_ref": a.tender.ref_no,
        "bidder_id": a.bidder_id, "bidder_name": a.bidder.name,
        "n_documents": len([d for d in a.bidder.documents if d.role == "BID"]),
        "status": a.status, "score": a.score, "verdict": a.verdict,
        "n_compliant": a.n_compliant, "n_review": a.n_review,
        "n_non_compliant": a.n_non_compliant, "created_at": a.created_at.isoformat(),
        "results": [{
            "id": r.id,
            "requirement_code": reqs[r.requirement_id].code,
            "requirement_title": reqs[r.requirement_id].title,
            "requirement_desc": reqs[r.requirement_id].description,
            "req_type": reqs[r.requirement_id].req_type,
            "evidence_required": reqs[r.requirement_id].evidence_required,
            "source_clause": reqs[r.requirement_id].source_clause,
            "threshold_value": reqs[r.requirement_id].threshold_value,
            "threshold_unit": reqs[r.requirement_id].threshold_unit,
            "comparator": reqs[r.requirement_id].comparator,
            "status": r.status, "reason": r.reason,
            "extracted_value": r.extracted_value, "rule_text": r.rule_text,
            "explanation": r.explanation, "recommendation": r.recommendation,
            "evidence_doc_name": r.evidence_doc_name, "evidence_page": r.evidence_page,
            "evidence_snippet": r.evidence_snippet, "score": r.score,
        } for r in a.results],
        "verifications": [{"kind": v.kind, "reference": v.reference, "status": v.status,
                           "legal_name": v.legal_name, "detail": v.detail}
                          for v in db.query(VerificationResult).filter(VerificationResult.analysis_id == a.id).all()],
        "audit": [{"ts": e.ts.isoformat(), "event": e.event, "detail": e.detail}
                  for e in db.query(AuditEvent).filter(AuditEvent.analysis_id == a.id).order_by(AuditEvent.id).all()],
    }


@app.get("/api/analyses/{analysis_id}")
def get_analysis(analysis_id: int):
    with next(get_db()) as db:
        a = db.get(Analysis, analysis_id)
        if not a:
            raise HTTPException(404, "Analysis not found")
        return analysis_payload(db, a)


@app.get("/api/analyses/{analysis_id}/report")
def get_report(analysis_id: int):
    """Structured compliance report (consumed by the printable report view)."""
    with next(get_db()) as db:
        a = db.get(Analysis, analysis_id)
        if not a:
            raise HTTPException(404, "Analysis not found")
        p = analysis_payload(db, a)
        return {
            "report_id": f"CGM-RPT-{a.id:05d}",
            "generated_at": datetime.utcnow().isoformat(),
            "tender": {"title": a.tender.title, "ref_no": a.tender.ref_no, "department": a.tender.department},
            "bidder": {"name": a.bidder.name, "gstin": a.bidder.gstin, "pan": a.bidder.pan},
            "summary": {"score": a.score, "verdict": a.verdict, "n_compliant": a.n_compliant,
                        "n_review": a.n_review, "n_non_compliant": a.n_non_compliant,
                        "recommendation": ("Recommended for further evaluation." if a.verdict == "GOOD"
                                           else "Requires officer review before acceptance." if a.verdict == "REVIEW"
                                           else "Significant compliance gaps — not recommended without clarifications.")},
            "results": p["results"],
            "verifications": p["verifications"],
        }


@app.get("/api/tenders/{tender_id}/audit")
def tender_audit(tender_id: int):
    with next(get_db()) as db:
        events = db.query(AuditEvent).filter(
            (AuditEvent.tender_id == tender_id) | (AuditEvent.tender_id.is_(None))
        ).order_by(AuditEvent.id).all()
        return [{"ts": e.ts.isoformat(), "event": e.event, "detail": e.detail} for e in events]


# --------------------------------------------------------------- verification service

@app.post("/api/verify/gst")
def api_verify_gst(gstin: str = Form(...), bidder_name: str = Form("")):
    return verification.verify_gst(gstin.strip().upper(), bidder_name)


@app.post("/api/verify/pan")
def api_verify_pan(pan: str = Form(...)):
    return verification.verify_pan(pan.strip().upper())


# --------------------------------------------------------------- aggregate views (read-only additions)

@app.get("/api/stats")
def global_stats():
    with next(get_db()) as db:
        tenders = db.query(Tender).all()
        done = [a for a in db.query(Analysis).all() if a.status == "DONE"]
        done_ids = {a.id for a in done}
        results = [r for r in db.query(ComplianceResult).all() if r.analysis_id in done_ids]
        return {
            "tenders": len(tenders),
            "bids_analysed": len(done),
            "requirements": len(db.query(Requirement).all()),
            "documents": db.query(Document).count(),
            "compliant": sum(a.n_compliant for a in done),
            "review": sum(a.n_review for a in done),
            "non_compliant": sum(a.n_non_compliant for a in done),
            "evidence_found": sum(1 for r in results if r.evidence_doc_id),
            "evidence_total": len(results),
        }


@app.get("/api/analyses")
def list_analyses():
    with next(get_db()) as db:
        out = []
        for a in db.query(Analysis).filter(Analysis.status == "DONE").order_by(Analysis.created_at.desc()).all():
            out.append({"id": a.id, "tender_id": a.tender_id, "tender_title": a.tender.title,
                        "tender_ref": a.tender.ref_no, "bidder_name": a.bidder.name,
                        "score": a.score, "verdict": a.verdict,
                        "n_compliant": a.n_compliant, "n_review": a.n_review,
                        "n_non_compliant": a.n_non_compliant,
                        "created_at": a.created_at.isoformat()})
        return out


@app.get("/api/documents")
def list_documents():
    with next(get_db()) as db:
        out = []
        for d in db.query(Document).order_by(Document.created_at.desc()).all():
            out.append({"id": d.id, "role": d.role, "doc_type": d.doc_type, "filename": d.filename,
                        "page_count": d.page_count, "char_count": d.char_count, "ocr_needed": d.ocr_needed,
                        "tender_id": d.tender_id, "tender_title": d.tender.title if d.tender else None,
                        "bidder_name": d.bidder.name if d.bidder else None,
                        "created_at": d.created_at.isoformat()})
        return out


@app.get("/api/audit")
def global_audit(limit: int = 200):
    with next(get_db()) as db:
        events = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(min(limit, 500)).all()
        return [{"id": e.id, "ts": e.ts.isoformat(), "event": e.event, "detail": e.detail,
                 "tender_id": e.tender_id,
                 "tender_title": e.analysis.tender.title if e.analysis else None}
                for e in events]


# --------------------------------------------------------------- frontend

@app.get("/favicon.ico")
def favicon():
    return FileResponse(FRONTEND_DIR / "favicon.svg", media_type="image/svg+xml")


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

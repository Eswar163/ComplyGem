from datetime import datetime, date

from sqlalchemy import String, Text, Integer, Float, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Tender(Base):
    __tablename__ = "tenders"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    ref_no: Mapped[str] = mapped_column(String(100), default="")
    category: Mapped[str] = mapped_column(String(100), default="")
    department: Mapped[str] = mapped_column(String(255), default="")
    bid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")  # DRAFT | READY | ANALYZED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    requirements: Mapped[list["Requirement"]] = relationship(back_populates="tender", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="tender", cascade="all, delete-orphan")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="tender", cascade="all, delete-orphan")


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"))
    code: Mapped[str] = mapped_column(String(20))  # REQ-001
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    # numeric | count | date | document | boolean
    req_type: Mapped[str] = mapped_column(String(20), default="document")
    comparator: Mapped[str] = mapped_column(String(10), default=">=")  # >=, <=, ==, present
    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_unit: Mapped[str] = mapped_column(String(20), default="")  # INR_CRORE, INR_LAKH, years, projects, date
    evidence_required: Mapped[list] = mapped_column(JSON, default=list)
    source_clause: Mapped[str] = mapped_column(Text, default="")

    tender: Mapped["Tender"] = relationship(back_populates="requirements")


class Bidder(Base):
    __tablename__ = "bidders"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    gstin: Mapped[str] = mapped_column(String(20), default="")
    pan: Mapped[str] = mapped_column(String(20), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    documents: Mapped[list["Document"]] = relationship(back_populates="bidder", cascade="all, delete-orphan")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="bidder", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    tender_id: Mapped[int | None] = mapped_column(ForeignKey("tenders.id"), nullable=True)
    bidder_id: Mapped[int | None] = mapped_column(ForeignKey("bidders.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="BID")  # TENDER | BID
    doc_type: Mapped[str] = mapped_column(String(60), default="UNKNOWN")
    filename: Mapped[str] = mapped_column(String(255))
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    char_count: Mapped[int] = mapped_column(Integer, default=0)
    ocr_needed: Mapped[bool] = mapped_column(default=False)
    text: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tender: Mapped["Tender"] = relationship(back_populates="documents")
    bidder: Mapped["Bidder"] = relationship(back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    page: Mapped[int] = mapped_column(Integer, default=1)
    idx: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)

    document: Mapped["Document"] = relationship(back_populates="chunks")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"))
    bidder_id: Mapped[int] = mapped_column(ForeignKey("bidders.id"))
    status: Mapped[str] = mapped_column(String(20), default="RUNNING")  # RUNNING | DONE
    score: Mapped[float] = mapped_column(Float, default=0.0)  # percent compliant
    verdict: Mapped[str] = mapped_column(String(30), default="")  # GOOD | REVIEW | RISK
    n_compliant: Mapped[int] = mapped_column(Integer, default=0)
    n_review: Mapped[int] = mapped_column(Integer, default=0)
    n_non_compliant: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tender: Mapped["Tender"] = relationship(back_populates="analyses")
    bidder: Mapped["Bidder"] = relationship(back_populates="analyses")
    results: Mapped[list["ComplianceResult"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")
    events: Mapped[list["AuditEvent"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")


class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"))
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id"))
    status: Mapped[str] = mapped_column(String(30))  # COMPLIANT | NON_COMPLIANT | REVIEW_REQUIRED
    reason: Mapped[str] = mapped_column(String(40), default="")  # VALUE_PASS, VALUE_FAIL, DOC_FOUND, DOC_MISSING, NEEDS_HUMAN, NO_EVIDENCE
    extracted_value: Mapped[str] = mapped_column(String(255), default="")
    rule_text: Mapped[str] = mapped_column(String(255), default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    recommendation: Mapped[str] = mapped_column(Text, default="")
    evidence_doc_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    evidence_doc_name: Mapped[str] = mapped_column(String(255), default="")
    evidence_page: Mapped[int] = mapped_column(Integer, default=0)
    evidence_snippet: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[float] = mapped_column(Float, default=0.0)

    analysis: Mapped["Analysis"] = relationship(back_populates="results")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int | None] = mapped_column(ForeignKey("analyses.id"), nullable=True)
    tender_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    event: Mapped[str] = mapped_column(String(80))
    detail: Mapped[str] = mapped_column(Text, default="")

    analysis: Mapped["Analysis"] = relationship(back_populates="events")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    kind: Mapped[str] = mapped_column(String(20))  # GST | PAN
    reference: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20))  # VERIFIED | NOT_FOUND | PENDING
    legal_name: Mapped[str] = mapped_column(String(255), default="")
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

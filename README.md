# ComplyGem

<div align="center">

# ComplyGeM

**AI-Assisted Bid Compliance Verification for Public Procurement**

Turn a tender document and a stack of bidder submissions into an explainable, evidence-backed compliance report, with every decision traced to a document, a page, and a rule.

![Status](https://img.shields.io/badge/status-prototype-orange)
![Python](https://img.shields.io/badge/python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React-61DAFB)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%20%2B%20pgvector-336791)

</div>

> [!NOTE]
> ComplyGeM is a **decision-support** prototype. It organises evidence, runs the checks that can be calculated, and flags risks. **The final decision always stays with the procurement officer.**

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Core Modules](#core-modules)
  - [1. Tender Upload](#1-tender-upload)
  - [2. Document Processing](#2-document-processing)
  - [3. Requirement Extraction](#3-requirement-extraction)
  - [4. Bidder Document Upload](#4-bidder-document-upload)
  - [5. Evidence Extraction](#5-evidence-extraction)
  - [6. Compliance Engine](#6-compliance-engine)
  - [7. Rule Engine](#7-rule-engine)
  - [8. RAG / AI Layer](#8-rag--ai-layer)
  - [9. Risk & Review Module](#9-risk--review-module)
  - [10. Dashboard & Evidence Viewer](#10-dashboard--evidence-viewer)
- [User Workflow](#user-workflow)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Design Principles](#design-principles)
- [Security & Privacy](#security--privacy)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Glossary](#glossary)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem

To evaluate one bid, an officer checks dozens of eligibility clauses against hundreds of pages of certificates, financial statements and declarations. Done by hand, this work is:

| Pain point | Impact |
|---|---|
| **Slow** | One bidder can take hours to verify, and a large tender can have many bidders. |
| **Inconsistent** | Two evaluators may read the same clause differently. |
| **Hard to audit** | Decisions are often recorded as a final label, with no reference to the supporting page. |
| **Error-prone** | Expired certificates, mismatched company names or a wrong turnover average can go unnoticed. |

## The Solution

ComplyGeM automates the repetitive work (reading, extracting, matching and calculating) and leaves the judgement to the officer.

It does not return a single verdict such as *"Bidder is compliant."* Instead, it records a **traceability chain** for every requirement:

| Step | Example: `REQ-001` |
|---|---|
| **Requirement** | Minimum average annual turnover of ₹50 lakh over the previous 3 financial years |
| **Evidence** | `Financial_Statement.pdf`, page 17 |
| **Extracted information** | FY 21-22: ₹68 L · FY 22-23: ₹72 L · FY 23-24: ₹76 L → **average ₹72 L** |
| **Validation rule** | `average_turnover >= required_turnover` → ₹72 L ≥ ₹50 L |
| **Compliance status** | ✅ **COMPLIANT** |
| **Explanation** | "The bidder's 3-year average turnover (₹72 lakh) exceeds the ₹50 lakh threshold in Clause 4.2(a)." |
| **Officer review** | The officer accepts or overrides the finding, and the remarks are logged in the audit trail |

---

## Key Features

| Feature | Description |
|---|---|
| **Document ingestion** | Handles native and scanned PDFs. Any page without a usable text layer is sent to OCR automatically. |
| **Structured requirement extraction** | Converts free-text tender clauses into machine-readable requirements: category, operator, threshold, period and accepted evidence types. |
| **Evidence discovery** | Finds supporting evidence across all bidder files and records the document, page, extracted value and confidence score. |
| **Hybrid compliance engine** | Numeric and date checks use **deterministic rules**. RAG + LLM is used only for clauses that need contextual understanding. |
| **Explainable findings** | Each status comes with its evidence, the rule applied and a plain-language explanation. |
| **Risk detection** | Flags expired certificates, company name or GSTIN mismatches, missing mandatory documents and financials that cannot be verified. |
| **Human-in-the-loop review** | A review queue where officers accept, override or annotate each finding. |
| **Officer dashboard** | Status summary, per-requirement drill-down and an evidence viewer with a page preview. |
| **Audit trail** | Logs every automated result and every human override. |

---

## How It Works

```mermaid
flowchart TD
    O([Procurement Officer]) --> T[Upload Tender PDF]
    T --> P[Document Processing<br/>Text extraction / OCR]
    P --> R[Extract Requirements]
    R --> B[Upload Bidder Files]
    B --> E[Extract Evidence]
    E --> M[Match Requirements with Evidence]
    M --> RE["Rule Engine<br/>numeric and date checks"]
    M --> AI["RAG / LLM<br/>contextual clauses"]
    RE --> CA[Compliance Analysis]
    AI --> CA
    CA --> S1["✅ Compliant"]
    CA --> S2["❌ Non-Compliant"]
    CA --> S3["⚠️ Review Required"]
    CA --> S4["❓ Missing Evidence"]
    S1 & S2 & S3 & S4 --> D[Officer Dashboard]
    D --> V[Evidence Review]
    V --> F([Final Human Decision])
```

| # | Stage | What happens | Output |
|---|---|---|---|
| 1 | Tender upload | Officer uploads the tender PDF | Stored file + processing task |
| 2 | Document processing | Text extraction, with OCR for scanned pages | Clean text for each page |
| 3 | Requirement extraction | Clauses are parsed into structured requirements | `REQ-001 … REQ-n` |
| 4 | Bidder upload | Officer uploads the bidder's documents | Classified bidder files |
| 5 | Evidence extraction | Each requirement's evidence is searched for across the bidder files | Evidence records (doc, page, value, confidence) |
| 6 | Matching & analysis | The rule engine or the AI layer evaluates each requirement | Findings with status and risk |
| 7 | Review | Officer inspects evidence and confirms or overrides | Verified, auditable decision |

---

## System Architecture

```mermaid
flowchart TB
    UI["React Frontend<br/>Upload · Dashboard · Review"]
    API["FastAPI Backend<br/>REST APIs · Orchestration · Auth"]
    DOC["Document Processing<br/>PDF parsing · OCR · Text cleaning"]
    AI["AI Processing<br/>NLP · Embeddings · LLM / RAG"]
    RULE["Compliance & Rule Engine<br/>Match · Validate · Classify"]
    DB[("PostgreSQL + pgvector")]
    FS[("File Storage")]

    UI <--> API
    API --> DOC --> AI --> RULE
    DOC --> FS
    API <--> DB
    AI <--> DB
    RULE --> DB
```

| Layer | Responsibility |
|---|---|
| **React Frontend** | Login, tender and bidder uploads, processing progress, requirements table, compliance dashboard, evidence viewer, review queue |
| **FastAPI Backend** | REST API, authentication, file handling, background task orchestration, business logic |
| **Document Processing** | Detects native or scanned pages, extracts text and tables, runs OCR, normalises text and numbers |
| **AI Processing** | Requirement extraction, document classification, chunking, embeddings, retrieval, LLM explanations |
| **Compliance & Rule Engine** | Deterministic validation (thresholds, dates, identity matches), status classification, risk flagging |
| **PostgreSQL + pgvector** | Relational data (tenders, requirements, findings) and vector embeddings in one database |

---

## Tech Stack

> These are the recommended choices for the prototype. Each layer can be swapped for an alternative.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (Vite), React Router, Axios | SPA, routing, API calls |
| PDF preview | `react-pdf` / PDF.js | Shows the evidence page, highlighted, in the viewer |
| Backend | FastAPI, Pydantic, SQLAlchemy, Alembic | API, validation, ORM, migrations |
| Background jobs | FastAPI `BackgroundTasks` (prototype) → Celery + Redis (scale) | Asynchronous document processing |
| PDF text | PyMuPDF / pdfplumber | Text and table extraction from native PDFs |
| OCR | Tesseract (`pytesseract`) + OpenCV preprocessing | Text from scanned pages |
| Embeddings | `sentence-transformers` | Semantic search over document chunks |
| Vector store | `pgvector` (PostgreSQL extension) | Similarity search without a separate vector DB |
| LLM | Configurable provider (hosted API or self-hosted model) | Requirement parsing, contextual evaluation, explanations |
| Database | PostgreSQL 15+ | Persistent storage |
| Auth | JWT (OAuth2 password flow) | Officer login and role-based access |

---

## Core Modules

### 1. Tender Upload

The officer uploads a tender PDF such as `Tender_ABC.pdf`:

```http
POST /api/tenders/{tender_id}/upload
Content-Type: multipart/form-data
```

The file is saved under a random name, its SHA-256 checksum is recorded to show whether it has been altered, and a **processing task** is created. The UI polls the task and shows progress:

```text
✓ Document uploaded
⟳ Processing document...
⟳ Extracting requirements...
✓ 20 requirements extracted
```

```mermaid
sequenceDiagram
    actor Officer
    participant UI as React UI
    participant API as FastAPI
    participant W as Background Worker
    participant DB as PostgreSQL

    Officer->>UI: Select Tender_ABC.pdf
    UI->>API: POST /api/tenders/{id}/upload
    API->>DB: Save document record (status = UPLOADED)
    API->>W: Enqueue processing task
    API-->>UI: 202 Accepted with task_id
    loop Every few seconds
        UI->>API: GET /api/tasks/{task_id}
        API-->>UI: PROCESSING → EXTRACTING → COMPLETED
    end
    W->>DB: Store page text, chunks and embeddings
    W->>DB: Store extracted requirements
    UI->>API: GET /api/tenders/{id}/requirements
    API-->>UI: Structured requirements
```

**Task states:** `UPLOADED → PROCESSING → EXTRACTING → COMPLETED` (or `FAILED` with an error message)

---

### 2. Document Processing

Each **page** is routed separately, so PDFs that mix native and scanned pages are handled correctly:

```mermaid
flowchart LR
    P[PDF page] --> Q{"Text layer has<br/>enough characters?"}
    Q -- Yes --> N["Native extraction<br/>PyMuPDF / pdfplumber"]
    Q -- No --> S["Preprocess<br/>deskew · denoise · binarise"] --> OCR[Tesseract OCR]
    N --> C["Clean & normalise"]
    OCR --> C
    C --> O[("Page text + metadata")]
```

**The cleaning and normalisation step:**
- Removes repeated headers, footers and page numbers
- Rebuilds tables where possible, since financial statements are usually tabular
- Converts Indian currency formats to numbers: `₹72,00,000`, `72 lakh`, `0.72 crore` and `Rs. 72 Lacs` all become `7200000`
- Standardises dates (`31/03/2025`, `31-Mar-2025` → `2025-03-31`)

**Output for each page:**

```json
{
  "document_id": "DOC-007",
  "page": 17,
  "source": "ocr",
  "ocr_confidence": 0.91,
  "text": "Average turnover for FY 2021-22 to 2023-24 ... ₹72,00,000"
}
```

---

### 3. Requirement Extraction

The AI layer finds eligibility clauses in the tender and converts each one into a structured, machine-checkable requirement.

**Original clause (Clause 4.2(a)):**
> Bidder shall have a minimum average annual turnover of ₹50 lakh during the previous three financial years.

**Structured requirement:**

```json
{
  "requirement_id": "REQ-001",
  "category": "Financial Eligibility",
  "condition": "Minimum Average Annual Turnover",
  "operator": ">=",
  "required_value": 5000000,
  "unit": "INR",
  "period": "Previous 3 financial years",
  "aggregation": "average",
  "evidence_types": ["Audited Financial Statement", "CA Certificate"],
  "mandatory": true,
  "evaluation_mode": "rule",
  "source": { "document": "Tender_ABC.pdf", "page": 12, "clause": "4.2(a)" }
}
```

`evaluation_mode` decides which engine evaluates the requirement: `rule` for anything that can be calculated, `ai` for anything that needs interpretation.

**Typical requirement categories:**

| Category | Examples | Usual evaluation |
|---|---|---|
| Financial Eligibility | Average turnover, net worth, solvency | `rule` |
| Technical Experience | Similar work completed, value of past orders | `rule` + `ai` |
| Statutory Registration | GST registration, PAN, company incorporation | `rule` (presence + validity) |
| Certifications | ISO certificates, MSME / Udyam registration | `rule` (presence + expiry) |
| Legal Declarations | Non-blacklisting affidavit, integrity pact | `ai` (content check) |
| Bid Security | EMD / bid security, or exemption proof | `rule` |
| Technical Compliance | Compliance with specifications, deviations | `ai` |

---

### 4. Bidder Document Upload

The officer uploads the bidder's submission:

```text
Bidder/
├── GST_Certificate.pdf
├── Financial_Statement.pdf
├── Experience_Certificate.pdf
├── MSME_Certificate.pdf
└── Technical_Compliance.pdf
```

These files go through the **same processing pipeline** as the tender. Each file is also **classified by document type**, which lets the evidence search look in the most relevant files first. For example, turnover evidence is searched for in the financial statement and CA certificate before anything else.

---

### 5. Evidence Extraction

For each requirement, ComplyGeM searches the bidder documents for supporting evidence:

```text
Requirement: Minimum average turnover ≥ ₹50 lakh
        ↓
Candidate documents: Financial_Statement.pdf, CA_Certificate.pdf
        ↓
Match found: Financial_Statement.pdf → Page 17
        ↓
Extracted value: ₹72 lakh (3-year average)
```

**Each evidence record stores:**

| Field | Description | Example |
|---|---|---|
| `requirement_id` | Requirement this evidence supports | `REQ-001` |
| `document_id` | Source bidder document | `Financial_Statement.pdf` |
| `page` | Page number | `17` |
| `text` | Exact extracted snippet (shown in the viewer) | `"Average turnover ... ₹72,00,000"` |
| `value` | Normalised machine value | `7200000` |
| `confidence` | Extraction confidence (0–1) | `0.94` |

---

### 6. Compliance Engine

Each requirement gets exactly one status:

| Status | Meaning | Typical trigger |
|---|---|---|
| ✅ **COMPLIANT** | Requirement is met | Evidence found, rule passes, confidence ≥ threshold |
| ❌ **NON-COMPLIANT** | Requirement is not met | Evidence found, rule fails, confidence ≥ threshold |
| ⚠️ **REVIEW REQUIRED** | The system cannot decide safely | Low confidence, conflicting evidence, ambiguous clause, or an AI-evaluated requirement |
| ❓ **MISSING EVIDENCE** | No supporting evidence found | No relevant document or passage found |

**Example:**

```text
Required turnover : ₹50 lakh
Bidder turnover   : ₹72 lakh
Rule              : 72 ≥ 50
Result            : ✅ COMPLIANT
```

> [!IMPORTANT]
> **Uncertainty escalates. It never rejects.** If extraction confidence is below the threshold, the finding becomes **REVIEW REQUIRED**, never NON-COMPLIANT. No bidder is disqualified automatically because of an OCR or model error.

---

### 7. Rule Engine

Simple numeric and date checks **must not depend on an LLM**. Anything that can be calculated is evaluated in code, so the result is deterministic, reproducible and auditable.

```python
from datetime import date
from decimal import Decimal

CONFIDENCE_THRESHOLD = 0.80

def evaluate_threshold(extracted: Decimal, required: Decimal, confidence: float) -> str:
    if confidence < CONFIDENCE_THRESHOLD:
        return "REVIEW_REQUIRED"
    return "COMPLIANT" if extracted >= required else "NON_COMPLIANT"

def evaluate_average_turnover(yearly: list[Decimal], required: Decimal, confidence: float) -> str:
    average = sum(yearly) / len(yearly)
    return evaluate_threshold(average, required, confidence)

def evaluate_certificate(expiry_date: date, bid_date: date) -> str:
    return "VALID" if expiry_date >= bid_date else "EXPIRED"
```

**Supported rule types:**

| Rule type | Example |
|---|---|
| Threshold (`>=`, `<=`) | Turnover ≥ ₹50 lakh, net worth ≥ 0 |
| Aggregate | Average or sum over N financial years |
| Date validity | Certificate expiry ≥ bid submission date |
| Presence | Mandatory document submitted (e.g. GST certificate) |
| Identity match | Company name, GSTIN and PAN match across all documents |
| Count | At least 3 similar completed works |

---

### 8. RAG / AI Layer

Retrieval-Augmented Generation (RAG) handles requirements that need contextual understanding, and produces the natural-language explanations.

```mermaid
flowchart LR
    D[Documents] --> C["Page-aware chunks<br/>(doc_id + page kept)"]
    C --> E[Embeddings]
    E --> V[("pgvector")]
    Q[Requirement or officer question] --> R["Hybrid retrieval<br/>vector + keyword"]
    V --> R
    R --> L["LLM<br/>(answers from retrieved context only)"]
    L --> X["Explanation + citations<br/>(document, page)"]
```

**Design choices:**
- **Page-aware chunking.** Every chunk keeps its `document_id` and `page`, so each answer can cite its source.
- **Hybrid retrieval.** Vector similarity is combined with keyword search, because exact terms such as "GSTIN" and "turnover" matter.
- **Grounded answers.** The LLM answers only from the retrieved passages. If the answer isn't in the documents, it replies *"insufficient evidence"*, and the finding becomes REVIEW REQUIRED or MISSING EVIDENCE.
- **No numeric verdicts from the LLM.** The LLM may *extract* a value, but the comparison is always done by the [rule engine](#7-rule-engine).

**Example interaction:**

> **Officer:** *Why was REQ-007 marked for review?*
>
> **ComplyGeM:** *The experience certificate (`Experience_Certificate.pdf`, page 3) is issued to "ABC Infra Private Limited", but the GST certificate (`GST_Certificate.pdf`, page 1) lists "ABC Infrastructure Pvt. Ltd." The names are similar but not identical, so the match could not be confirmed automatically.*

---

### 9. Risk & Review Module

Findings that need attention are flagged and sent to the officer's **review queue**:

| Risk flag | Trigger | Severity |
|---|---|---|
| ⚠️ Certificate expired | `expiry_date < bid_submission_date` | High |
| ⚠️ Conflicting company name | Entity names differ across documents (fuzzy match below threshold) | High |
| ⚠️ GSTIN / PAN mismatch | Identifiers differ between documents | High |
| ⚠️ Missing mandatory document | A required evidence type was not found | High |
| ⚠️ Financial information could not be verified | Illegible scan, low OCR confidence or inconsistent figures | Medium |
| ⚠️ Low extraction confidence | `confidence < CONFIDENCE_THRESHOLD` | Medium |

**Actions in the review queue:**
- **Accept.** Confirm the automated finding.
- **Override.** Change the status. A remark is **mandatory** and is written to the audit log.
- **Flag for clarification.** Mark the item for follow-up with the bidder.

---

### 10. Dashboard & Evidence Viewer

**Compliance summary:**

```text
BID COMPLIANCE · ABC Infra Pvt. Ltd. · Tender_ABC
──────────────────────────────────────────────────────
Total Requirements        20
✓ Compliant               14   ██████████████   70%
✗ Non-Compliant            2   ██               10%
⚠ Review Required          2   ██               10%
? Missing Evidence         2   ██               10%
──────────────────────────────────────────────────────
Risk flags: 3 High · 1 Medium   →  Open review queue
```

Clicking a requirement opens the **evidence viewer**, which shows the rendered source page with the snippet highlighted, next to the reasoning:

| Field | Value |
|---|---|
| **Requirement** | Minimum average annual turnover ₹50 lakh (Clause 4.2(a)) |
| **Evidence** | `Financial_Statement.pdf` |
| **Page** | 17 |
| **Extracted text** | "Average turnover for FY 2021-22 to 2023-24: ₹72,00,000" |
| **Extracted value** | ₹72 lakh (confidence 0.94) |
| **Validation** | ₹72 lakh ≥ ₹50 lakh |
| **Result** | ✅ COMPLIANT |
| **Officer decision** | Pending review |

The viewer shows **why** each label was given, as well as the label itself.

---

## User Workflow

```mermaid
flowchart LR
    A[Login] --> B[Dashboard] --> C[Select Tender] --> D[Upload Documents]
    D --> E[Process Documents] --> F[View Requirements] --> G[View Compliance]
    G --> H[Inspect Evidence] --> I[Review Findings]
```

| Screen | Purpose |
|---|---|
| **Login** | Officer sign-in (role-based access) |
| **Dashboard** | List of tenders, bidders and their evaluation progress |
| **Tender** | Tender details, tender and bidder uploads, processing status, extracted requirements |
| **Compliance** | Status summary and a filterable list of findings for each bidder |
| **Evidence Viewer** | Source page preview, extracted value, rule and explanation |
| **Review** | Review queue for flagged findings: accept, override or flag |

---

## Data Model

```mermaid
erDiagram
    USER ||--o{ TENDER : creates
    TENDER ||--o{ DOCUMENT : "has tender docs"
    TENDER ||--o{ REQUIREMENT : defines
    TENDER ||--o{ BIDDER : receives
    BIDDER ||--o{ DOCUMENT : submits
    DOCUMENT ||--o{ DOCUMENT_CHUNK : "split into"
    REQUIREMENT ||--o{ EVIDENCE : "supported by"
    DOCUMENT ||--o{ EVIDENCE : contains
    REQUIREMENT ||--o{ FINDING : "evaluated as"
    BIDDER ||--o{ FINDING : receives
    FINDING ||--o{ VERIFICATION : "reviewed in"
    USER ||--o{ VERIFICATION : performs
```

| Entity | Key fields | Description |
|---|---|---|
| **User** | `user_id`, `name`, `email`, `role` (officer / reviewer / admin), `password_hash` | Authenticated system users |
| **Tender** | `tender_id`, `reference_no`, `title`, `description`, `issuing_authority`, `deadline`, `status`, `created_by` | A procurement tender |
| **Bidder** | `bidder_id`, `tender_id`, `company_name`, `gstin`, `pan` | A company bidding on a tender |
| **Document** | `document_id`, `tender_id`, `bidder_id` *(null for tender docs)*, `file_name`, `file_type`, `doc_category`, `storage_path`, `sha256`, `page_count`, `processing_status`, `upload_date` | An uploaded tender or bidder file |
| **DocumentChunk** | `chunk_id`, `document_id`, `page`, `text`, `embedding` *(vector)* | Page-aware text chunks for RAG |
| **Requirement** | `requirement_id`, `tender_id`, `clause`, `clause_text`, `category`, `condition`, `operator`, `threshold`, `unit`, `period`, `evidence_types`, `evaluation_mode`, `mandatory` | A structured eligibility requirement |
| **Evidence** | `evidence_id`, `requirement_id`, `document_id`, `page`, `text`, `value`, `confidence` | Evidence snippet linked to a requirement |
| **Finding** | `finding_id`, `requirement_id`, `bidder_id`, `status`, `risk`, `rule_applied`, `explanation`, `created_at` | Automated compliance result |
| **Verification** | `verification_id`, `finding_id`, `user_id`, `decision`, `final_status`, `remarks`, `verified_at` | The officer's review decision (audit trail) |

---

## API Reference

Base URL: `http://localhost:8000/api`. Interactive docs are served at **`/docs`** (Swagger UI) and **`/redoc`**.

| Method | Endpoint | Router | Description |
|---|---|---|---|
| `POST` | `/auth/login` | `auth.py` | Authenticate and receive a JWT |
| `GET` | `/tenders` | `tender.py` | List tenders |
| `POST` | `/tenders` | `tender.py` | Create a tender |
| `GET` | `/tenders/{tender_id}` | `tender.py` | Tender details |
| `POST` | `/tenders/{tender_id}/upload` | `tender.py` | Upload the tender PDF and start processing |
| `GET` | `/tenders/{tender_id}/requirements` | `tender.py` | List extracted requirements |
| `POST` | `/tenders/{tender_id}/bidders` | `bidder.py` | Register a bidder for the tender |
| `POST` | `/bidders/{bidder_id}/documents` | `bidder.py` | Upload one or more bidder documents |
| `GET` | `/tasks/{task_id}` | `document.py` | Poll processing status |
| `GET` | `/documents/{document_id}/pages/{page}` | `document.py` | Render a page for the evidence viewer |
| `POST` | `/bidders/{bidder_id}/evaluate` | `compliance.py` | Run compliance analysis |
| `GET` | `/bidders/{bidder_id}/compliance` | `compliance.py` | Compliance summary + findings |
| `GET` | `/findings/{finding_id}` | `compliance.py` | Finding details with evidence |
| `POST` | `/findings/{finding_id}/explain` | `compliance.py` | Ask the RAG layer about a finding |
| `POST` | `/findings/{finding_id}/verify` | `compliance.py` | Record the officer's decision |

<details>
<summary><b>Example: <code>GET /api/findings/FND-001</code></b></summary>

```json
{
  "finding_id": "FND-001",
  "requirement": {
    "requirement_id": "REQ-001",
    "clause": "4.2(a)",
    "condition": "Minimum Average Annual Turnover",
    "operator": ">=",
    "required_value": 5000000
  },
  "evidence": [
    {
      "document": "Financial_Statement.pdf",
      "page": 17,
      "text": "Average turnover for FY 2021-22 to 2023-24: ₹72,00,000",
      "value": 7200000,
      "confidence": 0.94
    }
  ],
  "rule_applied": "average_turnover >= required_value",
  "status": "COMPLIANT",
  "risk": "LOW",
  "explanation": "The bidder's 3-year average turnover (₹72 lakh) exceeds the ₹50 lakh threshold.",
  "verification": null
}
```

</details>

---

## Project Structure

```text
complygem/
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── routes/
│   │   ├── auth.py                 # Login / JWT
│   │   ├── tender.py               # Tender CRUD, upload, requirements
│   │   ├── bidder.py               # Bidder registration and documents
│   │   ├── document.py             # Task status, page rendering
│   │   └── compliance.py           # Evaluation, findings, verification
│   ├── services/
│   │   ├── ocr_service.py          # PDF text extraction + OCR fallback
│   │   ├── extraction_service.py   # Requirement and evidence extraction
│   │   ├── rag_service.py          # Chunking, embeddings, retrieval, LLM
│   │   ├── rule_engine.py          # Deterministic numeric/date/identity rules
│   │   └── verification_service.py # Status classification and risk flags
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── tender.py
│   │   ├── bidder.py
│   │   ├── document.py
│   │   ├── requirement.py
│   │   ├── evidence.py
│   │   ├── finding.py
│   │   └── verification.py
│   ├── database/
│   │   └── connection.py           # Engine and session management
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx       # Compliance summary cards
│   │   │   ├── Upload.jsx          # Tender and bidder upload with progress
│   │   │   ├── Requirements.jsx    # Extracted requirements table
│   │   │   ├── Evidence.jsx        # Evidence viewer with page preview
│   │   │   └── Findings.jsx        # Findings list and status filters
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Tender.jsx          # Tender details and workflow
│   │   │   └── Review.jsx          # Officer review queue
│   │   └── services/
│   │       └── api.js              # API client
│   └── package.json
│
├── samples/                        # Sample tender and bidder PDFs for demos
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| PostgreSQL | 15+ with the [`pgvector`](https://github.com/pgvector/pgvector) extension |
| Tesseract OCR | 5.x ([install guide](https://tesseract-ocr.github.io/tessdoc/Installation.html)) |

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/complygem.git
cd complygem
```

### 2. Set up the database

```sql
CREATE DATABASE complygem;
\c complygem
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env          # then edit the values
alembic upgrade head
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`, with docs at `http://localhost:8000/docs`.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### 5. Try the demo

1. Log in and create a tender.
2. Upload a sample tender PDF from `samples/`.
3. Wait for the requirements to be extracted, then register a bidder and upload its documents.
4. Click **Evaluate** and open the compliance dashboard.
5. Click any requirement to inspect its evidence, then accept or override it in the review queue.

---

## Configuration

Backend settings are read from `.env`:

```env
# Database
DATABASE_URL=postgresql://complygem:password@localhost:5432/complygem

# File storage
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_MB=50

# OCR
TESSERACT_CMD=/usr/bin/tesseract
OCR_LANGUAGES=eng                 # e.g. eng+hin for bilingual documents
OCR_MIN_CHARS_PER_PAGE=50         # pages below this are routed to OCR

# AI
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
LLM_PROVIDER=anthropic            # or openai, ollama, etc.
LLM_MODEL=claude-sonnet-5
LLM_API_KEY=your-api-key

# Compliance
CONFIDENCE_THRESHOLD=0.80         # below this → REVIEW REQUIRED

# Auth
JWT_SECRET=change-me
JWT_EXPIRE_MINUTES=60
```

Frontend (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Design Principles

1. **Explainability over automation.** No status is shown without its evidence, the rule applied and an explanation.
2. **Deterministic first.** Anything that can be calculated is calculated in code. The LLM never decides a numeric or date comparison.
3. **Uncertainty escalates and never rejects.** Low confidence produces *Review Required*, not *Non-Compliant*.
4. **Human in the loop.** The officer makes the final decision, and every override needs a written remark.
5. **Traceability.** Every finding links back to a document, a page and the exact text snippet.
6. **Auditability.** Automated results and human decisions are stored separately and are never overwritten.

---

## Security & Privacy

- **Secure storage.** Uploaded files are kept outside the web root under random names, and a SHA-256 checksum records whether a file has changed.
- **Access control.** JWT authentication with role-based access (officer, reviewer, admin).
- **Audit logging.** Uploads, evaluations and review decisions are logged with the user and a timestamp.
- **LLM data handling.** Bidder documents may contain commercially sensitive data. For production, use a self-hosted model or a provider with suitable data-retention terms, and send only the retrieved passages, never whole documents.
- **Input validation.** Uploads are checked for file type and size, and malformed PDFs are rejected safely.

---

## Known Limitations

- OCR accuracy drops on low-quality scans, handwriting, stamps and overlapping seals.
- Complex tables in scanned financial statements may be extracted imperfectly.
- The LLM may misread unusually worded clauses, which is why AI-evaluated requirements go to review by default.
- ComplyGeM supports evaluation. Its findings are **not a legal determination** of eligibility.
- The prototype has been tested on a limited set of sample tenders.

---

## Roadmap

**Phase 1: Core prototype**
- [ ] Tender and bidder upload with processing status
- [ ] Native PDF extraction + OCR fallback
- [ ] Requirement extraction into structured form
- [ ] Rule engine for turnover, date validity and document presence
- [ ] Compliance dashboard and evidence viewer

**Phase 2: Intelligence & review**
- [ ] RAG-based explanations with page citations
- [ ] Risk flags (name / GSTIN mismatch, expired certificates)
- [ ] Review queue with accept / override / flag
- [ ] Audit trail

**Phase 3: Production readiness**
- [ ] Side-by-side comparison of multiple bidders
- [ ] Exportable evaluation report (PDF)
- [ ] Multilingual OCR (e.g. Hindi + English)
- [ ] Integration with e-procurement portals
- [ ] Background workers (Celery + Redis) and containerised deployment

---

## Glossary

| Term | Meaning |
|---|---|
| **Tender** | A formal invitation to submit bids for goods, works or services |
| **Bid / Bidder** | The submission, and the organisation submitting it |
| **EMD** | Earnest Money Deposit, the bid security paid with a bid |
| **CA Certificate** | A certificate from a Chartered Accountant confirming financial figures such as turnover |
| **GSTIN** | Goods and Services Tax Identification Number |
| **MSME / Udyam** | Micro, Small & Medium Enterprise registration |
| **Lakh / Crore** | ₹1 lakh = ₹1,00,000 (100 thousand). ₹1 crore = ₹1,00,00,000 (10 million). |
| **OCR** | Optical Character Recognition, which reads text from scanned images |
| **Embedding** | A numeric vector that represents the meaning of text, used for semantic search |
| **RAG** | Retrieval-Augmented Generation, where the LLM answers using retrieved document passages |

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch and open a pull request.

Please add tests for new rules in `backend/tests/`, and keep numeric and date logic in `rule_engine.py`, not in LLM prompts.

---

## License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for details. *(Update this if you choose a different license.)*

<div align="center">

**ComplyGeM**: from raw documents to explainable, evidence-backed compliance decisions.

</div>


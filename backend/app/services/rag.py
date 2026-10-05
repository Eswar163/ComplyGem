"""Lightweight retrieval (the 'R' in RAG) over bidder-document chunks.

For the prototype this is a pure-Python TF-IDF index scoped to one tender,
so it runs anywhere with zero infrastructure. The Chunk rows are persisted
in the database, so swapping this for pgvector / sentence-transformer
embeddings later only touches this file.
"""
import math
import re
from collections import Counter
from dataclasses import dataclass

MAX_CHUNK = 700
STOP = set("""a an the and or of to in for on with by is are be been as at from that this these those
shall must should may will would can could it its his her their our your all any each which who whom
whose not no than then there here also into upon per under above below during before after between
if else when while about against out up down over such only own same so too very s t just don now
""".split())


@dataclass
class Hit:
    doc_id: int
    doc_name: str
    page: int
    text: str
    score: float


def _tokens(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9₹.]+", text.lower()) if len(w) > 1 and w not in STOP]


def chunk_pages(pages: list[dict]) -> list[dict]:
    """pages: [{page, text}] -> [{page, idx, text}]"""
    out = []
    for p in pages:
        paras = [x.strip() for x in re.split(r"\n\s*\n", p["text"]) if x.strip()]
        if not paras and p["text"].strip():
            paras = [p["text"].strip()]
        buf, idx = "", 0
        for para in paras:
            if buf and len(buf) + len(para) > MAX_CHUNK:
                out.append({"page": p["page"], "idx": idx, "text": buf})
                idx += 1
                buf = ""
            buf = (buf + "\n" + para).strip()
        if buf:
            out.append({"page": p["page"], "idx": idx, "text": buf})
    return out


class TfidfIndex:
    def __init__(self, chunks: list[dict]):
        """chunks: [{doc_id, doc_name, page, idx, text}]"""
        self.chunks = chunks
        self.tfs: list[Counter] = []
        self.df: Counter = Counter()
        for c in chunks:
            tf = Counter(_tokens(c["text"]))
            self.tfs.append(tf)
            for term in tf:
                self.df[term] += 1
        self.n = max(len(chunks), 1)

    def _vec(self, tf: Counter) -> dict[str, float]:
        # +1 in the denominator keeps query-only terms (df=0) safe
        return {t: (1 + math.log(f)) * math.log(self.n / (self.df.get(t, 0) + 1) + 1) for t, f in tf.items()}

    def search(self, query: str, k: int = 5) -> list[Hit]:
        if not self.chunks:
            return []
        qv = self._vec(Counter(_tokens(query)))
        hits = []
        for c, tf in zip(self.chunks, self.tfs):
            cv = self._vec(tf)
            num = sum(w * cv.get(t, 0.0) for t, w in qv.items())
            den = math.sqrt(sum(w * w for w in qv.values())) * math.sqrt(sum(v * v for v in cv.values())) or 1.0
            hits.append(Hit(c["doc_id"], c["doc_name"], c["page"], c["text"], num / den))
        hits.sort(key=lambda h: h.score, reverse=True)
        return hits[:k]

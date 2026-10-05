"""PDF text extraction. Uses PyMuPDF for digital PDFs; flags scanned PDFs
(very little embedded text) so an OCR stage can be plugged in later."""
import pymupdf

MIN_CHARS_PER_PAGE = 120  # below this a page is considered image-only (scanned)


def extract_pdf(data: bytes) -> dict:
    """Returns {pages: [{page, text}], page_count, text, ocr_needed}"""
    pages = []
    with pymupdf.open(stream=data, filetype="pdf") as doc:
        page_count = doc.page_count
        for i, page in enumerate(doc):
            pages.append({"page": i + 1, "text": page.get_text("text") or ""})
    text = "\n\n".join(p["text"] for p in pages).strip()
    ocr_needed = page_count > 0 and (len(text) / page_count) < MIN_CHARS_PER_PAGE
    return {"pages": pages, "page_count": page_count, "text": text, "ocr_needed": ocr_needed}


def make_pdf(filename: str, pages: list[str]) -> bytes:
    """Small helper used by the demo-data generator to build sample PDFs."""
    doc = pymupdf.open()
    for content in pages:
        page = doc.new_page()  # A4
        rect = page.rect
        body = pymupdf.Rect(rect.x0 + 56, rect.y0 + 56, rect.x1 - 56, rect.y1 - 56)
        page.insert_textbox(body, content, fontname="helv", fontsize=10.5, align=0)
    data = doc.tobytes()
    doc.close()
    return data

# backend/apps/reports/services/extractor.py

import fitz  # PyMuPDF
import easyocr
from PIL import Image
import io
import os
import numpy as np

# Initialize EasyOCR reader once (heavy to load, so keep at module level)
# Add more languages if needed e.g. ['en', 'hi'] for Hindi support
reader = easyocr.Reader(['en'], gpu=False)


def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from a PDF or image file using EasyOCR.
    Supports: .pdf, .png, .jpg, .jpeg, .tiff, .bmp
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.pdf':
        return _extract_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        return _extract_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _extract_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF using PyMuPDF.
    Falls back to EasyOCR if page has no selectable text (scanned PDF).
    """
    doc = fitz.open(pdf_path)
    text = ""

    for page in doc:
        page_text = page.get_text()
        if page_text.strip():
            # Digital PDF – use native text
            text += page_text
        else:
            # Scanned PDF – render page as image then OCR
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)

            results = reader.readtext(img_array, detail=0, paragraph=True)
            text += "\n".join(results) + "\n"

    doc.close()
    return text.strip()


def _extract_from_image(image_path: str) -> str:
    """Extract text from an image file using EasyOCR."""
    results = reader.readtext(image_path, detail=0, paragraph=True)
    return "\n".join(results).strip()


# ── NEW ──────────────────────────────────────────────────────────────────────
def extract_text_from_report(report) -> str:
    """
    Convenience wrapper that accepts a MedicalReport model instance
    and delegates to extract_text_from_file using the file's path.
    """
    return extract_text_from_file(report.file.path)
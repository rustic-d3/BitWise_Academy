import pdfplumber


class EmptyPdfError(ValueError):
    """The PDF has no extractable text (empty, or a scanned image)."""


def extract_text(pdf_file) -> str:
    """Return the text of every page of an uploaded PDF."""
    with pdfplumber.open(pdf_file) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)

    if not text.strip():
        raise EmptyPdfError("PDF-ul pare să fie gol sau scanat ca imagine.")
    return text

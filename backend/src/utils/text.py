from io import BytesIO
import fitz
from pathlib import Path
import pandas as pd


def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into chunks with improved whitespace handling"""
    text = " ".join(text.split())  # Clean whitespace first
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size) if text[i:i+chunk_size].strip()]


def extract_text(content: bytes, filename: str, chunk_size: int = 500) -> list[str]:
    """Improved text extraction with CPU-only processing and better error handling"""
    texts: list[str] = []
    ext = Path(filename).suffix.lower()

    try:
        if ext == ".pdf":
            # PDF processing with explicit CPU fallback
            with fitz.open(stream=BytesIO(content)) as doc:
                for page in doc:
                    raw = page.get_text("text")
                    if raw.strip():
                        cleaned = " ".join(raw.split())
                        texts.append(cleaned)

        elif ext in (".xlsx", ".xls", ".xlsm", ".xlsb"):
            # Excel processing with memory-efficient parsing
            full_text = []
            with pd.ExcelFile(BytesIO(content)) as excel:
                for sheet_name in excel.sheet_names:
                    try:
                        df = excel.parse(
                            sheet_name,
                            engine='openpyxl' if ext == '.xlsx' else 'xlrd',
                            dtype=str,
                            na_filter=False
                        )
                        sheet_text = df.to_string(index=False)
                        full_text.append(f"Sheet: {sheet_name}\n{sheet_text}")
                    except Exception as sheet_error:
                        print(f"Error processing sheet {sheet_name}: {sheet_error}")
            
            cleaned = " ".join(" ".join(full_text).split())
            texts = chunk_text(cleaned, chunk_size)

        else:
            # Text file processing with encoding fallback
            try:
                full = content.decode("utf-8")
            except UnicodeDecodeError:
                full = content.decode("latin-1")
                
            cleaned = " ".join(full.split())
            texts = chunk_text(cleaned, chunk_size)

    except Exception as e:
        print(f"Critical error processing {filename}: {str(e)}")
        return []  # Return empty list to prevent partial processing

    # Final cleanup of empty chunks
    return [t for t in texts if t.strip()]
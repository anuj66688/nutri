import io
import base64
from typing import Tuple, List, Optional
from pypdf import PdfReader
from PIL import Image
from services.groq_service import GroqService
from models.schemas import LabValueRecord
from config import settings

class LabReportParser:
    @classmethod
    def extract_text_from_pdf(cls, file_bytes: bytes) -> str:
        """Extracts text from PDF document using pypdf"""
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"--- Page {i+1} ---\n{page_text}")
            return "\n".join(text_parts).strip()
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    @classmethod
    async def extract_text_from_image(cls, file_bytes: bytes, mime_type: str) -> str:
        """Extracts text from images using Groq Vision model if available"""
        groq_client = GroqService.get_client()
        if not groq_client:
            return ""

        try:
            b64_image = base64.b64encode(file_bytes).decode("utf-8")
            data_url = f"data:{mime_type};base64,{b64_image}"

            # Call Groq vision model
            response = groq_client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all readable text from this laboratory test report image word-for-word. Transcribe all test names, numeric results, units, and reference ranges exactly."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": data_url}
                            }
                        ]
                    }
                ],
                max_tokens=2048,
                temperature=0.0
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"Error extracting image text via vision: {e}")
            return ""

    @classmethod
    async def process_report_file(
        cls,
        file_bytes: bytes,
        file_name: str,
        content_type: str,
        default_date: str
    ) -> Tuple[str, List[LabValueRecord]]:
        """
        Processes any uploaded PDF or image file, extracts text,
        and converts it into structured lab records.
        """
        extracted_text = ""
        lower_name = file_name.lower()

        if "pdf" in content_type or lower_name.endswith(".pdf"):
            extracted_text = cls.extract_text_from_pdf(file_bytes)
        elif any(ext in content_type or lower_name.endswith(ext) for ext in [".jpg", ".jpeg", ".png"]):
            extracted_text = await cls.extract_text_from_image(file_bytes, content_type)
        else:
            raise ValueError("Unsupported file format. Please upload PDF, JPG, JPEG, or PNG.")

        if not extracted_text or len(extracted_text.strip()) < 10:
            return extracted_text, []

        lab_records = await GroqService.extract_lab_data(extracted_text, default_date)
        return extracted_text, lab_records

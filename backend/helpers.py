import os
from fastapi import UploadFile
from openai import OpenAI
from google import genai
from google.genai import types
from s3_storage import get_s3_storage


GPT_client = OpenAI(api_key=os.getenv("GPT_API_KEY"))
Gemini_client = genai.Client()

async def saveFile(file : UploadFile, user_id : int, document_id : int, type : str, base_path : str = "."):
    """
    Save file to AWS S3.

    Args:
        file: UploadFile object
        user_id: User ID
        document_id: Document ID
        type: Type of file ('original' or 'translated')
        base_path: Ignored (kept for backward compatibility)

    Returns:
        S3 key (path) where file was stored
    """
    s3_storage = get_s3_storage()
    s3_key = await s3_storage.upload_file(file, user_id, document_id, type)
    return s3_key

def get_gpt_response_with_context(messages: list, document_text: str, model: str = "gpt-4o-mini", language: str | None = None) -> str:
    language_instruction = ""
    if language:
        language_instruction = f"\n        - Respond ONLY in {language}. All your responses must be in {language}."
    
    system_prompt = {
        "role": "system",
        "content": f"""You are a helpful assistant that answers questions ONLY based on the provided document.

        DOCUMENT TEXT:
        {document_text}

        RULES:
        - Only answer questions using information from the document above
        - If the answer is not in the document, say "I cannot find that information in the provided document"
        - Do not use external knowledge or make assumptions beyond what's in the document
        - Quote relevant parts of the document when answering{language_instruction}"""
    }

    full_messages = [system_prompt] + messages

    response = GPT_client.chat.completions.create(
        model=model,
        messages=full_messages
    )

    return response.choices[0].message.content

def check_logic_with_gemini(content: str, document_text: str, language: str | None = None) -> bool:
    lang_note = ""
    if language:
        lang_note = f"\n    6.  **Language Note**: The answer may be in {language}, but the validation should focus on factual correctness regardless of language."
    
    system_instruction = f"""
    You are an **Expert Validation Engine** designed to check the factual basis of a given conclusion against a single, provided text document.

    DOCUMENT CONTEXT:
    ---
    {document_text}
    ---

    INSTRUCTIONS:
    1.  **Strictly adhere** to the information contained in the 'DOCUMENT CONTEXT'.
    2.  **Do not** use any external knowledge, common sense, or make assumptions.
    3.  Your task is to evaluate a question-and-answer pair (the "Conclusion") and determine if the answer is a **reasonable and direct consequence** of the facts stated in the 'DOCUMENT CONTEXT'.
    4.  If the answer can be logically inferred and fully supported by the document, the conclusion is **Reasonable**.
    5.  If the answer contains any information *not* found in the document, contradicts the document, or cannot be logically supported by the document, the conclusion is **Unreasonable**.{lang_note}

    OUTPUT FORMAT:
    Your final response **must be a single boolean value**.

    [REASONABLE] -> **True**
    [UNREASONABLE] -> **False**
    """

    response = Gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=content,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction
        )
    )

    if response.text == "True":
        return True
    return False

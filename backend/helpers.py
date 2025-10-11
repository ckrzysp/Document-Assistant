import os
from fastapi import UploadFile
from openai import OpenAI
from google import genai
from google.genai import types


GPT_client = OpenAI(api_key=os.getenv("GPT_API_KEY"))
Gemini_client = genai.Client()

async def saveFile(file : UploadFile, user_id : int, document_id : int, type : str, base_path : str = "."):
    tmp_path = os.path.join(base_path, "tmp")
    os.makedirs(tmp_path, exist_ok=True)

    file_dir = os.path.join(tmp_path, str(user_id))
    os.makedirs(file_dir, exist_ok=True)

    document_dir = os.path.join(file_dir, str(document_id))
    os.makedirs(document_dir, exist_ok=True)

    file_path = os.path.join(document_dir, type)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return file_path

def get_gpt_response_with_context(messages: list, document_text: str, model: str = "gpt-4o-mini") -> str:
    system_prompt = {
        "role": "system",
        "content": f"""You are a helpful assistant that answers questions ONLY based on the provided document.

        DOCUMENT TEXT:
        {document_text}

        RULES:
        - Only answer questions using information from the document above
        - If the answer is not in the document, say "I cannot find that information in the provided document"
        - Do not use external knowledge or make assumptions beyond what's in the document
        - Quote relevant parts of the document when answering"""
    }

    full_messages = [system_prompt] + messages

    response = GPT_client.chat.completions.create(
        model=model,
        messages=full_messages
    )

    return response.choices[0].message.content

def check_logic_with_gemini(content: str, document_text: str) -> bool:

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
    5.  If the answer contains any information *not* found in the document, contradicts the document, or cannot be logically supported by the document, the conclusion is **Unreasonable**.

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

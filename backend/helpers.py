import os
from fastapi import UploadFile

async def saveFile(file : UploadFile, user_id : int, document_id : int, base_path : str = ".", type : str):
    tmp_path = os.path.join(base_path, "tmp")
    os.makedirs(tmp_path, exist_ok=True)

    file_dir = os.path.join(tmp_path, str(user_id))
    os.makedirs(file_dir, exist_ok=True)

    file_path = os.path.join(file_dir, str(document_id), type)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    return file_path
    
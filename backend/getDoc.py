from routes import *

docs = get_documents(25, Session(bind=engine))
document_name = docs[0].filename
document_id = docs[0].id

files = download_document(document_id, "original", Session(bind=engine))
print(files.path)


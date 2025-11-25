from doctr.models import ocr_predictor
from doctr.io import DocumentFile
import json
from flatten_json import flatten

# Add .png to .jpg

extr_model = ocr_predictor(reco_arch="crnn_vgg16_bn", pretrained=True)
document = DocumentFile.from_images("..\\Document-Assistant\\neural_network\\testimagedoc.jpg")
result = extr_model(document)

#result.show()
to_json = result.export()
file_path = "..\\Document-Assistant\\neural_network\\user_data.json"

try:
     with open(file_path, "w", encoding="utf-8") as f:
          json.dump(to_json['pages'], f, indent=4, sort_keys=True)
     print("File stored")
    
     # Load JSON
     with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
          data = json.load(f)
     print("File stored")
     # Dict Check
     if 'blocks' in data:
          items = data['form']
     print("File stored")

     # Extract only box, label, text
     key_list = ['words']
     extracted = [{'file_name': file_path, **{k: item.get(k) for k in key_list}} for item in items]

     flattened = [flatten(d, '.') for d in extracted]

except:
     print("No file")
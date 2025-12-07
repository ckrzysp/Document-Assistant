from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from PIL import Image
import numpy as np
import json

# Add .png to .jpg

def extract_text_from_crop(cropped_image):
     # Run doctr extraction
     extr_model = ocr_predictor(reco_arch='crnn_vgg16_bn', pretrained=True)
     doc = DocumentFile.from_images(cropped_image)

     # json output
     output = extr_model(doc)
     tojson = output.export()

     # Extract text and confidence
     all_text = []
     confidences = []
     words = []
     for page in tojson['pages']:
          for block in page['blocks']:
               for line in block['lines']:
                    for word in line['words']:
                         all_text.append(word['value'])
                         confidences.append(word['confidence'])
                         words.append({
                              'text': word['value'],
                              'confidence': word['confidence']
                         })

     avg_confidence = sum(confidences) / len(confidences) if confidences else 0
     return {
          'text': ' '.join(all_text),
          'confidence': avg_confidence,
          'words': words,
          'raw_output': output
     }

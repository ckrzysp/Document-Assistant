from cnn_doctr_integration_example import *
from RequestImage import fx, fy, fw, fh

img_path = "neural_network//testimagedoc.jpg"
extractor = DocumentTextExtractor()
print(fx, fy, fw, fh)
extractor.crop_region(image=img_path, bbox=tuple([fx, fy, fw, fh]))
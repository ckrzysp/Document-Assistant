# DocTR (Document Text Recognition) Demo Guide

This guide shows you how to use the pretrained docTR model for text extraction from document images.

## Overview

DocTR is a two-stage OCR system:
1. **Text Detection**: Locates text regions in the image (using DB ResNet50)
2. **Text Recognition**: Reads the text from detected regions (using CRNN VGG16)

## Installation

The required package is already in `requirements.txt`:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install python-doctr[torch]  # or python-doctr[tf] for TensorFlow
```

## Demo Scripts

### 1. Basic Demo (`doctr_demo.py`)

Simple script to process a single image and see how docTR works.

**Run with default image:**
```bash
python doctr_demo.py
```

**Run with custom image:**
```bash
python doctr_demo.py --image_path ../dataset/training_data/images/0001129658.png
```

**Run with verbose output (shows bounding boxes):**
```bash
python doctr_demo.py --verbose
```

**Output:**
- Console output showing detected text
- JSON file with full results (including bounding boxes)
- Text file with extracted text

### 2. Batch Processing Demo (`doctr_batch_demo.py`)

Demonstrates processing multiple images, simulating the CNN->OCR pipeline.

**Run:**
```bash
python doctr_batch_demo.py
```

**What it does:**
1. Loads sample images from dataset
2. Creates cropped regions (simulating CNN bounding box outputs)
3. Runs docTR on each crop
4. Generates summary report with confidence scores

**Output:**
- Cropped images in `./doctr_outputs/crops/`
- Batch results in `./doctr_outputs/batch_results.json`

## Integration with Your CNN

Here's how to integrate docTR with your CNN detection model:

```python
from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from PIL import Image

# 1. Initialize docTR model (do this once)
ocr_model = ocr_predictor(
    det_arch='db_resnet50',
    reco_arch='crnn_vgg16_bn',
    pretrained=True
)

# 2. After CNN detects text regions
# Assume CNN gives you bounding boxes: [(x1, y1, x2, y2), ...]
def extract_text_from_crops(image_path, bounding_boxes):
    """
    Extract text from CNN-detected regions.

    Args:
        image_path: Path to original image
        bounding_boxes: List of (x1, y1, x2, y2) tuples from CNN

    Returns:
        List of extracted text strings
    """
    img = Image.open(image_path)
    results = []

    for bbox in bounding_boxes:
        # Crop the region detected by CNN
        x1, y1, x2, y2 = bbox
        cropped = img.crop((x1, y1, x2, y2))

        # Save temporarily (or use in-memory)
        temp_path = "temp_crop.png"
        cropped.save(temp_path)

        # Run docTR on the crop
        doc = DocumentFile.from_images(temp_path)
        result = ocr_model(doc)

        # Extract text
        output = result.export()
        text = extract_text(output)

        results.append({
            'bbox': bbox,
            'text': text,
            'raw_output': output
        })

    return results

def extract_text(doctr_output):
    """Helper to extract text from docTR output."""
    texts = []
    for page in doctr_output['pages']:
        for block in page['blocks']:
            for line in block['lines']:
                line_text = ' '.join([w['value'] for w in line['words']])
                texts.append(line_text)
    return ' '.join(texts)
```

## Model Architectures

You can try different pretrained models:

### Detection Models
- `db_resnet50` (default) - Good balance of speed/accuracy
- `db_mobilenet_v3_large` - Faster, less accurate
- `linknet_resnet18` - Alternative architecture

### Recognition Models
- `crnn_vgg16_bn` (default) - Good general purpose
- `crnn_mobilenet_v3_small` - Faster, less accurate
- `sar_resnet31` - Better for complex layouts
- `parseq` - State-of-the-art, slower

**Example with different models:**
```python
# Faster but less accurate
model = ocr_predictor(
    det_arch='db_mobilenet_v3_large',
    reco_arch='crnn_mobilenet_v3_small',
    pretrained=True
)

# More accurate but slower
model = ocr_predictor(
    det_arch='db_resnet50',
    reco_arch='parseq',
    pretrained=True
)
```

## Tips for Best Results

1. **Image Quality**: docTR works best with:
   - Clear, high-resolution images
   - Good contrast between text and background
   - Minimal skew/rotation

2. **Preprocessing**: Consider preprocessing before OCR:
   ```python
   from PIL import Image, ImageEnhance

   # Enhance contrast
   img = Image.open(image_path)
   enhancer = ImageEnhance.Contrast(img)
   img = enhancer.enhance(2.0)
   ```

3. **Confidence Filtering**: Filter out low-confidence results:
   ```python
   # Only keep words with confidence > 0.5
   for word in line['words']:
       if word['confidence'] > 0.5:
           text.append(word['value'])
   ```

4. **Fine-tuning**: For better results on your specific documents, you can fine-tune the models on your dataset.

## Output Structure

DocTR returns a hierarchical structure:

```
pages[]
  └─ blocks[]
      └─ lines[]
          └─ words[]
              ├─ value (text)
              ├─ confidence (0-1)
              └─ geometry (bounding box coordinates)
```

## Common Issues

1. **Out of Memory**: Reduce batch size or use smaller models
2. **Slow Performance**: Use mobilenet variants or GPU acceleration
3. **Poor Accuracy**: Try different model combinations or preprocess images

## Next Steps

1. Run the basic demo to see how it works
2. Run the batch demo to understand the pipeline
3. Integrate with your CNN detection model
4. Experiment with different model architectures
5. Consider fine-tuning on your dataset for better accuracy

## Resources

- [docTR GitHub](https://github.com/mindee/doctr)
- [docTR Documentation](https://mindee.github.io/doctr/)
- [Model Zoo](https://mindee.github.io/doctr/latest/models.html)

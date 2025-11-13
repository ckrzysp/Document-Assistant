"""
CNN + docTR Integration Example
================================
This demonstrates how to integrate your CNN detection model with docTR
for a complete document processing pipeline:

1. CNN detects text regions/boxes in document
2. Crop detected regions
3. Pass crops to docTR for text extraction
4. Aggregate results

This is a template/skeleton showing the integration pattern.
"""

from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from PIL import Image
import numpy as np
from pathlib import Path
import json


class DocumentTextExtractor:
    """
    Combines CNN detection with docTR text recognition.
    """

    def __init__(self):
        # Initialize docTR model
        print("Loading docTR OCR model...")
        self.ocr_model = ocr_predictor(
            det_arch='db_resnet50',
            reco_arch='crnn_vgg16_bn',
            pretrained=True
        )
        print("docTR model loaded!")

        # TODO: Load your CNN detection model here
        # self.cnn_model = load_your_cnn_model()
        # print("CNN detection model loaded!")

    def detect_text_regions(self, image_path):
        """
        Use CNN to detect text regions in the image.

        Args:
            image_path: Path to input image

        Returns:
            list: Bounding boxes [(x1, y1, x2, y2, confidence, label), ...]
        """
        # TODO: Replace this with your actual CNN detection code
        # For now, return a mock example

        # Example: Your CNN would return something like:
        # predictions = self.cnn_model(image_path)
        # bboxes = predictions.boxes

        # Mock bounding boxes for demonstration
        # In reality, these would come from your CNN detection model
        print("  [DEMO] Using mock bounding boxes - replace with CNN output")

        mock_boxes = [
            (100, 50, 500, 150, 0.95, 'text_block'),
            (100, 200, 500, 300, 0.87, 'text_block'),
            (100, 350, 500, 450, 0.92, 'text_block')
        ]

        return mock_boxes

    def crop_region(self, image, bbox):
        """
        Crop a region from the image.

        Args:
            image: PIL Image
            bbox: Tuple (x1, y1, x2, y2) or (x1, y1, x2, y2, conf, label)

        Returns:
            PIL Image: Cropped region
        """
        # Handle both formats
        if len(bbox) > 4:
            x1, y1, x2, y2 = bbox[:4]
        else:
            x1, y1, x2, y2 = bbox

        # Ensure coordinates are within image bounds
        width, height = image.size
        x1 = max(0, min(x1, width))
        y1 = max(0, min(y1, height))
        x2 = max(0, min(x2, width))
        y2 = max(0, min(y2, height))

        return image.crop((x1, y1, x2, y2))

    def extract_text_from_crop(self, crop_image, temp_path='temp_crop.png'):
        """
        Extract text from a cropped image using docTR.

        Args:
            crop_image: PIL Image of the cropped region
            temp_path: Temporary file path for saving crop

        Returns:
            dict: Extracted text and metadata
        """
        # Save crop temporarily
        crop_image.save(temp_path)

        # Run docTR
        doc = DocumentFile.from_images(temp_path)
        result = self.ocr_model(doc)

        # Parse output
        output = result.export()

        # Extract text and confidence
        all_text = []
        confidences = []
        words = []

        for page in output['pages']:
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

    def process_document(self, image_path, save_crops=False, output_dir='./output'):
        """
        Complete pipeline: detect -> crop -> extract text.

        Args:
            image_path: Path to input document image
            save_crops: Whether to save cropped regions
            output_dir: Directory to save outputs

        Returns:
            dict: Complete processing results
        """
        print(f"\nProcessing: {image_path}")
        print("-" * 60)

        # Load image
        image = Image.open(image_path)
        print(f"Image size: {image.size}")

        # Step 1: CNN Detection
        print("\nStep 1: Detecting text regions with CNN...")
        bboxes = self.detect_text_regions(image_path)
        print(f"  Found {len(bboxes)} text regions")

        # Step 2: Extract text from each region
        print("\nStep 2: Extracting text with docTR...")
        regions = []

        for idx, bbox in enumerate(bboxes):
            print(f"\n  Region {idx + 1}/{len(bboxes)}:")

            # Extract confidence and label if available
            if len(bbox) > 4:
                x1, y1, x2, y2, conf, label = bbox
                print(f"    BBox: ({x1:.0f}, {y1:.0f}, {x2:.0f}, {y2:.0f})")
                print(f"    CNN Confidence: {conf:.2f}")
                print(f"    Label: {label}")
            else:
                x1, y1, x2, y2 = bbox
                conf, label = None, None

            # Crop region
            crop = self.crop_region(image, bbox)

            # Save crop if requested
            if save_crops:
                Path(output_dir).mkdir(parents=True, exist_ok=True)
                crop_path = Path(output_dir) / f"crop_{idx}.png"
                crop.save(crop_path)

            # Extract text
            ocr_result = self.extract_text_from_crop(crop)

            # Combine results
            region_result = {
                'region_id': idx,
                'bbox': (x1, y1, x2, y2),
                'cnn_confidence': conf,
                'cnn_label': label,
                'extracted_text': ocr_result['text'],
                'ocr_confidence': ocr_result['confidence'],
                'word_details': ocr_result['words']
            }

            regions.append(region_result)

            # Display preview
            text_preview = ocr_result['text'][:60]
            print(f"    Text: '{text_preview}...'")
            print(f"    OCR Confidence: {ocr_result['confidence']:.2f}")

        # Step 3: Aggregate results
        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)

        all_text = ' '.join([r['extracted_text'] for r in regions])
        avg_ocr_conf = sum(r['ocr_confidence'] for r in regions) / len(regions) if regions else 0

        print(f"\nTotal regions processed: {len(regions)}")
        print(f"Average OCR confidence: {avg_ocr_conf:.2f}")
        print(f"\nExtracted text:\n{all_text}\n")

        return {
            'image_path': str(image_path),
            'image_size': image.size,
            'num_regions': len(regions),
            'regions': regions,
            'full_text': all_text,
            'avg_confidence': avg_ocr_conf
        }


def main():
    """
    Example usage of the integrated pipeline.
    """
    print("="*60)
    print("CNN + docTR Integration Demo")
    print("="*60)

    # Initialize processor
    processor = DocumentTextExtractor()

    # Process a sample document
    sample_image = '../dataset/training_data/images/0001129658.png'

    if not Path(sample_image).exists():
        print(f"Sample image not found: {sample_image}")
        print("Please provide a valid image path")
        return

    # Run the complete pipeline
    results = processor.process_document(
        sample_image,
        save_crops=True,
        output_dir='./integration_output'
    )

    # Save results
    output_path = Path('./integration_output/results.json')
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {output_path}")

    print("\n" + "="*60)
    print("TODO: Integration Steps")
    print("="*60)
    print("\n1. Replace detect_text_regions() with your CNN detection code")
    print("2. Load your trained CNN model in __init__")
    print("3. Adjust bounding box format to match your CNN output")
    print("4. Add any preprocessing steps your CNN requires")
    print("5. Test with your actual detected regions")
    print("\nExample CNN integration:")
    print("```python")
    print("def detect_text_regions(self, image_path):")
    print("    # Load your CNN model")
    print("    predictions = self.cnn_model.predict(image_path)")
    print("    ")
    print("    # Extract bounding boxes")
    print("    boxes = []")
    print("    for pred in predictions:")
    print("        x1, y1, x2, y2 = pred.bbox")
    print("        confidence = pred.confidence")
    print("        label = pred.label")
    print("        boxes.append((x1, y1, x2, y2, confidence, label))")
    print("    ")
    print("    return boxes")
    print("```")


if __name__ == '__main__':
    main()

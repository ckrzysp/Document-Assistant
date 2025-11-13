"""
DocTR Batch Processing Demo
============================
This script demonstrates how to process multiple cropped images
(like those from a CNN detection model) through docTR for text extraction.

This simulates the pipeline: CNN Detection -> Crop Regions -> docTR OCR
"""

import os
from pathlib import Path
from doctr.io import DocumentFile
from doctr.models import ocr_predictor
from PIL import Image
import json


class DocTRProcessor:
    """
    A processor class for handling OCR on cropped image regions.
    """

    def __init__(self, det_arch='db_resnet50', reco_arch='crnn_vgg16_bn'):
        """
        Initialize the docTR model.

        Args:
            det_arch: Detection architecture (default: db_resnet50)
            reco_arch: Recognition architecture (default: crnn_vgg16_bn)
        """
        print(f"Initializing DocTR with {det_arch} + {reco_arch}...")
        self.model = ocr_predictor(
            det_arch=det_arch,
            reco_arch=reco_arch,
            pretrained=True
        )
        print("Model ready!\n")

    def extract_text_from_crop(self, image_path):
        """
        Extract text from a single cropped image.

        Args:
            image_path: Path to the cropped image

        Returns:
            dict: Contains 'text', 'confidence', and 'details'
        """
        # Load image
        doc = DocumentFile.from_images(image_path)

        # Run OCR
        result = self.model(doc)

        # Export results
        output = result.export()

        # Parse and structure the output
        extracted_text = []
        confidences = []
        word_details = []

        for page in output['pages']:
            for block in page['blocks']:
                for line in block['lines']:
                    for word in line['words']:
                        extracted_text.append(word['value'])
                        confidences.append(word['confidence'])
                        word_details.append({
                            'text': word['value'],
                            'confidence': word['confidence'],
                            'geometry': word.get('geometry', None)
                        })

        # Calculate average confidence
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        return {
            'text': ' '.join(extracted_text),
            'confidence': avg_confidence,
            'word_count': len(extracted_text),
            'details': word_details,
            'raw_output': output
        }

    def process_batch(self, image_paths):
        """
        Process multiple images in batch.

        Args:
            image_paths: List of image paths

        Returns:
            list: Results for each image
        """
        results = []

        for idx, img_path in enumerate(image_paths):
            print(f"Processing {idx + 1}/{len(image_paths)}: {img_path}")

            try:
                result = self.extract_text_from_crop(img_path)
                result['image_path'] = img_path
                result['success'] = True
                results.append(result)

                print(f"  Extracted: '{result['text'][:50]}...' "
                      f"(confidence: {result['confidence']:.2f})")

            except Exception as e:
                print(f"  Error: {e}")
                results.append({
                    'image_path': img_path,
                    'success': False,
                    'error': str(e)
                })

        return results


def simulate_cnn_cropped_images(dataset_path, num_samples=5):
    """
    Simulate getting cropped images from CNN detection.
    In practice, these would be regions detected by your CNN model.

    Args:
        dataset_path: Path to dataset images
        num_samples: Number of sample images to process

    Returns:
        list: List of image paths
    """
    dataset_path = Path(dataset_path)

    if not dataset_path.exists():
        print(f"Dataset path not found: {dataset_path}")
        return []

    # Get sample images
    images = list(dataset_path.glob('*.png'))[:num_samples]

    print(f"Found {len(images)} sample images to process\n")
    return [str(img) for img in images]


def create_sample_crop(image_path, output_dir, crop_region=None):
    """
    Create a cropped region from an image (simulating CNN output).

    Args:
        image_path: Path to source image
        output_dir: Directory to save cropped image
        crop_region: Tuple (left, top, right, bottom) or None for center crop

    Returns:
        str: Path to cropped image
    """
    img = Image.open(image_path)
    width, height = img.size

    if crop_region is None:
        # Default: crop center region (simulating a text box detection)
        left = width // 4
        top = height // 4
        right = 3 * width // 4
        bottom = 3 * height // 4
        crop_region = (left, top, right, bottom)

    cropped = img.crop(crop_region)

    # Save cropped image
    os.makedirs(output_dir, exist_ok=True)
    crop_name = Path(image_path).stem + '_crop.png'
    crop_path = os.path.join(output_dir, crop_name)
    cropped.save(crop_path)

    return crop_path


def main():
    print("="*60)
    print("DocTR Batch Processing Demo")
    print("Simulating: CNN Detection -> Crop -> OCR Pipeline")
    print("="*60 + "\n")

    # Configuration
    dataset_path = '../dataset/training_data/images'
    output_dir = './doctr_outputs'
    crops_dir = os.path.join(output_dir, 'crops')

    # Create directories
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(crops_dir, exist_ok=True)

    # Initialize processor
    processor = DocTRProcessor()

    # Get sample images (simulating CNN input)
    print("Step 1: Getting sample images...")
    sample_images = simulate_cnn_cropped_images(dataset_path, num_samples=3)

    if not sample_images:
        print("No images found. Please check the dataset path.")
        return

    # Simulate cropping (this would be done by your CNN)
    print("\nStep 2: Creating sample crops (simulating CNN bounding boxes)...")
    cropped_images = []
    for img_path in sample_images:
        try:
            crop_path = create_sample_crop(img_path, crops_dir)
            cropped_images.append(crop_path)
            print(f"  Created crop: {crop_path}")
        except Exception as e:
            print(f"  Error cropping {img_path}: {e}")

    # Process with docTR
    print(f"\nStep 3: Running OCR on {len(cropped_images)} cropped regions...")
    print("-" * 60)
    results = processor.process_batch(cropped_images)

    # Display summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    successful = [r for r in results if r['success']]
    print(f"\nProcessed: {len(results)} images")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(results) - len(successful)}")

    if successful:
        avg_conf = sum(r['confidence'] for r in successful) / len(successful)
        print(f"Average confidence: {avg_conf:.2f}")

        print("\nExtracted text samples:")
        for idx, result in enumerate(successful[:3], 1):
            print(f"\n{idx}. {Path(result['image_path']).name}")
            print(f"   Text: {result['text'][:100]}...")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Words: {result['word_count']}")

    # Save results
    results_file = os.path.join(output_dir, 'batch_results.json')
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results saved to: {results_file}")

    print("\n" + "="*60)
    print("Next Steps:")
    print("="*60)
    print("1. Replace sample crops with actual CNN detection outputs")
    print("2. Integrate this into your pipeline after CNN detection")
    print("3. Use the extracted text for further processing")
    print("4. Consider fine-tuning docTR on your specific document types")


if __name__ == '__main__':
    main()

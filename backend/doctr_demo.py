"""
DocTR (Document Text Recognition) Demo Script
==============================================
This script demonstrates basic usage of the pretrained docTR model
for text detection and recognition on document images.

Usage:
    python doctr_demo.py [--image_path PATH] [--output_dir PATH]
"""

import argparse
import os
from pathlib import Path
from doctr.io import DocumentFile
from doctr.models import ocr_predictor
import json


def setup_model():
    """
    Initialize the pretrained docTR OCR model.
    Uses DB ResNet50 for detection and CRNN VGG16 for recognition.
    """
    print("Loading pretrained docTR model...")
    print("  - Detection: db_resnet50")
    print("  - Recognition: crnn_vgg16_bn")

    model = ocr_predictor(
        det_arch='db_resnet50',
        reco_arch='crnn_vgg16_bn',
        pretrained=True
    )

    print("Model loaded successfully!\n")
    return model


def process_image(model, image_path):
    """
    Process a single image and extract text using docTR.

    Args:
        model: The pretrained docTR model
        image_path: Path to the image file

    Returns:
        dict: Results containing detected text and bounding boxes
    """
    print(f"Processing image: {image_path}")

    # Load the document (can be image or PDF)
    doc = DocumentFile.from_images(image_path)

    # Run OCR
    result = model(doc)

    # Extract results
    output = result.export()

    return output


def display_results(results, verbose=True):
    """
    Display OCR results in a readable format.

    Args:
        results: Output from docTR model
        verbose: If True, show detailed bounding box info
    """
    print("\n" + "="*60)
    print("OCR RESULTS")
    print("="*60)

    # Navigate through the result structure
    for page_idx, page in enumerate(results['pages']):
        print(f"\nPage {page_idx + 1}:")
        print(f"  Dimensions: {page['dimensions']}")

        for block_idx, block in enumerate(page['blocks']):
            print(f"\n  Block {block_idx + 1}:")

            for line_idx, line in enumerate(block['lines']):
                # Collect all words in the line
                line_text = ' '.join([word['value'] for word in line['words']])
                print(f"    Line {line_idx + 1}: {line_text}")

                if verbose:
                    # Show word-level details
                    for word_idx, word in enumerate(line['words']):
                        print(f"      Word {word_idx + 1}: '{word['value']}' "
                              f"(confidence: {word['confidence']:.2f})")
                        if 'geometry' in word:
                            print(f"        BBox: {word['geometry']}")

    print("\n" + "="*60)


def extract_all_text(results):
    """
    Extract all text from results as a single string.

    Args:
        results: Output from docTR model

    Returns:
        str: All extracted text concatenated
    """
    all_text = []

    for page in results['pages']:
        for block in page['blocks']:
            for line in block['lines']:
                line_text = ' '.join([word['value'] for word in line['words']])
                all_text.append(line_text)

    return '\n'.join(all_text)


def save_results(results, output_path):
    """
    Save results to a JSON file.

    Args:
        results: Output from docTR model
        output_path: Path to save JSON file
    """
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description='DocTR OCR Demo')
    parser.add_argument(
        '--image_path',
        type=str,
        default='../dataset/training_data/images/0001129658.png',
        help='Path to input image (default: sample from dataset)'
    )
    parser.add_argument(
        '--output_dir',
        type=str,
        default='./doctr_outputs',
        help='Directory to save outputs (default: ./doctr_outputs)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed word-level results with bounding boxes'
    )

    args = parser.parse_args()

    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)

    # Check if image exists
    if not os.path.exists(args.image_path):
        print(f"Error: Image not found at {args.image_path}")
        print("\nAvailable sample images in dataset:")
        dataset_path = Path('../dataset/training_data/images')
        if dataset_path.exists():
            for img in list(dataset_path.glob('*.png'))[:5]:
                print(f"  - {img}")
        return

    # Initialize model
    model = setup_model()

    # Process image
    results = process_image(model, args.image_path)

    # Display results
    display_results(results, verbose=args.verbose)

    # Extract all text
    full_text = extract_all_text(results)
    print("\n" + "="*60)
    print("EXTRACTED TEXT (concatenated):")
    print("="*60)
    print(full_text)

    # Save results
    image_name = Path(args.image_path).stem
    json_output = os.path.join(args.output_dir, f'{image_name}_doctr_output.json')
    save_results(results, json_output)

    # Save text file
    text_output = os.path.join(args.output_dir, f'{image_name}_extracted_text.txt')
    with open(text_output, 'w') as f:
        f.write(full_text)
    print(f"Extracted text saved to: {text_output}")


if __name__ == '__main__':
    main()

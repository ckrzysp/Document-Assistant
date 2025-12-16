from pathlib import Path
from typing import Dict, List, Tuple
import sys
import numpy as np
from PIL import Image
import torch
from torch import nn
from torchvision.transforms import ToTensor

# Add neural_network to path to import ExtractionCNN
root_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(root_dir / 'neural_network'))
from ExtractionCNN import extract_text_from_crop

# Cache the doctr OCR model to avoid reloading on every region (critical for performance)
# Since we can't modify ExtractionCNN.py, we'll wrap it
_doctr_model_cache = None

def _get_cached_ocr_result(cropped_image_bytes):
    """
    Wrapper around extract_text_from_crop that caches the doctr model.
    Since ExtractionCNN loads the model on every call, we intercept and cache it.
    """
    global _doctr_model_cache
    
    # Import here to avoid circular issues
    from doctr.models import ocr_predictor
    from doctr.io import DocumentFile
    
    # Load model once and cache it
    if _doctr_model_cache is None:
        _doctr_model_cache = ocr_predictor(reco_arch='crnn_vgg16_bn', pretrained=True)
    
    # Use cached model directly instead of calling extract_text_from_crop
    # (which would reload the model)
    doc = DocumentFile.from_images(cropped_image_bytes)
    output = _doctr_model_cache(doc)
    tojson = output.export()
    
    # Extract text and confidence (same logic as ExtractionCNN)
    all_text = []
    confidences = []
    words = []
    for page in tojson.get('pages', []):
        for block in page.get('blocks', []):
            for line in block.get('lines', []):
                for word in line.get('words', []):
                    all_text.append(word.get('value', ''))
                    conf = word.get('confidence')
                    if conf is not None:
                        confidences.append(conf)
                    words.append({
                        'text': word.get('value', ''),
                        'confidence': conf
                    })
    
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    return {
        'text': ' '.join(all_text),
        'confidence': avg_confidence,
        'words': words,
    } 

model_state_path = root_dir / 'model_state' / 'CNNstate.pt'
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
obj_threshold = 0.7
classification = {0: 'header', 1: 'question', 2: 'answer', 3: 'other'}


# exact cnn detection architecture
# exact cnn detection architecture
class ConvolutionalNN(nn.Module):
    def __init__(self):
        super(ConvolutionalNN, self).__init__()
        self.convolutional_relu_seq = nn.Sequential(
            # 1
            nn.Conv2d(3, 25, 3, 1, padding=1),
            nn.BatchNorm2d(25),
            nn.ReLU(),
            nn.MaxPool2d(4,4),
            # 2
            nn.Conv2d(25, 150, 3, 1, padding=1),
            nn.BatchNorm2d(150),
            nn.ReLU(),
            nn.MaxPool2d(4,4),
            # 3
            nn.Conv2d(150, 400, 3, 1, padding=1),
            nn.BatchNorm2d(400),
            nn.ReLU(), 
            nn.MaxPool2d(4,4)            
        )

        num_boxes = 1
        num_classes = 4
        self.obj_head = nn.Conv2d(400, num_boxes*1, 1)
        self.box_head = nn.Conv2d(400, num_boxes*4, 1)
        self.class_head = nn.Conv2d(400, num_boxes*num_classes, 1)

    # Output Tensors, function used for training
    def forward(self, x):
        seq = self.convolutional_relu_seq(x)

        # Multi-label, multi-class
        boxP = self.box_head(seq)             # B,4,H,W
        boxP = torch.sigmoid(boxP)            # constrain to 0,1
        boxP = boxP.permute(0,2,3,1)           # B,H,W,4

        # Objectness
        objP = self.obj_head(seq)             # B,1,H,W
        objP = torch.sigmoid(objP)
        objP = objP.permute(0,2,3,1)           # B,H,W,1

        # Class scores (raw logits)
        classP = self.class_head(seq)          # B,4,H,W
        classP = classP.permute(0,2,3,1)        # B,H,W,4

        return boxP, objP, classP

# wrapper to load saved cnn weights for backend use
def _load_cnn_model() -> nn.Module | None:
    if not model_state_path.exists():
        return None
    try:
        model = ConvolutionalNN()
        try:
            state_dict = torch.load(model_state_path, map_location=device, weights_only=True)
        except TypeError:
            state_dict = torch.load(model_state_path, map_location=device)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        return model
    except Exception:
        return None


def _iou(box1: Tuple[int, int, int, int], box2: Tuple[int, int, int, int]) -> float:
    """Calculate Intersection over Union (IoU) of two bounding boxes."""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # Calculate intersection
    xi1 = max(x1_1, x1_2)
    yi1 = max(y1_1, y1_2)
    xi2 = min(x2_1, x2_2)
    yi2 = min(y2_1, y2_2)
    
    if xi2 <= xi1 or yi2 <= yi1:
        return 0.0
    
    inter_area = (xi2 - xi1) * (yi2 - yi1)
    
    # Calculate union
    box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
    box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
    union_area = box1_area + box2_area - inter_area
    
    if union_area == 0:
        return 0.0
    
    return inter_area / union_area


def _apply_nms(detections: List[Dict], iou_threshold: float = 0.5) -> List[Dict]:
    """Apply Non-Maximum Suppression to remove overlapping boxes."""
    if not detections:
        return []
    
    # Sort by score (highest first)
    sorted_detections = sorted(detections, key=lambda d: d['score'], reverse=True)
    keep = []
    
    while sorted_detections:
        # Take the highest scoring detection
        current = sorted_detections.pop(0)
        keep.append(current)
        
        # Remove all boxes that overlap significantly with current box
        sorted_detections = [
            det for det in sorted_detections
            if _iou(current['bbox'], det['bbox']) < iou_threshold
        ]
    
    return keep


def _prepare_image(image: Image.Image) -> Tuple[Image.Image, float, float]:
    # cnn resize logic
    img = image.convert('RGB')
    w, h = img.size
    if w < 750 or h < 1000:
        img = img.resize((750, 1000))
    # scaling to keep crops aligned with source images
    scale_x = image.width / img.width
    scale_y = image.height / img.height
    return img, scale_x, scale_y


def _detect_regions(image: Image.Image, model: nn.Module) -> List[Dict]:
    if model is None:
        return []
    
    img, scale_x, scale_y = _prepare_image(image)
    tensor = ToTensor()(img).unsqueeze(0).to(device)
    
    try:
        with torch.no_grad():
            pred_boxes, pred_obj, pred_classes = model(tensor)
    except Exception:
        return []
    
    pred_boxes = pred_boxes.squeeze(0).cpu()
    pred_obj = pred_obj.squeeze(0).cpu()
    pred_classes = pred_classes.squeeze(0).cpu()

    H_out, W_out, _ = pred_boxes.shape
    obj_mask = pred_obj.squeeze(-1) > obj_threshold
    detections = []
    
    if obj_mask.sum() > 0:
        for gy in range(H_out):
            for gx in range(W_out):
                if obj_mask[gy, gx]:
                    cx_rel, cy_rel, w_rel, h_rel = pred_boxes[gy, gx]
                    obj_score = pred_obj[gy, gx, 0]
                    class_logits = pred_classes[gy, gx]
                    class_id = torch.argmax(class_logits).item()

                    cx_abs = (gx + cx_rel.item()) / W_out
                    cy_abs = (gy + cy_rel.item()) / H_out
                    w_abs = w_rel.item()
                    h_abs = h_rel.item()

                    cx_pix = cx_abs * img.width
                    cy_pix = cy_abs * img.height
                    w_pix = max(w_abs * img.width, 1.0)
                    h_pix = max(h_abs * img.height, 1.0)
                    x1 = max(0.0, cx_pix - w_pix / 2)
                    y1 = max(0.0, cy_pix - h_pix / 2)
                    x2 = min(img.width, cx_pix + w_pix / 2)
                    y2 = min(img.height, cy_pix + h_pix / 2)
                    
                    if x2 <= x1 or y2 <= y1:
                        continue
                    
                    detections.append(
                        {
                            'bbox': (int(x1 * scale_x), int(y1 * scale_y), int(x2 * scale_x), int(y2 * scale_y)),
                            'score': obj_score.item(),
                            'label': classification.get(class_id, str(class_id)),
                        }
                    )
        detections = sorted(detections, key=lambda d: d['score'], reverse=True)
        
        # Apply Non-Maximum Suppression (NMS) to remove overlapping boxes
        detections = _apply_nms(detections, iou_threshold=0.5)
        
        # Limit to top 50 regions to avoid processing too many
        detections = detections[:50]
    
    return detections


def extract_document_text(file_path: str) -> Dict:
    result = {'text': '', 'regions': [], 'error': None}
    
    cnn_model = _load_cnn_model()
    if cnn_model is None:
        result['error'] = f'Model weights not found at {model_state_path}'
        return result
    
    try:
        with Image.open(file_path) as image: 
            image = image.convert('RGB')
            regions = _detect_regions(image, cnn_model)
            
            if not regions:
                result['error'] = f'CNN detection returned no regions (threshold={obj_threshold})'
                return result
            
            # Check if detections are likely false positives (high overlap suggests unstructured document)
            # Calculate total coverage
            image_area = image.size[0] * image.size[1]
            total_box_area = sum(
                (r['bbox'][2] - r['bbox'][0]) * (r['bbox'][3] - r['bbox'][1])
                for r in regions
            )
            coverage_ratio = total_box_area / image_area if image_area > 0 else 0
            
            # If coverage > 200% or too many small overlapping boxes, likely false positives
            # Fall back to whole-image OCR for unstructured documents
            if coverage_ratio > 2.0 or (len(regions) > 20 and coverage_ratio > 1.5):
                # Run OCR on entire image instead of boxes
                import io
                buf = io.BytesIO()
                image.save(buf, format='PNG')
                buf.seek(0)
                doctr_result = _get_cached_ocr_result([buf.getvalue()])
                
                result['text'] = doctr_result.get('text', '')
                result['regions'] = [{
                    'bbox': (0, 0, image.size[0], image.size[1]),
                    'score': 1.0,
                    'label': 'full_document',
                    'text': doctr_result.get('text', ''),
                    'ocr_confidence': doctr_result.get('confidence'),
                }]
                return result
            
            ocr_regions = []
            for region in regions:
                x1, y1, x2, y2 = region['bbox']
                crop = image.crop((x1, y1, x2, y2))
                
                try:
                    # Extract text from crop using cached OCR model
                    # DocumentFile.from_images expects bytes (image file content)
                    import io
                    buf = io.BytesIO()
                    crop.convert('RGB').save(buf, format='PNG')
                    buf.seek(0)
                    # Use cached wrapper instead of extract_text_from_crop to avoid reloading model
                    doctr_result = _get_cached_ocr_result([buf.getvalue()])
                    
                    ocr_regions.append(
                        {
                            **region,
                            'text': doctr_result.get('text', ''),
                            'ocr_confidence': doctr_result.get('confidence'),
                        }
                    )
                except Exception:
                    ocr_regions.append(
                        {
                            **region,
                            'text': '',
                            'ocr_confidence': None,
                        }
                    )
            
            result['regions'] = ocr_regions
            text_parts = [r['text'] for r in ocr_regions if r.get('text')]
            result['text'] = '\n'.join(text_parts).strip()
            
            if not result['text']:
                result['error'] = 'No text extracted from detected regions'
                
    except Exception as exc:
        result['error'] = str(exc)
    
    return result


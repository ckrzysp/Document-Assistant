# Output file

import os
import pandas as pd
import torch.nn as NN
import torch.nn.functional as F
import matplotlib.pyplot as pyp
import matplotlib.patches as patches
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.transforms import ToTensor
import torch.optim as optim
import torch

from DataLoading import *

## CNN for text detection

def collate_fn(batch):
     return tuple(zip(*batch))

class ConvolutionalNN(NN.Module):
     # CNN
     def __init__(self):
          super(ConvolutionalNN, self).__init__()
          self.convolutional_relu_seq = NN.Sequential(
               # 1
               NN.Conv2d(3, 25, 3, 1, padding=1),
               NN.BatchNorm2d(25),
               NN.ReLU(),
               NN.MaxPool2d(4,4),
               # 2
               NN.Conv2d(25, 75, 3, 1, padding=1), # 2D Convolutional Layer, Kernel Size 5, Moves 1 pixel (x,y) direction , 16 input layers to 24 output
               NN.BatchNorm2d(75),                 # Batches are standardized so feature learning to even
               NN.ReLU(),                          # Retified Learning Unit, Non-Linearity // Outlier detection or uniqueness 
               NN.MaxPool2d(4,4),                  # 4x4 grid of 2x2 pools, extracting highest # / highest feature
               # 3
               NN.Conv2d(75, 150, 3, 1, padding=1),
               NN.BatchNorm2d(150),
               NN.ReLU(), 
               NN.MaxPool2d(4,4)              
          )

          num_boxes = 1
          num_classes = 4
          self.obj_head = NN.Conv2d(150, num_boxes*1, 1)
          self.box_head = NN.Conv2d(150, num_boxes*4, 1)
          self.class_head = NN.Conv2d(150, num_boxes*num_classes, 1)

     # Output Tensors, function used for training
     def forward(self, x):
          seq = self.convolutional_relu_seq(x)

          # Single label, multi-class
          # boxP = boxP.mean(dim=[2,3])
          # classP = classP.mean(dim=[2,3])

          # Multi-label, multi-class
          boxP = self.box_head(seq)               # (B,4,H,W)
          boxP = torch.sigmoid(boxP)               # constrain to 0..1
          boxP = boxP.permute(0,2,3,1)             # → (B,H,W,4)

          # Objectness
          objP = self.obj_head(seq)               # (B,1,H,W)
          objP = torch.sigmoid(objP)
          objP = objP.permute(0,2,3,1)             # → (B,H,W,1)

          # Class scores (raw logits)
          classP = self.class_head(seq)           # (B,4,H,W)
          classP = classP.permute(0,2,3,1)         # → (B,H,W,4)

          return boxP, objP, classP


## LOADING

# NOT EVERY image is the size resolution
resize = transforms.Compose([transforms.Resize((1000,750)), transforms.ToTensor()])
batch = 4

# Training loader
training_LOADER = DataLoader(
                              DocumentCSVDataset(
                              csv_file=datapata_training_csv, root_dir=datapath_training_image, transform=resize), 
                              batch_size=batch, shuffle=True, collate_fn=collate_fn)
testing_LOADER = DataLoader(
                              DocumentCSVDataset(
                              csv_file= datapata_testing_csv, root_dir=datapath_testing_image, transform=resize), 
                              batch_size=batch, shuffle=False, collate_fn=collate_fn)

print('Training set has {} instances'.format(len(training_LOADER)))
print('Testing set has {} instances'.format(len(testing_LOADER)))


statepath = "../Document-Assistant/model_state/CNNstateTEST.pt"
model = ConvolutionalNN()
model.load_state_dict(torch.load(statepath, weights_only=True))
model.to('cuda')
model.eval()

# Get grid dimensions
with torch.no_grad():
     dummy_input = torch.randn(1, 3, 1000, 750).to('cuda')
     dummy_boxes, _, _ = model(dummy_input)
     H_out = dummy_boxes.shape[1]
     W_out = dummy_boxes.shape[2]
     print(f"Grid dimensions: {H_out}x{W_out}")

boxcount = 10
for imaget in range(boxcount):
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image + "\\" + img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')

     # Get predictions
     with torch.no_grad():
          pred_boxes, pred_obj, pred_classes = model(img_tensor)
     
     # Check objectness distribution
     pred_obj_flat = pred_obj.squeeze().flatten()
     print(f"\nImage: {name}")
     print(f"Cells > 0.9: {(pred_obj_flat > 0.9).sum().item()}/{len(pred_obj_flat)}")
     print(f"Cells > 0.6: {(pred_obj_flat > 0.6).sum().item()}/{len(pred_obj_flat)}")
     print(f"Cells > 0.3: {(pred_obj_flat > 0.3).sum().item()}/{len(pred_obj_flat)}")
     
     # Check if boxes are still identical
     pred_boxes_2d = pred_boxes.squeeze(0)  # (H, W, 4)
     unique_boxes = torch.unique(pred_boxes_2d.reshape(-1, 4), dim=0)
     print(f"\nUnique box predictions: {len(unique_boxes)} out of {H_out*W_out} cells")
     
     # Get actual detections
     pred_boxes = pred_boxes.squeeze(0)
     pred_obj = pred_obj.squeeze(0)
     pred_classes = pred_classes.squeeze(0)
     
     obj_threshold = 0.7
     obj_mask = pred_obj.squeeze(-1) > obj_threshold
    
     if obj_mask.sum() > 0:
          detections = []
          for gy in range(H_out):
               for gx in range(W_out):
                    if obj_mask[gy, gx]:
                         cx_rel, cy_rel, w_rel, h_rel = pred_boxes[gy, gx]
                         obj_score = pred_obj[gy, gx, 0]
                         class_logits = pred_classes[gy, gx]
                         class_id = torch.argmax(class_logits).item()
                         
                         # Convert back to absolute normalized coordinates
                         cx_abs = (gx + cx_rel.item()) / W_out
                         cy_abs = (gy + cy_rel.item()) / H_out
                         w_abs = w_rel.item()
                         h_abs = h_rel.item()
                         
                         detections.append({
                         'box': [cx_abs, cy_abs, w_abs, h_abs],
                         'objectness': obj_score.item(),
                         'class': class_id,
                         'grid_cell': (gx, gy)
                         })
          
          detections = sorted(detections, key=lambda x: x['objectness'], reverse=True)
        
          # Visualize
          fig, ax = pyp.subplots(figsize=(15, 10))
          ax.imshow(img)

          # Get image dimensions
          img_w, img_h = img.size

          # Draw top detections
          num_to_show = min(20, len(detections))  # Show top 20
          for i, det in enumerate(detections[:num_to_show]):
               cx, cy, w, h = det['box']
               obj_score = det['objectness']
               class_id = det['class']
               
               # Convert normalized to pixel coordinates
               cx_pix = cx * img_w
               cy_pix = cy * img_h
               w_pix = w * img_w
               h_pix = h * img_h
               
               # Convert center format to corner format
               x1 = cx_pix - w_pix / 2
               y1 = cy_pix - h_pix / 2
               
               # Color by confidence
               if obj_score > 0.95:
                    color = 'red'
                    linewidth = 3
               elif obj_score > 0.9:
                    color = 'green'
                    linewidth = 2
               else:
                    color = 'black'
                    linewidth = 1
               
               # Draw rectangle
               rect = patches.Rectangle(
                    (x1, y1), w_pix, h_pix,
                    linewidth=linewidth,
                    edgecolor=color,
                    facecolor='none'
               )
               ax.add_patch(rect)
               
               # Add label
               label = f"{obj_score:.2f}"
               ax.text(x1, y1-5, label, color=color, fontsize=8, 
                         bbox=dict(boxstyle='round', facecolor='white', alpha=0.7))

          pyp.title(f"Detections: {len(detections)} found")
          pyp.tight_layout()
          pyp.show()
          pyp.close()

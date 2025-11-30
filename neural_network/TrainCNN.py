# CNN Training file

import os
import pandas as pd
import torch.nn as NN
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from datetime import datetime
from torchvision.transforms import ToTensor
from torchvision.ops import box_iou
import torch
import matplotlib.pyplot as plt
from tqdm import tqdm
import torch.optim as optim

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

# MODEL
model = ConvolutionalNN()
device = torch.device("cuda")
model.to(device)

SmoothL1 = NN.SmoothL1Loss()
ce = NN.CrossEntropyLoss()

bce = NN.BCELoss(reduction='none')  
optimizer = optim.AdamW(model.parameters(), lr=.0001)

# Get grid dimensions ONCE
with torch.no_grad():
    dummy_input = torch.randn(1, 3, 1000, 750).to(device)
    dummy_boxes, _, _ = model(dummy_input)
    H_out = dummy_boxes.shape[1]
    W_out = dummy_boxes.shape[2]
    print(f"Grid dimensio3s: {H_out}x{W_out}")

# TRAINING
train_losses = []
num_epochs = 30
e_loss = 0
for epoch in range(num_epochs):
     model.train()
     e_loss = 0.0 
     for i, (image_name, image, boxes, labels) in enumerate(training_LOADER):
          # Handle image tuple from DataLoader
          optimizer.zero_grad()
          if isinstance(image, (tuple, list)):
               image = image[0]
          if isinstance(boxes, (tuple, list)):
               boxes = boxes[0]
          if isinstance(labels, (tuple, list)):
               labels = labels[0]
     
          # Add dimension if missing
          if image.dim() == 3:
               image = image.unsqueeze(0)

          # Apply tensors to gpu
          image = image.to(device)
          boxes = boxes.to(device)
          labels = labels.to(device)

          gt_obj = torch.zeros((H_out, W_out), dtype=torch.float32, device=device)
          gt_boxes = torch.zeros((H_out, W_out, 4), dtype=torch.float32, device=device)
          gt_labels = torch.zeros((H_out, W_out), dtype=torch.long, device=device)

          for b in range(boxes.shape[0]):
               cx, cy, w, h = boxes[b]  # normalized
               clss = labels[b]

               # Find grid cell
               gx = int(cx * W_out)
               gy = int(cy * H_out)
               gx = max(0, min(W_out - 1, gx))
               gy = max(0, min(H_out - 1, gy))

               gt_obj[gy, gx] = 1.0

               # Convert to relative cell offsets
               cx_rel = cx * W_out - gx
               cy_rel = cy * H_out - gy
               w_rel = w
               h_rel = h
               
               gt_boxes[gy, gx] = torch.tensor([cx_rel, cy_rel, w_rel, h_rel], device=device)
               gt_labels[gy, gx] = clss

          num_boxes_in_image = boxes.shape[0]
          num_cells_assigned = (gt_obj > 0).sum().item()

          pred_boxes, pred_obj, pred_classes = model(image)
          pred_boxes = pred_boxes.squeeze(0)
          pred_obj = pred_obj.squeeze(0)
          pred_classes = pred_classes.squeeze(0)

          obj_mask = gt_obj == 1
          
          # Objectness loss with manual weighting for imbalance
          obj_loss_raw = bce(pred_obj, gt_obj.unsqueeze(-1))
          weight = torch.ones_like(gt_obj).unsqueeze(-1)
          weight[obj_mask] = 20.0
          L_obj = (obj_loss_raw * weight).mean()

          # Box and class loss only for object cells
          if obj_mask.sum() > 0:
               L_box = SmoothL1(pred_boxes[obj_mask], gt_boxes[obj_mask])
               L_cls = ce(pred_classes[obj_mask], gt_labels[obj_mask])
          else:
               L_box = torch.tensor(0.0, device=device)
               L_cls = torch.tensor(0.0, device=device)

          # Total
          loss = 1*L_obj + 1*L_box + 1*L_cls
          e_loss += loss.item()

          loss.backward()
          NN.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
          optimizer.step()
          
          if (i+1) % 15 == 0:
               avgloss = e_loss/(i+1)
               print(f"[Epoch {epoch+1}, Batch {i+1}] Loss: {avgloss:.12f}")
               print(f"  Obj cells: {obj_mask.sum().item()}/{H_out*W_out}, Total boxes: {boxes.shape[0]}")

     Aloss = e_loss/len(training_LOADER)
     train_losses.append(Aloss)
     print(f"Epoch {epoch+1} Average Loss: {Aloss:.6f}")

model.eval()
# Save state
statepath = "../Document-Assistant/model_state/CNNstateTEST.pt"
try:
     torch.save(model.state_dict(), statepath)
except:
     print("Cannot Open.")

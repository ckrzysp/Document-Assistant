import os
import pandas as pd
import numpy
import torch.nn as NN
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from datetime import datetime
from torchvision.transforms import ToTensor
from torchvision.ops import nms
import torch
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
               NN.MaxPool2d(2,2),
               # 2
               NN.Conv2d(25, 75, 3, 1, padding=1), # 2D Convolutional Layer, Kernel Size 5, Moves 1 pixel (x,y) direction , 16 input layers to 24 output
               NN.BatchNorm2d(75),                 # Batches are standardized so feature learning to even
               NN.ReLU(),                          # Retified Learning Unit, Non-Linearity // Outlier detection or uniqueness 
               NN.MaxPool2d(2,2),                  # 4x4 grid of 2x2 pools, extracting highest # / highest feature
               # 3
               NN.Conv2d(75, 150, 3, 1, padding=1),
               NN.BatchNorm2d(150),
               NN.ReLU(), 
               NN.MaxPool2d(2,2)              
          )

          num_boxes = 1
          num_classes = 4
          self.box_head = NN.Conv2d(150, num_boxes*4, 1)
          self.class_head = NN.Conv2d(150, num_boxes*num_classes, 1)

     # Output Tensors, function used for training
     def forward(self, x):
          seq = self.convolutional_relu_seq(x)
          boxP = self.box_head(seq)
          classP = self.class_head(seq)

          # Single label, multi-class
          #boxP = boxP.mean(dim=[2,3])
          #classP = classP.mean(dim=[2,3])

          # Multi-label, multi-class
          inSize = x.size(0)
          boxP = boxP.permute(0,1,2,3).contiguous().view(1,-1,4)
          #boxP = boxP.view(inSize,-1,4)
          classP = classP.permute(0,1,2,3).contiguous().view(1,-1,4)
          #classP = classP.view(inSize,-1,4)

          return boxP, classP


## LOADING

# NOT EVERY image is the size resolution
resize = transforms.Compose([transforms.Resize((1000,750)), transforms.ToTensor()])
batch = 1

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

reg_lossfn = NN.SmoothL1Loss()
class_lossfn = NN.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr= 0.001)

device = torch.device("cuda")
model.to(device)

# TRAINING

train_losses = []
num_epochs = 15
for epoch in range(num_epochs):
     correction = 0
     for i, (image_name, image, boxes, labels) in enumerate(training_LOADER):
          # Handle image tuple from DataLoader
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

          # forward function is called
          optimizer.zero_grad()
          boxP, classP = model(image)  # boxP: [1,4], classP: [1,4 classes] :-: [1, n_classes*4]

          #target_boxes = boxes.mean(dim=0, keepdim=True).repeat(boxP.size(1), 1) 
          target_boxes = boxes 
          target_boxes = target_boxes.view(1,4)               
          boxP = boxP[:, :1, :]
          target_classes = torch.ones_like(classP).to(device)
          target_classes = target_classes.float()

          # CrossEntropyLoss expects labels 
          loss = reg_lossfn(boxP, target_boxes.unsqueeze(0)) + class_lossfn((classP), target_classes)

          # Changes weights within network
          loss.backward()
          optimizer.step()

          #print(torch.unique(classP))
          correction += (classP==labels).float().sum().item()
          acc = correction/labels.size(0)
          
          if (i+1) % 10 == 9:
               print(f"[Epoch {epoch+1}, Batch {i+1}] Loss: {loss / 20:.12f}","Accuracy: {} ".format(acc))

     train_losses.append(loss / len(training_LOADER))


# Save state
statepath = "../Document-Assistant/model_state/CNNstate.pt"
try:
     torch.save(model.state_dict(), statepath)
except:
     print("Cannot Open.")

# TRAINING

# Printing to see if everything is resized and every file is loaded, NOT printing boxes because it takes a while, add: boxes after shape if need be
# for i, (image_name, image, boxes, labels) in enumerate(training_LOADER):
#     print(i, image_name[0], image[0].shape)
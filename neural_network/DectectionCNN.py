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

          self.box_head = NN.Conv2d(150, 4, 1)
          self.class_head = NN.Conv2d(150, 4, 1)

     # Output Tensors, function used for training
     def forward(self, x):
          seq = self.convolutional_relu_seq(x)
          boxP = self.box_head(seq)
          classP = self.class_head(seq)

          boxP = boxP.mean(dim=[2,3])
          classP = classP.mean(dim=[2,3])

          return boxP, classP


## LOADING

# NOT EVERY image is the size resolution
resize = transforms.Compose([transforms.Resize((1000,750)), transforms.ToTensor()])

# Training loader
training_LOADER = DataLoader(
                              DocumentCSVDataset(
                              csv_file=datapata_training_csv, root_dir=datapath_training_image, transform=resize), 
                              batch_size=2, shuffle=True, collate_fn=collate_fn)
testing_LOADER = DataLoader(
                              DocumentCSVDataset(
                              csv_file= datapata_testing_csv, root_dir=datapath_testing_image, transform=resize), 
                              batch_size=2, shuffle=False, collate_fn=collate_fn)

print('Training set has {} instances'.format(len(training_LOADER)))
print('Testing set has {} instances'.format(len(testing_LOADER)))


# MODEL

model = ConvolutionalNN()

reg_lossfn = NN.SmoothL1Loss()
class_lossfn = NN.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr= 0.01)

device = torch.device("cuda")
model.to(device)

# TRAINING

train_losses = []
num_epochs = 10
for epoch in range(num_epochs):
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
          boxP, classP = model(image)  # boxP: [1,4], classP: [1,4 classes]

          # CrossEntropyLoss expects labels 
          loss = reg_lossfn(boxP, boxes) + class_lossfn(classP, labels.view(-1))

          # Changes weights within network
          loss.backward()
          optimizer.step()
          
          if (i+1) % 10 == 9:
               print(f"[Epoch {epoch+1}, Batch {i+1}] Loss: {loss / 20:.12f}")

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
import os
import pandas as pd
import numpy
import torch.nn as NN
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from torch.utils.tensorboard import SummaryWriter
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
               NN.Conv2d(1, 16, 5, 1, padding=1),
               NN.BatchNorm2d(16),
               NN.ReLU(),
               NN.MaxPool2d(2,2),
               # 2
               NN.Conv2d(16, 24, 5, 1, padding=1), # 2D Convolutional Layer, Kernel Size 5, Moves 1 pixel (x,y) direction , 16 input layers to 24 output
               NN.BatchNorm2d(24),                 # Batches are standardized so feature learning to even
               NN.ReLU(),                          # Retified Learning Unit, Non-Linearity // Outlier detection or uniqueness 
               NN.MaxPool2d(2,2),                  # 4x4 grid of 2x2 pools, extracting highest # / highest feature
               # 3
               NN.Conv2d(24, 48, 5, 1, padding=1),
               NN.BatchNorm2d(48),
               NN.ReLU(), 
               NN.MaxPool2d(2,2)              
          )

          self.detector_head = NN.Conv2d(48, 4, 1)

     # Output Tensors
     def forward(self, x):
          seq = self.convolutional_relu_seq(x)
          prediction = self.detector_head(seq)
          prediction = torch.sigmoid(prediction)
          return prediction


## Loading

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

loss_func = NN.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr= 0.001)

# TRAINING

# Printing to see if everything is resized and every file is loaded, NOT printing boxes because it takes a while, add: boxes after shape if need be
#for i, (image_name, image, boxes, labels) in enumerate(training_LOADER):
#     print(i, image_name[0], image[0].shape)

train_losses = []
num_epochs = 5 
for epoch in range(num_epochs):
     running_loss = 0.0
     for i, (image_name, image, boxes, labels) in enumerate(training_LOADER):
          if torch.cuda.is_available():
               image, labels = image.cuda(), labels.cuda()
               model.cuda()
          else:
               model.cpu()

          optimizer.zero_grad()

          outputs = model(image)
          loss = optimizer(outputs, labels)

          loss.backward()
          optimizer.step()

          running_loss += loss.item()
          
          if i % 20 == 9:
               print(f"[Epoch {epoch+1}, Batch {i+1}] Loss: {running_loss / 100:.4f}")
               running_loss = 0.0

     train_losses.append(running_loss / len(training_LOADER))
import os
import pandas as pd
import numpy
import torch.nn as NN
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from torchvision.transforms import ToTensor
import torch

transform = transforms.ToTensor()

## CNN for text detection

class ConvolutionalNN(NN.Module):
     # CNN
     def __init__(self):
          super.__init__()
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

          self.detector_head = NN.Conv2d(48, 5, 1)

     # Output Tensors
     def forward(self, x):
          seq = self.convolutional_relu_seq(x)
          prediction = self.detector_head(seq)
          prediction = torch.sigmoid(prediction)
          return prediction


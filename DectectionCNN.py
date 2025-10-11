import os
import pandas as pd
import numpy
import torch.nn as NN
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from torchvision.transforms import ToTensor




## CNN for text detection

class ConvolutionalNN(NN.Module):
     # CNN
     def __init__(self):
          super.__init__()
          self.convolutional_relu_seq = NN.Sequential(
               # 1
               NN.Conv2d(1, 8, 5, 1),
               NN.ReLU(),
               # 2
               NN.Conv2d(8, 18, 5, 1),
               NN.ReLU(),
               # 3
               NN.Conv2d(18, 36, 5, 1),
               NN.ReLU(),
               # 4
               NN.Conv2d(36, 54, 5, 1),

               ## Fully Connected
               NN.Linear(1350, 450),
               NN.Linear(450, 50),
               NN.Linear(50, 10),
          )

     # Output Tensors
     def forward(self, x):
          logits = self.convolutional_relu_seq(x)
          return logits


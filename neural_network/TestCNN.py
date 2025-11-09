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

          # Single Box
          #boxP = boxP.mean(dim=[2,3])
          #classP = classP.mean(dim=[2,3])

          inSize = x.size(0)
          boxP = boxP.permute(0,1,2,3).contiguous().view(1,-1,4)
          #boxP = boxP.view(inSize,-1,4)
          classP = classP.permute(0,1,2,3).contiguous().view(1,-1,4)
          #classP = classP.view(inSize,-1,4)

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


# MODEL STATE LOADING

statepath = "../Document-Assistant/model_state/CNNstate.pt"
# Load model
model = ConvolutionalNN()
model.load_state_dict(torch.load(statepath, weights_only=True))
model.to('cuda')

boxcount = 5
detected = 0
# Show prediction on every image
dirc = os.listdir(datapath_testing_image)
for imaget in range(boxcount):
     # Take image, convert to tensor
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image +"\\"+ img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')
     img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32, device='cuda')

     # Converting it from tensor to readable numbers
     fig, ax = pyp.subplots()
     boxvector = []
     tempx = 0
     tempy = 0
     box = model(img_tensor)[0]
     clss = model(img_tensor)[1]
     print(box)
     print(clss)

     for i in range(int(len(box[0][0]))):
          # Dimensions
          img_w, img_h = img.size
          x, y = int(box[0][i][0].item()*img_w), int(box[0][i][1].item()*img_h)
          box_w, box_h = int(box[0][i][2].item()*img_w), int(box[0][i][3].item()*img_h)

          x = abs(x)
          y = abs(y)
          box_w = abs(box_w)
          box_h = abs(box_h)

          xp = x
          yp = y
          box_wp = box_w
          box_hp = box_h
          x1, y1 = xp - box_wp/2, yp - box_hp/2
          x2, y2 = xp + box_wp/2, yp + box_hp/2

          ax.imshow(img)
          rect = patches.Rectangle((x1, y1), x2, y2, linewidth=2, edgecolor='r', facecolor='none')
          tempx = x
          tempy = y

          boxvector.append(rect)
     
     for i in range(int(len(box[0][0]))):
          ax.add_patch(boxvector[i])
          ax.text(tempx, tempy, finder[torch.argmax(model(img_tensor)[0][0][i]).item()], color='red', fontsize=2)
     
     pyp.show()
     pyp.close()
     
     # OUTPUT 
     print("IMG: "+name+" --- Class: " + finder[torch.argmax(model(img_tensor)[0][0][i]).item()])

     # print(torch.argmax(model(img_tensor)[0]).item())
     print(len(boxvector))



"""
dirc = os.listdir(datapath_testing_image)
for imaget in range(3):
     # Take image, convert to tensor
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image +"\\"+ img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')
     img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32, device='cuda')

     # Add Confidence
     # Converting it from tensor to readable numbers
     fig, ax = pyp.subplots()
     boxvector = []
     tempx = 0
     tempy = 0
     for i in range(boxcount):
          boxO = (model(img_tensor)[0])
          print(boxO)
     
          # Dimensions
          print("\n")
          img_w, img_h = img.size
          x, y = int(model(img_tensor)[0][0][i][0].item()*img_w), int(model(img_tensor)[0][0][i][1].item()*img_h)
          box_w, box_h = int(model(img_tensor)[0][0][i][2].item()*img_w), int(model(img_tensor)[0][0][i][3].item()*img_h)

          xp = x*img_w
          yp = y*img_h
          box_wp = box_w*img_w
          box_hp = box_h*img_h 
          x1, y1 = xp - box_wp/2, yp - box_hp/2

          #fig, ax = pyp.subplots()
          ax.imshow(img)
          rect = patches.Rectangle((x, y), box_w, box_h, linewidth=2, edgecolor='r', facecolor='none')
          tempx = x
          tempy = y

          boxvector.append(rect)

     for i in range(boxcount):
          ax.add_patch(boxvector[i])
          ax.text(tempx, tempy, finder[torch.argmax(model(img_tensor)[0][0][i]).item()], color='red', fontsize=2)
     pyp.show()
     pyp.close()
     # OUTPUT 
     print("IMG: "+name+" --- Class: " + finder[torch.argmax(model(img_tensor)[0][0][i]).item()])
     # print(torch.argmax(model(img_tensor)[0]).item())
"""
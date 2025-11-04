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


# MODEL STATE LOADING

statepath = "../Document-Assistant/model_state/CNNstate.pt"
# Load model
model = ConvolutionalNN()
model.load_state_dict(torch.load(statepath, weights_only=True))
model.to('cuda')

# Show prediction on every image
dirc = os.listdir(datapath_testing_image)
for imaget in range(10):
     # Take image, convert to tensor
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image +"\\"+ img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')
     img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32, device='cuda')

     # Add Confidence
     # Converting it from tensor to readable numbers
     boxO = (model(img_tensor)[0])
     print("\n")
     print(model(img_tensor))
 
     # Dimensions
     img_w, img_h = img.size
     x, y = model(img_tensor)[0][0][0].item(), model(img_tensor)[0][0][1].item()
     box_w, box_h = model(img_tensor)[0][0][2].item(), model(img_tensor)[0][0][3].item()

     xp = x*img_w
     yp = y*img_h
     box_wp = box_w*img_w
     box_hp = box_h*img_h
     x1, y1 = xp - box_wp/2, yp - box_hp/2

     fig, ax = pyp.subplots(1)
     ax.imshow(img)
     rect = patches.Rectangle((x1, y1), box_wp, box_hp, linewidth=2, edgecolor='r', facecolor='none')
     ax.add_patch(rect)
     ax.text(x, y-5, finder[torch.argmax(model(img_tensor)[0]).item()], color='red', fontsize=10, backgroundcolor='white')

     pyp.show()
     pyp.close()

     # OUTPUT 
     print("IMG: "+name+" --- Class: " + finder[torch.argmax(model(img_tensor)[0]).item()])
     # print(torch.argmax(model(img_tensor)[0]).item())

import os
import numpy as np
import pandas as pd
import torch
import csv
from PIL import Image
from skimage import io
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from torchvision.transforms import ToTensor
import torchvision.transforms.functional as f

# Accelerator (Data Parallelism / GPU us age) or Sequential (CPU Usage)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("using " + str(device))
print(torch.cuda.get_device_name(device))

# Dataset Configuration

datapata_training_csv = "../Document-Assistant/dataset/TRAINING.csv"
datapath_training_image = "../Document-Assistant/dataset/training_data/images"

datapata_testing_csv = "../Document-Assistant/dataset/TESTING.csv"
datapath_testing_image = "../Document-Assistant/dataset/testing_data/images"

classification = {"header": 0, "question": 1, "answer": 3, "other":2}
finder = {0:"header", 1:"question", 3:"answer", 2:"other"}

class DocumentCSVDataset(Dataset):
     def __init__(self, csv_file, root_dir, transform=None):
          # Essentials
          self.documents = pd.read_csv(csv_file)
          self.root_dir = root_dir
          self.transform = transform
          self.csvfile = csv_file
          self.directory = os.listdir(self.root_dir)

     def __len__(self):
          return len(self.directory)

     def __getitem__(self, idx):
          if torch.is_tensor(idx):
               idx = idx.tolist()

          # Get image from directory
          image_name = ""
          for file in range(len(self.directory)):
               if idx == file:
                    image_name = self.directory[file]

          # Need to tranpose to numpy array for Tensor later
          image = io.imread(self.root_dir + "\\" + image_name)
          # Trimming file extension to match names for boxes and labels
          image_name = image_name[:-4] + ".json"
          # PYTORCH expects 3 channels not 1, needed to convert from grayscale (1) to RGB (3)
          image = Image.fromarray(image).convert("RGB")

          # Transform

          if self.transform:
               transformed = self.transform(image)
               # If the transform is a tuple, extract the first item
               if isinstance(transformed, tuple):
                    image = transformed[0]
               else:
                    image = transformed
          else:
               image = transforms.ToTensor()(image)

          # Finding those labels and boxes
          boxes = [] 
          labels = []
          with open(self.csvfile, 'r', encoding='utf-8') as csvfile:
               csvReader = csv.reader(csvfile)
               next(csvReader, None) # Skip header
               for row in csvReader:
                    if len(row) > 0 and row[0] == image_name:
                         boxes.append([float(row[1]), float(row[2]), float(row[3]), float(row[4])])
                         labels.append(classification[row[-1]])
          
          boxes = torch.as_tensor(boxes, dtype=torch.float32, device=device)
          labels = torch.as_tensor(labels, dtype=torch.long, device=device)

          # Return box coords, labels, image
          sample = {'name': image_name, 'image': image, 'boxes': boxes, 'labels': labels}

          boxes = boxes[:1,:]
          labels = labels[:1]

          H, W = image.shape[1], image.shape[2]
          boxes[:, [0,2]] /= W
          boxes[:, [1,3]] /= H

          return image_name, image, boxes, labels


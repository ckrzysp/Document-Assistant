import os
import json
import pandas as pd
import torch
import torch.nn 
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms
from torchvision.io import decode_image
from torchvision.transforms import ToTensor

# Accelerator (Data Parallelism / GPU us age) or Sequential (CPU Usage)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("using " + str(device))
print(torch.cuda.get_device_name(device))

# Data Loading
## JSON 

class MyJsonDataset(Dataset):
     def __init__(self, json_filepath, transform=None):
          with open(json_filepath, 'r', encoding='utf-8-sig') as f:
               data = json.load(f)
               self.transform = transform
               if isinstance(data, dict):
                    self.data = [data]
               else:
                    self.data = data


     def __len__(self):
          return len(self.data)

     def __getitem__(self, idx):
          sample = self.data[idx]
          # Extract features and labels from the sample dictionary
          box = torch.tensor(sample['form'][0].get('box'), dtype=torch.float32)
          print(box)

          classes_doc = {'header': 1, 'question': 2 , 'answer': 3 , 'other': 4}
          label = torch.tensor(classes_doc[sample['form'][2].get('label')], dtype=torch.long)
          print(label)

          if self.transform:
               box = self.transform(box)

          return box, label

# CNN

classes_doc = {'header': 1, 'question': 2 , 'answer': 3 , 'other': 4}
classes_nat = {'title': 0, 'text': 1}

dataset = MyJsonDataset(
"Document-Assistant\\00040534.json"
     )
print(dataset.__getitem__(0))

class ConvolutionalNN(torch.nn.Module):
     def __init__(self):
          pass
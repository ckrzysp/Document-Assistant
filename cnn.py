import os
import torch
import torch.nn
from torch.utils.data import Dataset
from torchvision import datasets, transforms
from torchvision.transforms import ToTensor
from device import device

training_path = '/dataset/dataset/training_data/images'

testing_path = '/dataset/dataset/testing_data/images'
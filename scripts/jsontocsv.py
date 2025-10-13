import json
import pandas as pd
from flatten_json import flatten
import os

### TRAINING

# Change PATH files once uploaded
path = "../Document-Assistant/dataset/training_data/annotations/"
path1 = "../Document-Assistant/dataset/training_data/annotations/"
path2 = "../Document-Assistant/dataset/converted_training/"
files = os.listdir(path)

for i in range(len(files)):
     # Path
     print("FILE " + str(i))
     print(files[i])
     file_path = files[i]

     # Load JSON
     with open(path1 + file_path, 'r', encoding='utf-8', errors='ignore') as f:
          data = json.load(f)

     # Dict Check
     if 'form' in data:
          items = data['form']
     else:
          raise KeyError("Key not found")

     # Extract only box, label, text
     key_list = ['box', 'text', 'label']
     extracted = [{'file_name': file_path, **{k: item.get(k) for k in key_list}} for item in items]

     flattened = [flatten(d, '.') for d in extracted]
     df = pd.DataFrame(flattened)

     # Place in converted directory
     csv_path = path2 + file_path + '.csv'
     df.to_csv(csv_path, sep=',', encoding='utf-8', index=False)

print("JSON into Training CSV Completed.")

### TESTING

# Change PATH files once uploaded
path1 = "../Document-Assistant/dataset/testing_data/annotations/"
path2 = "../Document-Assistant/dataset/converted_testing/"
files = os.listdir(path1)

for i in range(len(files)):
     # Path
     print("FILE " + str(i))
     print(files[i])
     file_path = files[i]

     # Load JSON
     with open(path1 + file_path, 'r', encoding='utf-8', errors='ignore') as f:
          data = json.load(f)

     # Dict Check
     if 'form' in data:
          items = data['form']
     else:
          raise KeyError("Key not found")

     # Extract only box, label, text
     key_list = ['box', 'text', 'label']
     extracted = [{'file_name': file_path, **{k: item.get(k) for k in key_list}} for item in items]

     flattened = [flatten(d, '.') for d in extracted]
     df = pd.DataFrame(flattened)

     # Place in converted directory
     csv_path = path2 + file_path + '.csv'
     df.to_csv(csv_path, sep=',', encoding='utf-8', index=False)

print("JSON into Testing CSV Completed.")
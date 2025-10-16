import os
import glob
import pandas as pd

### TRAINING

pathFrom = "../Document-Assistant/dataset/converted_training/"
pathTo = "../Document-Assistant/dataset/"

with open(pathTo + 'TRAINING.csv', 'w', encoding="utf-8") as output:
     inputFiles = glob.glob(pathFrom + "*.json.csv")
     i = 0
     for inputFile in inputFiles:
          with open(inputFile, 'r', encoding='utf-8', errors='ignore') as source:
               for line in source:
                    output.write(line)
               i+=1
               output.write("\n")

print("Merged TRAIN CSVs.")

### TESTING

pathFrom = "../Document-Assistant/dataset/converted_testing/"
pathTo = "../Document-Assistant/dataset/"

with open(pathTo + 'TESTING.csv', 'w', encoding="utf-8") as output:
     inputFiles = glob.glob(pathFrom + "*.json.csv")
     i = 0
     for inputFile in inputFiles:
          with open(inputFile, 'r', encoding='utf-8', errors='ignore') as source:
               for line in source:
                    output.write(line)
               i+=1
               output.write("\n")

print("Merged TEST CSVs.")


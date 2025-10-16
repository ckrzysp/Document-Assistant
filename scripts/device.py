import torch

# Accelerator (Data Parallelism / GPU usage) or Sequential (CPU Usage)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("using " + str(device))
print(torch.cuda.get_device_name(device))
import torch, os
print("Torch version:", torch.__version__)
print("CUDA version:", torch.version.cuda)
print("GPU available:", torch.cuda.is_available())
print("Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu")

lib = os.path.join(torch.__path__[0], "lib")
print("c10.dll exists:", os.path.exists(os.path.join(lib, "c10.dll")))

import torch.nn as nn
print("torch.nn WORKS")

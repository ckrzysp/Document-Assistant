from DectectionCNN import *

# Load model
model = ConvolutionalNN()
model.load_state_dict(torch.load(statepath, weights_only=True))
model.to('cuda')

# Show prediction on every image
dirc = os.listdir(datapath_testing_image)
for imaget in range(len(dirc)):
     # Take image, convert to tensor
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image +"\\"+ img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')
     img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32, device='cuda')

     # Add Confidence

     # OUTPUT 
     print("IMG: "+name+" --- Class: " + finder[torch.argmax(model(img_tensor)[0]).item()])
     # print(torch.argmax(model(img_tensor)[0]).item())

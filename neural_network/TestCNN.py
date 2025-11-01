from DectectionCNN import *
import matplotlib.pyplot as pyp
import matplotlib.patches as patches

# Load model
model = ConvolutionalNN()
model.load_state_dict(torch.load(statepath, weights_only=True))
model.to('cuda')

# Show prediction on every image
dirc = os.listdir(datapath_testing_image)
for imaget in range(5):
     # Take image, convert to tensor
     img = os.listdir(datapath_testing_image)[imaget]
     name = img
     img = Image.open(datapath_testing_image +"\\"+ img).convert('RGB')
     img_tensor = ToTensor()(img).unsqueeze(0).to('cuda')
     img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32, device='cuda')

     # Add Confidence
     # Converting it from tensor to readable numbers
     boxO = (model(img_tensor)[0])

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

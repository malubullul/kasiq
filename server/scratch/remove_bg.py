
from PIL import Image
import os

def remove_background(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Threshold untuk mendeteksi warna putih (mendekati 255, 255, 255)
    threshold = 240 
    
    for item in datas:
        # Jika R, G, dan B semuanya di atas threshold, buat jadi transparan
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

# List file yang akan diproses
files = ["ai_head.png", "growth_plant.png", "automation_gears.png"]
public_dir = "public"

for f in files:
    path = os.path.join(public_dir, f)
    if os.path.exists(path):
        remove_background(path, path) # Overwrite dengan versi transparan
    else:
        print(f"File {f} not found in {public_dir}")

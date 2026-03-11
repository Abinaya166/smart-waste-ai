import cv2
import numpy as np
import os

def preprocess_image(image_path, target_size=(224, 224)):
    """
    Loads an image, resizes it, and normalizes it.
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    img = cv2.resize(img, target_size)
    img = img.astype('float32') / 255.0
    return img

def load_and_preprocess_data(dataset_path, target_size=(224, 224)):
    """
    Walks through the dataset directory and prepares data for training.
    """
    images = []
    labels = []
    class_names = sorted(os.listdir(dataset_path))
    
    for i, class_name in enumerate(class_names):
        class_dir = os.path.join(dataset_path, class_name)
        if not os.path.isdir(class_dir):
            continue
            
        for img_name in os.listdir(class_dir):
            img_path = os.path.join(class_dir, img_name)
            processed_img = preprocess_image(img_path, target_size)
            if processed_img is not None:
                images.append(processed_img)
                labels.append(i)
                
    return np.array(images), np.array(labels), class_names

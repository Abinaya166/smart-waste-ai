import tensorflow as tf
from tensorflow.keras import layers, models
import os
import numpy as np
from preprocess import load_and_preprocess_data

# Configuration
DATASET_PATH = '../dataset'
MODEL_SAVE_PATH = '../model/waste_classifier.h5'
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

def build_model(num_classes):
    """
    Builds a simple CNN model for image classification.
    """
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def train():
    print("Loading dataset...")
    # In a real scenario, you'd use flow_from_directory or similar
    # This is a simplified representation
    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_PATH,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_PATH,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )

    class_names = train_ds.class_names
    print(f"Classes found: {class_names}")
    
    # Save labels to file
    with open('labels.txt', 'w') as f:
        for name in class_names:
            f.write(f"{name}\n")

    model = build_model(len(class_names))
    model.summary()

    print("Starting training...")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS
    )

    # Ensure model directory exists
    os.makedirs('../model', exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train()

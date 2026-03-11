import cv2
import numpy as np
from tensorflow.keras.models import load_model

# Load the pre-trained model
MODEL_PATH = '../model/waste_classifier.h5'
LABELS_PATH = 'labels.txt'

try:
    model = load_model(MODEL_PATH)
    print("Model loaded successfully.")
except:
    print("Error: Model file not found. Please run train_model.py first.")
    exit()

# Load labels
with open(LABELS_PATH, 'r') as f:
    labels = [line.strip() for line in f.readlines()]

def predict():
    # Initialize camera
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("Starting real-time classification... Press 'q' to quit.")

    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()
        if not ret:
            break

        # Preprocess the frame for the model
        # 1. Resize to 224x224
        resized_frame = cv2.resize(frame, (224, 224))
        # 2. Normalize pixel values (0-1)
        normalized_frame = resized_frame.astype('float32') / 255.0
        # 3. Add batch dimension
        input_data = np.expand_dims(normalized_frame, axis=0)

        # Make prediction
        predictions = model.predict(input_data)
        class_idx = np.argmax(predictions[0])
        confidence = predictions[0][class_idx]
        label = labels[class_idx]

        # Display the result on the frame
        text = f"{label} ({confidence*100:.2f}%)"
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Show the frame
        cv2.imshow('Smart Waste Segregator', frame)

        # Break loop on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release resources
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    predict()

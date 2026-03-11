# Smart Waste Segregation and Recycling System

This project uses a Deep Learning (CNN) model to classify waste into three categories: **Plastic, Paper, and Metal**.

## Project Structure
- `dataset/`: Contains folders for each waste category (Plastic, Paper, Metal).
- `model/`: Stores the trained `waste_classifier.h5` model.
- `src/`:
    - `train_model.py`: Script to train the CNN model on the dataset.
    - `predict_camera.py`: Real-time classification using a webcam.
    - `preprocess.py`: Utility functions for image preprocessing.
    - `labels.txt`: List of class labels.

## How to Run

### 1. Install Dependencies
Ensure you have Python installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Prepare Dataset
Place images of plastic, paper, and metal in their respective folders under `dataset/`.

### 3. Train the Model
Run the training script:
```bash
python src/train_model.py
```
This will generate `model/waste_classifier.h5`.

### 4. Run Real-time Prediction
Connect a webcam and run:
```bash
python src/predict_camera.py
```

## Requirements
- Python 3.8+
- Webcam
- TensorFlow
- OpenCV
- NumPy

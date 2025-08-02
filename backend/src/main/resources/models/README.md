# Face Recognition Models

This directory should contain the face recognition models used by the application.

## Required Models

1. **Haar Cascade Classifier** - For face detection
   - File: `haarcascade_frontalface_alt.xml`
   - Download from: OpenCV GitHub repository

2. **Face Recognition Models** (Optional - for enhanced recognition)
   - Face landmark detection model
   - Face recognition model
   - Download from: dlib or face_recognition library

## Setup Instructions

1. Download the required model files
2. Place them in this directory
3. The application will automatically load them on startup

## Model Sources

- OpenCV Haar Cascades: https://github.com/opencv/opencv/tree/master/data/haarcascades
- dlib Models: http://dlib.net/files/
- face-api.js Models: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Note

For production use, consider using more advanced models like:
- Deep learning-based face detection
- Face recognition models trained on large datasets
- Real-time face recognition models optimized for performance
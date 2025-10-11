# FIDO - Your Personal Mental Well-being Buddy

## Overview

In today's fast-paced world, mental health issues are on the rise, and traditional therapy can often be expensive and inaccessible. FIDO - Your Personal Mental Well-being Buddy aims to bridge this gap by providing an innovative and accessible solution for mental health support. FIDO leverages advanced emotion detection algorithms to identify users' emotions in real-time through their webcam feed and responds with immediate therapeutic support, making it a constant emotional companion available 24/7.
![Screenshot 2024-06-09 130822](https://github.com/Dysfunctional-Human/FIDO---Real-time-Facial-Emotion-Recognition-based-AI-Therapist/assets/124693488/cc08254f-e306-448a-b5b6-ce5b6a007934)


The Demo can be found here: [https://youtu.be/qorGj4Kxh3Y](https://youtu.be/qorGj4Kxh3Y?feature=shared)


## Features

- **Emotion Detection**: Utilizes real-time webcam feed to classify user emotions based on facial expressions.
- **Immediate Support**: Provides immediate therapeutic responses tailored to the user's current emotional state.
- **24/7 Availability**: Always available to offer support, acting as a comforting presence.
- **Affordable and Accessible**: Offers an alternative to traditional therapy, especially for those who cannot afford it or are hesitant to seek help due to stigma.
- **Remote Support**: Available on digital platforms, removing geographical barriers and supporting users in remote areas.

## Benefits

- **Alleviates Loneliness, Anxiety, and Depression**: Acts as a comforting friend, helping users feel heard and understood.
- **Supports Mental Health Services**: Helps reduce the burden on traditional mental health services.
- **Encourages Mental Health Management**: The convenience and privacy of FIDO encourage more individuals to address their mental health concerns.

## Installation and Setup

### Prerequisites

- Python 3.7 or higher
- Flask
- OpenCV
- Keras
- NumPy
- Google Generative AI
- LangChain

### Installation

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/your-repo/fido.git
    cd fido
    ```

2. **Install Dependencies**:
    ```sh
    pip install -r requirements.txt
    ```

3. **Download the Pre-trained Model**:
    - Ensure you have the `mobile_net_v2_firstmodel.h5` file in the project directory.

4. **Set Up Google Generative AI**:
    - Configure your API key for Google Generative AI:
    ```python
    genai.configure(api_key='YOUR_API_KEY')
    ```

### Running the Application

1. **Start the Flask Server**:
    ```sh
    python app.py
    ```

2. **Access the Application**:
    - Open your web browser and navigate to `http://127.0.0.1:5000`.

## Usage

### Emotion Detection

- **Access the Video Feed**:
    - Navigate to `http://127.0.0.1:5000/video` to allow the webcam to capture your facial expressions.

### Chat with FIDO

- **Start a Conversation**:
    - On the main page, you can submit queries, and FIDO will respond based on your detected emotions.

## Code Explanation

### Emotion Detection

- The application captures the video feed from the webcam.
- It detects faces and classifies emotions using a pre-trained Keras model.
- The detected emotions are displayed on the video feed in real-time.

### Chat Integration

- FIDO uses Google Generative AI to generate responses based on the user's current emotional state.
- The responses are customized to uplift and support the user's mental well-being.

### Routes

- `/`: Renders the main page.
- `/submit`: Handles form submissions and displays the response from FIDO.
- `/video`: Streams the video feed with real-time emotion detection.
- `/chat`: Handles chat messages and returns responses from FIDO.

## Future Enhancements

- **Enhanced Emotion Detection**: Improve accuracy with more advanced models and larger datasets.
- **Additional Languages**: Support for multiple languages to reach a broader audience.
- **Mobile Application**: Develop a mobile version for better accessibility on-the-go.
- **Integration with Wearables**: Connect with wearable devices to monitor physical indicators of mental health.

## Contributing

We welcome contributions to enhance FIDO. Please fork the repository and submit pull requests.

# MCQ Practice App

**Vibe Coded This Thing ✨**  
A simple React Native app for practicing multiple-choice questions (MCQs).  
Paste MCQs or upload a PDF to generate questions, then take a mock test offline.  

Built with **Expo**, connected to a backend [`gemini-mcq-generator`](https://gemini-mcq-generator.onrender.com) for PDF processing using the **Gemini API**.  

---

## 📥 Download and Install

### 1. Download the APK
Get the latest APK: [MCQ Practice v1.0.0](https://drive.google.com/file/d/1FcDRrB8WGcNGN7EJ79TEG2jYyqvPo2Ec/view?usp=drive_link)  


### 2. Enable Unknown Sources
1. On your Android phone, go to **Settings > About Phone**.  
2. Tap **Build Number** 7 times to enable Developer Options.  
3. Go to **Settings > Developer Options** → Enable **Install unknown apps** for your browser or file manager.

### 3. Install the APK
- Open your browser or file manager.  
- Navigate to the downloaded `app-release.apk`.  
- Tap to install and grant permissions when prompted.

### 4. Run the App
- Open **MCQ Practice** from your home screen (look for the custom app icon).  
- Paste MCQs or upload a PDF to start practicing.  

---

## 🚀 Features
- Paste MCQs or upload PDFs to extract questions.  
- Preview parsed questions and take **mock tests offline**.  
 

---

## 🛠 For Developers

### Build the APK Yourself
```bash
# Clone the repo
git clone <repo-url>

# Install dependencies
npm install

# Install Expo and EAS CLI
npm install -g expo-cli eas-cli

# Configure app.json with your icon in assets/

# Build the APK
eas build --platform android --profile production

﻿# MLH
# MLH
# 📍 LocalLens - Real-Time Location Updates to Instagram Live  
**LocalLens** is a real-time location tracking system that posts automatic updates to an Instagram Live stream. It integrates geofencing with automated social media updates, making it an interactive experience for users exploring different locations.  

## 🚀 Features  
- **Real-Time Location Tracking** – Uses `expo-location` to continuously track a user's position.  
- **Geofencing & Notifications** – Detects when users enter specific locations and provides relevant information.  
- **Automated Instagram Comments** – Posts live updates to an Instagram Live stream using a **Node.js backend with Selenium**.  
- **Interactive UI** – Built with **React Native & Expo**, featuring a clean and mobile-friendly interface.  
- **Live Map Visualization** – Displays nearby locations and directions.  

## 📦 Tech Stack  
### **Frontend:**  
- **React Native** (Expo Router for navigation)  
- **react-native-maps** (for displaying real-time user locations)  
- **expo-location** (for geolocation tracking)  
- **Expo & Expo Plugins** (Splash Screen, Status Bar, Haptics)  

### **Backend:**  
- **Node.js** with **Express.js** (API Server)  
- **Selenium WebDriver** (Automating Instagram interactions)  
- **Flask & Python** (Alternative backend for API endpoints)  

## 🔧 Installation & Setup  
### **1. Clone the Repository**  
```bash  
git clone https://github.com/yourusername/LocalLens.git  
cd LocalLens  
2. Install Dependencies
📱 For the Frontend:
bash
Copy
Edit
cd MyLocationApp  
npm install  
🖥️ For the Backend:
bash
Copy
Edit
cd backend  
pip install -r requirements.txt  # Python dependencies  
npm install  # Node.js dependencies  
3. Setup Environment Variables
Create a .env file in the backend/ directory and add:

ini
Copy
Edit
INSTAGRAM_USERNAME=your_instagram_username  
INSTAGRAM_PASSWORD=your_instagram_password  
TARGET_LIVE_URL=your_instagram_live_url  
PORT=5000  
4. Start the Backend Server
bash
Copy
Edit
cd backend  
node server.js  
5. Start the Mobile App
bash
Copy
Edit
cd MyLocationApp  
npx expo start  
Scan the QR code to open the app in Expo Go.

# MLH
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
bash  
git clone https://github.com/sp3ked/MLH.git  
cd LocalLens  

2. Install Dependencies
📱 For the Frontend:
cd MyLocationApp  
npm install

🖥️ For the Backend:
cd backend  
pip install -r requirements.txt  # Python dependencies  
npm install  # Node.js dependencies  

4. Setup Environment Variables
Create a .env file in the backend/ directory and add:
INSTAGRAM_USERNAME=your_instagram_username  
INSTAGRAM_PASSWORD=your_instagram_password  
TARGET_LIVE_URL=your_instagram_live_url  
PORT=5000  

5. Start the Backend Server
cd backend  
node server.js  

6. Start the Mobile App
cd MyLocationApp  
npx expo start  
Scan the QR code to open the app in Expo Go.

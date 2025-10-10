# Nana's Digital Photo Calendar

## Overview
A personalized digital calendar built for my grandmother that displays family photos and upcoming events. The application runs locally on a Raspberry Pi in portrait-oriented kiosk mode and can also be accessed online through Firebase Hosting. The Raspberry Pi version receives updates from the web-hosted version, allowing both to stay synchronized.

## Core Features

### Photo Display
- Displays personal photos at the top portion of the screen.
- Supports single and multiple photo uploads.
- Allows photo deletion and management.
- Includes a dedicated Photo Manager page for viewing all uploaded photos, inspecting details, and managing individual items.

### Calendar Display
- Full calendar view powered by React Big Calendar.
- Displays personal events and public holidays.
- Allows creating, editing, and deleting of events.

### Additional Visual Components
- Current date and time display.
- Weather display section.
- Simple navigation through a main menu and overlays.

## Tech Stack

- **Framework:** React (Create React App)
- **Styling:** Plain CSS
- **Calendar Library:** React Big Calendar
- **Backend:** Firebase  
  - **Firestore:** Stores event and photo metadata.
  - **Storage:** Holds uploaded photo files.
  - **Authentication:** Supports secure access and management functions.
  - **Hosting:** Used for the live web version.
- **Deployment Environments:**  
  - **Firebase Hosting:** Public, online access.  
  - **Raspberry Pi:** Local deployment in kiosk mode using `serve` and `pm2`.

## Environment Configuration
Two environment files are used to separate online and local configurations.

- `.env.web`: Firebase configuration for the online (web-hosted) version.
- `.env.raspi`: Firebase configuration for the Raspberry Pi deployment.

Both contain the following keys:

```env
REACT_APP_FIREBASE_API_KEY="YOUR_API_KEY"
REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
REACT_APP_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
REACT_APP_FIREBASE_APP_ID="YOUR_APP_ID"
```

## Project Setup

### Prerequisites
- Node.js (v18 or later)
- npm (v9 or later)
- Firebase project configured with Firestore, Storage, Authentication, and Hosting

### Installation and Configuration

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nana-calendar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Create a Firebase project from the [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore, Storage, Authentication, and Hosting.
   - Add a new Web App and copy the configuration keys into `.env.web` and `.env.raspi` as needed.

4. **Run locally for development:**
   ```bash
   npm start
   ```
   The application will launch on `http://localhost:3000`.

5. **Deploy to Firebase Hosting:**
   ```bash
   npm run build
   firebase deploy
   ```

## Local Raspberry Pi Deployment
The Raspberry Pi runs the same build folder locally using `serve` and `pm2`, configured to launch automatically in Chromium kiosk mode.  
Refer to `DeploymentSummary.md` for detailed setup and automation steps.

## Relevant File Structure
nana-calendar/
│
├── public/                     # Static assets and index.html
├── src/
│   ├── components/
│   │   ├── CalendarView/       # Main calendar component
│   │   ├── DateTimeDisplay/    # Displays current date and time
│   │   ├── EventCreator/       # Handles event creation
│   │   ├── PhotoDisplay/       # Rotating photo display
│   │   ├── PhotoManager/       # Full photo management interface
│   │   ├── WeatherDisplay/     # Displays local weather
│   │   └── ...                 # Other supporting UI components
│   ├── App.js                  # Root application component
│   ├── firebase.js             # Firebase initialization
│   ├── auth.js                 # Authentication setup
│   ├── index.js                # Application entry point
│   ├── App.css / index.css     # Styling
│   └── serviceWorkerRegistration.js # Service workers allow caching photos for offline use
│
├── .env.web                    # Firebase config for web version
├── .env.raspi                  # Firebase config for Raspberry Pi version
├── package.json
└── firebase.json               # Firebase hosting configuration

# Nana's Digital Photo Calendar

## 🌟 Project Overview

This project is a personalized digital calendar application designed for my Nana. It aims to provide an always-on display (e.g., on a vertical monitor/TV) featuring a rotating display of personal photos and a comprehensive calendar with events, holidays, and reminders. The application will allow for photo uploads and calendar management, with potential integration with existing phone calendar services.

## ✨ Core Features

*   **Photo Display:**
    *   Top section of the screen dedicated to displaying personal photos.
    *   Ability to upload photos.
    *   Photos rotate in a slideshow format.
*   **Calendar Display:**
    *   Bottom section of the screen displaying a monthly calendar.
    *   Shows events, holidays, and reminders.
    *   Ability to add/edit/delete personal events.
*   **Potential Integrations:**
    *   Sync with Google Calendar (or other phone calendar services) for events.
    *   Fetch photos from cloud services (e.g., Google Photos).
    *   Display public holidays via an API.

## 🛠️ Tech Stack

*   **Frontend:** React
    *   State Management: React Context API / Zustand (to be decided based on complexity)
    *   Calendar Library: [React Big Calendar](https://github.com/jquense/react-big-calendar) or [FullCalendar for React](https://fullcalendar.io/docs/react) (to be evaluated)
    *   Photo Slideshow: Custom component or a library like `react-slideshow-image`.
*   **Backend (BaaS):** Firebase
    *   **Firestore:** NoSQL database for storing calendar events, photo metadata (URLs).
    *   **Firebase Storage:** For storing uploaded photo files.
    *   **Firebase Authentication:** (Optional, for managing access if needed, e.g., for an admin upload interface).
*   **Styling:** CSS Modules / Styled Components / Tailwind CSS (to be decided)
*   **Deployment Target (Conceptual):** Raspberry Pi / Mini-PC connected to a vertical monitor, running the web application in a browser (kiosk mode).

## ⚙️ Project Setup & Installation

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v9.x or later) or yarn

### Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Firebase Setup:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   In your Firebase project, navigate to Project Settings and add a new "Web app" (</> icon).
    *   Firebase will provide you with a configuration object. Copy these credentials.
    *   Create a `.env` file in the root of your project (e.g., `nana-calendar/.env`) and add your Firebase configuration keys. **Do NOT commit this file to Git.**
        ```env
        REACT_APP_FIREBASE_API_KEY="YOUR_API_KEY"
        REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        REACT_APP_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        REACT_APP_FIREBASE_APP_ID="YOUR_APP_ID"
        ```
    *   Ensure your `src/firebase.js` (or `src/services/firebase.js`) file is set up to use these environment variables:
        ```javascript
        // src/firebase.js
        import { initializeApp } from "firebase/app";
        import { getFirestore } from "firebase/firestore";
        import { getStorage } from "firebase/storage";
        // import { getAuth } from "firebase/auth"; // If using authentication

        const firebaseConfig = {
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.REACT_APP_FIREBASE_APP_ID,
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const storage = getStorage(app);
        // const auth = getAuth(app); // If using authentication

        export { db, storage /*, auth */ };
        ```
    *   In the Firebase console:
        *   Enable **Firestore Database**. Start in **test mode** for initial development (remember to secure rules later!).
        *   Enable **Firebase Storage**. Set up basic security rules (similar to Firestore, start with test mode and secure later).

4.  **Running the Development Server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    This will open the app in your default browser, usually at `http://localhost:3000`.

## 🎨 Project Structure (Example)

NanaCalendar/
├── .git/
├── node_modules/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable UI components
│   │   ├── PhotoDisplay/
│   │   └── CalendarView/
│   ├── services/           # Firebase config and service functions
│   │   └── firebase.js
│   ├── App.js              # Main application component
│   ├── App.css             # Main app styles
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── .env                    # Firebase API keys (DO NOT COMMIT)
├── .gitignore
├── package.json
├── README.md
└── yarn.lock or package-lock.json

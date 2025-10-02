/**
 * @file index.js
 * @description The entry point of the React application. This file is responsible for
 * rendering the root component into the DOM. It also acts as an authentication gate,
 * displaying a login page for unauthorized users and the main App component for
 * authenticated and whitelisted users.
 */

import React, { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth"; // Firebase auth state listener
import ReactDOM from "react-dom/client";

import App from "./App";
import { login, loginWithToken, logout } from "./auth.js";
import { auth } from "./firebase.js";
import * as serviceWorker from './serviceWorkerRegistration.js';

import "./index.css";

// A whitelist of email addresses permitted to access the application.
const allowedEmails = ["clogan1227@gmail.com", "ekandoll@hotmail.com", "Ekandoll@hotmail.com", "kiosk@nanacalendar.com"];

/**
 * A root wrapper component that handles the application's authentication logic.
 */
function Root() {
  // Holds the authenticated user object, or null if not logged in.
  const [user, setUser] = useState(null);
  // Manages the initial loading state while checking for an active session.
  const [loading, setLoading] = useState(true);
  // State for the email input field on the login form.
  const [email, setEmail] = useState("");
  // State for the password input field on the login form.
  const [password, setPassword] = useState("");
  // Stores any error messages that occur during login.
  const [error, setError] = useState("");

  /**
   * This effect sets up a listener for Firebase authentication state changes.
   * It runs once on component mount, checks the current user's status, and updates
   * the state accordingly. The returned function cleans up the listener on unmount.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && allowedEmails.includes(currentUser.email)) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup function to remove the listener and prevent memory leaks.
    return () => unsubscribe();
  }, []);

  // Auto-login if kiosk_token param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kioskToken = params.get("kiosk_token");

    if (kioskToken) {
      (async () => {
        try {
          console.log("Found kiosk token, logging in...");
          await loginWithToken(kioskToken);
        } catch (err) {
          console.error("Kiosk login failed", err);
          setLoading(false);
        }
      })();
    }
  }, []);

  /**
   * This effect adds a global keyboard event listener.
   * It allows the authenticated user to log out by pressing the "Escape" key.
   */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        logout();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup function to remove the event listener when the component unmounts.
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Handles the login process when the user clicks the login button.
   * It performs a client-side check against the allowed emails list before
   * attempting to authenticate with Firebase.
   */
  const handleLogin = async () => {
    try {
      // Failsafe to prevent unnecessary Firebase calls for non-whitelisted emails.
      if (!allowedEmails.includes(email)) {
        setError("This account is not allowed.");
        return;
      }
      await login(email, password);
      setError(""); // Clear previous errors on successful login attempt
    } catch (err) {
      setError(err.message);
    }
  };

  // Displays a loading indicator while the initial auth state is being determined.
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no authenticated and whitelisted user exists, render the login form.
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Nana's Calendar!</h1>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
          {error && <p className="login-error">{error}</p>}
        </div>
      </div>
    );
  }

  // If a user is successfully authenticated, render the main application.
  return <App />;
}

// Standard React 18 initialization to render the Root component into the DOM.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

serviceWorker.register();
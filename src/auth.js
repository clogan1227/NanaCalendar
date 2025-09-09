/**
 * @file auth.js
 * @description This module centralizes Firebase Authentication logic. It provides
 * reusable functions for handling user login and logout processes throughout the
 * application.
 */

import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

import { auth } from "./firebase.js"; // The initialized Firebase auth instance

/**
 * Signs in a user with their email and password. It sets the session persistence
 * to 'local' to keep the user logged in across browser sessions.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @throws Will re-throw any errors from Firebase for the calling function to handle.
 */
export async function login(email, password) {
    try {
        // Ensures the user's session persists even after the browser tab is closed.
        await setPersistence(auth, browserLocalPersistence);

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );
        console.log("User logged in:", userCredential.user);
    } catch (error) {
        console.error("Error logging in:", error.message);
        // Propagate the error so the UI layer can catch it and display a message.
        throw error;
    }
}

/**
 * Signs out the currently authenticated user.
 */
export async function logout() {
    try {
        await signOut(auth);
        console.log("User signed out");
    } catch (error) {
        console.error("Error signing out:", error.message);
    }
}
/**
 * @file PhotoDisplay.js
 * @description This component is the main background feature of the application.
 * It fetches photos from Firestore in real-time and displays them in a continuous,
 * cross-fading slideshow. It also serves as a host for the InfoOverlay.
 */

import React, { useState, useEffect } from "react";

import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

import { db } from "../../firebase";
import InfoOverlay from "../InfoOverlay/InfoOverlay";

import "./PhotoDisplay.css";

// Defines the duration each photo is visible in the slideshow, in milliseconds.
const SLIDESHOW_VISIBLE_DURATION_MS = 10000; // 10 seconds

function PhotoDisplay({ showMenuButton, onOpenMenu }) {
    // Stores the array of photo objects fetched from Firestore.
    const [photos, setPhotos] = useState([]);
    // Manages the initial loading state while photos are being fetched.
    const [isLoading, setIsLoading] = useState(true);
    // The index of the currently visible photo in the `photos` array.
    const [activeIndex, setActiveIndex] = useState(0);
    // A boolean to control which of the two image elements is on top for the cross-fade.
    const [isImageA_OnTop, setIsImageA_OnTop] = useState(true);

    /**
     * This effect runs once on component mount to establish a real-time listener
     * to the 'photos' collection in Firestore, ordered by their creation date.
     * The `onSnapshot` function automatically updates the component when data changes.
     */
    useEffect(() => {
        setIsLoading(true);
        const photosCollectionRef = collection(db, "photos");
        const q = query(photosCollectionRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const photosData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setPhotos(photosData);
                setIsLoading(false);

                // After updating photos, ensure activeIndex is still valid.
                // This prevents errors if photos are deleted.
                setActiveIndex((prevIndex) => {
                    if (photosData.length === 0) return 0;
                    if (prevIndex >= photosData.length) return photosData.length - 1;
                    return prevIndex;
                });
            },
            (error) => {
                console.error("Error fetching photos: ", error);
                setIsLoading(false);
            },
        );

        // Cleanup function to remove the listener when the component unmounts.
        return () => unsubscribe();
    }, []);

    /**
     * This effect manages the slideshow timer. It runs whenever the active photo
     * changes. It sets a timeout to advance to the next slide after the specified duration.
     */
    useEffect(() => {
        // Only start the timer if we are not loading and there's more than one photo.
        if (!isLoading && photos.length > 1) {
            const timerId = setTimeout(() => {
                // Advance to the next photo, looping back to the start if at the end.
                setActiveIndex((prevIndex) => (prevIndex + 1) % photos.length);
                // Toggle which image element is on top to trigger the cross-fade effect.
                setIsImageA_OnTop((prev) => !prev);
            }, SLIDESHOW_VISIBLE_DURATION_MS);

            // Cleanup function to clear the timeout if the component unmounts or re-renders.
            return () => clearTimeout(timerId);
        }
    }, [activeIndex, photos, isLoading]);

    /**
     * A helper function to format a Firestore Timestamp into a readable string.
     * @param {object|null} timestamp - The Firestore Timestamp object.
     * @returns {string|null} The formatted date and time string, or null.
     */
    const formatPhotoTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== "function") {
            return null;
        }
        const date = timestamp.toDate();
        const dateOptions = { year: "numeric", month: "short", day: "numeric" };
        const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
        return `${date.toLocaleDateString(
            undefined,
            dateOptions,
        )} ${date.toLocaleTimeString(undefined, timeOptions)}`;
    };

    // Display a loading message during the initial data fetch.
    if (isLoading) {
        return (
            <div className="photo-display-section">
                <p>Loading photos...</p>
            </div>
        );
    }

    // Display a message and prompt if no photos have been uploaded yet.
    if (photos.length === 0) {
        return (
            <div className="photo-display-section">
                <InfoOverlay />
                {showMenuButton && (
                    <button className="photo-menu-btn" onClick={onOpenMenu} title="Open Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
                <div className="no-photos-message">
                    <h2>My Photos</h2>
                    <p>No photos uploaded yet. Use the menu to add photos!</p>
                </div>
            </div>
        );
    }

    // The currently visible image.
    const activeImage = photos[activeIndex];
    // The next image in the sequence, used for preloading in the background.
    const preloadImage = photos[(activeIndex + 1) % photos.length];

    return (
        <div className="photo-display-section">
            <InfoOverlay />
            {showMenuButton && (
                <button className="photo-menu-btn" onClick={onOpenMenu} title="Open Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
            <div className="photo-container">
                {/* These two image elements work together to create a cross-fade effect.
                One is always visible on top (zIndex: 2) while the other is hidden
                below (zIndex: 1), preloading the next image in the sequence. */}
                <img
                    key={isImageA_OnTop ? activeImage.id : preloadImage.id}
                    src={isImageA_OnTop ? activeImage.imageUrl : preloadImage.imageUrl}
                    alt={isImageA_OnTop ? activeImage.fileName : preloadImage.fileName}
                    className="slideshow-image"
                    style={{ zIndex: isImageA_OnTop ? 2 : 1 }}
                />
                <img
                    key={!isImageA_OnTop ? activeImage.id : preloadImage.id}
                    src={!isImageA_OnTop ? activeImage.imageUrl : preloadImage.imageUrl}
                    alt={!isImageA_OnTop ? activeImage.fileName : preloadImage.fileName}
                    className="slideshow-image"
                    style={{ zIndex: !isImageA_OnTop ? 2 : 1 }}
                />
            </div>
            {activeImage && activeImage.dateTaken && (
                <div className="photo-metadata-overlay">
                    <div className="photo-capture-date">
                        Taken: {formatPhotoTimestamp(activeImage.dateTaken)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoDisplay;
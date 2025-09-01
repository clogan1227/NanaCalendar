import React, { useState, useEffect } from 'react';
import './PhotoDisplay.css';
import InfoOverlay from '../InfoOverlay/InfoOverlay';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const SLIDESHOW_VISIBLE_DURATION_MS = 10000; // 10 seconds

function PhotoDisplay({ showMenuButton, onOpenMenu }) {
    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // This effect runs once to set up a real-time listener for photos from Firestore.
    useEffect(() => {
        setIsLoading(true);
        const photosCollectionRef = collection(db, "photos");
        const q = query(photosCollectionRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const photosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPhotos(photosData);
            setIsLoading(false);

            // When the photo list updates, ensure the current index is still valid.
            setCurrentPhotoIndex(prevIndex => {
                if (photosData.length === 0) return 0;
                if (prevIndex >= photosData.length) return photosData.length - 1; // Go to last photo
                return prevIndex;
            });
        }, (error) => {
            console.error("Error fetching photos: ", error);
            setIsLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs only once

    // This effect is responsible for advancing the slide after a delay.
    useEffect(() => {
        // Only run the slideshow if there is more than one photo
        if (!isLoading && photos.length > 1) {
            const timerId = setTimeout(() => {
                setCurrentPhotoIndex(prevIndex => (prevIndex + 1) % photos.length);
            }, SLIDESHOW_VISIBLE_DURATION_MS);

            // Clear the timer if the component unmounts or dependencies change
            return () => clearTimeout(timerId);
        }
    }, [currentPhotoIndex, photos, isLoading]); // Re-run when the slide or photo list changes

    // Helper function to format Firestore Timestamps
    const formatPhotoTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== 'function') {
            return null;
        }
        const date = timestamp.toDate();
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="photo-display-section">
                <p>Loading photos...</p>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="photo-display-section">
                <InfoOverlay />
                {/* The new menu button is also shown here */}
                {showMenuButton && (
                    <button className="photo-menu-btn" onClick={onOpenMenu} title="Open Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
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

    const currentPhoto = photos[currentPhotoIndex];

    return (
        <div className="photo-display-section">
            <InfoOverlay />

            {/* The new menu button, conditionally rendered */}
            {showMenuButton && (
                <button className="photo-menu-btn" onClick={onOpenMenu} title="Open Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                    </svg>
                </button>
            )}

            {currentPhoto ? (
                <>
                    <img
                        key={currentPhoto.id}
                        src={currentPhoto.imageUrl}
                        alt={currentPhoto.fileName || `Slide ${currentPhotoIndex + 1}`}
                        className="displayed-photo"
                        // The style prop for opacity and transition has been removed
                    />
                    {(currentPhoto.fileName || currentPhoto.dateTaken) && (
                        <div className="photo-metadata-overlay">
                            {currentPhoto.fileName && (
                                <div className="photo-filename">{currentPhoto.fileName}</div>
                            )}
                            {currentPhoto.dateTaken && (
                                <div className="photo-capture-date">
                                    Taken: {formatPhotoTimestamp(currentPhoto.dateTaken)}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                // This fallback is for the rare case where photos exist but currentPhoto is somehow null
                <p>Error displaying photo.</p>
            )}
        </div>
    );
}

export default PhotoDisplay;
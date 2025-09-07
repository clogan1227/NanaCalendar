import React, { useState, useEffect } from 'react';
import './PhotoDisplay.css';
import InfoOverlay from '../InfoOverlay/InfoOverlay';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const SLIDESHOW_VISIBLE_DURATION_MS = 10000; // 10 seconds

function PhotoDisplay({ showMenuButton, onOpenMenu }) {
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isImageA_OnTop, setIsImageA_OnTop] = useState(true);

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

            setActiveIndex(prevIndex => {
                if (photosData.length === 0) return 0;
                if (prevIndex >= photosData.length) return photosData.length - 1;
                return prevIndex;
            });
        }, (error) => {
            console.error("Error fetching photos: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isLoading && photos.length > 1) {
            const timerId = setTimeout(() => {
                setActiveIndex(prevIndex => (prevIndex + 1) % photos.length);
                setIsImageA_OnTop(prev => !prev);
            }, SLIDESHOW_VISIBLE_DURATION_MS);

            return () => clearTimeout(timerId);
        }
    }, [activeIndex, photos, isLoading]); // This effect correctly re-runs when the active photo changes

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

    const preloadIndex = (activeIndex + 1) % photos.length;
    const topImage = photos[activeIndex];
    const bottomImage = photos[preloadIndex];

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
                {topImage && (
                    <img
                        key={isImageA_OnTop ? topImage.id : bottomImage.id}
                        src={isImageA_OnTop ? topImage.imageUrl : bottomImage.imageUrl}
                        alt={isImageA_OnTop ? topImage.fileName : bottomImage.fileName}
                        className="slideshow-image"
                        style={{ zIndex: isImageA_OnTop ? 2 : 1 }}
                    />
                )}
                {bottomImage && (
                    <img
                        key={!isImageA_OnTop ? topImage.id : bottomImage.id}
                        src={!isImageA_OnTop ? topImage.imageUrl : bottomImage.imageUrl}
                        alt={!isImageA_OnTop ? topImage.fileName : bottomImage.fileName}
                        className="slideshow-image"
                        style={{ zIndex: !isImageA_OnTop ? 2 : 1 }}
                    />
                )}
            </div>
            {topImage && topImage.dateTaken && (
                <div className="photo-metadata-overlay">
                    <div className="photo-capture-date">
                        Taken: {formatPhotoTimestamp(topImage.dateTaken)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoDisplay;
import React, { useState, useEffect, useRef } from 'react';
import './PhotoDisplay.css';
import InfoOverlay from '../InfoOverlay/InfoOverlay';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const FADE_DURATION_MS = 1000; // 1 second
const SLIDESHOW_VISIBLE_DURATION_MS = 10000; // 10 seconds

function PhotoDisplay() {
    const [photos, setPhotos] = useState([]); // To store photo data from Firestore
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true); // To show a loading state
    const [imageOpacity, setImageOpacity] = useState(1); // Target opacity for current image

    const slideshowTimerRef = useRef(null); // Timer for visible duration
    const changeImageSrcTimerRef = useRef(null); // Timer to delay src change after fade out

    // Effect for fetching photos from Firestore
    useEffect(() => {
        setIsLoading(true);
        const photosCollectionRef = collection(db, "photos")
        const q = query(photosCollectionRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const photosData = [];
            querySnapshot.forEach((doc) => {
                photosData.push({ id: doc.id, ...doc.data() });
            });
            setPhotos(photosData);
            setIsLoading(false);

            // If photos change, reset index to 0 to avoid out-of-bounds, especially if the number of photos decreases.
            setCurrentPhotoIndex(prevIndex => { // prevIndex is the current value of currentPhotoIndex
            if (photosData.length > 0 && prevIndex >= photosData.length) {
                return 0;
            }
            if (photosData.length === 0) {
                return 0;
            }
            return prevIndex; // No change needed
            });

        }, (error) => {
            console.error("Error fetching photos: ", error);
            setIsLoading(false);
        });

        // Cleanup: Unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array: runs once on mount and cleans up on unmount

    // Effect: Adjust index and ensure visibility when 'photos' array changes
    useEffect(() => {
        if (!isLoading) {
            // We use the functional update form of setCurrentPhotoIndex.
            // This allows us to calculate the new index based on the previous index
            // and the current 'photos' state, without needing 'currentPhotoIndex'
            // as a direct dependency for this specific adjustment logic.
            setCurrentPhotoIndex(prevCurrentPhotoIndex => {
                let newIndex = prevCurrentPhotoIndex;

                if (photos.length === 0) {
                    newIndex = 0;
                } else if (prevCurrentPhotoIndex >= photos.length) {
                    // If current index is now out of bounds, set to the last valid photo index.
                    newIndex = photos.length - 1;
                }
                // If newIndex is different from prevCurrentPhotoIndex, React will update the state.
                // If it's the same, React will bail out of the update.
                return newIndex;
            });

            // If the photos array changes but the index *doesn't* (e.g. content update, or single photo),
            // we want to ensure it's visible.
            // If the index *does* change, "Effect 2" (for fade-in) will handle opacity.
            // Let's make this conditional.
            // We can check if the index *would have* changed.
            let potentialNewIndex = currentPhotoIndex; // Read current for this specific logic
            if (photos.length === 0) {
                potentialNewIndex = 0;
            } else if (currentPhotoIndex >= photos.length) {
                potentialNewIndex = photos.length - 1;
            }

            if (potentialNewIndex === currentPhotoIndex) {
                // If the index isn't going to change due to photos array adjustment,
                // but photos array itself might have changed (or it's initial load),
                // ensure current image is visible.
                // setImageOpacity(1);
            }
            // If currentPhotoIndex *will* change due to the setCurrentPhotoIndex above,
            // then "Effect 2" (which depends on currentPhotoIndex) will run and handle the fade-in.
        }
    }, [photos, isLoading, currentPhotoIndex, setImageOpacity]);

    // Effect 1: Manages FADE-OUT and triggers SRC CHANGE
    useEffect(() => {
        // Clear any pending timers
        if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
        if (changeImageSrcTimerRef.current) clearTimeout(changeImageSrcTimerRef.current);

        if (!isLoading && photos.length > 1) {
            if (imageOpacity === 1) {
                // Current image is visible, set timer to fade it out
                slideshowTimerRef.current = setTimeout(() => {
                    setImageOpacity(0); // Trigger fade-out
                }, SLIDESHOW_VISIBLE_DURATION_MS);
            } else if (imageOpacity === 0) {
                // Current image has been told to fade out (or is faded out)
                // Now, wait for the fade-out duration, then change the src
                changeImageSrcTimerRef.current = setTimeout(() => {
                    setCurrentPhotoIndex(prevIndex => (prevIndex + 1) % photos.length);
                    // DO NOT set imageOpacity back to 1 here. The next useEffect will handle that.
                }, FADE_DURATION_MS);
            }
        } else if (photos.length <= 1 && !isLoading) {
            // Not slideshowing, ensure image is visible
            setImageOpacity(1);
        }

        return () => {
            if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
            if (changeImageSrcTimerRef.current) clearTimeout(changeImageSrcTimerRef.current);
        };
    // This effect depends on when imageOpacity changes to 0 to trigger the src change
    }, [isLoading, photos, imageOpacity]);

  // Effect 2: Manages FADE-IN when currentPhotoIndex changes (new image src)
    useEffect(() => {
        if (!isLoading && photos.length > 0) {
            setImageOpacity(0); // Ensure the new image starts transparent

            const fadeInTimer = setTimeout(() => {
                setImageOpacity(1); // Trigger the fade-in
            }, 50); // A small delay (e.g., 10-50ms) is often enough

            return () => clearTimeout(fadeInTimer);
        } else if (!isLoading && photos.length === 0) {
            // If all photos are removed, ensure opacity is reset (though no image will show)
            setImageOpacity(1); // Or 0, depending on desired "empty" state appearance
        }
    // This effect runs when currentPhotoIndex changes, ensuring the new image fades in.
    }, [currentPhotoIndex, isLoading, photos.length]); // photos.length in case photos disappear

    if (isLoading) {
        return (
            <div className="photo-display-section">
                <h2>My Photos</h2>
                <p>Loading photos...</p>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="photo-display-section">
                <h2>My Photos</h2>
                <p>No photos uploaded yet. Use the upload button below!</p>
            </div>
        );
    }

    const currentPhoto = photos.length > 0 ? photos[currentPhotoIndex] : null;

    return (
        <div className="photo-display-section">
            <InfoOverlay />
            {currentPhoto ? (
                <img
                    key={currentPhoto.id} // Important for React to see it as a new element
                    src={currentPhoto.imageUrl}
                    alt={currentPhoto.fileName || `Slide ${currentPhotoIndex + 1}`}
                    className="displayed-photo"
                    style={{
                        opacity: imageOpacity,
                        transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`
                    }}
                />
            ) : (
                <p>Error displaying photo.</p>
            )}
        </div>
    );
}

export default PhotoDisplay;

/**
 * @file PhotoManager.js
 * @description This is a container component that provides the UI for managing photos.
 * It handles fetching all photos from Firestore, displaying them in a grid, managing
 * photo selection for bulk actions, and controlling the file upload and deletion processes
 * by communicating with the root App component.
 */

import React, { useState, useEffect } from "react";

import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

import { db } from "../../firebase";
import PhotoDetails from "../PhotoDetails/PhotoDetails";
import PhotoGridItem from "../PhotoGridItem/PhotoGridItem";

import "./PhotoManager.css";

function PhotoManager({ isOpen, onClose, onUploadMultiple, onDelete, onMultiDelete }) {
    // Stores the array of all photo objects fetched from Firestore.
    const [allPhotos, setAllPhotos] = useState([]);
    // Manages the loading state while photos are being fetched.
    const [isLoading, setIsLoading] = useState(true);
    // Stores files selected by the user from the file input before they are uploaded.
    const [filesToUpload, setFilesToUpload] = useState([]);
    // An array of photo IDs that the user has checked for bulk deletion.
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    // Holds the photo object for the PhotoDetails modal, or null if it's closed.
    const [viewingPhoto, setViewingPhoto] = useState(null);

    /**
     * This effect sets up a real-time Firestore listener for the photos collection.
     * It only runs when the component is visible (`isOpen` is true) to fetch the
     * latest data. The returned function cleans up the listener when the component
     * is closed or unmounted, preventing memory leaks and unnecessary data fetching.
     */
    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const photosData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllPhotos(photosData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isOpen]);

    // A guard clause to prevent rendering the component when it is not open.
    if (!isOpen) return null;

    // Updates the state with the files the user has selected from their computer.
    const handleFileSelect = (e) => setFilesToUpload(Array.from(e.target.files));

    // Triggers the upload process via the parent component and resets the file input.
    const handleUploadClick = () => {
        if (filesToUpload.length > 0) {
            onUploadMultiple(filesToUpload);
            setFilesToUpload([]);
            document.getElementById("photo-upload-input").value = "";
        }
    };

    // Toggles the selection status of a photo for bulk actions.
    const handlePhotoSelect = (photoId) => {
        setSelectedPhotos((prev) =>
            prev.includes(photoId)
                ? prev.filter((id) => id !== photoId) // Unselect if already selected
                : [...prev, photoId], // Select if not already selected
        );
    };

    // Gathers the full photo objects of selected items and triggers the bulk delete process.
    const handleDeleteSelected = () => {
        const photosToDelete = allPhotos.filter((p) =>
            selectedPhotos.includes(p.id),
        );
        if (photosToDelete.length > 0) {
            onMultiDelete(photosToDelete);
            setSelectedPhotos([]); // Clear the selection after deletion.
        }
    };

    return (
        <>
            <div className="photo-manager-overlay">
                <div className="photo-manager-header">
                    <h1>Manage Photos</h1>
                    <button onClick={onClose} className="close-button">
                        &times;
                    </button>
                </div>

                <div className="photo-manager-actions">
                    <div className="upload-section">
                        <input
                            type="file"
                            id="photo-upload-input"
                            multiple
                            onChange={handleFileSelect}
                            accept="image/*"
                        />
                        <button onClick={handleUploadClick} disabled={filesToUpload.length === 0}>
                            Upload {filesToUpload.length > 0 ? `${filesToUpload.length} Photo(s)` : ""}
                        </button>
                    </div>
                    <div className="delete-section">
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedPhotos.length === 0}
                        >
                            Delete ({selectedPhotos.length}) Selected
                        </button>
                    </div>
                </div>

                <div className="photo-manager-grid">
                    {isLoading && <p>Loading photos...</p>}
                    {!isLoading &&
                        allPhotos.map((photo) => (
                            <PhotoGridItem
                                key={photo.id}
                                photo={photo}
                                isSelected={selectedPhotos.includes(photo.id)}
                                onSelect={() => handlePhotoSelect(photo.id)}
                                onView={() => setViewingPhoto(photo)}
                                onDelete={() => onDelete(photo)}
                            />
                        ))}
                </div>
            </div>
            {/* The PhotoDetails modal is only rendered when a photo is being viewed. */}
            {viewingPhoto && (
                <PhotoDetails
                    photo={viewingPhoto}
                    onClose={() => setViewingPhoto(null)}
                    onDelete={() => {
                        onDelete(viewingPhoto);
                        setViewingPhoto(null); // Also close the modal after deletion.
                    }}
                />
            )}
        </>
    );
}

export default PhotoManager;
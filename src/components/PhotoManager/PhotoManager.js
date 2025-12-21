import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, limit, startAfter, getCountFromServer } from "firebase/firestore";

import { db } from "../../firebase";
import PhotoDetails from "../PhotoDetails/PhotoDetails";
import PhotoGridItem from "../PhotoGridItem/PhotoGridItem";

import "./PhotoManager.css";

const PHOTOS_PER_PAGE = 50;

function PhotoManager({ isOpen, onClose, onUploadMultiple, onDelete, onMultiDelete }) {
    const [currentPhotos, setCurrentPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [viewingPhoto, setViewingPhoto] = useState(null);

    // PAGINATION STATE
    const [lastVisible, setLastVisible] = useState(null);
    const [pageStack, setPageStack] = useState([]);
    const [cursor, setCursor] = useState(null);

    // STATS STATE
    const [totalPhotos, setTotalPhotos] = useState(0);

    const containerRef = useRef(null);

    /**
     * Effect: Scroll to top whenever the page changes (cursor updates)
     */
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [cursor]);

    const resetPagination = () => {
        setCursor(null);
        setPageStack([]);
        setLastVisible(null);
    };

    /**
     * Effect 1: Fetch TOTAL count (Runs once when opened)
     */
    useEffect(() => {
        if (!isOpen) return;

        const fetchCount = async () => {
            try {
                const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
                const snapshot = await getCountFromServer(q);
                setTotalPhotos(snapshot.data().count);
            } catch (err) {
                console.error("Failed to get count", err);
            }
        };

        fetchCount();
    }, [isOpen]);

    /**
     * Effect 2: Fetch Photos (Pagination Logic)
     */
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);

        let q = query(
            collection(db, "photos"),
            orderBy("createdAt", "desc"),
            limit(PHOTOS_PER_PAGE)
        );

        if (cursor) {
            q = query(
                collection(db, "photos"),
                orderBy("createdAt", "desc"),
                startAfter(cursor),
                limit(PHOTOS_PER_PAGE)
            );
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const photosData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setCurrentPhotos(photosData);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, cursor]);

    if (!isOpen) return null;

    // --- CALCULATE STATS ---
    const currentPage = pageStack.length + 1;
    const startOffset = (currentPage - 1) * PHOTOS_PER_PAGE;
    const rangeStart = totalPhotos === 0 ? 0 : startOffset + 1;
    const rangeEnd = startOffset + currentPhotos.length;
    const displayTotal = Math.max(totalPhotos, rangeEnd);

    // --- HANDLERS ---
    const handleFilesSelected = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const filesToUpload = Array.from(event.target.files);
            resetPagination();
            setTotalPhotos(prev => prev + filesToUpload.length);
            onUploadMultiple(filesToUpload);
        }
    };

    const handlePhotoSelect = (photoId) => {
        setSelectedPhotos((prev) =>
            prev.includes(photoId)
                ? prev.filter((id) => id !== photoId)
                : [...prev, photoId],
        );
    };

    const handleDeleteSelected = () => {
        const photosToDelete = currentPhotos.filter((p) =>
            selectedPhotos.includes(p.id),
        );
        if (photosToDelete.length > 0) {
            onMultiDelete(photosToDelete);
            setSelectedPhotos([]);
            // Optimistically update total count
            setTotalPhotos(prev => Math.max(0, prev - photosToDelete.length));
        }
    };

    const handleNextPage = () => {
        if (!lastVisible) return;
        setPageStack((prev) => [...prev, cursor]);
        setCursor(lastVisible);
    };

    const handlePrevPage = () => {
        if (pageStack.length === 0) return;
        const newStack = [...pageStack];
        const prevCursor = newStack.pop();
        setPageStack(newStack);
        setCursor(prevCursor);
    };

    return (
        <>
            <div className="photo-manager-overlay" ref={containerRef}>
                <div className="photo-manager-header">
                    <h1>Manage Photos</h1>
                    <button onClick={onClose} className="close-button">
                        &times;
                    </button>
                </div>

                <div className="photo-manager-actions">
                    <div className="upload-section">
                        <label htmlFor="photo-upload-input" className="upload-label-button">
                            Upload Photos
                        </label>
                        <input
                            type="file"
                            id="photo-upload-input"
                            style={{ display: "none" }}
                            multiple
                            onChange={handleFilesSelected}
                            accept="image/*"
                        />
                    </div>
                    <div className="delete-section">
                        <button
                            className="delete-button-multi"
                            onClick={handleDeleteSelected}
                            disabled={selectedPhotos.length === 0}
                        >
                            Delete Selected ({selectedPhotos.length})
                        </button>
                    </div>
                </div>

                <div className="photo-manager-grid">
                    {isLoading && <p>Loading photos...</p>}

                    {!isLoading && currentPhotos.length === 0 && (
                        <div className="no-photos-message">No photos found.</div>
                    )}

                    {!isLoading &&
                        currentPhotos.map((photo) => (
                            <PhotoGridItem
                                key={photo.id}
                                photo={photo}
                                isSelected={selectedPhotos.includes(photo.id)}
                                onSelect={() => handlePhotoSelect(photo.id)}
                                onView={() => setViewingPhoto(photo)}
                                onDelete={() => {
                                    onDelete(photo);
                                    setTotalPhotos(prev => Math.max(0, prev - 1));
                                }}
                            />
                        ))}
                </div>

                {/* --- PAGINATION FOOTER --- */}
                <div className="pagination-footer">
                    <button
                        onClick={handlePrevPage}
                        disabled={pageStack.length === 0 || isLoading}
                        className="pagination-button"
                        aria-label="Previous Page" // Accessibility
                    >
                        &laquo; <span className="pagination-text">Previous</span>
                    </button>

                    <div className="pagination-info">
                        <span className="page-number">Page {currentPage}</span>
                        <span className="page-range">
                            {rangeStart}-{rangeEnd} of {displayTotal}
                        </span>
                    </div>

                    <button
                        onClick={handleNextPage}
                        disabled={currentPhotos.length < PHOTOS_PER_PAGE || isLoading}
                        className="pagination-button"
                        aria-label="Next Page" // Accessibility
                    >
                        <span className="pagination-text">Next</span> &raquo;
                    </button>
                </div>
            </div>

            {viewingPhoto && (
                <PhotoDetails
                    photo={viewingPhoto}
                    onClose={() => setViewingPhoto(null)}
                    onDelete={() => {
                        onDelete(viewingPhoto);
                        setTotalPhotos(prev => Math.max(0, prev - 1));
                        setViewingPhoto(null);
                    }}
                />
            )}
        </>
    );
}

export default PhotoManager;
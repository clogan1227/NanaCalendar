import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import './PhotoManager.css';
import PhotoGridItem from '../PhotoGridItem/PhotoGridItem';
import PhotoDetails from '../PhotoDetailModal/PhotoDetails';

function PhotoManager({ isOpen, onClose, onUploadMultiple, onDelete, onMultiDelete }) {
    const [allPhotos, setAllPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [selectedPhotos, setSelectedPhotos] = useState([]); // Store IDs of selected photos
    const [viewingPhoto, setViewingPhoto] = useState(null); // Photo object for detail view

    // Fetch all photos from Firestore
    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const photosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllPhotos(photosData);
        setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = (e) => setFilesToUpload(Array.from(e.target.files));

    const handleUploadClick = () => {
        if (filesToUpload.length > 0) {
        onUploadMultiple(filesToUpload);
        setFilesToUpload([]);
        document.getElementById('photo-upload-input').value = '';
        }
    };

    const handlePhotoSelect = (photoId) => {
        setSelectedPhotos(prev =>
        prev.includes(photoId)
            ? prev.filter(id => id !== photoId) // Unselect
            : [...prev, photoId] // Select
        );
    };

    const handleDeleteSelected = () => {
        const photosToDelete = allPhotos.filter(p => selectedPhotos.includes(p.id));
        if (photosToDelete.length > 0) {
        onMultiDelete(photosToDelete);
        setSelectedPhotos([]); // Clear selection
        }
    };

    return (
        <>
        <div className="photo-manager-overlay">
            <div className="photo-manager-header">
                <h1>Manage Photos</h1>
                <button onClick={onClose} className="close-button">&times;</button>
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
                        Upload {filesToUpload.length > 0 ? `${filesToUpload.length} Photo(s)` : ''}
                    </button>
                </div>
                <div className="delete-section">
                    <button onClick={handleDeleteSelected} disabled={selectedPhotos.length === 0}>
                        Delete ({selectedPhotos.length}) Selected
                    </button>
                </div>
            </div>

            <div className="photo-manager-grid">
                {isLoading && <p>Loading photos...</p>}
                {!isLoading && allPhotos.map(photo => (
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
        {viewingPhoto && (
            <PhotoDetails
                photo={viewingPhoto}
                onClose={() => setViewingPhoto(null)}
                onDelete={() => {
                    onDelete(viewingPhoto);
                    setViewingPhoto(null); // Close modal after delete
                }}
            />
        )}
        </>
    );
}

export default PhotoManager;
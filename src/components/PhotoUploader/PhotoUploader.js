import React, { useState } from 'react';
import './PhotoUploader.css';

function PhotoUploader({ isOpen, onClose, onUpload }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setMessage(""); // Clear any previous messages
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setMessage("Uploading, please wait...");

        try {
            // Call the async upload function passed from App.js
            await onUpload(selectedFile);

            setMessage("Upload successful!");
            // Close the modal after a short delay
            setTimeout(() => {
                onClose();
                // Reset state for next time it opens
                setSelectedFile(null);
                setIsUploading(false);
                setMessage("");
            }, 1500);

        } catch (error) {
            console.error("Upload failed:", error);
            setMessage(`Error: ${error.message}`);
            setIsUploading(false); // Allow user to try again
        }
    };

    // Use a separate function to handle closing to reset state
    const handleClose = () => {
        if (isUploading) return; // Don't allow closing while uploading
        onClose();
        setSelectedFile(null);
        setMessage("");
    };

    return (
        <div className="photo-uploader-modal">
            <div className="photo-uploader-content">
                <h3>Upload New Photo</h3>
                <input type="file" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                <div className="uploader-message">{message}</div>
                <div className="uploader-buttons">
                    <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                        {isUploading ? "Uploading..." : "Upload"}
                    </button>
                    <button onClick={handleClose} disabled={isUploading}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
  );
}

export default PhotoUploader;
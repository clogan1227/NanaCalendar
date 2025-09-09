/**
 * @file PhotoDetails.js
 * @description A modal component that displays a larger view of a selected photo
 * along with its associated metadata, such as filename, date taken, and camera model.
 * It also provides an option to delete the photo.
 */

import React from "react";

import "./PhotoDetails.css";

function PhotoDetails({ photo, onClose, onDelete }) {
    /**
     * A robust helper function to format a Firestore Timestamp into a readable string.
     * It safely handles cases where the timestamp might be null or not a valid object.
     * @param {object|null} timestamp - The Firestore Timestamp object.
     * @returns {string} The formatted local date and time string, or 'N/A'.
     */
    const formatTimestamp = (timestamp) => {
        // Failsafe to prevent errors if the timestamp is missing or not a valid object.
        if (!timestamp || typeof timestamp.toDate !== "function") return "N/A";
        return timestamp.toDate().toLocaleString();
    };

    return (
        // The full-screen overlay that captures clicks to close the modal.
        <div className="photo-detail-overlay" onClick={onClose}>
            {/*
			 * The modal content. The onClick handler stops the click event from
			 * bubbling up to the overlay, which would incorrectly close the modal.
			 */}
            <div
                className="photo-detail-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="close-detail-button">
                    &times;
                </button>
                <div className="photo-detail-image-container">
                    <img src={photo.imageUrl} alt={photo.fileName} />
                </div>
                <div className="photo-detail-metadata">
                    <h3>Details</h3>
                    <p>
                        <strong>Filename:</strong> {photo.fileName || "N/A"}
                    </p>
                    <p>
                        <strong>Date Taken:</strong> {formatTimestamp(photo.dateTaken)}
                    </p>
                    <p>
                        <strong>Date Uploaded:</strong> {formatTimestamp(photo.createdAt)}
                    </p>
                    <p>
                        <strong>Camera:</strong> {photo.cameraMake || "N/A"}{" "}
                        {photo.cameraModel || ""}
                    </p>
                    <button onClick={onDelete} className="button-danger">
                        Delete Photo
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PhotoDetails;
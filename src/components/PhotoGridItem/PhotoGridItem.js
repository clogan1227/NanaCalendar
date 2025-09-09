/**
 * @file PhotoGridItem.js
 * @description A presentational component that represents a single photo thumbnail
 * in the PhotoManager grid. It displays the image and provides interactive controls
 * for selecting, viewing details, and deleting the photo.
 */

import React from "react";

import "./PhotoGridItem.css";

function PhotoGridItem({ photo, isSelected, onSelect, onView, onDelete }) {
    /**
    -	 * Handles the click event on the delete button. It stops the event from
    -	 * propagating to the parent div, which would incorrectly trigger the `onView`
    -	 * handler for the detail modal.
     * @param {React.MouseEvent} e - The click event object.
     */
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        // The main container's class changes based on its selection state.
        <div className={`photo-grid-item ${isSelected ? "selected" : ""}`}>
            {/* The 'loading="lazy"' attribute is a browser-native optimization that
            defers loading the image until it is about to enter the viewport. */}
            <img src={photo.imageUrl} alt={photo.fileName} loading="lazy" onClick={onView} />

            {/* An overlay that also triggers the detail view when clicked. */}
            <div className="photo-item-overlay" onClick={onView}></div>

            {/* A checkbox to handle the selection state for multi-delete actions. */}
            <input
                type="checkbox"
                className="selection-checkbox"
                checked={isSelected}
                onChange={onSelect}
            />

            {/* A button to trigger the deletion of this specific photo. */}
            <button
                onClick={handleDeleteClick}
                className="delete-photo-button"
                title="Delete Photo"
            >
                &times;
            </button>
        </div>
    );
}

export default PhotoGridItem;
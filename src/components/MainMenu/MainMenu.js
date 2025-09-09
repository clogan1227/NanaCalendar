/**
 * @file MainMenu.js
 * @description A modal component that serves as the main navigation menu for the application.
 * It provides options to navigate to different management pages like the Photo Manager
 * and the Manual Event Creator.
 */

import React from "react";

import "./MainMenu.css";

function MainMenu({ isOpen, onClose, onOpenPhotoManager, onOpenAddEvent }) {
    // A guard clause to prevent the component from rendering when it's not open.
    if (!isOpen) return null;

    return (
        // The full-screen overlay that captures clicks to close the menu.
        <div className="main-menu-modal-overlay" onClick={onClose}>
            {/*
			 * The actual menu content. The onClick handler here is crucial:
			 * it stops the click event from "bubbling up" to the overlay,
			 * which would otherwise trigger the onClose function.
			 */}
            <div
                className="main-menu-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Menu</h2>
                <div className="main-menu-options">
                    <button onClick={onOpenPhotoManager} className="menu-button">
                        🖼️ Manage Photos
                    </button>
                    <button onClick={onOpenAddEvent} className="menu-button">
                        🗓️ Add Event by Date
                    </button>
                </div>
                <div className="main-menu-footer">
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default MainMenu;
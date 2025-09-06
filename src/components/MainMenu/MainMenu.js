import './MainMenu.css';

function MainMenu({ isOpen, onClose, onOpenPhotoManager, onOpenAddEvent }) {
    if (!isOpen) return null;

    return (
        <div className="main-menu-modal-overlay" onClick={onClose}>
            {/* Stop propagation to prevent closing when clicking inside the content */}
            <div className="main-menu-modal-content" onClick={(e) => e.stopPropagation()}>
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
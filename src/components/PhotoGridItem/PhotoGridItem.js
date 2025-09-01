import './PhotoGridItem.css';

function PhotoGridItem({ photo, isSelected, onSelect, onView, onDelete }) {
    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent opening the detail view when deleting
        onDelete();
    };

    return (
        <div className={`photo-grid-item ${isSelected ? 'selected' : ''}`}>
            <img src={photo.imageUrl} alt={photo.fileName} loading="lazy" onClick={onView} />
            <div className="photo-item-overlay" onClick={onView}></div>
            <input
                type="checkbox"
                className="selection-checkbox"
                checked={isSelected}
                onChange={onSelect}
            />
            <button onClick={handleDeleteClick} className="delete-photo-button" title="Delete Photo">
                &times;
            </button>
        </div>
    );
}

export default PhotoGridItem;
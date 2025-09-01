import './PhotoDetails.css';

function PhotoDetails({ photo, onClose, onDelete }) {
    const formatTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== 'function') return 'N/A';
        return timestamp.toDate().toLocaleString();
    };

    return (
        <div className="photo-detail-overlay" onClick={onClose}>
            <div className="photo-detail-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="close-detail-button">&times;</button>
                <div className="photo-detail-image-container">
                    <img src={photo.imageUrl} alt={photo.fileName} />
                </div>
                <div className="photo-detail-metadata">
                    <h3>Details</h3>
                    <p><strong>Filename:</strong> {photo.fileName || 'N/A'}</p>
                    <p><strong>Date Taken:</strong> {formatTimestamp(photo.dateTaken)}</p>
                    <p><strong>Date Uploaded:</strong> {formatTimestamp(photo.createdAt)}</p>
                    <p><strong>Camera:</strong> {photo.cameraMake || 'N/A'} {photo.cameraModel || ''}</p>
                    <button onClick={onDelete} className="button-danger">Delete Photo</button>
                </div>
            </div>
        </div>
  );
}

export default PhotoDetails;
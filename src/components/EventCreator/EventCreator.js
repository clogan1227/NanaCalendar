import React, { useState, useEffect } from 'react';
import './EventCreator.css';

function EventCreator({ isOpen, onClose, onEventAdd, selectedSlot }) {
    const [title, setTitle] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    // When the modal opens or the selected slot changes, update the form's state
    useEffect(() => {
        if (selectedSlot) {
        setTitle(''); // Reset title
        setAllDay(selectedSlot.action === 'click' || selectedSlot.slots.length === 1);
        setStart(selectedSlot.start);
        setEnd(selectedSlot.end);
        }
    }, [selectedSlot]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && start && end) {
            onEventAdd({
                title,
                start,
                end,
                allDay,
            });
            onClose(); // Close the modal after adding
        } else {
            alert('Please enter a title for the event.');
        }
    };

    // Helper to format dates for display in the input fields
    const formatDateForInput = (date) => {
        if (!date) return '';
        // Format to YYYY-MM-DDTHH:mm which is required by datetime-local input
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    return (
        <div className="event-modal-overlay">
            <div className="event-modal-content">
                <h2>Add New Event</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="event-modal-input"
                        required
                    />
                    <div className="event-modal-field">
                        <label>
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                        />
                        All-day event
                        </label>
                    </div>
                    {!allDay && (
                        <>
                            <div className="event-modal-field">
                                <label>Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="event-modal-input"
                                    value={formatDateForInput(start)}
                                    onChange={(e) => setStart(new Date(e.target.value))}
                                    />
                            </div>
                            <div className="event-modal-field">
                                <label>End Time</label>
                                <input
                                    type="datetime-local"
                                    className="event-modal-input"
                                    value={formatDateForInput(end)}
                                    onChange={(e) => setEnd(new Date(e.target.value))}
                                />
                            </div>
                        </>
                    )}
                    <div className="event-modal-buttons">
                        <button type="submit" className="button-primary">Save Event</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventCreator;
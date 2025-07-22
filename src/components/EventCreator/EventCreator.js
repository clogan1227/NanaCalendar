import React, { useState, useEffect } from 'react';
import './EventCreator.css';

function EventCreator({ isOpen, onClose, onEventAdd, onEventUpdate, onEventDelete, selectedSlot, editingEvent }) {
    const [title, setTitle] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    useEffect(() => {
        if (editingEvent) {
            // We are in "edit mode"
            setTitle(editingEvent.title);
            setAllDay(editingEvent.allDay);
            setStart(editingEvent.start);
            setEnd(editingEvent.end);
        } else if (selectedSlot) {
            // We are in "create mode"
            setTitle('');
            const isAllDay = selectedSlot.action === 'click' || selectedSlot.slots.length === 1;
            setAllDay(isAllDay);
            setStart(selectedSlot.start);
            setEnd(selectedSlot.end);
        }
    }, [editingEvent, selectedSlot]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert('Please enter a title.');
            return;
        }

        const eventData = {title, start, end, allDay};

        if (editingEvent) {
            onEventUpdate({...eventData, id: editingEvent.id});
        } else {
            onEventAdd(eventData);
        }

        onClose();
    };

    const handleDelete = () => {
        if (editingEvent) {
            onEventDelete(editingEvent.id);
            onClose();
        }
    }

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
                <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
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
                        {editingEvent && (
                            <button type="button" onClick={handleDelete} className="button-danger">
                                Delete
                            </button>
                        )}
                        <div className="buttons-right">
                            <button type="button" onClick={onClose}>Cancel</button>
                            <button type="submit" className="button-primary">
                                {editingEvent ? 'Update Event' : 'Save Event'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventCreator;
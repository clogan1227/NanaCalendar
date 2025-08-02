import React, { useState, useEffect } from 'react';
import './EventCreator.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function EventCreator({ isOpen, onClose, onEventAdd, onEventUpdate, onEventDelete, selectedSlot, editingEvent }) {
    const [title, setTitle] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [recurrence, setRecurrence] = useState('none');
    const [until, setUntil] = useState(null);

    useEffect(() => {
        if (editingEvent) {
            // We are in "edit mode"
            setTitle(editingEvent.title);
            setAllDay(editingEvent.allDay);
            setStart(editingEvent.start);
            setEnd(editingEvent.end);
            setRecurrence(editingEvent.recurrence || 'none');
            setUntil(editingEvent.until ? editingEvent.until.toDate() : null);
        } else if (selectedSlot) {
            // We are in "create mode"
            setTitle('');
            const isAllDay = selectedSlot.action === 'click' || selectedSlot.slots.length === 1;
            setAllDay(isAllDay);
            setStart(selectedSlot.start);
            setEnd(selectedSlot.end);
            setRecurrence('none');
            setUntil(null);
        }
    }, [editingEvent, selectedSlot]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert('Please enter a title.');
            return;
        }

        const eventData = {title, start, end, allDay, recurrence, until};

        if (editingEvent) {
            onEventUpdate({...eventData, id: editingEvent.id});
        } else {
            onEventAdd(eventData);
        }

        onClose();
    };

    const handleDelete = () => {
        if (editingEvent) {
            const confirmationMessage = editingEvent.recurrence && editingEvent.recurrence !== 'none'
                ? `This is a recurring event. Are you sure you want to delete this event and all future occurrences?`
                : `Are you sure you want to delete the event: "${editingEvent.title}"?`;

            if (window.confirm(confirmationMessage)) {
                onEventDelete(editingEvent.id);
                onClose();
            }
        }
    }

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
                    <div className="event-modal-field">
                        <label>Repeat</label>
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value)}
                            className="event-modal-input"
                        >
                        <option value="none">Does not repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    {recurrence !== 'none' && (
                        <div className="event-modal-field">
                            <label>Repeat Until</label>
                            <DatePicker
                                selected={until}
                                onChange={(date) => setUntil(date)}
                                dateFormat="MMMM d, yyyy"
                                className="event-modal-input"
                                placeholderText="Optional: Select an end date"
                                isClearable // Adds a small 'x' to clear the date
                            />
                        </div>
                    )}
                    {!allDay && (
                        <>
                            <div className="event-modal-field">
                                <label>Start Time</label>
                                {/* <input
                                    type="datetime-local"
                                    className="event-modal-input"
                                    value={formatDateForInput(start)}
                                    onChange={(e) => setStart(new Date(e.target.value))}
                                    /> */}
                                <DatePicker
                                    selected={start}
                                    onChange={(date) => setStart(date)}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="event-modal-input"
                                    />
                            </div>
                            <div className="event-modal-field">
                                <label>End Time</label>
                                {/* <input
                                    type="datetime-local"
                                    className="event-modal-input"
                                    value={formatDateForInput(end)}
                                    onChange={(e) => setEnd(new Date(e.target.value))}
                                /> */}
                                <DatePicker
                                    selected={end}
                                    onChange={(date) => setEnd(date)}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="event-modal-input"
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
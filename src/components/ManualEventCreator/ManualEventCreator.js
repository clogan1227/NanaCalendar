import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './ManualEventCreator.css';

function ManualEventCreator({ isOpen, onClose, onEventAdd }) {
    const [title, setTitle] = useState('');
    const [allDay, setAllDay] = useState(true); // Default to all-day
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [recurrence, setRecurrence] = useState('none');
    const [until, setUntil] = useState(null);

    // This effect resets the form state whenever the page is opened
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setAllDay(true);
            const now = new Date();
            setStart(now);
            setEnd(now);
            setRecurrence('none');
            setUntil(null);
        }
    }, [isOpen]); // Depend on isOpen to reset the form

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert('Please enter a title.');
        return;
        }
        // Pass the event data up to the App component to be saved
        onEventAdd({ title, start, end, allDay, recurrence, until });
        onClose(); // Close the page after submitting
    };

    return (
        <div className="add-event-overlay">
            <div className="add-event-content">
                <h2>Add New Event</h2>
                <button onClick={onClose} className="close-button">&times;</button>

                <form onSubmit={handleSubmit}>
                    <div className="add-event-field">
                        <label>Event Title</label>
                        <input
                            type="text"
                            placeholder="Event Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="add-event-input"
                            required
                        />
                    </div>
                    <div className="add-event-field">
                        <label>
                            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                            All-day event
                        </label>
                    </div>

                    {allDay ? (
                        <div className="add-event-field">
                            <label>Date</label>
                            <DatePicker
                                selected={start}
                                onChange={(date) => { setStart(date); setEnd(date); }}
                                dateFormat="MMMM d, yyyy"
                                className="add-event-input"
                            />
                        </div>
                    ) : (
                        <>
                        <div className="add-event-field">
                            <label>Start Date & Time</label>
                            <DatePicker
                                selected={start}
                                onChange={(date) => setStart(date)}
                                showTimeSelect
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="add-event-input"
                            />
                        </div>
                        <div className="add-event-field">
                            <label>End Date & Time</label>
                            <DatePicker
                                selected={end}
                                onChange={(date) => setEnd(date)}
                                showTimeSelect
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="add-event-input"
                            />
                        </div>
                        </>
                    )}

                    <div className="add-event-field">
                        <label>Repeat</label>
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value)}
                            className="add-event-input"
                        >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    {recurrence !== 'none' && (
                        <div className="add-event-field">
                            <label>Repeat Until</label>
                            <DatePicker
                                selected={until}
                                onChange={(date) => setUntil(date)}
                                dateFormat="MMMM d, yyyy"
                                className="add-event-input"
                                placeholderText="Optional: Select an end date"
                                isClearable
                            />
                        </div>
                    )}
                    <div className="add-event-buttons">
                        <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Event</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ManualEventCreator;
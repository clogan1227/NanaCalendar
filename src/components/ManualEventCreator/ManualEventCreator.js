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
            <div className="add-event-header">
                <h1>Add New Event</h1>
                <button onClick={onClose} className="close-button">&times;</button>
            </div>
            <div className="add-event-form-container">
                <form onSubmit={handleSubmit} className="add-event-form">
                <div className="form-field">
                    <label>Event Title</label>
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-field">
                    <label>
                        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                        All-day event
                    </label>
                </div>
                <div className="form-field">
                    <label>Start Date {allDay ? '' : '& Time'}</label>
                    <DatePicker
                        selected={start}
                        onChange={(date) => setStart(date)}
                        showTimeSelect={!allDay}
                        dateFormat={allDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"}
                    />
                </div>
                <div className="form-field">
                    <label>End Date {allDay ? '' : '& Time'}</label>
                    <DatePicker
                        selected={end}
                        onChange={(date) => setEnd(date)}
                        showTimeSelect={!allDay}
                        dateFormat={allDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"}
                    />
                </div>
                <div className="form-field">
                    <label>Repeat</label>
                    <select
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                    >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    </select>
                </div>
                {recurrence !== 'none' && (
                    <div className="form-field">
                        <label>Repeat Until</label>
                        <DatePicker
                            selected={until}
                            onChange={(date) => setUntil(date)}
                            dateFormat="MMMM d, yyyy"
                            placeholderText="Optional: Select an end date"
                            isClearable
                        />
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary">Save Event</button>
                </div>
                </form>
            </div>
        </div>
    );
}

export default ManualEventCreator;
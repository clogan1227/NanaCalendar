/**
 * @file ManualEventCreator.js
 * @description A full-page overlay component that provides a form for manually creating a
 * new event. Unlike EventCreator, it is not tied to a specific pre-selected date slot
 * from the calendar and defaults to the current date.
 */

import React, { useState, useEffect } from "react";

import DatePicker from "react-datepicker"; // A library for the date/time picker inputs

import "react-datepicker/dist/react-datepicker.css";
import "./ManualEventCreator.css";

function ManualEventCreator({ isOpen, onClose, onEventAdd }) {
    // State for the event title input field.
    const [title, setTitle] = useState("");
    // State for the "All-day" checkbox, defaulting to true for convenience.
    const [allDay, setAllDay] = useState(true);
    // State for the event's start date, defaulting to the current date.
    const [start, setStart] = useState(new Date());
    // State for the event's end date, defaulting to the current date.
    const [end, setEnd] = useState(new Date());
    // State for the recurrence rule dropdown.
    const [recurrence, setRecurrence] = useState("none");
    // State for the optional end date of a recurring event.
    const [until, setUntil] = useState(null);

    /**
     * This effect resets the entire form to a default state every time the modal is opened.
     * This is crucial to ensure that data from a previously entered event doesn't
     * persist when the user intends to create a new one.
     */
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setAllDay(true);
            const now = new Date();
            setStart(now);
            setEnd(now);
            setRecurrence("none");
            setUntil(null);
        }
    }, [isOpen]); // The effect re-runs only when the `isOpen` prop changes.

    // A guard clause to prevent the component from rendering when it's closed.
    if (!isOpen) return null;

    /**
     * Handles form submission by packaging the form state into an event object
     * and passing it to the parent component via the onEventAdd prop.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert("Please enter a title.");
            return;
        }
        onEventAdd({ title, start, end, allDay, recurrence, until });
        onClose(); // Close the overlay after submission.
    };

    return (
        <div className="add-event-overlay">
            <div className="add-event-content">
                <h2>Add New Event</h2>
                <button onClick={onClose} className="close-button">
                    &times;
                </button>

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
                            <input
                                type="checkbox"
                                checked={allDay}
                                onChange={(e) => setAllDay(e.target.checked)}
                            />
                            All-day event
                        </label>
                    </div>

                    {/* Conditionally render date/time pickers based on 'allDay' state */}
                    {allDay ? (
                        <div className="add-event-field">
                            <label>Date</label>
                            <DatePicker
                                selected={start}
                                onChange={(date) => {
                                    setStart(date);
                                    setEnd(date);
                                }}
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
                    {/* Conditionally render the 'until' date picker if recurrence is active */}
                    {recurrence !== "none" && (
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
                        <button type="button" onClick={onClose} className="button-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="button-primary">
                            Save Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ManualEventCreator;
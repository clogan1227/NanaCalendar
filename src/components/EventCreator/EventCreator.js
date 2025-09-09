/**
 * @file EventCreator.js
 * @description A modal form component used for both creating new calendar events and
 * editing existing ones. It manages its own form state and communicates with the
 * parent component (CalendarView) to perform CRUD operations on Firestore.
 */

import React, { useState, useEffect } from "react";

import DatePicker from "react-datepicker"; // A library for the date/time picker inputs

import "react-datepicker/dist/react-datepicker.css";
import "./EventCreator.css";

function EventCreator({ isOpen, onClose, onEventAdd, onEventUpdate, onEventDelete, selectedSlot, editingEvent }) {
    // State for the event title input field.
    const [title, setTitle] = useState("");
    // State for the "All-day" checkbox.
    const [allDay, setAllDay] = useState(false);
    // State for the event's start date and time.
    const [start, setStart] = useState(null);
    // State for the event's end date and time.
    const [end, setEnd] = useState(null);
    // State for the recurrence rule dropdown (e.g., 'weekly').
    const [recurrence, setRecurrence] = useState("none");
    // State for the optional end date of a recurring event.
    const [until, setUntil] = useState(null);

    /**
     * This effect is the core logic that populates the form. It runs whenever the
     * `editingEvent` or `selectedSlot` props change, determining whether the modal
     * should be in "edit mode" or "create mode".
     */
    useEffect(() => {
        if (editingEvent) {
            // In "edit mode", populate the form with the data from the existing event.
            setTitle(editingEvent.title);
            setAllDay(editingEvent.allDay);
            setStart(editingEvent.start);
            setEnd(editingEvent.end);
            setRecurrence(editingEvent.recurrence || "none");
            setUntil(editingEvent.until || null);
        } else if (selectedSlot) {
            // In "create mode", set initial values based on the calendar slot the user selected.
            setTitle("");
            const isAllDay = selectedSlot.action === "click" || selectedSlot.slots.length === 1;
            setAllDay(isAllDay);
            setStart(selectedSlot.start);
            setEnd(selectedSlot.end);
            setRecurrence("none");
            setUntil(null);
        }
    }, [editingEvent, selectedSlot]);

    // A guard clause to prevent rendering the modal if it's not supposed to be open.
    if (!isOpen) return null;

    /**
     * Handles the form submission. It prevents the default form action, validates the
     * input, packages the state into an event object, and then calls the appropriate
     * handler function passed down from the parent component.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert("Please enter a title.");
            return;
        }

        const eventData = { title, start, end, allDay, recurrence, until };

        // Determines whether to call the update or the add function.
        if (editingEvent) {
            onEventUpdate({ ...eventData, id: editingEvent.id });
        } else {
            onEventAdd(eventData);
        }

        onClose(); // Close the modal after submission.
    };

    /**
     * Handles the delete action. It shows a confirmation dialog with a specific message
     * for recurring events before calling the parent's delete handler.
     */
    const handleDelete = () => {
        if (editingEvent) {
            const confirmationMessage =
                editingEvent.recurrence && editingEvent.recurrence !== "none"
                    ? `This is a recurring event. Are you sure you want to delete this event and all future occurrences?`
                    : `Are you sure you want to delete the event: "${editingEvent.title}"?`;

            if (window.confirm(confirmationMessage)) {
                onEventDelete(editingEvent.id);
                onClose();
            }
        }
    };

    return (
        <div className="event-modal-overlay">
            <div className="event-modal-content">
                <h2>{editingEvent ? "Edit Event" : "Add New Event"}</h2>
                <button onClick={onClose} className="close-button">
                    &times;
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="event-modal-field">
                        <label>Event Title</label>
                        <input
                            type="text"
                            placeholder="Event Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="event-modal-input"
                            required
                        />
                    </div>
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
                    {/* Conditionally render date/time pickers based on 'allDay' state */}
                    {allDay ? (
                        <div className="event-modal-field">
                            <label>Date</label>
                            <DatePicker
                                selected={start}
                                onChange={(date) => {
                                    setStart(date);
                                    setEnd(date);
                                }}
                                dateFormat="MMMM d, yyyy"
                                className="event-modal-input"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="event-modal-field">
                                <label>Start Date & Time</label>
                                <DatePicker
                                    selected={start}
                                    onChange={(date) => setStart(date)}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="event-modal-input"
                                />
                            </div>
                            <div className="event-modal-field">
                                <label>End Date & Time</label>
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
                    {/* Conditionally render the 'until' date picker if recurrence is active */}
                    {recurrence !== "none" && (
                        <div className="event-modal-field">
                            <label>Repeat Until</label>
                            <DatePicker
                                selected={until}
                                onChange={(date) => setUntil(date)}
                                dateFormat="MMMM d, yyyy"
                                className="event-modal-input"
                                placeholderText="Optional: Select an end date"
                                isClearable
                            />
                        </div>
                    )}
                    <div className="event-modal-buttons">
                        {/* Conditionally render the delete button only in edit mode */}
                        {editingEvent && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="button-danger"
                            >
                                Delete
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="button-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="button-primary">
                            {editingEvent ? "Update Event" : "Save Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventCreator;
/**
 * @file DateTimeDisplay.js
 * @description A self-contained component that displays the current date and time,
 * functioning as a live clock that updates its display every second.
 */

import React, { useState, useEffect } from "react";

import "./DateTimeDisplay.css";

function DateTimeDisplay() {
    // State to hold the current date and time, which is updated every second.
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    /**
     * This effect sets up a timer (an interval) that updates the component's state
     * every second. The returned function is a critical cleanup step that clears the
     * interval when the component unmounts, preventing performance issues and memory leaks.
     */
    useEffect(() => {
        // Sets up an interval to call the update function every 10000 milliseconds.
        const timerId = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 10000);

        // The cleanup function that runs when the component is removed from the DOM.
        return () => clearInterval(timerId);
    }, []); // An empty dependency array ensures this effect runs only once on mount.

    /**
     * Formats a Date object into a long, human-readable date string.
     * e.g., "Monday, September 8, 2025"
     * @param {Date} date - The date object to format.
     * @returns {string} The formatted date string.
     */
    const formatDate = (date) => {
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        return date.toLocaleDateString("en-US", options);
    };

    /**
     * Formats a Date object into a standard time string with AM/PM.
     * e.g., "07:00:00 PM"
     * @param {Date} date - The date object to format.
     * @returns {string} The formatted time string.
     */
    const formatTime = (date) => {
        const options = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true, // Use AM/PM format
        };
        return date.toLocaleTimeString(undefined, options);
    };

    return (
        <div className="datetime-display">
            <div className="date-display">{formatDate(currentDateTime)}</div>
            <div className="time-display">{formatTime(currentDateTime)}</div>
        </div>
    );
}

export default DateTimeDisplay;
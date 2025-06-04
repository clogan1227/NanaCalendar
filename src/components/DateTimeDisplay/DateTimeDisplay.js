import React, { useState, useEffect } from 'react';
import './DateTimeDisplay.css';

function DateTimeDisplay() {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        // Update the time every second
        const timerId = setInterval(() => {
        setCurrentDateTime(new Date());
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(timerId);
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    const formatDate = (date) => {
        const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        };
        return date.toLocaleDateString(undefined, options);
    };

    const formatTime = (date) => {
        const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Use true for AM/PM, false for 24-hour
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
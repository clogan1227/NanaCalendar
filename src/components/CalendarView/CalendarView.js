/**
 * @file CalendarView.js
 * @description This component renders the main calendar interface. It is responsible for
 * fetching and displaying events from Firestore, generating holidays, expanding
 * recurring events for the current view, and handling user interactions like
 * creating, updating, and deleting events via EventCreator.
 */

import React, { useState, useEffect, useMemo } from "react";

import { endOfMonth, startOfMonth } from "date-fns";
import format from "date-fns/format";
import getDay from "date-fns/getDay";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import Holidays from "date-holidays"; // For generating holiday events
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Calendar, dateFnsLocalizer } from "react-big-calendar"; // The calendar component
import { RRule } from "rrule"; // For handling recurring event logic

import { db } from "../../firebase";
import EventCreator from "../EventCreator/EventCreator";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css";

// Required setup for react-big-calendar to handle date formatting.
const locales = {
    "en-US": require("date-fns/locale/en-US"),
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

/**
 * A custom component to render the header for each day column in the calendar.
 * Displays the full name of the weekday (e.g., "Monday").
 */
const CustomHeader = ({ date, localizer }) => {
    return <span>{localizer.format(date, "eeee")}</span>;
};

/**
 * A custom component for rendering an event within the month view.
 * Shows only the title for all-day events, and title + time for timed events.
 */
const MonthEvent = ({ event, localizer }) => {
    if (event.allDay) {
        return <strong>{event.title}</strong>;
    }
    return (
        <div>
            <strong>{event.title}</strong>
            <span> - </span>
            <span style={{ marginRight: "5px" }}>
                {localizer.format(event.start, "p")}
            </span>
        </div>
    );
};

function CalendarView() {
    // Stores events fetched directly from Firestore.
    const [events, setEvents] = useState([]);
    // Tracks the current month/year the calendar is displaying.
    const [date, setDate] = useState(new Date());
    // Controls the visibility of the EventCreator modal.
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Holds info about a selected time slot for creating a new event.
    const [selectedSlot, setSelectedSlot] = useState(null);
    // Holds the data of an existing event that is being edited.
    const [editingEvent, setEditingEvent] = useState(null);

    /**
     * This effect sets up a real-time listener to the 'events' collection in Firestore.
     * It automatically updates the component's state whenever events are added,
     * modified, or deleted in the database.
     */
    useEffect(() => {
        const eventsCollectionRef = collection(db, "events");
        const q = query(eventsCollectionRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const firestoreEvents = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    // Convert Firestore Timestamps back to JS Date objects for the calendar.
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    until: data.until ? data.until.toDate() : null,
                };
            });
            setEvents(firestoreEvents);
        });

        // Cleans up the listener when the component unmounts to prevent memory leaks.
        return () => unsubscribe();
    }, []);

    /**
     * Memoized calculation of holidays. This prevents the holiday generation logic
     * from re-running on every render, only recalculating when the displayed year changes.
     */
    const holidays = useMemo(() => {
        const year = date.getFullYear();
        const hd = new Holidays("US");
        const federalHolidays = hd.getHolidays(year);

        // Manually calculate dates for Christian holidays relative to Easter.
        const easterHoliday = hd
            .getHolidays(year)
            .find((h) => h.name === "Easter Sunday");
        if (!easterHoliday) return []; // Failsafe if Easter can't be found
        const easter = new Date(easterHoliday.date);
        const dayMs = 24 * 60 * 60 * 1000;
        const customHolidays = [
            { name: "Ash Wednesday", date: new Date(easter.getTime() - 46 * dayMs) },
            { name: "Palm Sunday", date: new Date(easter.getTime() - 7 * dayMs) },
            { name: "Good Friday", date: new Date(easter.getTime() - 2 * dayMs) },
            { name: "Easter Sunday", date: easter },
            { name: "Christmas Day", date: new Date(year, 11, 25) },
        ];

        // Combine, de-duplicate, and format all holidays for the calendar.
        const allRawHolidays = [...federalHolidays, ...customHolidays];
        const uniqueHolidays = Array.from(
            new Map(
                // FIX: Wrap h.date in new Date() to handle both string and Date object types.
                allRawHolidays.map((h) => [
                    new Date(h.date).toISOString().split("T")[0],
                    h,
                ]),
            ).values(),
        );

        return uniqueHolidays
            .filter((holiday) => holiday.name !== "Day after Thanksgiving Day")
            .map((holiday) => ({
                title: holiday.name,
                start: new Date(holiday.date),
                end: new Date(holiday.date),
                allDay: true,
                isHoliday: true, // Custom flag for styling
            }));
    }, [date]);

    /**
     * Memoized calculation that combines user events and holidays. Crucially, it
     * expands recurring events into individual instances that fall within the
     * currently viewed month. This is a performance-critical calculation.
     */
    const allEvents = useMemo(() => {
        const expandedEvents = events.flatMap((event) => {
            // If the event has a recurrence rule, expand it.
            if (event.recurrence && event.recurrence !== "none") {
                const rule = new RRule({
                    freq: RRule[event.recurrence.toUpperCase()],
                    dtstart: event.start,
                    until: event.until,
                });

                // Define the date range for the current calendar view.
                const viewStart = startOfMonth(date);
                const viewEnd = endOfMonth(date);

                // Generate all occurrences within the current view.
                const dates = rule.between(viewStart, viewEnd);

                // Map each occurrence to a full calendar event object.
                return dates.map((occurrenceDate) => {
                    const duration = event.end.getTime() - event.start.getTime();
                    return {
                        ...event,
                        start: occurrenceDate,
                        end: new Date(occurrenceDate.getTime() + duration),
                    };
                });
            }
            // Otherwise, return the single, non-recurring event.
            return event;
        });

        return [...expandedEvents, ...holidays];
    }, [events, holidays, date]); // Recalculates if events, holidays, or the view date change.

    /**
     * Memoized function to apply custom styling to events.
     * This adds a specific CSS class to events marked as holidays.
     */
    const eventPropGetter = useMemo(
        () => (event) => ({
            ...(event.isHoliday && { className: "is-holiday" }),
        }),
        [],
    );

    /**
    // Memoized object containing custom components and formats for the calendar.
    // Using useMemo prevents these objects from being recreated on every render.
     */
    const { components, formats } = useMemo(
        () => ({
            components: {
                header: (props) => <CustomHeader {...props} localizer={localizer} />,
                month: {
                    event: (props) => <MonthEvent {...props} localizer={localizer} />,
                },
            },
            formats: {
                eventTimeRangeFormat: ({ start }, culture, localizer) =>
                    localizer.format(start, "p", culture),
            },
        }),
        [],
    );

    // Opens the modal in 'create' mode when a user clicks/drags on an empty slot.
    const handleSelectSlot = (slotInfo) => {
        setEditingEvent(null);
        setSelectedSlot(slotInfo);
        setIsModalOpen(true);
    };

    // Opens the modal in 'edit' mode when a user clicks an existing event.
    const handleSelectEvent = (event) => {
        // Do not allow editing of generated holiday events.
        if (event.isHoliday) return;
        setEditingEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    // --- Firestore Data Handlers ---

    // Adds a new event document to Firestore.
    const handleEventAdd = async (eventData) => {
        try {
            await addDoc(collection(db, "events"), eventData);
            console.log("Event added successfully!");
        } catch (error) {
            console.error("Error adding event: ", error);
        }
    };

    // Updates an existing event document in Firestore.
    const handleEventUpdate = async (eventData) => {
        try {
            const eventDocRef = doc(db, "events", eventData.id);
            await updateDoc(eventDocRef, eventData);
            console.log("Event updated successfully!");
        } catch (error) {
            console.error("Error updating event: ", error);
        }
    };

    // Deletes an event document from Firestore.
    const handleEventDelete = async (eventId) => {
        try {
            const eventDocRef = doc(db, "events", eventId);
            await deleteDoc(eventDocRef);
            console.log("Event deleted successfully!");
        } catch (error) {
            console.error("Error deleting event: ", error);
        }
    };

    // Resets state and closes the EventCreator modal.
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setSelectedSlot(null);
    };

    return (
        <div
            className="calendar-container"
            style={{ height: "50%", padding: "10px" }}
        >
            <Calendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                selectable={true}
                onSelectSlot={handleSelectSlot}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                onSelectEvent={handleSelectEvent}
                components={components}
                formats={formats}
                views={["month"]}
                eventPropGetter={eventPropGetter}
            />
            <EventCreator
                isOpen={isModalOpen}
                onClose={closeModal}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                selectedSlot={selectedSlot}
                editingEvent={editingEvent}
            />
        </div>
    );
}

export default CalendarView;
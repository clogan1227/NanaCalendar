/**
 * @file CalendarView.js
 * @description This component renders the main calendar interface. It is responsible for
 * fetching and displaying events from Firestore, generating holidays, expanding
 * recurring events for the current view, and handling user interactions like
 * creating, updating, and deleting events via EventCreator.
 */

import React, { useState, useEffect, useMemo } from "react";
import { isPi } from "../../config/env";
import { endOfMonth, startOfMonth, getDaysInMonth, addMonths, subDays } from "date-fns";
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
import { useWindowWidth } from "../../hooks/useWindowWidth";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css";

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

function AutoSizeText({ text }) {
    const ref = React.useRef(null);
    const [fontSize, setFontSize] = useState("1.2em");

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const parentStyle = window.getComputedStyle(el.parentElement);
        const basePx = parseFloat(parentStyle.fontSize) || 16;
        let sizeEm = 1.2;
        const minEm = 0.9;
        const maxWidth = el.parentElement.offsetWidth - 4;
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${sizeEm * basePx}px Arial`;
        while (ctx.measureText(text).width > maxWidth && sizeEm > minEm) {
            sizeEm -= 0.05;
            ctx.font = `${sizeEm * basePx}px Arial`;
        }
        setFontSize(`${sizeEm}em`);
    }, [text]);

    return (
        <div
            ref={ref}
            style={{
                fontSize,
                whiteSpace: "normal",
                lineHeight: 1.2,
                wordBreak: "break-word",
            }}
        >
            {text}
        </div>
    );
}

/**
 * A custom component for rendering an event within the month view.
 */
const MonthEvent = ({ event }) => {
    return (
        <div className="event-wrapper">
            <AutoSizeText text={event.title} />
        </div>
    );
};

/**
 * A custom component to render the header for each day column in the calendar.
 * Displays the full name of the weekday (e.g., "Monday").
 */
const CustomHeader = ({ date, localizer }) => {
    return <span>{localizer.format(date, "eeee")}</span>;
};

/**
 * A custom component to render the calendar header without the buttons for pi-mode
 */
const CustomToolbarPi = (toolbar) => {
    return (
        <div className="rbc-toolbar pi-toolbar">
            <span className="rbc-toolbar-label">{toolbar.label}</span>
        </div>
    );
};

/**
 * A custom toolbar for the web view, which includes an "Add Event" button on mobile.
 */
const CustomToolbarWeb = ({ toolbar, onAddEvent, isMobile }) => {
    const goToBack = () => {
        if (isMobile) {
            const newDate = startOfMonth(addMonths(toolbar.date, -1));
            toolbar.onNavigate('DATE', newDate);
        } else {
            toolbar.onNavigate("PREV");
        }
    };
    const goToNext = () => {
        if (isMobile) {
            const newDate = startOfMonth(addMonths(toolbar.date, 1));
            toolbar.onNavigate('DATE', newDate);
        } else {
            toolbar.onNavigate("NEXT");
        }
    };
    const goToCurrent = () => {
        if (isMobile) {
            const newDate = startOfMonth(new Date());
            toolbar.onNavigate('DATE', newDate);
        } else {
            toolbar.onNavigate("TODAY");
        }
    };

    return (
        <div className="rbc-toolbar">
            <span className="rbc-toolbar-label">{toolbar.label}</span>
            <span className="rbc-btn-group">
                {isMobile && (
                    <button type="button" onClick={onAddEvent}>
                        Add Event
                    </button>
                )}
                <button type="button" onClick={goToBack}>Back</button>
                <button type="button" onClick={goToCurrent}>Today</button>
                <button type="button" onClick={goToNext}>Next</button>
            </span>
        </div>
    );
};

function CalendarView() {
    const [events, setEvents] = useState([]);
    const [date, setDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 768;

    useEffect(() => {
        const eventsCollectionRef = collection(db, "events");
        const q = query(eventsCollectionRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const firestoreEvents = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    until: data.until ? data.until.toDate() : null,
                };
            });
            setEvents(firestoreEvents);
        });
        return () => unsubscribe();
    }, []);

    const holidays = useMemo(() => {
        const year = date.getFullYear();
        const hd = new Holidays("US");
        const federalHolidays = hd.getHolidays(year);
        const easterHoliday = hd
            .getHolidays(year)
            .find((h) => h.name === "Easter Sunday");
        if (!easterHoliday) return [];
        const easter = new Date(easterHoliday.date);
        const dayMs = 24 * 60 * 60 * 1000;
        const customHolidays = [
            { name: "Ash Wednesday", date: subDays(easter, 46) },
            { name: "Palm Sunday", date: subDays(easter, 7) },
            { name: "Good Friday", date: subDays(easter, 2) },
            { name: "Easter Sunday", date: easter },
            { name: "Christmas Day", date: new Date(year, 11, 25) },
        ];
        const allRawHolidays = [...federalHolidays, ...customHolidays];
        const uniqueHolidays = Array.from(
            new Map(
                allRawHolidays.map((h) => [
                    new Date(h.date).toISOString().split("T")[0],
                    h,
                ]),
            ).values(),
        );
        const holidaysToExclude = [
            "Day after Thanksgiving Day",
            "Administrative Professionals Day",
            "Independence Day (substitute day)",
        ];
        return uniqueHolidays
            .filter((holiday) => !holidaysToExclude.includes(holiday.name))
            .map((holiday) => ({
                title: holiday.name,
                start: new Date(holiday.date),
                end: new Date(holiday.date),
                allDay: true,
                isHoliday: true,
            }));
    }, [date]);

    const allEvents = useMemo(() => {
        const expandedEvents = events.flatMap((event) => {
            if (event.recurrence && event.recurrence !== "none") {
                const rule = new RRule({
                    freq: RRule[event.recurrence.toUpperCase()],
                    dtstart: event.start,
                    until: event.until,
                });
                const viewStart = startOfMonth(date);
                const viewEnd = endOfMonth(date);
                const dates = rule.between(viewStart, viewEnd);
                return dates.map((occurrenceDate) => {
                    const duration = event.end.getTime() - event.start.getTime();
                    return {
                        ...event,
                        start: occurrenceDate,
                        end: new Date(occurrenceDate.getTime() + duration),
                    };
                });
            }
            return event;
        });
        return [...expandedEvents, ...holidays];
    }, [events, holidays, date]);

    const agendaEvents = useMemo(() => {
        if (!isMobile) return [];

        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        return allEvents.filter(event => {
            const eventStart = event.start;
            return eventStart >= monthStart && eventStart <= monthEnd;
        });
    }, [isMobile, allEvents, date]);

    const eventPropGetter = useMemo(
        () => (event) => ({
            ...(event.isHoliday && { className: "is-holiday" }),
        }),
        [],
    );

    const { components, formats } = useMemo(
        () => ({
            components: {
                toolbar: isPi ? CustomToolbarPi : (toolbarProps) => (
                    <CustomToolbarWeb
                        toolbar={toolbarProps}
                        onAddEvent={handleAddNewEventClick}
                        isMobile={isMobile}
                    />
                ),
                header: (props) => <CustomHeader {...props} localizer={localizer} />,
                month: isMobile ? undefined : { event: MonthEvent },
            },
            formats: {
                eventTimeRangeFormat: ({ start }, culture, localizer) =>
                    localizer.format(start, "p", culture),
                agendaHeaderFormat: ({ start }, culture, localizer) =>
                    localizer.format(start, "MMMM yyyy", culture),
            },
        }),
        [isMobile],
    );

    // Handler for the new "Add Event" button on mobile
    const handleAddNewEventClick = () => {
        const now = new Date();
        handleSelectSlot({
            start: now,
            end: now,
            action: "click", // Mimic clicking a day slot
        });
    };

    const handleSelectSlot = (slotInfo) => {
        setEditingEvent(null);
        setSelectedSlot(slotInfo);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        if (event.isHoliday) return;
        setEditingEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    const handleEventAdd = async (eventData) => {
        try {
            await addDoc(collection(db, "events"), eventData);
            console.log("Event added successfully!");
        } catch (error) {
            console.error("Error adding event: ", error);
        }
    };

    const handleEventUpdate = async (eventData) => {
        try {
            const eventDocRef = doc(db, "events", eventData.id);
            await updateDoc(eventDocRef, eventData);
            console.log("Event updated successfully!");
        } catch (error) {
            console.error("Error updating event: ", error);
        }
    };

    const handleEventDelete = async (eventId) => {
        try {
            const eventDocRef = doc(db, "events", eventId);
            await deleteDoc(eventDocRef);
            console.log("Event deleted successfully!");
        } catch (error) {
            console.error("Error deleting event: ", error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setSelectedSlot(null);
    };

    return (
        <div className={`calendar-container ${isPi ? "pi-mode" : ""}`}>
            <Calendar
                localizer={localizer}
                events={isMobile ? agendaEvents : allEvents}
                startAccessor="start"
                endAccessor="end"
                selectable={true}
                onSelectSlot={handleSelectSlot}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                onSelectEvent={handleSelectEvent}
                components={components}
                formats={formats}
                views={isMobile ? ["agenda"] : ["month"]}
                defaultView={isMobile ? "agenda" : "month"}
                length={getDaysInMonth(date)}
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
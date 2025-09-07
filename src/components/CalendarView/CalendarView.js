import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';
import EventCreator from '../EventCreator/EventCreator';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import Holidays from 'date-holidays';
import { RRule } from 'rrule';
import { startOfMonth, endOfMonth } from 'date-fns';

const locales = {
    'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CustomHeader = ({ date, localizer }) => {
    // We receive the 'date' for the column and the 'localizer'.
    // We use the localizer to format the date into the full weekday name ('eeee').
    return <span>{localizer.format(date, 'eeee')}</span>;
};

const MonthEvent = ({ event, localizer }) => {
    // If it's an all-day event, just show the title
    if (event.allDay) {
        return <strong>{event.title}</strong>;
    }

    // If it's not an all-day event, show the time and the title
    return (
        <div>
            {/* Format the time using 'p' for short time, e.g., "7:00 PM" */}
            <strong>{event.title}</strong>
            <span> - </span>
            <span style={{ marginRight: '5px' }}>
                {localizer.format(event.start, 'p')}
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

    // --- FETCH EVENTS FROM FIRESTORE ---
    useEffect(() => {
        const eventsCollectionRef = collection(db, "events");
        const q = query(eventsCollectionRef); // can add orderBy here later

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const firestoreEvents = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    // Convert Firestore Timestamps to JS Date objects
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    until: data.until ? data.until.toDate() : null,
                };
            });
            setEvents(firestoreEvents);
        });

        return () => unsubscribe(); // Cleanup listener
    }, []);

    // --- Generate holidays using useMemo ---
    const holidays = useMemo(() => {
        const year = date.getFullYear();

        // Step 1: Get the raw data for US Federal holidays
        const hd = new Holidays('US');
        const federalHolidays = hd.getHolidays(year);

        // Step 2: Create the raw data for custom Christian holidays
        const easterHoliday = hd.getHolidays(year).find(h => h.name === 'Easter Sunday');

        if (!easterHoliday) {
            console.error("Could not determine the date of Easter.");
            // Fallback: return only the federal holidays if Easter can't be found
            return federalHolidays.map(holiday => ({
                title: holiday.name,
                start: new Date(holiday.date),
                end: new Date(holiday.date),
                allDay: true,
                isHoliday: true,
            }));
        }
        const easter = new Date(easterHoliday.date);
        const millisecondsInDay = 24 * 60 * 60 * 1000;

        const customHolidays = [
            { name: 'Ash Wednesday', date: new Date(easter.getTime() - 46 * millisecondsInDay) },
            { name: 'Palm Sunday', date: new Date(easter.getTime() - 7 * millisecondsInDay) },
            { name: 'Good Friday', date: new Date(easter.getTime() - 2 * millisecondsInDay) },
            { name: 'Easter Sunday', date: easter },
            { name: 'Christmas Day', date: new Date(year, 11, 25) },
        ];

        // Step 3: Combine the two lists and remove duplicates
        const combinedHolidays = [...federalHolidays, ...customHolidays];
        const uniqueHolidays = [];
        const seenDates = new Set(); // Keep track of dates we've already added

        combinedHolidays.forEach(holiday => {
            const dateString = new Date(holiday.date).toISOString().split('T')[0];
            if (!seenDates.has(dateString)) {
                uniqueHolidays.push(holiday);
                seenDates.add(dateString);
            }
        });

        // Step 4: Filter out any unwanted holidays by name
        const filteredHolidays = uniqueHolidays.filter(
            holiday => holiday.name !== 'Day after Thanksgiving Day'
        );

        // Step 5: Format the final, filtered list for the calendar
        return filteredHolidays.map(holiday => ({
            title: holiday.name,
            start: new Date(holiday.date),
            end: new Date(holiday.date),
            allDay: true,
            isHoliday: true,
        }));
    }, [date]);

    // const allEvents = useMemo(() => [...events, ...holidays], [events, holidays]);

    // --- COMBINE user events and holidays for the calendar ---
    const allEvents = useMemo(() => {
        const expandedEvents = events.flatMap(event => {
            if (event.recurrence && event.recurrence !== 'none') {
                const ruleOptions = {
                    freq: RRule[event.recurrence.toUpperCase()],
                    dtstart: event.start,
                    until: event.until, // Pass the 'until' date directly to the rule
                };

                const rule = new RRule(ruleOptions);

                // Get the start and end of the currently visible month for expansion range
                const viewStart = startOfMonth(date);
                const viewEnd = endOfMonth(date);

                const dates = rule.between(viewStart, viewEnd);

                // Create an event instance for each occurrence
                return dates.map(occurrenceDate => ({
                    ...event,
                    // Override start and end for this specific instance
                    start: occurrenceDate,
                    end: new Date(occurrenceDate.getTime() + (event.end.getTime() - event.start.getTime())),
                }));
            }
            // This is a regular, non-recurring event
            return event;
        });

        return [...expandedEvents, ...holidays];
    }, [events, holidays, date]); // Re-expand when the view date changes

    const eventPropGetter = useMemo(() => (event) => {
        const newProps = {};
        if (event.isHoliday) {
            newProps.className = 'is-holiday'; // Apply our custom holiday class
        }
        return newProps;
    }, []);

    // --- HANDLER TO OPEN THE MODAL ---
    const handleSelectSlot = (slotInfo) => {
        setEditingEvent(null);
        setSelectedSlot(slotInfo);
        setIsModalOpen(true);
    };

    // --- HANDLER TO SELECT EVENT ---
    const handleSelectEvent = (event) => {
        setEditingEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    // --- HANDLER TO ADD EVENT TO FIRESTORE ---
    const handleEventAdd = async (eventData) => {
        try {
            const eventsCollectionRef = collection(db, "events");
            await addDoc(eventsCollectionRef, {
                title: eventData.title,
                start: eventData.start, // This is already a JS Date object
                end: eventData.end,     // This is also a JS Date object
                allDay: eventData.allDay,
                recurrence: eventData.recurrence,
                until: eventData.until,
            });
            console.log("Event added successfully!");
        } catch (error) {
            console.error("Error adding event: ", error);
        }
    };

    // --- Handler to UPDATE event in Firestore ---
    const handleEventUpdate = async (eventData) => {
        try {
            const eventDocRef = doc(db, "events", eventData.id);
            await updateDoc(eventDocRef, {
                title: eventData.title,
                start: eventData.start,
                end: eventData.end,
                allDay: eventData.allDay,
                recurrence: eventData.recurrence,
                until: eventData.until,
            });
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

    const { components, formats } = useMemo(
        () => ({
            components: {
                header: (props) => <CustomHeader {...props} localizer={localizer} />,
                // Use our custom component for the 'event' in the 'month' view
                month: {
                    event: (props) => <MonthEvent {...props} localizer={localizer} />,
                },
            },
            formats: {
                // This format is still useful for Week and Day views
                eventTimeRangeFormat: ({ start }, culture, localizer) =>
                    localizer.format(start, 'p', culture),
            },
        }),
        [] // Empty dependency array means this object is created only once
    );

    return (
        <div className="calendar-container" style={{ height: '50%', padding: '10px' }}>
            <Calendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                selectable={true}
                onSelectSlot={handleSelectSlot}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                onSelectEvent={handleSelectEvent}
                components={components}
                formats={formats}
                views={['month']}
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
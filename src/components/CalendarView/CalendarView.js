import React, { useState, useEffect } from 'react';
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

// --- Define custom formats for the calendar ---
const customFormats = {
    // This format is used for the time that appears on events
    eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
        const startTime = localizer.format(start, 'p', culture);
        return startTime;
    },
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
                };
            });
            setEvents(firestoreEvents);
        });

        return () => unsubscribe(); // Cleanup listener
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

    return (
        <div className="calendar-container" style={{ height: '50%', background: 'white', padding: '10px' }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                selectable={true}
                onSelectSlot={handleSelectSlot}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                onSelectEvent={handleSelectEvent}
                formats={customFormats}
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
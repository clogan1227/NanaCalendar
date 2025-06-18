import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

function CalendarView() {
    // Example events
    const [events, setEvents] = useState([
        {
        title: 'Sample Event',
        start: new Date(),
        end: new Date(),
        allDay: true,
        },
    ]);

    // Fetch events from Firestore here later

    return (
        <div style={{ height: '100%', background: 'white', padding: '10px' }}>
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
        />
        </div>
    );
}

export default CalendarView;
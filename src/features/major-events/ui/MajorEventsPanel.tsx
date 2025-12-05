import { useEffect, useState } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './MajorEventsPanel.css';

export const MajorEventsPanel = () => {
    const [events, setEvents] = useState<ParsedMainEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            const data = await fetchMainEvents();
            // Sort by year ascending
            const sorted = data.sort((a, b) => a.year - b.year);
            setEvents(sorted);
            setLoading(false);
        };
        loadEvents();
    }, []);

    if (loading) {
        return <div className="major-events-loading">로딩 중...</div>;
    }

    return (
        <div className="major-events-panel">
            <div className="major-events-list">
                {events.map((event) => (
                    <div key={event.eventId} className="major-event-item">
                        <div className="event-header">
                            <span className="event-year">{event.year}년</span>
                            <span className="event-era">{event.era}</span>
                        </div>
                        <h3 className="event-name">{event.eventName}</h3>
                        <div className="event-country">{event.countryName}</div>
                        <div className="event-description">
                            <p><strong>개요:</strong> {event.description.summary}</p>
                            <p><strong>의의:</strong> {event.description.significance}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

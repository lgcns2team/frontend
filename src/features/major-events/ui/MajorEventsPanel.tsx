import { useEffect, useState } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './MajorEventsPanel.css';

import { getEraForYear } from '../../../shared/config/era-theme';

interface MajorEventsPanelProps {
    onYearChange?: (year: number) => void;
}

export const MajorEventsPanel = ({ onYearChange }: MajorEventsPanelProps) => {
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
                {events.map((event) => {
                    const eraConfig = getEraForYear(event.year);
                    return (
                        <div
                            key={event.eventId}
                            className="major-event-item"
                            onClick={() => onYearChange?.(event.year)}
                            style={{
                                cursor: 'pointer',
                                borderColor: eraConfig.color,
                                backgroundColor: `${eraConfig.color}1A`, // 10% opacity
                                fontFamily: eraConfig.fontFamily
                            }}
                        >
                            <div className="event-header">
                                <span
                                    className="event-year"
                                    style={{ color: eraConfig.color }}
                                >
                                    {event.year}년
                                </span>
                                <span className="event-era">{event.era}</span>
                            </div>
                            <h3 className="event-name">{event.eventName}</h3>
                            <div className="event-country">{event.countryName}</div>
                            <div className="event-description">
                                <p><strong>개요:</strong> {event.description.summary}</p>
                                <p><strong>의의:</strong> {event.description.significance}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

import { useEffect, useState } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './MajorEventsPanel.css';

import { getEraForYear, getEraFrameImage } from '../../../shared/config/era-theme';

interface MajorEventsPanelProps {
    onYearChange?: (year: number) => void;
    onEventClick?: (event: ParsedMainEvent) => void;
}

export const MajorEventsPanel = ({ onYearChange, onEventClick }: MajorEventsPanelProps) => {
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

    const handleEventClick = (event: ParsedMainEvent) => {
        onYearChange?.(event.year);
        onEventClick?.(event);
    };

    return (
        <div className="major-events-panel">
            <div className="major-events-list">
                {events.map((event) => {
                    const eraConfig = getEraForYear(event.year);
                    const eraFrame = getEraFrameImage(event.year);

                    return (
                        <div
                            key={event.eventId}
                            className="major-event-item"
                            onClick={() => handleEventClick(event)}
                            style={{
                                cursor: 'pointer',
                                borderColor: eraConfig.color,
                                backgroundColor: '#FFFEF5', // Very pale yellow
                                fontFamily: "'Noto Serif KR', serif", // Fixed font family (Three Kingdoms style)
                                ...(eraFrame && {
                                    '--item-frame-image': `url(${eraFrame})`
                                } as React.CSSProperties)
                            }}
                        >
                            <div className="event-header">
                                <span
                                    className="event-year"
                                    style={{ color: '#000000' }} // Black color
                                >
                                    {event.year}년
                                </span>
                                <span className="event-era">{event.era}</span>
                            </div>
                            <h3 className="event-name">{event.eventName}</h3>
                            <div className="event-country">{event.countryName}</div>
                            {/* Detailed description removed for list view */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

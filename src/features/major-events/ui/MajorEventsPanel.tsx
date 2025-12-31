import { useEffect, useState, type ReactNode } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './MajorEventsPanel.css';

import { getEraForYear, getEraFrameImage } from '../../../shared/config/era-theme';

interface MajorEventsPanelProps {
    onYearChange?: (year: number) => void;
    onEventClick?: (event: ParsedMainEvent) => void;
    currentYear?: number;
    renderToggle?: (toggleElement: ReactNode) => void;
}

export const MajorEventsPanel = ({ onYearChange, onEventClick, currentYear = 1244, renderToggle }: MajorEventsPanelProps) => {
    const [events, setEvents] = useState<ParsedMainEvent[]>([]);
    const [showAll, setShowAll] = useState(false); // true: 전체, false: 현재 시대만
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            const data = await fetchMainEvents();
            // Sort by year ascending
            const filtered = data.filter(event =>
                event.eventName !== "기타/미분류 전쟁" && event.eventName !== "1년 기타/미분류 전쟁"
            );
            const sorted = filtered.sort((a, b) => a.year - b.year);
            setEvents(sorted);
            setLoading(false);
        };
        loadEvents();
    }, []);

    // Toggle element 생성
    useEffect(() => {
        if (renderToggle) {
            const toggleElement = (
                <div className="filter-toggle-container-header">
                    <span className="toggle-label">현재 시대</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">전체</span>
                </div>
            );
            renderToggle(toggleElement);
        }
    }, [showAll, renderToggle]);

    if (loading) {
        return <div className="major-events-loading">로딩 중...</div>;
    }

    const handleEventClick = (event: ParsedMainEvent) => {
        onYearChange?.(event.year);
        onEventClick?.(event);
    };

    // 현재 시대 정보 가져오기
    const currentEra = getEraForYear(currentYear);

    // 현재 시대에 해당하는 이벤트 필터링 (era 데이터 기준)
    const filteredEvents = showAll
        ? events
        : events.filter(event => {
            // 이벤트의 era가 현재 연도의 era와 일치하는지 확인
            const eventEra = getEraForYear(event.year);
            return eventEra.id === currentEra.id;
        });

    return (
        <div className="major-events-panel">
            {filteredEvents.length === 0 ? (
                <div className="major-events-loading">해당 시대의 주요사건이 없습니다.</div>
            ) : (
                <div className="major-events-list">
                    {filteredEvents.map((event) => {
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
            )}
        </div>
    );
};

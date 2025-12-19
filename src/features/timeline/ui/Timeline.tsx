import { useMemo, useState, useEffect, useRef } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './Timeline.css';
import { getEraColor, ERA_LIMITS, ERAS } from '../../../shared/config/era-theme';


interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
    onEventClick?: (event: ParsedMainEvent) => void;
    isVisible: boolean;
    onToggleVisibility: () => void;
    showEvents?: boolean;
    timelineVisibility?: 'full' | 'no-events' | 'hidden' | 'full-hidden';
}


const GLOBAL_MIN_YEAR = -2333;
const GLOBAL_MAX_YEAR = 2024;

export const Timeline = ({ currentYear, onYearChange, onEventClick, isVisible, onToggleVisibility, showEvents = true, timelineVisibility = 'full' }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);
    const [mainEvents, setMainEvents] = useState<ParsedMainEvent[]>([]);
    // const [isVisible, setIsVisible] = useState(true); // Moved to parent

    useEffect(() => {
        fetchMainEvents().then(events => {
            // Filter events that should be shown on timeline
            const filteredEvents = events.filter(e => e.showTimeline !== false);
            setMainEvents(filteredEvents);
        });
    }, []);

    // Base window size is 500 years
    const BASE_WINDOW_SIZE = 500;
    const displayWindowSize = BASE_WINDOW_SIZE;

    // Initialize view window centered on current year
    const [viewStart, setViewStart] = useState(() => {
        const start = currentYear - displayWindowSize / 2;
        return Math.max(GLOBAL_MIN_YEAR, Math.min(start, GLOBAL_MAX_YEAR - displayWindowSize));
    });

    const viewEnd = Math.min(GLOBAL_MAX_YEAR, viewStart + displayWindowSize);

    const [isDragging, setIsDragging] = useState(false);
    const scrollDirection = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);



    // Update view window if currentYear goes out of bounds (e.g. from auto-play or external change)
    useEffect(() => {
        if (!isDragging) {
            if (currentYear < viewStart) {
                setViewStart(Math.max(GLOBAL_MIN_YEAR, currentYear - displayWindowSize * 0.1));
            } else if (currentYear > viewEnd) {
                setViewStart(Math.min(GLOBAL_MAX_YEAR - displayWindowSize, currentYear - displayWindowSize * 0.9));
            }
        }
    }, [currentYear, viewStart, viewEnd, isDragging, displayWindowSize]);
    // Continuous scroll loop
    useEffect(() => {
        const scroll = () => {
            if (scrollDirection.current !== 0) {
                const step = displayWindowSize / 100; // Scroll speed: 1% of window per frame (5 years or 1 year)

                setViewStart(prev => {
                    let nextStart = prev;
                    if (scrollDirection.current === 1) {
                        nextStart = Math.min(GLOBAL_MAX_YEAR - displayWindowSize, prev + step);
                        // Also push currentYear if we are scrolling right
                        if (nextStart > prev) {
                            onYearChange(Math.min(GLOBAL_MAX_YEAR, currentYear + step));
                        }
                    } else if (scrollDirection.current === -1) {
                        nextStart = Math.max(GLOBAL_MIN_YEAR, prev - step);
                        // Also push currentYear if we are scrolling left
                        if (nextStart < prev) {
                            onYearChange(Math.max(GLOBAL_MIN_YEAR, currentYear - step));
                        }
                    }
                    return nextStart;
                });
            }

            if (isDragging) {
                animationFrameId.current = requestAnimationFrame(scroll);
            }
        };

        if (isDragging) {
            animationFrameId.current = requestAnimationFrame(scroll);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            scrollDirection.current = 0;
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isDragging, displayWindowSize, currentYear, onYearChange]);

    const handleSliderChange = (newYear: number) => {
        onYearChange(newYear);

        // Detect scroll zone
        const margin = displayWindowSize * 0.1; // 10% margin

        if (newYear > viewEnd - margin && viewEnd < GLOBAL_MAX_YEAR) {
            scrollDirection.current = 1;
        } else if (newYear < viewStart + margin && viewStart > GLOBAL_MIN_YEAR) {
            scrollDirection.current = -1;
        } else {
            scrollDirection.current = 0;
        }
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => {
        setIsDragging(false);
        scrollDirection.current = 0;
    };

    const trackGradient = useMemo(() => {
        const totalRange = viewEnd - viewStart;
        const getPercent = (year: number) => {
            const percent = ((year - viewStart) / totalRange) * 100;
            return Math.max(0, Math.min(100, percent)); // Clamp between 0 and 100
        };

        const eras = [
            { label: '고조선', end: ERA_LIMITS.GOJOSEON_END, color: getEraColor(ERA_LIMITS.GOJOSEON_END - 1) },
            { label: '원삼국', end: ERA_LIMITS.PROTO_THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.PROTO_THREE_KINGDOMS_END - 1) },
            { label: '삼국', end: ERA_LIMITS.THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.THREE_KINGDOMS_END - 1) },
            { label: '남북국', end: ERA_LIMITS.NORTH_SOUTH_STATES_END, color: getEraColor(ERA_LIMITS.NORTH_SOUTH_STATES_END - 1) },
            { label: '고려', end: ERA_LIMITS.GORYEO_END, color: getEraColor(ERA_LIMITS.GORYEO_END - 1) },
            { label: '조선', end: ERA_LIMITS.JOSEON_END, color: getEraColor(ERA_LIMITS.JOSEON_END - 1) },
            { label: '대한제국', end: ERA_LIMITS.KOREAN_EMPIRE_END, color: getEraColor(ERA_LIMITS.KOREAN_EMPIRE_END - 1) },
            { label: '일제강점기', end: ERA_LIMITS.COLONIAL_PERIOD_END, color: getEraColor(ERA_LIMITS.COLONIAL_PERIOD_END - 1) },
            { label: '광복', end: ERA_LIMITS.LIBERATION_END, color: getEraColor(ERA_LIMITS.LIBERATION_END - 1) },
            { label: '6.25전쟁', end: ERA_LIMITS.KOREAN_WAR_END, color: getEraColor(ERA_LIMITS.KOREAN_WAR_END - 1) },
            { label: '대한민국', end: GLOBAL_MAX_YEAR, color: getEraColor(GLOBAL_MAX_YEAR) },
        ];

        let gradient = 'linear-gradient(to right';
        let prevPercent = 0;

        // Filter eras that overlap with current view
        const visibleEras = eras.filter(era => {
            return era.end > viewStart;
        });

        visibleEras.forEach((era) => {
            const endPercent = getPercent(era.end);

            if (endPercent > prevPercent) {
                gradient += `, ${era.color} ${prevPercent}%, ${era.color} ${endPercent}%`;
                prevPercent = endPercent;
            }
        });

        gradient += ')';
        return gradient;
    }, [viewStart, viewEnd]);




    // Navigation Press-and-Hold Logic
    const latestYearRef = useRef(currentYear);
    const navInterval = useRef<number | null>(null);
    const activeDirection = useRef<number | null>(null);

    useEffect(() => {
        latestYearRef.current = currentYear;
    }, [currentYear]);

    const startNav = (direction: number) => {
        // If already navigating in a different direction, stop it first
        if (activeDirection.current !== null && activeDirection.current !== direction) {
            if (navInterval.current) {
                clearInterval(navInterval.current);
                navInterval.current = null;
            }
        }

        // Set active direction
        activeDirection.current = direction;

        if (navInterval.current) return;

        // Immediate move
        onYearChange(latestYearRef.current + direction);

        // Continuous move
        navInterval.current = window.setInterval(() => {
            onYearChange(latestYearRef.current + direction);
        }, 100); // 100ms interval for fast scrolling
    };

    const stopNav = (direction: number) => {
        // Only stop if the stopped button matches the active direction
        if (activeDirection.current === direction) {
            if (navInterval.current) {
                clearInterval(navInterval.current);
                navInterval.current = null;
            }
            activeDirection.current = null;
        }
    };

    // Cleanup on mount/unmount
    useEffect(() => {
        return () => {
            if (navInterval.current) clearInterval(navInterval.current);
        };
    }, []);


    // Generate 100-year ticks
    const ticks = useMemo(() => {
        const tickElements = [];
        const totalRange = viewEnd - viewStart;
        // Extend range by 10% on each side
        const extendedStart = viewStart - totalRange * 0.1;
        const extendedEnd = viewEnd + totalRange * 0.1;

        const startTick = Math.ceil(extendedStart / 100) * 100;
        const endTick = Math.floor(extendedEnd / 100) * 100;

        for (let year = startTick; year <= endTick; year += 100) {
            const percent = ((year - viewStart) / totalRange) * 100;
            if (percent >= -5 && percent <= 105) {
                tickElements.push({ year, percent });
            }
        }
        return tickElements;
    }, [viewStart, viewEnd]);

    // Generate Era Labels
    const eraLabels = useMemo(() => {
        const totalRange = viewEnd - viewStart;
        return ERAS.filter(era => !era.hideOnTimeline).filter(era => {
            // Check if era start is within extended view
            const extendedStart = viewStart - totalRange * 0.1;
            const extendedEnd = viewEnd + totalRange * 0.1;
            return (era.startYear >= extendedStart && era.startYear <= extendedEnd) ||
                (era.startYear < extendedStart && era.endYear > extendedStart);
        }).map(era => {
            const percent = ((era.startYear - viewStart) / totalRange) * 100;
            return { ...era, percent };
        }).filter(item => item.percent >= -5 && item.percent <= 105); // Allow slight overflow for labels
    }, [viewStart, viewEnd]);


    // Process events for staggering (Vertical Alternation)
    const processedEvents = useMemo(() => {
        const sortedEvents = [...mainEvents].sort((a, b) => a.year - b.year);
        const GAP = 10; // Years gap to consider as overlap

        let lastYear = -9999;
        let lastPosition = 'above'; // 'above' or 'below'

        return sortedEvents.map(event => {
            let position = 'above';

            if (event.year - lastYear < GAP) {
                // If within GAP, toggle position relative to last one
                position = lastPosition === 'above' ? 'below' : 'above';
            } else {
                // Reset to default 'above' if no overlap
                position = 'above';
            }

            lastYear = event.year;
            lastPosition = position;

            return { ...event, position };
        });
    }, [mainEvents]);

    return (
        <div className="timeline-component">

            {/* Sliding Panel */}
            <div
                className={`timeline-panel ${!isVisible ? 'panel-hidden' : ''}`}
                style={{
                    backgroundImage: showEvents
                        ? "url('/assets/images/paper_timeline2.png')"
                        : "url('/assets/images/paper_timeline.png')",
                    height: showEvents ? '250px' : '125px',
                    backgroundSize: showEvents ? '100% 100%' : '100% 100%',
                    backgroundPosition: showEvents ? 'center' : 'bottom'
                }}
            >
                {/* Toggle Button - Always Visible (Moved Inside) */}
                <button
                    className={`timeline-toggle-btn ${!isVisible ? 'btn-hidden-state' : ''}`}
                    onClick={onToggleVisibility}
                    aria-label={isVisible ? "Hide timeline" : "Show timeline"}
                >
                    {timelineVisibility === 'full' ? (
                        <>
                            <span style={{ marginRight: '8px', fontSize: '14px', fontWeight: 600 }}>연표 줄이기</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    ) : timelineVisibility === 'no-events' ? (
                        <>
                            <span style={{ marginRight: '8px', fontSize: '14px', fontWeight: 600 }}>연표 숨기기</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    ) : timelineVisibility === 'hidden' ? (
                        <>
                            <span style={{ marginRight: '8px', fontSize: '14px', fontWeight: 600 }}>모두 숨기기</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 15l7-7 7 7" />
                            </svg>
                        </>
                    ) : (
                        <>
                            <span style={{ marginRight: '8px', fontSize: '14px', fontWeight: 600 }}>전부 보이기</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 15l7-7 7 7" />
                            </svg>
                        </>
                    )}
                </button>

                {/* Scroll Background Wrapper */}
                <div
                    className="timeline-scroll-bg"
                    style={{
                        marginTop: showEvents ? '0' : '-60px'
                    }}
                >
                    <button
                        className="nav-btn prev-btn"
                        onMouseDown={() => startNav(-1)}
                        onMouseUp={() => stopNav(-1)}
                        onMouseLeave={() => stopNav(-1)}
                        onTouchStart={(e) => { e.preventDefault(); startNav(-1); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopNav(-1); }}
                        onTouchCancel={() => stopNav(-1)}
                        aria-label="Previous 1 year"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <div className="timeline-wrapper">
                        <div className="timeline-slider-container">
                            {/* Brush Stroke Line */}
                            <div className="timeline-brush-line"></div>

                            {/* Ticks & Year Labels */}
                            <div className="timeline-ticks">
                                {ticks.map(tick => (
                                    <div
                                        key={tick.year}
                                        className="timeline-tick"
                                        style={{ left: `${tick.percent}%` }}
                                    >
                                        <div className="tick-line"></div>
                                        <div className="tick-label">
                                            {tick.year < 0 ? `BC ${Math.abs(tick.year)}` : tick.year}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Era Labels */}
                            <div className="timeline-era-labels">
                                {eraLabels.map(era => (
                                    <div
                                        key={era.id}
                                        className="era-change-marker"
                                        style={{ left: `${era.percent}%` }}
                                    >
                                        <div className="era-change-line" style={{ backgroundColor: era.color }}></div>
                                        <div className="era-change-label" style={{ color: era.color }}>{era.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Event Markers */}
                            {showEvents && (
                                <div className="timeline-event-markers">
                                    {processedEvents.map((event) => {
                                        const totalRange = viewEnd - viewStart;
                                        const percent = ((event.year - viewStart) / totalRange) * 100;

                                        if (percent < 1 || percent > 99) return null;

                                        const formatEventName = (name: string) => {
                                            return name.split(' ').join('\n');
                                        };

                                        const isBelow = event.position === 'below';

                                        const displayName = event.shortName || event.eventName;

                                        return (
                                            <div
                                                key={event.eventId}
                                                className="event-marker"
                                                style={{ left: `${percent}%` }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onYearChange(event.year);
                                                    if (onEventClick) onEventClick(event);
                                                }}
                                            >
                                                <div className="event-marker-dot" style={{ backgroundColor: getEraColor(event.year) }}></div>
                                                <div
                                                    className="event-marker-label"
                                                    style={{
                                                        borderColor: getEraColor(event.year),
                                                        bottom: isBelow ? 'auto' : '15px',
                                                        top: isBelow ? '25px' : 'auto',
                                                        transformOrigin: isBelow ? 'top center' : 'bottom center'
                                                    }}
                                                >
                                                    {formatEventName(displayName)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <input
                                type="range"
                                min={viewStart}
                                max={viewEnd}
                                value={currentYear}
                                className="timeline-slider"
                                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onTouchStart={handleMouseDown}
                                onTouchEnd={handleMouseUp}
                                style={{ '--thumb-color': thumbColor } as React.CSSProperties}
                            />
                            {/* Gradient Track - Optional, maybe remove if brush line is enough, or keep for subtle color indication */}
                            <div
                                className="timeline-track-bg"
                                style={{ background: trackGradient, opacity: 0.3 }}
                            ></div>
                        </div>
                    </div>

                    <button
                        className="nav-btn next-btn"
                        onMouseDown={() => startNav(1)}
                        onMouseUp={() => stopNav(1)}
                        onMouseLeave={() => stopNav(1)}
                        onTouchStart={(e) => { e.preventDefault(); startNav(1); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopNav(1); }}
                        onTouchCancel={() => stopNav(1)}
                        aria-label="Next 1 year"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

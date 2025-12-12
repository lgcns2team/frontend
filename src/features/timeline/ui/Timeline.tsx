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
}


const GLOBAL_MIN_YEAR = -2333;
const GLOBAL_MAX_YEAR = 2024;

export const Timeline = ({ currentYear, onYearChange, onEventClick, isVisible, onToggleVisibility }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);
    const [mainEvents, setMainEvents] = useState<ParsedMainEvent[]>([]);
    // const [isVisible, setIsVisible] = useState(true); // Moved to parent

    useEffect(() => {
        fetchMainEvents().then(setMainEvents);
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
    }, [isDragging, currentYear, onYearChange, displayWindowSize]);

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
        const startTick = Math.ceil(viewStart / 100) * 100;
        const endTick = Math.floor(viewEnd / 100) * 100;
        const totalRange = viewEnd - viewStart;

        for (let year = startTick; year <= endTick; year += 100) {
            const percent = ((year - viewStart) / totalRange) * 100;
            if (percent >= 0 && percent <= 100) {
                tickElements.push({ year, percent });
            }
        }
        return tickElements;
    }, [viewStart, viewEnd]);

    // Generate Era Labels
    const eraLabels = useMemo(() => {
        const totalRange = viewEnd - viewStart;
        return ERAS.filter(era => {
            // Check if era start is within view or if era spans across view start
            return (era.startYear >= viewStart && era.startYear <= viewEnd) ||
                (era.startYear < viewStart && era.endYear > viewStart);
        }).map(era => {
            // Position at start of era, or at left edge if start is off-screen?
            // User said "where the era changes", so strictly at startYear seems best.
            // But if startYear is offscreen, we might miss the label.
            // Let's stick to startYear for now as "era change marker".
            const percent = ((era.startYear - viewStart) / totalRange) * 100;
            return { ...era, percent };
        }).filter(item => item.percent >= -5 && item.percent <= 105); // Allow slight overflow for labels
    }, [viewStart, viewEnd]);


    return (
        <div className="timeline-component">

            {/* Sliding Panel */}
            <div className={`timeline-panel ${!isVisible ? 'panel-hidden' : ''}`}>
                {/* Toggle Button - Always Visible (Moved Inside) */}
                <button
                    className="timeline-toggle-btn"
                    onClick={onToggleVisibility}
                    aria-label={isVisible ? "Hide timeline" : "Show timeline"}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transform: isVisible ? 'rotate(0deg)' : 'rotate(180deg)',
                            transition: 'transform 0.3s ease'
                        }}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                {/* Scroll Background Wrapper */}
                <div className="timeline-scroll-bg">
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
                            <div className="timeline-event-markers">
                                {mainEvents.map((event) => {
                                    const totalRange = viewEnd - viewStart;
                                    const percent = ((event.year - viewStart) / totalRange) * 100;

                                    if (percent < -5 || percent > 105) return null;

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
                                            <div className="event-marker-label" style={{ borderColor: getEraColor(event.year) }}>
                                                {event.eventName}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

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

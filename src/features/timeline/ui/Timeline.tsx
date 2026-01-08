import { useMemo, useState, useEffect, useRef } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './Timeline.css';
import { getEraColor, ERA_LIMITS, ERAS, getEraForYear } from '../../../shared/config/era-theme';


interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
    onEventClick?: (event: ParsedMainEvent) => void;
    isVisible: boolean;
    onIncreaseVisibility: () => void;
    onDecreaseVisibility: () => void;
    showEvents?: boolean;
    timelineVisibility?: 'full' | 'no-events' | 'hidden' | 'full-hidden';
}


const GLOBAL_MIN_YEAR = -2333;
const GLOBAL_MAX_YEAR = 2024;

// Dynamic window size calculation based on event density
const calculateDynamicWindowSize = (year: number, events: ParsedMainEvent[]): number => {
    const era = getEraForYear(year);

    // Get era boundaries (clamped to global limits)
    const eraStart = Math.max(era.startYear === -Infinity ? GLOBAL_MIN_YEAR : era.startYear, GLOBAL_MIN_YEAR);
    const eraEnd = Math.min(era.endYear === Infinity ? GLOBAL_MAX_YEAR : era.endYear, GLOBAL_MAX_YEAR);
    const eraDuration = eraEnd - eraStart;

    // Count events in this era
    const eraEvents = events.filter(e => e.year >= eraStart && e.year <= eraEnd);
    const eventCount = eraEvents.length;

    // Calculate density (events per 100 years)
    const density = eraDuration > 0 ? (eventCount / eraDuration) * 100 : 0;

    // Window size scaling:
    // - High density (many events) -> smaller window (zoom in) -> more space between labels
    // - Low density (few events) -> larger window (zoom out) -> compact view
    const MIN_WINDOW = 50;   // Maximum zoom in (dense eras like 대한제국/일제강점기)
    const MAX_WINDOW = 300;  // Maximum zoom out (sparse eras like 고조선/조선)
    const BASE_WINDOW = 150; // Default window size

    // Scale inversely with density
    // density 0.5 events/100yr -> 300 years window
    // density 5+ events/100yr -> 50 years window
    let windowSize = BASE_WINDOW;
    if (density > 0) {
        // Higher density = smaller window
        windowSize = Math.max(MIN_WINDOW, Math.min(MAX_WINDOW, BASE_WINDOW / (density * 0.5 + 0.5)));
    }

    return Math.round(windowSize);
};

export const Timeline = ({ currentYear, onYearChange, onEventClick, isVisible, onIncreaseVisibility, onDecreaseVisibility, showEvents = true, timelineVisibility = 'full' }: TimelineProps) => {
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

    // Base window size is 500 years, but dynamic when showing events for better readability
    const BASE_WINDOW_SIZE = 500;

    // Calculate dynamic window size based on current era's event density
    const dynamicWindowSize = useMemo(() => {
        if (!showEvents || mainEvents.length === 0) return 200; // Default when no events
        return calculateDynamicWindowSize(currentYear, mainEvents);
    }, [currentYear, mainEvents, showEvents]);

    // Smooth transition for window size changes
    const [smoothWindowSize, setSmoothWindowSize] = useState(dynamicWindowSize);

    useEffect(() => {
        // Gradually transition to new window size for smooth zoom effect
        const targetSize = dynamicWindowSize;
        const currentSize = smoothWindowSize;

        if (Math.abs(targetSize - currentSize) < 5) {
            setSmoothWindowSize(targetSize);
            return;
        }

        const step = (targetSize - currentSize) * 0.15; // 15% per frame for smooth transition
        const timeout = setTimeout(() => {
            setSmoothWindowSize(Math.round(currentSize + step));
        }, 16); // ~60fps

        return () => clearTimeout(timeout);
    }, [dynamicWindowSize, smoothWindowSize]);

    const displayWindowSize = showEvents ? smoothWindowSize : BASE_WINDOW_SIZE;

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
                setViewStart(Math.round(Math.max(GLOBAL_MIN_YEAR, currentYear - displayWindowSize * 0.1)));
            } else if (currentYear > viewEnd) {
                setViewStart(Math.round(Math.min(GLOBAL_MAX_YEAR - displayWindowSize, currentYear - displayWindowSize * 0.9)));
            }
        }
    }, [currentYear, viewStart, viewEnd, isDragging, displayWindowSize]);
    // Continuous scroll loop
    useEffect(() => {
        const scroll = () => {
            if (scrollDirection.current !== 0) {
                const step = Math.max(1, Math.round(displayWindowSize / 100)); // Scroll speed: 1% of window per frame, minimum 1 year

                setViewStart(prev => {
                    let nextStart = prev;
                    if (scrollDirection.current === 1) {
                        nextStart = Math.round(Math.min(GLOBAL_MAX_YEAR - displayWindowSize, prev + step));
                        // Also push currentYear if we are scrolling right
                        if (nextStart > prev) {
                            onYearChange(Math.round(Math.min(GLOBAL_MAX_YEAR, currentYear + step)));
                        }
                    } else if (scrollDirection.current === -1) {
                        nextStart = Math.round(Math.max(GLOBAL_MIN_YEAR, prev - step));
                        // Also push currentYear if we are scrolling left
                        if (nextStart < prev) {
                            onYearChange(Math.round(Math.max(GLOBAL_MIN_YEAR, currentYear - step)));
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


    // Process events for staggering (Vertical Alternation + Same-year stacking + Era label avoidance)
    const processedEvents = useMemo(() => {
        const sortedEvents = [...mainEvents].sort((a, b) => a.year - b.year);

        const totalRange = viewEnd - viewStart;

        // Get era start years for horizontal offset check
        const eraStartYears = ERAS.filter(era => !era.hideOnTimeline).map(era => era.startYear);

        const reservedPercents = [
            ...ticks.map(t => t.percent),
            ...eraLabels.map(e => e.percent),
        ];

        const NEAR_PCT = 3; // 3% 이내면 아래 금지

        const isReservedX = (eventYear: number) => {
            const p = ((eventYear - viewStart) / totalRange) * 100;
            return reservedPercents.some(rp => Math.abs(rp - p) <= NEAR_PCT);
        };

        // Check if event is near an era start (for horizontal offset)
        const isNearEraStart = (eventYear: number): boolean => {
            // Check if within 5 years of any era start
            return eraStartYears.some(eraYear => Math.abs(eventYear - eraYear) <= 5);
        };

        const GAP = 10; // Years gap to consider as overlap

        // Track same-year event indices for horizontal offsetting
        const yearCurrentIndex: { [year: number]: number } = {};

        let lastYear = -9999;
        let lastPosition = 'above'; // 'above' or 'below'

        return sortedEvents.map(ev => {
            // Track same-year index for horizontal offset
            if (yearCurrentIndex[ev.year] === undefined) {
                yearCurrentIndex[ev.year] = 0;
            } else {
                yearCurrentIndex[ev.year]++;
            }
            const sameYearIndex = yearCurrentIndex[ev.year];

            // Calculate horizontal offset
            let horizontalOffset = 0;

            // Same-year events alternate left/right
            if (sameYearIndex > 0) {
                // Odd indices go left, even go right
                const direction = sameYearIndex % 2 === 1 ? -1 : 1;
                const magnitude = Math.ceil(sameYearIndex / 2) * 35; // 35px spacing
                horizontalOffset = direction * magnitude;
            }

            // Era label conflicts - push to LEFT (negative offset) to avoid right-side label
            if (isNearEraStart(ev.year)) {
                horizontalOffset -= 30; // Push left away from era label
            }

            // Determine above/below position
            let position: 'above' | 'below' = 'above';

            // 연도/시대 라벨이 있는 구간이면 below 금지
            if (isReservedX(ev.year)) {
                position = 'above';
            } else if (ev.year === lastYear || ev.year - lastYear < GAP) {
                // Same year or within GAP years - alternate above/below
                position = lastPosition === 'above' ? 'below' : 'above';
            } else {
                position = 'above';
            }

            lastYear = ev.year;
            lastPosition = position;

            return {
                ...ev,
                position,
                horizontalOffset
            };
        });
    }, [mainEvents, showEvents, viewStart, viewEnd, ticks, eraLabels]);

    return (
        <div className="timeline-component">
            {/* Visibility Control Buttons - Outside panel to stay fixed */}
            <div
                className="timeline-visibility-controls"
                style={{
                    bottom: (timelineVisibility === 'full' || timelineVisibility === 'no-events')
                        ? (showEvents ? '260px' : '135px')
                        : '10px'
                }}
            >
                <button
                    className={`timeline-visibility-btn timeline-visibility-up ${timelineVisibility === 'full' ? 'visibility-btn-disabled' : ''}`}
                    onClick={onDecreaseVisibility}
                    disabled={timelineVisibility === 'full'}
                    aria-label="Decrease visibility level"
                    title="단계 낮추기"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button
                    className={`timeline-visibility-btn timeline-visibility-down ${timelineVisibility === 'full-hidden' ? 'visibility-btn-disabled' : ''}`}
                    onClick={onIncreaseVisibility}
                    disabled={timelineVisibility === 'full-hidden'}
                    aria-label="Increase visibility level"
                    title="단계 높이기"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Sliding Panel */}
            <div
                className={`timeline-panel ${!isVisible ? 'panel-hidden' : ''}`}
                style={{
                    backgroundImage: showEvents
                        ? "url('/assets/images/etc/paper_timeline2.png')"
                        : "url('/assets/images/etc/paper_timeline.png')",
                    height: showEvents ? '250px' : '125px',
                    backgroundSize: '100% 100%',
                    backgroundPosition: showEvents ? 'center' : 'bottom'
                }}
            >

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
                                                        transformOrigin: isBelow ? 'top center' : 'bottom center',
                                                        marginLeft: event.horizontalOffset ? `${event.horizontalOffset}px` : '0'
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

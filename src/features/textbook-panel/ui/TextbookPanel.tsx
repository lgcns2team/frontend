import { useState, useRef, useEffect } from 'react';
import './TextbookPanel.css';

// 인물 핫스팟 데이터 구조
interface PersonHotspot {
    name: string;         // 인물 이름
    x: number;           // 왼쪽에서의 위치 (%)
    y: number;           // 위에서의 위치 (%)
    width: number;       // 너비 (%)
    height: number;      // 높이 (%)
}

// 페이지별 인물 핫스팟 매핑 데이터
// 좌표는 이미지 기준 상대 위치 (%)
// 키는 0-indexed (currentPage 값과 일치), 주석은 실제 표시 페이지 번호
const PERSON_HOTSPOTS: Record<number, PersonHotspot[]> = {
    45: [{ name: '을지문덕', x: 5, y: 72, width: 25, height: 20 }],   // 46페이지 - 왼쪽 하단
    48: [{ name: '신채호', x: 34, y: 52, width: 16, height: 15 }],     // 49페이지 - 중앙 하단
    50: [{ name: '대조영', x: 70, y: 66, width: 22, height: 24 }],      // 51페이지 - 왼쪽 상단
    81: [{ name: '서희', x: 60, y: 70, width: 20, height: 18 }],       // 82페이지 - 왼쪽 하단
    121: [                                                              // 122페이지 - 중앙 두 원형 초상화
        { name: '이황', x: 34, y: 65, width: 12, height: 15 },
        { name: '이이', x: 74, y: 65, width: 12, height: 15 }
    ],
    125: [{ name: '이순신', x: 72, y: 67, width: 22, height: 24 }],     // 126페이지 - 왼쪽 하단
    143: [{ name: '영조', x: 9, y: 60, width: 18, height: 18 }],      // 144페이지 - 탐구 박스 내
    148: [{ name: '정약용', x: 37, y: 48, width: 15, height: 18 }],    // 149페이지 - 두번째 원형 초상화
    171: [{ name: '고종', x: 9, y: 72, width: 16, height: 20 }],       // 172페이지 - 왼쪽 하단
    172: [{ name: '안중근', x: 74, y: 40, width: 16, height: 18 }],    // 173페이지 - 오른쪽 의열 투쟁 박스
    178: [{ name: '윤봉길', x: 72, y: 22, width: 19, height: 20 }],    // 179페이지 - 오른쪽 상단
    180: [{ name: '김구', x: 77, y: 15, width: 13, height: 14 }]       // 181페이지 - 오른쪽 상단
};

// 지도 핫스팟 데이터 구조
interface MapHotspot {
    year: number;        // 이동할 연도
    x: number;           // 왼쪽 위치 (%)
    y: number;           // 위쪽 위치 (%)
    width: number;       // 너비 (%)
    height: number;      // 높이 (%)
    description: string; // 설명 (툴팁용)
}

// 페이지별 지도 핫스팟 매핑 (좌표는 임시)
const MAP_HOTSPOTS: Record<number, MapHotspot[]> = {
    13: [{ year: -108, x: 4, y: 7, width: 32, height: 22, description: '고조선-한 전쟁' }], // 14p
    23: [{ year: 413, x: 5, y: 3, width: 22, height: 24, description: '고구려 전성기' }],   // 24p
    25: [{ year: 371, x: 4, y: 33, width: 23, height: 16, description: '백제 전성기' }],     // 26p
    28: [{ year: 554, x: 38, y: 48, width: 30, height: 30, description: '신라 전성기' }],     // 29p
    46: [{ year: 612, x: 66, y: 19, width: 30, height: 20, description: '고구려 vs 수-당 전쟁' }], // 47p
    48: [{ year: 675, x: 66, y: 3, width: 30, height: 24, description: '나당 전쟁' }],       // 49p
    50: [{ year: 698, x: 62, y: 26, width: 28, height: 16, description: '발해 건국 전쟁' }],  // 51p
    57: [{ year: 822, x: 4, y: 47, width: 22, height: 23, description: '통일신라 반란' }],   // 58p
    73: [{ year: 936, x: 10, y: 34, width: 21, height: 19, description: '후삼국 전쟁' }],     // 74p
    80: [{ year: 1176, x: 17, y: 56, width: 24, height: 21, description: '망이·망소이의 난' }], // 81p
    81: [{ year: 993, x: 10, y: 66, width: 30, height: 23, description: '거란의 침입 (서희)' }], // 82p
    85: [{ year: 1231, x: 32, y: 20, width: 33, height: 33, description: '여몽전쟁' }],       // 86p
    90: [{ year: 1380, x: 70, y: 29, width: 30, height: 28, description: '홍건적/왜구 침입' }], // 91p
    125: [{ year: 1592, x: 6, y: 61, width: 30, height: 28, description: '임진왜란' }],      // 126p
    130: [{ year: 1636, x: 72, y: 9, width: 24, height: 24, description: '병자호란' }],      // 131p
    160: [{ year: 1811, x: 70, y: 20, width: 28, height: 30, description: '홍경래의 난/민란' }], // 161p
    178: [{ year: 1920, x: 74, y: 3, width: 25, height: 20, description: '독립 전쟁 (청산리/봉오동)' }], // 179p
    182: [{ year: 1950, x: 70, y: 3, width: 28, height: 29, description: '6.25 전쟁' }],     // 183p
};

interface TextbookPanelProps {
    currentPage: number;
    viewMode: 'single' | 'double';
    onPageChange: (page: number) => void;
    onViewModeChange: (mode: 'single' | 'double') => void;
    onVoiceChat?: () => void;
    isConversationMode?: boolean;
    onPersonClick?: (personName: string) => void;
    isPinsetEnabled?: boolean;
    onTogglePinset?: () => void;
    onJumpToYear?: (year: number) => void;
}

const S3_BUCKET_URL = "https://khistorybook.s3.ap-northeast-2.amazonaws.com";

export const TextbookPanel = ({
    currentPage,
    viewMode,
    onPageChange,
    onViewModeChange,
    onVoiceChat,
    isConversationMode = false,
    onPersonClick,
    isPinsetEnabled = false,
    onTogglePinset,
    onJumpToYear
}: TextbookPanelProps) => {
    // 인물 핫스팟 렌더링 함수
    const renderHotspots = (page: number) => {
        const personHotspots = PERSON_HOTSPOTS[page] || [];
        const mapHotspots = MAP_HOTSPOTS[page] || [];

        if ((!personHotspots.length && !mapHotspots.length)) return null;

        return (
            <>
                {/* Person Hotspots */}
                {onPersonClick && personHotspots.map((hotspot, index) => (
                    <div
                        key={`person-${page}-${hotspot.name}-${index}`}
                        className="person-hotspot"
                        style={{
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                            width: `${hotspot.width}%`,
                            height: `${hotspot.height}%`
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPersonClick(hotspot.name);
                        }}
                        title={`${hotspot.name} - 클릭하여 대화하기`}
                    >
                        <span className="hotspot-label">{hotspot.name}</span>
                    </div>
                ))}

                {/* Map Hotspots */}
                {onJumpToYear && mapHotspots.map((hotspot, index) => (
                    <div
                        key={`map-${page}-${hotspot.year}-${index}`}
                        className="map-hotspot"
                        style={{
                            position: 'absolute',
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                            width: `${hotspot.width}%`,
                            height: `${hotspot.height}%`,
                            cursor: 'pointer',
                            // border: '2px dashed rgba(0, 0, 255, 0.3)', // Debug visualization
                            zIndex: 10
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onJumpToYear(hotspot.year);
                        }}
                        title={`${hotspot.description} - 클릭하여 지도로 이동 (${Math.abs(hotspot.year)}${hotspot.year < 0 ? 'BC' : '년'})`}
                    >
                        {/* Optional: Add visual indicator on hover via CSS or a small icon */}
                    </div>
                ))}
            </>
        );
    };
    const getImageUrl = (page: number) => {
        // return `/historybook/${page}.png`;

        // S3 주소로 변경
        return `${S3_BUCKET_URL}/${page}.png`
    };

    const totalPages = 220;
    const [pageInput, setPageInput] = useState('');

    // Floating bar position state - start at bottom center
    const [barPosition, setBarPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Center the bar horizontally at the bottom on mount and when viewMode changes
    useEffect(() => {
        const updateBarPosition = () => {
            if (containerRef.current) {
                // In conversation mode, panel is half width, so center within that
                const containerWidth = containerRef.current.offsetWidth;
                const containerHeight = containerRef.current.offsetHeight;
                const barWidth = 500; // Approximate bar width (updated for wider bar)
                const barHeight = 50; // Approximate bar height
                setBarPosition({
                    x: (containerWidth - barWidth) / 2,
                    y: containerHeight - barHeight - 30 // 30px from bottom
                });
            }
        };

        if (barPosition === null) {
            // Use setTimeout to wait for layout update after view mode change
            const timer = setTimeout(updateBarPosition, 50);
            return () => clearTimeout(timer);
        }
    }, [barPosition, viewMode, isConversationMode]);

    const handlePrev = () => {
        if (viewMode === 'single') {
            onPageChange(Math.max(0, currentPage - 1));
        } else {
            onPageChange(Math.max(0, currentPage - 2));
        }
    };

    const handleNext = () => {
        if (viewMode === 'single') {
            onPageChange(Math.min(totalPages - 1, currentPage + 1));
        } else {
            onPageChange(Math.min(totalPages - 2, currentPage + 2));
        }
    };

    const handlePageInputSubmit = () => {
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 220) {
            onPageChange(pageNum - 1);
            setPageInput('');
        } else {
            alert('1에서 220 사이의 페이지를 입력해주세요.');
        }
    };

    const toggleViewMode = () => {
        onViewModeChange(viewMode === 'single' ? 'double' : 'single');
        // Reset nav bar position to bottom center after view mode change
        setBarPosition(null);
    };

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!barPosition) return;
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - barPosition.x,
            y: e.clientY - barPosition.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const barWidth = 400;
        const barHeight = 44;

        let newX = e.clientX - dragStart.current.x;
        let newY = e.clientY - dragStart.current.y;

        // Constrain within container
        newX = Math.max(0, Math.min(newX, containerRect.width - barWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - barHeight));

        setBarPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Double-click to collapse nav bar
    const handleCollapse = () => {
        setIsCollapsed(true);
    };

    // Click collapsed button to expand
    const handleExpandClick = () => {
        setIsCollapsed(false);
        setBarPosition(null); // Reset to bottom center
    };

    return (
        <div
            className="textbook-panel"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Floating Navigation Bar - hide when collapsed */}
            {barPosition && !isCollapsed && (
                <div
                    className="textbook-floating-nav"
                    style={{
                        left: `${barPosition.x}px`,
                        top: `${barPosition.y}px`
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <button
                        className="nav-btn"
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                    >
                        ◀
                    </button>

                    <span className="page-indicator">
                        {viewMode === 'single'
                            ? `${currentPage + 1}p`
                            : `${currentPage + 1}p - ${currentPage + 2}p`}
                    </span>

                    <button
                        className="nav-btn"
                        onClick={handleNext}
                        disabled={viewMode === 'single' ? currentPage === totalPages - 1 : currentPage >= totalPages - 2}
                    >
                        ▶
                    </button>

                    <div className="nav-divider"></div>

                    {/* Pinset (Sync) Toggle */}
                    {onTogglePinset && (
                        <button
                            className={`nav-btn ${isPinsetEnabled ? 'active' : ''}`}
                            onClick={onTogglePinset}
                            title={isPinsetEnabled ? "지도 연동 끄기" : "지도 연동 켜기"}
                            style={{
                                color: isPinsetEnabled ? '#ef4444' : 'inherit',
                                position: 'relative'
                            }}
                        >
                            📌
                            {isPinsetEnabled && (
                                <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ef4444',
                                    border: '1px solid white'
                                }}></span>
                            )}
                        </button>
                    )}

                    <div className="nav-divider"></div>

                    <input
                        type="text"
                        className="page-input"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                        placeholder="p"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button className="nav-btn" onClick={handlePageInputSubmit}>
                        이동
                    </button>

                    <div className="nav-divider"></div>

                    {onVoiceChat && (
                        <button
                            className={`nav-btn accent ${isConversationMode ? 'disabled' : ''}`}
                            onClick={onVoiceChat}
                            disabled={isConversationMode}
                        >
                            인물대화
                        </button>
                    )}

                    <button
                        className={`nav-btn accent ${isConversationMode ? 'disabled' : ''}`}
                        onClick={toggleViewMode}
                        disabled={isConversationMode}
                    >
                        {viewMode === 'single' ? '양면' : '한면'}
                    </button>

                    <button
                        className="nav-minimize-btn"
                        onClick={handleCollapse}
                        title="최소화"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Collapsed Circle Button */}
            {isCollapsed && (
                <button
                    className="nav-collapsed-btn"
                    onClick={handleExpandClick}
                    title="클릭하여 확장"
                >
                    컨트롤 바
                </button>
            )}

            {/* Textbook Content */}
            <div className={`textbook-content ${viewMode}`}>
                {viewMode === 'single' ? (
                    <div className="page-container single">
                        <div className="image-wrapper">
                            <img
                                src={getImageUrl(currentPage)}
                                alt={`Page ${currentPage}`}
                                className="textbook-page"
                            />
                            {renderHotspots(currentPage)}
                        </div>
                    </div>
                ) : (
                    <div className="page-container double">
                        <div className="page-wrapper">
                            <img
                                src={getImageUrl(currentPage)}
                                alt={`Page ${currentPage}`}
                                className="textbook-page"
                            />
                            {renderHotspots(currentPage)}
                        </div>
                        <div className="page-wrapper">
                            {currentPage + 1 < totalPages && (
                                <>
                                    <img
                                        src={getImageUrl(currentPage + 1)}
                                        alt={`Page ${currentPage + 1}`}
                                        className="textbook-page"
                                    />
                                    {renderHotspots(currentPage + 1)}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

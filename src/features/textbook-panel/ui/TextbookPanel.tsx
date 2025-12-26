import { useState, useRef, useEffect } from 'react';
import './TextbookPanel.css';

interface TextbookPanelProps {
    currentPage: number;
    viewMode: 'single' | 'double';
    onPageChange: (page: number) => void;
    onViewModeChange: (mode: 'single' | 'double') => void;
    onVoiceChat?: () => void;
    isConversationMode?: boolean;
}

const S3_BUCKET_URL = "https://khistorybook.s3.ap-northeast-2.amazonaws.com";

export const TextbookPanel = ({
    currentPage,
    viewMode,
    onPageChange,
    onViewModeChange,
    onVoiceChat,
    isConversationMode = false
}: TextbookPanelProps) => {
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
                        <img
                            src={getImageUrl(currentPage)}
                            alt={`Page ${currentPage}`}
                            className="textbook-page"
                        />
                    </div>
                ) : (
                    <div className="page-container double">
                        <div className="page-wrapper">
                            <img
                                src={getImageUrl(currentPage)}
                                alt={`Page ${currentPage}`}
                                className="textbook-page"
                            />
                        </div>
                        <div className="page-wrapper">
                            {currentPage + 1 < totalPages && (
                                <img
                                    src={getImageUrl(currentPage + 1)}
                                    alt={`Page ${currentPage + 1}`}
                                    className="textbook-page"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

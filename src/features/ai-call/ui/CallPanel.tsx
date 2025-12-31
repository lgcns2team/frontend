import { useState, useEffect } from 'react';
import './CallPanel.css';

interface CallPanelProps {
    characterName: string;
    characterImage: string;
    onClose: () => void;
}

export const CallPanel = ({ characterName, characterImage, onClose }: CallPanelProps) => {
    const [isCallAccepted, setIsCallAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [isVoiceFilter, setIsVoiceFilter] = useState(false);
    const [isChatLogOpen, setIsChatLogOpen] = useState(false);
    const [isHideScreen, setIsHideScreen] = useState(false);
    const [isFaceTalk, setIsFaceTalk] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // 임시 채팅 로그 데이터 (TODO: 실제 데이터 연결)
    const chatLogs = [
        { id: 1, sender: 'bot', text: '안녕하십니까. 무엇을 도와드릴까요?' },
        { id: 2, sender: 'user', text: '조선 건국에 대해 알려주세요.' },
        { id: 3, sender: 'bot', text: '조선은 1392년에 건국되었습니다.' },
    ];

    // 통화 시간 타이머 (통화 수락 후에만 동작)
    useEffect(() => {
        if (!isCallAccepted) return;

        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isCallAccepted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 수신 화면 (통화 수락 전)
    if (!isCallAccepted) {
        return (
            <div className="call-panel call-incoming">
                <div className="call-profile-section">
                    <div className="call-profile-image-container">
                        <img src={characterImage} alt={characterName} className="call-profile-image" />
                    </div>
                    <div className="call-profile-name">{characterName}</div>
                    <div className="call-incoming-text">음성 통화</div>
                </div>

                {/* 수락/거절 버튼 */}
                <div className="call-incoming-buttons">
                    <button className="call-accept-btn" onClick={() => setIsCallAccepted(true)}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                    </button>
                    <button className="call-reject-btn" onClick={onClose}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // 통화 중 화면 (통화 수락 후)
    return (
        <div className="call-panel">
            {/* 프로필 영역 */}
            <div className={`call-profile-section ${isChatLogOpen ? 'chatlog-open' : ''}`}>
                <div className="call-profile-image-container">
                    <img src={characterImage} alt={characterName} className="call-profile-image" />
                </div>
                <div className="call-profile-name">{characterName}</div>
                <div className="call-duration">{formatTime(callDuration)}</div>
            </div>

            {/* 버튼 그리드 영역 */}
            <div className="call-buttons-grid">
                {/* 상단 3개 버튼 */}
                <div className="call-button-row">
                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isMuted ? '#333' : '#999'}>
                                {isMuted ? (
                                    <>
                                        <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05V9h2v2zm-4 .98V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.17l6 5.98V12h.01z" />
                                        <path d="M4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.18 4.18L21 19.73 4.27 3z" />
                                    </>
                                ) : (
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V21c0 .55.45 1 1 1s1-.45 1-1v-3.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                                )}
                            </svg>
                        </button>
                        <span className="call-button-label">음소거</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsSpeaker(!isSpeaker)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isSpeaker ? '#333' : '#999'}>
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        </button>
                        <span className="call-button-label">스피커</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsVoiceFilter(!isVoiceFilter)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isVoiceFilter ? '#333' : '#999'}>
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </button>
                        <span className="call-button-label">음성필터</span>
                    </div>
                </div>

                {/* 하단 3개 버튼 */}
                <div className="call-button-row">
                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsChatLogOpen(!isChatLogOpen)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isChatLogOpen ? '#333' : '#999'}>
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                                <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z" />
                            </svg>
                        </button>
                        <span className="call-button-label">대화내역</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsHideScreen(!isHideScreen)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isHideScreen ? '#333' : '#999'}>
                                <path d="M18 4l2 3h-3l-2-3h-2l2 3h-3l-2-3H8l2 3H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM4 18V6.47L5.76 9H16l2 3h2v6H4z" />
                            </svg>
                        </button>
                        <span className="call-button-label">화면 숨김</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn"
                            onClick={() => setIsFaceTalk(!isFaceTalk)}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isFaceTalk ? '#333' : '#999'}>
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        </button>
                        <span className="call-button-label">페이스톡</span>
                    </div>
                </div>
            </div>

            {/* 채팅 로그 오버레이 */}
            {isChatLogOpen && (
                <div className="call-chatlog-overlay">
                    <div className="call-chatlog-header">
                        <span>대화 내역</span>
                        <button className="call-chatlog-close" onClick={() => setIsChatLogOpen(false)}>×</button>
                    </div>
                    <div className="call-chatlog-body">
                        {chatLogs.map(log => (
                            <div key={log.id} className={`call-chatlog-msg ${log.sender}`}>
                                {log.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 통화 종료 버튼 */}
            <div className="call-end-section">
                <button className="call-end-btn" onClick={onClose}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

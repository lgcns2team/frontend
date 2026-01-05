import { useState, useEffect, useRef } from 'react';
import { sendCharacterMessage } from '../../../shared/api/aichat-api';
import { fetchCharacterDetail } from '../../../shared/api/characters-api';
import './CallPanel.css';

interface CallPanelProps {
    characterName: string;
    characterImage: string;
    promptId: string;
    initialMessage: string;
    onClose: () => void;
    isMinimized: boolean;
    onMinimize: (minimized: boolean) => void;
}

interface ChatMessage {
    id: number;
    text: string;
    sender: 'bot' | 'user';
}

export const CallPanel = ({ characterName, characterImage, promptId, initialMessage, onClose, isMinimized, onMinimize }: CallPanelProps) => {
    console.log('Rendering CallPanel, isMinimized:', isMinimized);
    const [isCallAccepted, setIsCallAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true); // 기본 ON 상태
    const [isChatLogOpen, setIsChatLogOpen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 타이핑 효과 관련 Ref
    const typingBufferRef = useRef<string>('');
    const typingIntervalRef = useRef<number | null>(null);
    const currentBotMsgIdRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Audio Refs
    const waitAudioRef = useRef<HTMLAudioElement | null>(null);
    const startAudioRef = useRef<HTMLAudioElement | null>(null);
    const endAudioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

    // Component Mounted State
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Initialize Audio
    useEffect(() => {
        waitAudioRef.current = new Audio('/assets/wait.mp3');
        waitAudioRef.current.loop = true;
        startAudioRef.current = new Audio('/assets/start.mp3');
        endAudioRef.current = new Audio('/assets/end.mp3');
        endAudioRef.current.volume = 0.2;

        // Play wait sound initially
        waitAudioRef.current.play().catch(e => console.log('Audio play failed:', e));

        return () => {
            // Cleanup on unmount
            if (waitAudioRef.current) {
                waitAudioRef.current.pause();
                waitAudioRef.current.currentTime = 0;
            }
            if (startAudioRef.current) {
                startAudioRef.current.pause();
                startAudioRef.current.currentTime = 0;
            }

            // Abort any pending TTS request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Stop TTS if playing
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current = null;
            }

            // Deliberately NOT pausing endAudioRef to let it finish playing after unmount
        };
    }, []);

    // Handle Call Acceptance Audio
    useEffect(() => {
        if (isCallAccepted) {
            // Stop wait sound
            if (waitAudioRef.current) {
                waitAudioRef.current.pause();
                waitAudioRef.current.currentTime = 0;
            }
            // Play start sound
            if (startAudioRef.current) {
                startAudioRef.current.play().catch(e => console.log('Start audio play failed:', e));
            }
        }
    }, [isCallAccepted]);

    // Handle Call End (Custom handler to play sound)
    const handleCallEnd = () => {
        // Stop others
        if (waitAudioRef.current) {
            waitAudioRef.current.pause();
        }
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current = null;
        }

        if (endAudioRef.current) {
            endAudioRef.current.play().catch(e => console.log('End audio play failed:', e));
        }
        onClose();
    };

    // 음성 재생 함수
    const playVoice = async (text: string, onPlay?: () => void) => {
        // 스피커가 꺼져있으면 재생 안함
        if (!isSpeaker) {
            console.log('🔊 [CallPanel] Speaker is OFF, skipping TTS');
            if (onPlay) onPlay(); // Fallback
            return;
        }

        if (!promptId) {
            console.warn('⚠️ [CallPanel] No promptId provided for TTS');
            if (onPlay) onPlay(); // Fallback
            return;
        }

        try {
            // Stop previous TTS
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current = null;
            }

            // Cancel previous request if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new controller
            abortControllerRef.current = new AbortController();

            const response = await fetch('http://127.0.0.1:8000/api/prompt/speak/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.replace(/\([^)]*\)/g, ''),
                    promptId: promptId
                }),
                signal: abortControllerRef.current.signal
            });

            if (!isMountedRef.current) return;

            if (response.ok) {
                const blob = await response.blob();

                if (!isMountedRef.current) return;

                const url = window.URL.createObjectURL(blob);
                const audio = new Audio(url);
                ttsAudioRef.current = audio;

                audio.onended = () => {
                    window.URL.revokeObjectURL(url);
                };

                if (onPlay) onPlay();

                // Play only if mounted
                if (isMountedRef.current) {
                    await audio.play();
                }
            } else {
                if (onPlay) onPlay();
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('TTS fetch aborted');
                return;
            }
            console.error("TTS 재생 실패:", error);
            if (onPlay) onPlay();
        } finally {
            abortControllerRef.current = null;
        }
    };

    const [currentGreeting, setCurrentGreeting] = useState(initialMessage);

    // 초기 인사말 설정
    useEffect(() => {
        let isMounted = true;

        const setupGreeting = async () => {
            let greeting = initialMessage;

            // promptId가 있으면 상세 정보(Rich Greeting)를 가져온다 (ChatPanel과 동일 로직)
            if (promptId) {
                try {
                    const detail = await fetchCharacterDetail(promptId);
                    if (detail.greetingMessage) {
                        greeting = detail.greetingMessage;
                    }
                } catch (e) {
                    console.error("Failed to fetch character detail in CallPanel", e);
                }
            }

            if (isMounted) {
                setCurrentGreeting(greeting);
                setMessages([{
                    id: Date.now(),
                    text: greeting,
                    sender: 'bot'
                }]);
            }
        };

        setupGreeting();

        return () => { isMounted = false; };
    }, [initialMessage, promptId]);

    // 통화 수락 시 초기 인사말 재생
    useEffect(() => {
        if (isCallAccepted) {
            // 초기 인사말 재생 (약간의 딜레이 후)
            // initialMessage가 아닌 fetch된 currentGreeting을 재생
            setTimeout(() => playVoice(currentGreeting), 500);
        }
    }, [isCallAccepted, currentGreeting]);

    // 메시지 추가 시 스크롤 하단 이동
    useEffect(() => {
        if (isChatLogOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatLogOpen]);

    // 타이핑 루프
    const startTypingLoop = () => {
        if (typingIntervalRef.current !== null) return;
        typingIntervalRef.current = window.setInterval(() => {
            const buffer = typingBufferRef.current;
            if (!buffer || buffer.length === 0) {
                if (typingIntervalRef.current !== null) {
                    window.clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }
                return;
            }
            const chars = [...buffer];
            const firstChar = chars[0];
            const rest = chars.slice(1).join('');
            typingBufferRef.current = rest;
            const botId = currentBotMsgIdRef.current;
            if (botId == null) return;

            setMessages(prev => prev.map(msg =>
                msg.id === botId ? { ...msg, text: msg.text + firstChar } : msg
            ));
        }, 10);
    };

    // 컴포넌트 unmount 시 인터벌 정리
    useEffect(() => {
        return () => {
            if (typingIntervalRef.current !== null) window.clearInterval(typingIntervalRef.current);
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        if (!promptId) {
            alert('캐릭터 ID(promptId)가 없습니다. 대화를 시작할 수 없습니다.');
            return;
        }

        const userMsg: ChatMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        const msgToSend = input;
        setInput('');
        setIsLoading(true);

        const botMsgId = Date.now() + 1;
        const initialBotMsg: ChatMessage = { id: botMsgId, text: '', sender: 'bot' };
        setMessages(prev => [...prev, initialBotMsg]);

        currentBotMsgIdRef.current = botMsgId;
        typingBufferRef.current = '';

        let fullResponse = '';

        try {
            await sendCharacterMessage(promptId, msgToSend, (text) => {
                fullResponse += text;
                typingBufferRef.current += text;

                // 스피커가 꺼져있으면 즉시 타이핑, 켜져있으면 음성 대기
                if (!isSpeaker) {
                    startTypingLoop();
                }
            });

            // 답변 완료 후 음성 재생
            if (fullResponse) {
                if (isSpeaker) {
                    // 음성 재생 시점에 타이핑 시작
                    await playVoice(fullResponse, () => startTypingLoop());
                }
            }
        } catch (error) {
            console.error('Send error:', error);
            const errorMsg = '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, text: errorMsg }
                    : msg
            ));
            playVoice(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

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

    // Draggable State
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        if (isMinimized) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMinimized]);

    // 최소화된 상태 (버튼만 표시)
    if (isMinimized) {
        return (
            <button
                className="call-restore-btn"
                onMouseDown={handleMouseDown}
                onClick={() => {
                    // 드래그가 아니었을 때만 클릭 이벤트 처리
                    if (!isDragging.current) {
                        onMinimize(false);
                    }
                }}
                title="통화 화면 복귀"
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: '3.5em',
                    height: '3.5em',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    border: '2px solid white',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    fontSize: '1rem',
                    zIndex: 9999,
                    pointerEvents: 'auto'
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.01A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                </svg>
            </button>
        );
    }

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
                    <button className="call-reject-btn" onClick={handleCallEnd}>
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
            <div className="call-profile-section">
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
                            onClick={() => {
                                if (isSpeaker) {
                                    // Turning OFF: Stop current TTS
                                    if (ttsAudioRef.current) {
                                        ttsAudioRef.current.pause();
                                        ttsAudioRef.current = null;
                                    }
                                }
                                setIsSpeaker(!isSpeaker);
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isSpeaker ? '#333' : '#999'}>
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                {!isSpeaker && (
                                    <path d="M4 4L20 20" stroke="#999" strokeWidth="1" strokeLinecap="round" />
                                )}
                            </svg>
                        </button>
                        <span className="call-button-label">스피커</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn disabled-diagonal"
                            onClick={() => { }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#999">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </button>
                        <span className="call-button-label" style={{ color: '#999' }}>음성필터</span>
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
                            onClick={() => {
                                console.log('[CallPanel] Hide Screen button clicked');
                                onMinimize(true);
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#999">
                                <path d="M18 4l2 3h-3l-2-3h-2l2 3h-3l-2-3H8l2 3H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM4 18V6.47L5.76 9H16l2 3h2v6H4z" />
                            </svg>
                        </button>
                        <span className="call-button-label">화면 숨김</span>
                    </div>

                    <div className="call-button-wrapper">
                        <button
                            className="call-control-btn disabled-diagonal"
                            onClick={() => { }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#999">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        </button>
                        <span className="call-button-label" style={{ color: '#999' }}>페이스톡</span>
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
                        {messages.map(msg => (
                            <div key={msg.id} className={`call-chatlog-msg ${msg.sender}`}>
                                {(msg.sender === 'bot' && msg.text === '' && isLoading) ? (
                                    <span className="dot-typing">...</span>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    {/* 채팅 입력 영역 */}
                    <div className="call-chatlog-input-area">
                        <input
                            type="text"
                            className="call-chatlog-input"
                            placeholder={isMuted ? "음소거 상태입니다. (클릭 시 해제)" : "메시지를 입력하세요..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onClick={() => {
                                if (isMuted) setIsMuted(false);
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading} // 로딩중일 때만 입력 불가 (음소거는 클릭으로 해제)
                        />
                        <button
                            className="call-chatlog-send-btn"
                            onClick={handleSend}
                            disabled={isLoading || isMuted} // 로딩중이거나 음소거 상태면 전송 불가
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* 통화 종료 버튼 */}
            <div className="call-end-section">
                <button className="call-end-btn" onClick={handleCallEnd}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

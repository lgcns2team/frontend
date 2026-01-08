import { useState, useEffect, useRef } from 'react';
import { sendGeneralMessage, type ToolCallEvent } from '../../../shared/api/aichat-api';
import { createStreamingTts, type StreamingTtsController } from '../../../shared/api/streamingTts';
import './ChatbotPanel.css';

type Sender = 'bot' | 'user';

interface ChatMessage {
    id: number;
    text: string;
    sender: Sender;
}

interface ChatbotPanelProps {
    onClose: () => void;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    onStateChange?: (state: { x: number; y: number; width: number; height: number }) => void;
    onNavigateToCharacter?: (promptId: string, characterName: string) => void;
    onNavigateToWar?: (year: number, warName: string) => void;
}

export const ChatbotPanel = ({ onClose, initialPosition, initialSize, onStateChange, onNavigateToCharacter, onNavigateToWar }: ChatbotPanelProps) => {
    // State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, text: '안녕하세요! 역사 챗봇 H.AI입니다. 무엇을 도와드릴까요?', sender: 'bot' }
    ]);
    const [position, setPosition] = useState(initialPosition || { x: window.innerWidth / 4 - 200, y: window.innerHeight / 2 - 250 });
    const [size, setSize] = useState(initialSize || { width: 506, height: 500 });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);

    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

    // ↘↘ 추가: 타이핑 효과용 버퍼 & 인터벌 & 현재 타이핑 중인 봇 메시지 id
    const typingBufferRef = useRef<string>('');           // 아직 안 찍힌 글자들
    const typingIntervalRef = useRef<number | null>(null); // setInterval id
    const currentBotMsgIdRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 🆕 Streaming TTS Controller Ref
    const streamingTtsRef = useRef<StreamingTtsController | null>(null);
    const isMountedRef = useRef(true);

    // Refs to track latest state for event handlers
    const latestState = useRef({ position, size });
    useEffect(() => {
        latestState.current = { position, size };
    }, [position, size]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            } else if (isResizing && resizeDirection) {
                const deltaX = e.clientX - resizeStart.current.x;
                const deltaY = e.clientY - resizeStart.current.y;

                let newWidth = resizeStart.current.width;
                let newHeight = resizeStart.current.height;
                let newX = resizeStart.current.posX;
                let newY = resizeStart.current.posY;

                if (resizeDirection.includes('r')) {
                    newWidth = Math.max(300, resizeStart.current.width + deltaX);
                } else if (resizeDirection.includes('l')) {
                    const possibleWidth = resizeStart.current.width - deltaX;
                    if (possibleWidth >= 300) {
                        newWidth = possibleWidth;
                        newX = resizeStart.current.posX + deltaX;
                    }
                }

                if (resizeDirection.includes('b')) {
                    newHeight = Math.max(400, resizeStart.current.height + deltaY);
                } else if (resizeDirection.includes('t')) {
                    const possibleHeight = resizeStart.current.height - deltaY;
                    if (possibleHeight >= 400) {
                        newHeight = possibleHeight;
                        newY = resizeStart.current.posY + deltaY;
                    }
                }

                setSize({ width: newWidth, height: newHeight });
                setPosition({ x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeDirection(null);

            if (onStateChange) {
                onStateChange({
                    x: latestState.current.position.x,
                    y: latestState.current.position.y,
                    width: latestState.current.size.width,
                    height: latestState.current.size.height
                });
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                // Prevent scrolling while dragging
                if (e.cancelable) e.preventDefault();

                const touch = e.touches[0];
                setPosition({
                    x: touch.clientX - dragOffset.current.x,
                    y: touch.clientY - dragOffset.current.y
                });
            }
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeDirection(null);

            if (onStateChange) {
                onStateChange({
                    x: latestState.current.position.x,
                    y: latestState.current.position.y,
                    width: latestState.current.size.width,
                    height: latestState.current.size.height
                });
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, isResizing, resizeDirection, onStateChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        dragOffset.current = {
            x: touch.clientX - position.x,
            y: touch.clientY - position.y
        };
    };

    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y
        };
    };

    const handleResizeTouchStart = (e: React.TouchEvent, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        const touch = e.touches[0];
        resizeStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y
        };
    };

    const [isLoading, setIsLoading] = useState(false);
    const [isTTSEnabled, setIsTTSEnabled] = useState(false);

    // TODO: TTS 기능은 나중에 백엔드 API로 연결 예정

    // Audio Ref for controlling playback
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsEnabledRef = useRef(isTTSEnabled);

    // Sync ref and handle stop on disable
    useEffect(() => {
        ttsEnabledRef.current = isTTSEnabled;
        if (!isTTSEnabled) {
            // TTS 꺼지면 기존 오디오 정지
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            // 스트리밍 TTS도 정지
            if (streamingTtsRef.current) {
                streamingTtsRef.current.stop();
            }
        }
    }, [isTTSEnabled]);

    // 🆕 스트리밍 TTS 시작 함수
    const startStreamingTts = (onFirstPlay?: () => void): StreamingTtsController | null => {
        if (!isTTSEnabled) {
            onFirstPlay?.();
            return null;
        }

        // 이전 스트리밍 TTS 정리
        if (streamingTtsRef.current) {
            streamingTtsRef.current.destroy();
        }

        const controller = createStreamingTts({
            promptId: '', // 일반 챗봇은 promptId 불필요 (knowledge API 사용)
            ttsApiUrl: '/api/knowledge/speak/',
            onFirstPlay: () => {
                console.log('🎵 [ChatbotPanel] First sentence playing');
                onFirstPlay?.();
            },
            onAllDone: () => {
                console.log('✅ [ChatbotPanel] All TTS done');
            },
            onError: (error) => {
                console.error('❌ [ChatbotPanel] Streaming TTS error:', error);
            }
        });

        streamingTtsRef.current = controller;
        return controller;
    };

    // 🆕 음성 재생 함수 (handleSend보다 위에 있어야 함)
    const playVoice = async (text: string) => {
        if (!isTTSEnabled) return;

        try {
            // 이전 재생 중인 음성이 있다면 정지
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const response = await fetch('/api/knowledge/speak/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.replace(/\([^)]*\)/g, '')
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => {
                    window.URL.revokeObjectURL(url);
                };

                // Play only if still enabled
                if (ttsEnabledRef.current) {
                    audio.play();
                } else {
                    window.URL.revokeObjectURL(url);
                }
            }
        } catch (error) {
            console.error("TTS 재생 실패:", error);
        }
    };

    // ↘↘ 추가: 버퍼에서 한 글자씩 꺼내서 현재 봇 메시지에 붙이는 타이핑 루프
    const startTypingLoop = () => {
        // 이미 인터벌 돌고 있으면 또 만들지 않기
        if (typingIntervalRef.current !== null) return;

        typingIntervalRef.current = window.setInterval(() => {
            const buffer = typingBufferRef.current;
            if (!buffer || buffer.length === 0) {
                // 더 이상 쓸 글자가 없으면 인터벌 종료
                if (typingIntervalRef.current !== null) {
                    window.clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }

                return;
            }

            // 유니코드 기준 한 글자씩 잘라내기 (한글 안전)
            const chars = [...buffer];
            const firstChar = chars[0];
            const rest = chars.slice(1).join('');
            typingBufferRef.current = rest;

            const botId = currentBotMsgIdRef.current;
            if (botId == null) return;

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botId
                        ? { ...msg, text: msg.text + firstChar }
                        : msg
                )
            );
        }, 5); // 타이핑 속도: 5ms로 빠르게 (원래 25ms)
    };

    // 컴포넌트 unmount 시 인터벌 정리
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            console.log('📉 [ChatbotPanel] Unmounting...');
            isMountedRef.current = false;

            if (typingIntervalRef.current !== null) {
                window.clearInterval(typingIntervalRef.current);
            }
            // ✅ Unmount 시 오디오 정지
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            // 🆕 스트리밍 TTS 정리
            if (streamingTtsRef.current) {
                streamingTtsRef.current.destroy();
                streamingTtsRef.current = null;
            }
        };
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now(), text: input, sender: 'user' };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Add loading indicator message
        const loadingMsgId = Date.now() + 1;
        const loadingMsg: ChatMessage = {
            id: loadingMsgId,
            text: 'loading',
            sender: 'bot'
        };
        setMessages(prev => [...prev, loadingMsg]);

        // Buffer initialization
        typingBufferRef.current = '';

        // Flag to track if bot message has been created
        let botMessageCreated = false;

        // 🆕 스트리밍 TTS 시작 (TTS가 켜져있을 때만)
        const ttsController = isTTSEnabled
            ? startStreamingTts(() => {
                // 첫 문장 재생 시 특별한 동작 필요하면 여기에 추가
            })
            : null;

        // Capture full response for TTS (legacy fallback)
        let fullResponse = '';

        try {
            console.log('🚀 [DEBUG] Sending message to AI chat');

            await sendGeneralMessage(input, (text) => {
                // Add text to typing buffer
                let newText = text;
                // If this is the start of the message (buffer empty) or just after loading removed
                if (typingBufferRef.current.length === 0 && fullResponse.length === 0) {
                    newText = newText.trimStart();
                }

                if (newText) {
                    // Create bot message only when we have actual text
                    if (!botMessageCreated) {
                        // Remove loading message
                        setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

                        // Create new bot message
                        const botMsgId = Date.now() + 2;
                        currentBotMsgIdRef.current = botMsgId;

                        const initialBotMsg: ChatMessage = {
                            id: botMsgId,
                            text: '',
                            sender: 'bot'
                        };
                        setMessages(prev => [...prev, initialBotMsg]);
                        botMessageCreated = true;
                    }

                    typingBufferRef.current += newText;
                    fullResponse += newText;

                    // 🆕 스트리밍 TTS: 문장 단위로 TTS 큐에 추가
                    if (ttsController) {
                        ttsController.addSentence(newText);
                    }

                    console.log('✍️ [DEBUG] Added to typing buffer. Buffer now:', typingBufferRef.current.length, 'chars');
                    // Start typing loop (if not already running)
                    startTypingLoop();
                }
            }, (toolCall: ToolCallEvent) => {
                // Handle tool calls from AI
                console.log('🔧 [DEBUG] Tool call received:', toolCall);

                if (toolCall.tool_name === 'navigate_to_character_chat') {
                    const { promptId, characterName } = toolCall.parameters;
                    if (promptId && onNavigateToCharacter) {
                        console.log('🚀 [DEBUG] Navigating to character chat:', characterName, promptId);
                        onNavigateToCharacter(promptId, characterName || '인물');

                        // Clear buffer to stop typing effect
                        typingBufferRef.current = '';

                        if (!botMessageCreated) {
                            // Remove loading message
                            setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

                            // Create new bot message
                            const botMsgId = Date.now() + 2;
                            currentBotMsgIdRef.current = botMsgId;

                            const initialBotMsg: ChatMessage = {
                                id: botMsgId,
                                text: '예. 알겠습니다.',
                                sender: 'bot'
                            };
                            setMessages(prev => [...prev, initialBotMsg]);
                            botMessageCreated = true;
                        } else {
                            // Update existing message
                            setMessages(prev => prev.map(msg =>
                                msg.id === currentBotMsgIdRef.current
                                    ? { ...msg, text: '예. 알겠습니다.' }
                                    : msg
                            ));
                        }
                    }
                } else if (toolCall.tool_name === 'navigate_to_war') {
                    const { year, war_name } = toolCall.parameters;
                    if (year && onNavigateToWar) {
                        console.log('⚔️ [DEBUG] Navigating to war:', war_name, year);
                        onNavigateToWar(year, war_name || '전쟁');
                    }
                }
            });

            console.log('✅ [DEBUG] Message sent successfully');

            // 🆕 스트리밍 완료 - 남은 버퍼 처리
            if (ttsController) {
                ttsController.flush();
            }

            // (구형 단일 파일 재생 로직은 제거하거나 주석 처리)
            // if (fullResponse) { ... }
        } catch (error) {
            console.error('Error sending message:', error);

            // 3-second delay to show loading animation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Remove loading message if it still exists
            setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

            const errorMsg = {
                id: Date.now() + 3,
                text: '죄송합니다. 오류가 발생했습니다..\n잠시 후 다시 시도해주세요.',
                sender: 'bot' as const
            };
            setMessages(prev => [...prev, errorMsg]);

            // ✅ 에러 메시지 음성 재생
            playVoice('죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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

    return (
        <div
            className="chatbot-panel"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height
            }}
        >
            <div className="chatbot-header" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
                <div className="chatbot-title">
                    <span>🤖</span> 역사 챗봇 H.AI
                    <button
                        className={`tts-btn ${isTTSEnabled ? 'tts-active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            const nextState = !isTTSEnabled;
                            setIsTTSEnabled(nextState);
                            if (!nextState) {
                                console.log('🔇 [ChatbotPanel] Speaker OFF -> Stopping TTS');
                                // 1. 일반 TTS 오디오 중단
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current = null;
                                }
                                // 2. 스트리밍 TTS 중단
                                if (streamingTtsRef.current) {
                                    streamingTtsRef.current.stop();
                                }
                            }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title={isTTSEnabled ? 'TTS 끄기' : 'TTS 켜기'}
                    >
                        <img
                            src="/assets/images/etc/speaker.png"
                            alt="TTS"
                            style={{ width: '18px', height: '18px' }}
                        />
                    </button>
                </div>
                <button className="close-btn" onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>×</button>
            </div>

            <div className="chatbot-body">
                {messages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.sender}`}>
                        {(msg.text === 'loading' || (msg.sender === 'bot' && msg.text === '')) ? (
                            <div className="chat-typing">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        ) : (
                            msg.text
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-footer">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="역사에 대해 물어보세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    lang="ko"
                />
                <button className="send-btn" onClick={handleSend} disabled={isLoading}>
                    ➤
                </button>
            </div>

            {/* Only show bottom-right resize handle with visual indicator */}
            <div
                className="resize-handle resize-handle-br"
                onMouseDown={(e) => handleResizeMouseDown(e, 'br')}
                onTouchStart={(e) => handleResizeTouchStart(e, 'br')}
            ></div>
        </div>
    );
};
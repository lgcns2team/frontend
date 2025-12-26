import { useState, useEffect, useRef } from 'react';
import { sendGeneralMessage, type ToolCallEvent } from '../../../shared/api/aichat-api';
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
}

export const ChatbotPanel = ({ onClose, initialPosition, initialSize, onStateChange, onNavigateToCharacter }: ChatbotPanelProps) => {
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
        return () => {
            if (typingIntervalRef.current !== null) {
                window.clearInterval(typingIntervalRef.current);
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

        try {
            console.log('🚀 [DEBUG] Sending message to AI chat');

            await sendGeneralMessage(input, (text) => {
                // Remove loading message and create bot message on first chunk
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

                // Add text to typing buffer
                typingBufferRef.current += text;
                console.log('✍️ [DEBUG] Added to typing buffer. Buffer now:', typingBufferRef.current.length, 'chars');
                // Start typing loop (if not already running)
                startTypingLoop();
            }, (toolCall: ToolCallEvent) => {
                // Handle tool calls from AI
                console.log('🔧 [DEBUG] Tool call received:', toolCall);

                if (toolCall.tool_name === 'navigate_to_character_chat') {
                    const { promptId, characterName } = toolCall.parameters;
                    if (promptId && onNavigateToCharacter) {
                        console.log('🚀 [DEBUG] Navigating to character chat:', characterName, promptId);
                        onNavigateToCharacter(promptId, characterName || '인물');
                    }
                }
            });

            console.log('✅ [DEBUG] Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);

            // 3-second delay to show loading animation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Remove loading message if it still exists
            setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

            const errorMsg = {
                id: Date.now() + 3,
                text: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                sender: 'bot' as const
            };
            setMessages(prev => [...prev, errorMsg]);
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
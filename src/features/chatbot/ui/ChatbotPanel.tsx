import { useState, useEffect, useRef } from 'react';
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
}

export const ChatbotPanel = ({ onClose, initialPosition, initialSize, onStateChange }: ChatbotPanelProps) => {
    // State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, text: '안녕하세요! 역사 챗봇 H.AI입니다. 무엇을 도와드릴까요?', sender: 'bot' }
    ]);
    const [position, setPosition] = useState(initialPosition || { x: window.innerWidth / 2 - 145, y: window.innerHeight / 2 - 250 });
    const [size, setSize] = useState(initialSize || { width: 350, height: 500 });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);

    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

    // ↘↘ 추가: 타이핑 효과용 버퍼 & 인터벌 & 현재 타이핑 중인 봇 메시지 id
    const typingBufferRef = useRef<string>('');           // 아직 안 찍힌 글자들
    const typingIntervalRef = useRef<number | null>(null); // setInterval id
    const currentBotMsgIdRef = useRef<number | null>(null);

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

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now(), text: input, sender: 'user' };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // 봇 메시지 placeholder 추가
        const botMsgId = Date.now() + 1;
        const initialBotMsg: ChatMessage = {
            id: botMsgId,
            text: '',
            sender: 'bot'
        };
        setMessages(prev => [...prev, initialBotMsg]);

        // 현재 타이핑 대상 봇 메시지 id 기록 + 버퍼 초기화
        currentBotMsgIdRef.current = botMsgId;
        typingBufferRef.current = '';

        try {
            console.log('🚀 [DEBUG] Starting fetch to /api/ai/chat with message:', input);
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            console.log('📥 [DEBUG] Response received, status:', response.status, 'ok:', response.ok);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            console.log('📖 [DEBUG] Starting to read response body stream...');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let chunkCount = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('✅ [DEBUG] Stream done. Total chunks:', chunkCount);
                    break;
                }

                chunkCount++;
                console.log(`📦 [DEBUG] Chunk #${chunkCount} received, bytes:`, value?.length);

                // UTF-8 안전하게 디코딩
                const chunk = decoder.decode(value, { stream: true });
                console.log(`📝 [DEBUG] Decoded chunk #${chunkCount}:`, chunk.substring(0, 100));
                buffer += chunk;

                // SSE 이벤트 파싱 (개행으로 분리)
                const lines = buffer.split('\n');

                // 마지막 줄은 불완전할 수 있으므로 버퍼에 보관
                buffer = lines.pop() || '';
                console.log(`📋 [DEBUG] Processing ${lines.length} lines, buffer remainder:`, buffer.substring(0, 50));

                for (const line of lines) {
                    if (line.startsWith('data:')) {  // 공백 없음
                        const dataStr = line.substring(5).trim();  // 5자 ("data:")
                        if (!dataStr || dataStr === '[DONE]') continue;

                        try {
                            // JSON 파싱
                            const event = JSON.parse(dataStr);
                            console.log('🎯 [DEBUG] Parsed event:', event.type, 'text length:', event.text?.length);

                            if (event.type === 'content' && event.text) {
                                // 🔥 여기서 바로 메시지에 넣지 말고 버퍼에 추가만!
                                typingBufferRef.current += event.text;
                                console.log('✍️ [DEBUG] Added to typing buffer. Buffer now:', typingBufferRef.current.length, 'chars');
                                // 타이핑 루프 시작 (이미 돌고 있으면 아무 일 X)
                                startTypingLoop();

                            } else if (event.type === 'citations') {
                                console.log('📚 Received citations:', event.count);
                            } else if (event.type === 'done') {
                                console.log('✅ Stream completed, total length maybe:', event.total_length);
                            } else if (event.type === 'error') {
                                console.error('❌ Error from backend:', event.message);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE JSON:', e, 'Data:', dataStr);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = {
                id: Date.now() + 2,
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
                        {msg.text}
                    </div>
                ))}
            </div>

            <div className="chatbot-footer">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="역사에 대해 물어보세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={handleSend} disabled={isLoading}>
                    ➤
                </button>
            </div>

            <div className="resize-handle resize-handle-tl" onMouseDown={(e) => handleResizeMouseDown(e, 'tl')}></div>
            <div className="resize-handle resize-handle-tr" onMouseDown={(e) => handleResizeMouseDown(e, 'tr')}></div>
            <div className="resize-handle resize-handle-bl" onMouseDown={(e) => handleResizeMouseDown(e, 'bl')}></div>
            <div className="resize-handle resize-handle-br" onMouseDown={(e) => handleResizeMouseDown(e, 'br')}></div>
        </div>
    );
};
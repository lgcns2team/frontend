import { useState, useEffect, useRef } from 'react';
import './ChatbotPanel.css';

interface ChatbotPanelProps {
    onClose: () => void;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    onStateChange?: (state: { x: number; y: number; width: number; height: number }) => void;
}

export const ChatbotPanel = ({ onClose, initialPosition, initialSize, onStateChange }: ChatbotPanelProps) => {
    // State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, text: '안녕하세요! 역사 챗봇 H.AI입니다. 무엇을 도와드릴까요?', sender: 'bot' }
    ]);

    const [position, setPosition] = useState(initialPosition || { x: 60, y: window.innerHeight - 730 });
    const [size, setSize] = useState(initialSize || { width: 350, height: 500 });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);

    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

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

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeDirection]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
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

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate bot response
        setTimeout(() => {
            const botMsg = {
                id: Date.now() + 1,
                text: '죄송합니다. 아직 학습 중이라 답변을 드릴 수 없어요. 😅',
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
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
            <div className="chatbot-header" onMouseDown={handleMouseDown}>
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
                <button className="send-btn" onClick={handleSend}>
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

import { useState, useRef, useEffect } from 'react';
import { type ParsedCharacter, fetchCharacterDetail } from '../../../shared/api/characters-api';
import { ERAS } from '../../../shared/config/era-theme';
import './ChatPanel.css'; // ✅ 임시 주석 처리 - 실제 CSS 파일명 확인 후 수정

interface ChatMessage {
    id: number;
    text: string;
    sender: 'bot' | 'user';
}

interface ChatPanelProps {
    character: ParsedCharacter;
}

export const ChatPanel = ({ character }: ChatPanelProps) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 캐릭터 변경 시 초기화
    useEffect(() => {
        let isMounted = true;

        const initChat = async () => {
            // 초기화
            setMessages([]);
            setInput('');
            setIsLoading(false);

            let greeting = character.greetingMessage;

            // API에서 인사말 가져오기 시도
            if (!greeting && character.promptId) {
                try {
                    const detail = await fetchCharacterDetail(character.promptId);
                    if (detail.greetingMessage) {
                        greeting = detail.greetingMessage;
                    }
                } catch (e) {
                    console.error("Failed to fetch greeting", e);
                }
            }

            if (isMounted) {
                setMessages([
                    {
                        id: 1,
                        text: greeting || `안녕하세요. ${character.characterName}입니다. 무엇이 궁금하신가요?`,
                        sender: 'bot'
                    }
                ]);
            }
        };

        initChat();

        return () => { isMounted = false; };
    }, [character.characterId, character.characterName, character.promptId]);

    // 타이핑 효과 관련 Ref
    const typingBufferRef = useRef<string>('');
    const typingIntervalRef = useRef<number | null>(null);
    const currentBotMsgIdRef = useRef<number | null>(null);

    // 스크롤 처리를 위한 Ref
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // 메시지 추가될 때마다 스크롤 하단으로
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

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

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botId
                        ? { ...msg, text: msg.text + firstChar }
                        : msg
                )
            );
        }, 10); // 10ms
    };

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
        const msgToSend = input; // 캡처
        setInput('');
        setIsLoading(true);

        // 봇 응답 placeholder
        const botMsgId = Date.now() + 1;
        const initialBotMsg: ChatMessage = { id: botMsgId, text: '', sender: 'bot' };
        setMessages(prev => [...prev, initialBotMsg]);

        currentBotMsgIdRef.current = botMsgId;
        typingBufferRef.current = '';

        try {
            // TODO: 추후 캐릭터별 페르소나 적용 필요 (promptId 등 전송)
            // userId는 현재 하드코딩 (1) - 실제 로그인 구현 시 변경 필요
            const response = await fetch(`/api/ai-person/${character.promptId}/chat?userId=1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msgToSend,
                }),
            });

            if (!response.ok || !response.body) throw new Error('Network error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const dataStr = line.substring(5).trim();
                        if (!dataStr || dataStr === '[DONE]') continue;

                        // ✅ 수정: JSON 파싱 시도, 실패하면 순수 텍스트로 처리
                        try {
                            const event = JSON.parse(dataStr);
                            // JSON 형식인 경우
                            if (event.type === 'content' && event.text) {
                                typingBufferRef.current += event.text;
                                startTypingLoop();
                            } else if (typeof event === 'string') {
                                // JSON이지만 문자열인 경우
                                typingBufferRef.current += event;
                                startTypingLoop();
                            }
                        } catch (e) {
                            // ✅ JSON이 아니면 순수 텍스트로 처리
                            if (dataStr) {
                                console.log('📝 Received text chunk:', dataStr);
                                typingBufferRef.current += dataStr;
                                startTypingLoop();
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Send error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, text: '오류가 발생했습니다. 다시 시도해주세요.' }
                    : msg
            ));
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

    // Frame Image Logic
    const currEra = ERAS.find(e => e.id === character.era);
    const frameImage = currEra?.frameImage;
    const eraColor = currEra?.color || '#3B82F6'; // Default to republic color

    return (
        <div className="chat-panel">
            {/* 상단 프로필 영역 */}
            <div className="chat-profile-area">
                <div className="chat-profile-image-container">
                    <img src={character.imagePath} alt={character.characterName} className="chat-profile-image" />
                    {frameImage && (
                        <div
                            className="chat-profile-frame"
                            style={{ backgroundImage: `url(${frameImage})` }}
                        />
                    )}
                </div>
                <div className="chat-profile-info">
                    <h3 className="chat-profile-name">{character.characterName}</h3>
                    {character.summary && <p className="chat-profile-desc">{character.summary}</p>}
                </div>
            </div>

            {/* 대화 영역 */}
            <div className="chat-body-area" ref={chatBodyRef}>
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`chat-message ${msg.sender}`}
                    >
                        {msg.sender === 'bot' && msg.text === '' && isLoading ? (
                            <div className="chat-typing">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        ) : (
                            msg.text
                        )}
                    </div>
                ))}
            </div>

            {/* 입력 영역 */}
            <div className="chat-input-area">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="메시지를 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={isLoading}
                    style={{ backgroundColor: eraColor }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
};
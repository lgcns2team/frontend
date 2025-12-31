import { useState, useRef, useEffect } from 'react';
import { type ParsedCharacter, fetchCharacterDetail } from '../../../shared/api/characters-api';
import { sendCharacterMessage } from '../../../shared/api/aichat-api';
import { ERAS } from '../../../shared/config/era-theme';
import { CallPanel } from '../../ai-call';
import './ChatPanel.css';

interface ChatMessage {
    id: number;
    text: string;
    sender: 'bot' | 'user';
    isError?: boolean;
}

interface ChatPanelProps {
    character: ParsedCharacter;
}

export const ChatPanel = ({ character }: ChatPanelProps) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTTSEnabled, setIsTTSEnabled] = useState(false);
    const [isCallPanelOpen, setIsCallPanelOpen] = useState(false);

    // TODO: TTS 기능은 나중에 백엔드 API로 연결 예정

    // 타이핑 효과 관련 Ref
    const typingBufferRef = useRef<string>('');
    const typingIntervalRef = useRef<number | null>(null);
    const currentBotMsgIdRef = useRef<number | null>(null);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // 캐릭터 변경 시 초기화
    useEffect(() => {
        let isMounted = true;
        const initChat = async () => {
            setMessages([]);
            setInput('');
            setIsLoading(false);

            let greeting = character.greetingMessage;
            if (!greeting && character.promptId) {
                try {
                    const detail = await fetchCharacterDetail(character.promptId);
                    if (detail.greetingMessage) greeting = detail.greetingMessage;
                } catch (e) {
                    console.error("Failed to fetch greeting", e);
                }
            }

            if (isMounted) {
                setMessages([{
                    id: Date.now(),
                    text: greeting || `안녕하세요. ${character.characterName}입니다. 무엇이 궁금하신가요?`,
                    sender: 'bot'
                }]);
            }
        };
        initChat();

        return () => { isMounted = false; };
    }, [character.characterId, character.characterName, character.promptId]);

    // 메시지 추가 시 스크롤 하단 이동
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    // 🆕 음성 재생 함수 (handleSend보다 위에 있어야 함)
    const playVoice = async (text: string) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/prompt/speak/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    promptId: character.promptId
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
            }
        } catch (error) {
            console.error("TTS 재생 실패:", error);
        }
    };

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

    // 메시지 전송 로직
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

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
            await sendCharacterMessage(character.promptId!, msgToSend, (text) => {
                fullResponse += text;
                typingBufferRef.current += text;
                startTypingLoop();
            });
            setIsLoading(false);

            // ✅ 정상 답변 완료 후 음성 재생
            if (fullResponse) {
                setTimeout(() => playVoice(fullResponse), 500);
            }
        } catch (error) {
            console.error('Send error:', error);
            const errorMsg = '오류가 발생했습니다. 다시 시도해주세요.';
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, text: '죄송합니다. 오류가 발생했습니다..\n잠시 후 다시 시도해주세요.', isError: true }
                    : msg
            ));

            setIsLoading(false);

            // ✅ 에러 메시지 음성 재생
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

    useEffect(() => {
        return () => {
            if (typingIntervalRef.current !== null) window.clearInterval(typingIntervalRef.current);
        };
    }, []);

    const currEra = ERAS.find(e => e.id === character.era);
    const frameImage = currEra?.frameImage;
    const eraColor = currEra?.color || '#3B82F6';

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
                    <div className="chat-profile-name-row">
                        <h3 className="chat-profile-name">{character.characterName}</h3>
                        <button
                            className={`tts-btn ${isTTSEnabled ? 'tts-active' : ''}`}
                            onClick={() => {
                                setIsTTSEnabled(!isTTSEnabled);
                                // TODO: 백엔드 API 연결 시 여기에 TTS 호출 로직 추가
                            }}
                            title={isTTSEnabled ? 'TTS 끄기' : 'TTS 켜기'}
                        >
                            <img
                                src="/assets/images/etc/speaker.png"
                                alt="TTS"
                                style={{ width: '18px', height: '18px' }}
                            />
                        </button>
                        <button
                            className="call-btn"
                            onClick={() => setIsCallPanelOpen(true)}
                            title="통화 시작"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                            </svg>
                        </button>
                    </div>
                    {character.summary && <p className="chat-profile-desc">{character.summary}</p>}
                </div>
            </div>

            {/* 대화 영역 */}
            <div className="chat-body-area" ref={chatBodyRef}>
                {messages.map(msg => (
                    msg.isError ? (
                        // 에러 메시지: HAI 이미지 + 말풍선
                        <div key={msg.id} className="chat-error-wrapper">
                            <img
                                src="/assets/images/character/HAI.png"
                                alt="HAI"
                                className="chat-error-avatar"
                            />
                            <div className="chat-message bot error">
                                {msg.text}
                            </div>
                        </div>
                    ) : (
                        // 일반 메시지
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
                    )
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
                    lang="ko"
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

            {/* Call Panel Overlay */}
            {isCallPanelOpen && (
                <div className="call-panel-overlay">
                    <CallPanel
                        characterName={character.characterName}
                        characterImage={character.imagePath || ''}
                        onClose={() => setIsCallPanelOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};
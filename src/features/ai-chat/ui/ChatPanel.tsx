import { useState, useRef, useEffect } from 'react';
import { type ParsedCharacter, fetchCharacterDetail } from '../../../shared/api/characters-api';
import { sendCharacterMessage } from '../../../shared/api/aichat-api';
import { ERAS } from '../../../shared/config/era-theme';
import './ChatPanel.css';
import { createBrowserStt } from "../../../shared/api/browseStt"; // ✅ STT 추가
import { createStreamingTts, type StreamingTtsController } from '../../../shared/api/streamingTts'; // ✅ 스트리밍 TTS 추가


interface ChatMessage {
    id: number;
    text: string;
    sender: 'bot' | 'user';
    isError?: boolean;
}

interface ChatPanelProps {
    character: ParsedCharacter;
    onCallStart: () => void;
}

export const ChatPanel = ({ character, onCallStart }: ChatPanelProps) => {

    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState(""); // (선택) 실시간 자막 표시용

    const sttRef = useRef<ReturnType<typeof createBrowserStt> | null>(null);

    useEffect(() => {
        sttRef.current = createBrowserStt("ko-KR", {
            onStart: () => {
                setIsListening(true);
            },
            onEnd: () => {
                setIsListening(false);
                setInterimText("");
            },
            onInterim: (t) => {
                setInterimText(t);
            },
            onFinal: (t) => {
                // 확정 텍스트를 input에 채움 (기존 입력 뒤에 붙이기)
                setInput(prev => (prev ? `${prev} ${t}` : t));
                // 텍스트 입력 후 즉시 STT 종료
                sttRef.current?.stop();
            },
            onError: (e) => {
                setIsListening(false);
                setInterimText("");
                console.error("[STT] error:", e);
                // alert("STT 오류/미지원 브라우저일 수 있어요: " + e);
            }
        });

    }, []);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTTSEnabled, setIsTTSEnabled] = useState(false);

    // Call Panel Overlay removed
    const typingBufferRef = useRef<string>('');
    const typingIntervalRef = useRef<number | null>(null);
    const currentBotMsgIdRef = useRef<number | null>(null);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // 🆕 Streaming TTS Controller Ref
    const streamingTtsRef = useRef<StreamingTtsController | null>(null);

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

            const finalGreeting = greeting || `안녕하세요. ${character.characterName}입니다. 무엇이 궁금하신가요?`;

            if (isMounted) {
                setMessages([{
                    id: Date.now(),
                    text: finalGreeting,
                    sender: 'bot'
                }]);
            }
        };
        initChat();

        return () => { 
            isMounted = false;
            // 🆕 캐릭터 변경 시 스트리밍 TTS 정리
            if (streamingTtsRef.current) {
                streamingTtsRef.current.destroy();
                streamingTtsRef.current = null;
            }
        };
    }, [character.characterId, character.characterName, character.promptId]);


    // 메시지 추가 시 스크롤 하단 이동
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsEnabledRef = useRef(isTTSEnabled);
    const isMountedRef = useRef(true); // ✅ 마운트 상태 추적

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
        if (!isTTSEnabled || !character.promptId) {
            onFirstPlay?.();
            return null;
        }

        // 이전 스트리밍 TTS 정리
        if (streamingTtsRef.current) {
            streamingTtsRef.current.destroy();
        }

        const controller = createStreamingTts({
            promptId: character.promptId,
            ttsApiUrl: 'http://127.0.0.1:8000/api/prompt/speak/',
            onFirstPlay: () => {
                console.log('🎵 [ChatPanel] First sentence playing');
                onFirstPlay?.();
            },
            onAllDone: () => {
                console.log('✅ [ChatPanel] All TTS done');
            },
            onError: (error) => {
                console.error('❌ [ChatPanel] Streaming TTS error:', error);
            }
        });

        streamingTtsRef.current = controller;
        return controller;
    };

    // 🆕 음성 재생 함수 (단일 텍스트용 - 인사말 등에 사용)
    const playVoice = async (text: string) => {
        // Unmounted check
        if (!isMountedRef.current) return;

        console.log("TTS 함수 호출됨 현재 스위치 상태:", isTTSEnabled);
        if (!isTTSEnabled) {
            // TTS가 꺼져있을 때는 바로 타이핑 시작
            startTypingLoop();
            return;
        }

        try {
            if (isTTSEnabled) {
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
                    audioRef.current = audio; // ✅ 참조에 할당해야 stop 가능

                    audio.onplay = () => {
                        startTypingLoop();
                    }
                    if (ttsEnabledRef.current) {
                        audio.play();
                    } else {
                        // Playback disabled while fetching
                        startTypingLoop();
                    }
                }
            } else {
                console.log("TTS 스위치가 꺼져 있어 음성을 생성하지 않고 로직을 계속합니다.");
                startTypingLoop();
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

        // Buffer initialization
        typingBufferRef.current = '';
        let fullResponse = '';
        let botMessageCreated = false;

        // Add loading indicator message
        const loadingMsgId = Date.now() + 1;
        const loadingMsg: ChatMessage = { id: loadingMsgId, text: 'loading', sender: 'bot' };
        setMessages(prev => [...prev, loadingMsg]);

        // 🆕 스트리밍 TTS 시작 (TTS가 켜져있을 때만)
        const ttsController = isTTSEnabled 
            ? startStreamingTts(() => {
                // 첫 문장 재생 시작 시 타이핑 시작하지 않음 (이미 스트리밍 중 타이핑됨)
            }) 
            : null;

        try {
            await sendCharacterMessage(character.promptId!, msgToSend, (text) => {
                let newText = text;

                // If this is the start and we have text, initiate bot message
                if (newText) {
                    if (!botMessageCreated) {
                        // Remove loading message
                        setMessages(prev => prev.filter(msg => msg.id !== loadingMsgId));

                        // Create new bot message
                        const botMsgId = Date.now() + 2;
                        currentBotMsgIdRef.current = botMsgId;
                        const initialBotMsg: ChatMessage = { id: botMsgId, text: '', sender: 'bot' };
                        setMessages(prev => [...prev, initialBotMsg]);

                        botMessageCreated = true;

                        // Trim leading whitespace if it's the very first chunk
                        if (fullResponse.length === 0) {
                            newText = newText.trimStart();
                        }
                    }

                    fullResponse += newText;
                    typingBufferRef.current += newText;

                    // 🆕 스트리밍 TTS: 문장 단위로 TTS 큐에 추가
                    if (ttsController) {
                        ttsController.addSentence(newText);
                    }

                    // Start typing loop if not running
                    startTypingLoop();
                }
            });

            // 🆕 스트리밍 완료 - 남은 버퍼 처리
            if (ttsController) {
                ttsController.flush();
            }
        } catch (error) {
            console.error('Send error:', error);
            const errorMsg = '오류가 발생했습니다. 다시 시도해주세요.';

            const targetId = currentBotMsgIdRef.current;
            if (targetId) {
                setMessages(prev => prev.map(msg =>
                    msg.id === targetId
                        ? { ...msg, text: errorMsg, isError: true }
                        : msg
                ));
            }

            // 에러 상황에서도 사용자에게 알림 음성 제공 여부 결정
            if (isTTSEnabled) playVoice("오류가 발생했습니다.");
            // ✅ 에러 메시지 음성 재생
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
        console.log('🏁 [ChatPanel] Mounted');
        isMountedRef.current = true;

        return () => {
            console.log('📉 [ChatPanel] Unmounting... Clean up audio');
            isMountedRef.current = false;

            if (typingIntervalRef.current !== null) window.clearInterval(typingIntervalRef.current);
            // ✅ Unmount 시 오디오 정지
            if (audioRef.current) {
                console.log('🔇 [ChatPanel] Stopping audio on unmount');
                audioRef.current.pause();
                audioRef.current = null;
            } else {
                console.log('⚠️ [ChatPanel] No active audio to stop');
            }
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
                            onClick={onCallStart}
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
                            {(msg.text === 'loading' || (msg.sender === 'bot' && msg.text === '' && isLoading)) ? (
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
            {interimText && (
                <div style={{ fontSize: 12, color: "#666", margin: "6px 0" }}>
                    (인식중) {interimText}
                </div>
            )}
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
                <button
                    className="chat-send-btn"
                    onClick={() => {
                        const stt = sttRef.current;
                        if (!stt) return;

                        if (!stt.isSupported) {
                            alert("이 브라우저는 Web Speech STT를 지원하지 않습니다. (iOS Safari/Chrome일 수 있어요)");
                            return;
                        }

                        if (!isListening) stt.start();
                        else stt.stop();
                    }}
                    disabled={isLoading}
                    style={{ backgroundColor: isListening ? "#999" : eraColor, marginLeft: 8 }}
                    title={isListening ? "음성 인식 종료" : "음성 인식 시작"}
                >
                    🎙️
                </button>

            </div>

        </div >
    );
};
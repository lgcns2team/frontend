import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DiscussionRoomPage.module.css';
import { useStomp } from '../../../shared/lib/useStomp';

interface ChatMessage {
    sender: string;
    content: string;
    type: 'CHAT' | 'JOIN' | 'LEAVE';
    userId?: string;
    roomId?: string;
    side?: 'agree' | 'disagree';
}

interface DisplayMessage extends ChatMessage {
    side: 'agree' | 'disagree';
}

const DiscussionRoomPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const saved = localStorage.getItem('discussions');
    const discussions = saved ? JSON.parse(saved) : [];
    const discussion = discussions.find((d: any) => String(d.id) === id);

    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    // viewMode: vote -> chat -> verify -> result -> final(박스 5개 화면)
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'verify' | 'result' | 'final'>('vote');
    const [messages, setMessages] = useState<{ text: string, side: 'agree' | 'disagree' }[]>([]);
    const [inputValue, setInputValue] = useState('');

    // Mock user info
    const [userId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
    const [username] = useState(`User ${Math.floor(Math.random() * 100)}`);

    const { connect, disconnect, subscribe, sendMessage, isConnected } = useStomp({
        url: 'http://localhost:8081/ws-stomp',
        onConnect: (frame) => {
            console.log('Connected: ' + frame);
            if (!id) return;
            subscribe('/topic/room/' + id, (chatMessage) => {
                handleIncomingMessage(JSON.parse(chatMessage.body));
            });
            // Send JOIN message
            sendMessage(
                "/app/chat.addUser/" + id,
                { sender: username, type: 'JOIN', userId: userId, roomId: id, side: vote }
            );
        },
        onError: (error) => {
            console.error(error);
            alert("Could not connect to WebSocket server. Please check backend.");
        }
    });

    const handleIncomingMessage = (message: any) => {
        if (message.type === 'JOIN' || message.type === 'LEAVE') {
            return;
        }

        const displayMsg: DisplayMessage = {
            ...message,
            side: message.side || 'agree' // Fallback
        };

        setMessages((prev) => [...prev, displayMsg]);
    };


    if (!discussion) return <div className={styles.container}>Discussion Not Found</div>;

    const topic = discussion.title;
    const description = discussion.description || discussion.content;

    const handleNext = () => {
        if (viewMode === 'chat') setViewMode('verify');
        else if (viewMode === 'verify') setViewMode('result');
        else if (viewMode === 'result') setViewMode('final'); // 결과보기 클릭 시 진입
    };

    const handleSendMessage = () => {
        if (!inputValue.trim() || !vote) return;
        setMessages([...messages, { text: inputValue, side: vote }]);
        setInputValue('');
    };



    // Speech Bubble Logic
    const [activeBubbles, setActiveBubbles] = useState<{ id: number, side: 'agree' | 'disagree', index: number, text: string }[]>([]);
    const agreeCounter = React.useRef(0);
    const disagreeCounter = React.useRef(0);
    const lastMessageCount = React.useRef(0);

    React.useEffect(() => {
        if (messages.length > lastMessageCount.current) {
            const lastMsg = messages[messages.length - 1];

            // Determine rotation index
            let index = 0;
            if (lastMsg.side === 'agree') {
                index = agreeCounter.current;
            } else {
                index = disagreeCounter.current;
            }

            // check collision
            // Note: We need to access the LATEST state here. 
            // Since we are in useEffect depend on messages, activeBubbles might be stale if we don't use functional update or ref.
            // However, typical React flow: setBubbles(prev => ...).
            // But we need to KNOW if collision exists to decide whether to increment counter or not?
            // User requirement: "If existing message ... don't show"
            // We can check collision inside the set state callback or use a Ref to track occupied slots?
            // Only using state is safer for rendering. 

            setActiveBubbles(prev => {
                const isOccupied = prev.some(b => b.side === lastMsg.side && b.index === index);

                if (isOccupied) {
                    // Collision: Skip adding this bubble.
                    // Should we increment counter? User logic implies we skip THIS position.
                    // Usually rotation happens regardless. Let's increment counter outside.
                    return prev;
                }

                const newBubble = { id: Date.now(), side: lastMsg.side, index, text: lastMsg.text };

                // Set timer to remove this specific bubble
                setTimeout(() => {
                    setActiveBubbles(current => current.filter(b => b.id !== newBubble.id));
                }, 3000);

                return [...prev, newBubble];
            });

            // Always increment counter to rotate focus
            if (lastMsg.side === 'agree') {
                agreeCounter.current = (agreeCounter.current + 1) % 3;
            } else {
                disagreeCounter.current = (disagreeCounter.current + 1) % 3;
            }

            lastMessageCount.current = messages.length;
        }
    }, [messages]);

    const handleEnd = () => {
        if (!window.confirm("정말 종료하시겠습니까?")) return;
        localStorage.setItem('openPanel', 'discussion');
        navigate('/map');
    };

    // 🟢 결과 화면 (박스 5개 레이아웃)
    if (viewMode === 'final') {
        return (
            <div className={styles.container}>
                <div className={styles.resultContainer}>
                    <div className={styles.resultTopRow}>
                        <div className={`${styles.resultBox} ${styles.topLeftBox}`}>결과 요약 (25%)</div>
                        <div className={`${styles.resultBox} ${styles.topRightBox}`}>
                            <h2>{topic}</h2>
                            <p>{description}</p>
                        </div>
                    </div>
                    <div className={styles.resultBottomRow}>
                        <div className={styles.resultBox}>찬성측 통계</div>
                        <div className={styles.resultBox}>반대측 통계</div>
                        <div className={styles.resultBox}>최종 결론</div>
                    </div>
                </div>
                <button className={styles.startButton} onClick={handleEnd}>토론 끝내기</button>
            </div>
        );
    }

    // 🔵 토론 진행 화면 (기존)
    return (
        <div className={styles.container}>
            {viewMode === 'vote' && (
                <div className={styles.header}>
                    <h1 className={styles.title}>주제 : {topic}</h1>
                    <p className={styles.description}>
                        {description}
                    </p>
                </div>
            )}

            {viewMode !== 'vote' && (
                <div className={styles.statusBar}>
                    <div
                        className={`${styles.statusStep} ${viewMode === 'chat' ? styles.active : ''}`}
                        onClick={() => setViewMode('chat')}
                    >
                        <div className={styles.circle}>의견제시</div>
                    </div>
                    <div className={styles.line} />
                    <div
                        className={`${styles.statusStep} ${viewMode === 'verify' ? styles.active : ''}`}
                        onClick={() => setViewMode('verify')}
                    >
                        <div className={styles.circle}>의견확인</div>
                    </div>
                    <div className={styles.line} />
                    <div
                        className={`${styles.statusStep} ${viewMode === 'result' ? styles.active : ''}`}
                        onClick={() => setViewMode('result')}
                    >
                        <div className={styles.circle}>반론</div>
                    </div>
                </div>
            )}


            {viewMode === 'vote' && (
                <>
                    <div className={styles.voteContainer}>
                        <button className={`${styles.voteButton} ${styles.agreeButton}`} onClick={() => setVote('agree')} style={{ opacity: vote === 'disagree' ? 0.3 : 1 }}>찬성</button>
                        <button className={`${styles.voteButton} ${styles.disagreeButton}`} onClick={() => setVote('disagree')} style={{ opacity: vote === 'agree' ? 0.3 : 1 }}>반대</button>
                    </div>
                    <button className={styles.startButton} onClick={() => vote ? setViewMode('chat') : alert('입장을 선택하세요')}>시작하기</button>
                </>
            )}

            {(viewMode === 'chat' || viewMode === 'verify' || viewMode === 'result') && (
                <div className={styles.chatContainer}>
                    {/* 🟢 Top Section: King Image & Info */}
                    <div className={styles.topSection}>
                        <div className={styles.kingImageWrapper}>
                            <img src="/assets/images/discussion/king.png" alt="King" className={styles.kingImage} />
                        </div>
                        <div className={styles.infoSection}>
                            <h2 className={styles.chatTitle}>{topic}</h2>
                            <p className={styles.chatDescription}>{description}</p>
                        </div>
                    </div>

                    {/* 🟢 Chat Logs */}
                    <div className={styles.chatWrapper}>
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'agree').map((msg, i) => (
                                    <div key={i} className={`${styles.messageBubble} ${styles.agreeMessage}`}>{msg.text}</div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.disagreeHeader}`}>반대</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'disagree').map((msg, i) => (
                                    <div key={i} className={`${styles.messageBubble} ${styles.disagreeMessage}`}>{msg.text}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 🟢 Human Images Section & Speech Bubbles */}
                    <div className={styles.humanSection}>
                        {/* Agree Side */}
                        <div className={`${styles.humanGroup} ${styles.agreeGroup}`}>
                            {[1, 2, 3].map((_, i) => (
                                <img key={`agree-human-${i}`} src="/assets/images/discussion/yesman.png" alt="Human" className={styles.humanImage} />
                            ))}
                        </div>
                        {/* Disagree Side */}
                        <div className={`${styles.humanGroup} ${styles.disagreeGroup}`}>
                            {[1, 2, 3].map((_, i) => (
                                <img key={`disagree-human-${i}`} src="/assets/images/discussion/noman.png" alt="Human" className={`${styles.humanImage}`} />
                            ))}
                        </div>

                        {/* Speech Bubbles */}
                        {activeBubbles.map((bubble) => (
                            <div
                                key={bubble.id}
                                className={`${styles.speechBubble} ${bubble.side === 'agree' ? styles.bubbleAgree : styles.bubbleDisagree}`}
                                style={{
                                    top: bubble.index === 0 ? '70px' :
                                        bubble.index === 1 ? 'calc(33% + 60px)' :
                                            'calc(66% + 60px)'
                                }}
                            >
                                {bubble.text}
                            </div>
                        ))}
                    </div>

                    {/* 🟢 Bottom Section: Input & Buttons */}
                    <div className={styles.bottomSection}>
                        <div className={styles.chatInputBar}>
                            <input
                                className={styles.chatInput}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={viewMode === 'verify' ? "의견 확인 단계입니다." : "의견을 입력하세요..."}
                                disabled={viewMode === 'verify'}
                            />
                            <button
                                className={styles.sendButton}
                                onClick={handleSendMessage}
                                disabled={viewMode === 'verify'}
                                style={{
                                    backgroundColor: viewMode === 'verify' ? '#ccc' : '#2196F3',
                                    cursor: viewMode === 'verify' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                전송
                            </button>
                        </div>
                        <div className={styles.actionButtons}>
                            <button className={styles.endButton} onClick={handleEnd}>종료</button>
                            <button className={viewMode === 'result' ? styles.resultButton : styles.startButton} style={{ position: 'static' }} onClick={handleNext}>
                                {viewMode === 'result' ? '결과보기' : '다음'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'final' && (
                <div className={styles.resultContainer}>
                    <div className={styles.resultTopRow}>
                        <div className={`${styles.resultBox} ${styles.topLeftBox}`}>Result Top Left</div>
                        <div className={`${styles.resultBox} ${styles.topRightBox}`}>
                            <h2>주제 : {topic}</h2>
                            <p>내용 : {description}</p>
                        </div>
                    </div>
                    <div className={styles.resultBottomRow}>
                        <div className={styles.resultBox}>Result Bottom 1</div>
                        <div className={styles.resultBox}>Result Bottom 2</div>
                        <div className={styles.resultBox}>Result Bottom 3</div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <button className={styles.endButton} onClick={handleEnd}>종료</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscussionRoomPage;
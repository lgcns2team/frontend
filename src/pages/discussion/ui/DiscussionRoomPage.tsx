import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DiscussionRoomPage.module.css';
import { useStomp } from '../../../shared/lib/useStomp';





const DiscussionRoomPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const saved = localStorage.getItem('discussions');
    const discussions = saved ? JSON.parse(saved) : [];
    const discussion = discussions.find((d: any) => String(d.id) === id);

    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    // viewMode: vote -> chat -> verify -> result -> final(박스 5개 화면)
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'verify' | 'result' | 'final'>('vote');
    const [messages, setMessages] = useState<{ id: string, text: string, side: 'agree' | 'disagree', parentId?: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [replyToId, setReplyToId] = useState<string | null>(null);

    // Font size scaling refs & state
    const titleRef = React.useRef<HTMLHeadingElement>(null);
    const descRef = React.useRef<HTMLParagraphElement>(null);
    const [titleFontSize, setTitleFontSize] = useState(2.5); // rem
    const [descFontSize, setDescFontSize] = useState(1.5);   // rem

    // Mock user info
    const [userId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
    const [username] = useState(`User ${Math.floor(Math.random() * 100)}`);

    const { subscribe, sendMessage } = useStomp({
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

        const displayMsg = {
<<<<<<< HEAD
            id: message.id || `msg-${Date.now()}-${Math.random()}`,
            text: message.content,
            side: message.side || 'agree', // Fallback
            parentId: message.parentId
=======
            text: message.content,
            side: message.side || 'agree'
>>>>>>> 74ed53f4692dd058cf48520a7a50359842621839
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

        const newMsg = {
            id: `msg-${Date.now()}`,
            text: inputValue,
            side: vote,
            parentId: replyToId || undefined
        };

        setMessages([...messages, newMsg]);
        setInputValue('');
        setReplyToId(null);
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

    // Font size scaling state management
    React.useEffect(() => {
        setTitleFontSize(2.5);
    }, [topic]);

    React.useEffect(() => {
        setDescFontSize(1.5);
    }, [description]);

    // Auto-scale font effect
    React.useEffect(() => {

        // Scale Title (2 lines limit)
        if (titleRef.current) {
            const el = titleRef.current;
            if (el.scrollHeight > el.clientHeight && titleFontSize > 0.5) {
                setTitleFontSize(prev => prev - 0.05);
            }
        }

        // Scale Description (3 lines limit)
        if (descRef.current) {
            const el = descRef.current;
            if (el.scrollHeight > el.clientHeight && descFontSize > 0.5) {
                setDescFontSize(prev => prev - 0.05);
            }
        }
    }, [topic, description, viewMode, titleFontSize, descFontSize]);

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
                        <div className={`${styles.resultBox} ${styles.topLeftBox}`}>
                            <img src="/assets/images/discussion/king.png" alt="King" className={styles.resultKingImage} />
                        </div>
                        <div className={`${styles.resultBox} ${styles.topRightBox}`}>
                            <h2
                                ref={titleRef}
                                style={{ fontSize: `${titleFontSize}rem` }}
                            >
                                주제 : {topic}
                            </h2>
                            <p
                                ref={descRef}
                                style={{ fontSize: `${descFontSize}rem` }}
                            >
                                설명 : {description}
                            </p>
                        </div>
                    </div>
                    <div className={styles.resultBottomRow}>
                        <div className={styles.resultBox}>결론 1</div>
                        <div className={styles.resultBox}>결론 2</div>
                        <div className={styles.resultBox}>결론 3</div>
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
                    <h1
                        ref={titleRef}
                        className={styles.title}
                        style={{ fontSize: `${titleFontSize}rem` }}
                    >
                        주제 : {topic}
                    </h1>
                    <p
                        ref={descRef}
                        className={styles.description}
                        style={{ fontSize: `${descFontSize}rem` }}
                    >
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
                    <div className={styles.voteContainer} onClick={() => setVote(null)}>
                        <button
                            className={`${styles.voteButton} ${styles.agreeButton}`}
                            onClick={(e) => { e.stopPropagation(); setVote(vote === 'agree' ? null : 'agree'); }}
                            style={{ opacity: vote === 'disagree' ? 0.3 : 1 }}
                        >
                            찬성
                        </button>
                        <button
                            className={`${styles.voteButton} ${styles.disagreeButton}`}
                            onClick={(e) => { e.stopPropagation(); setVote(vote === 'disagree' ? null : 'disagree'); }}
                            style={{ opacity: vote === 'agree' ? 0.3 : 1 }}
                        >
                            반대
                        </button>
                    </div>
                    {localStorage.getItem('userRole') === 'TEACHER' && (
                        <button className={styles.startButton} onClick={() => setViewMode('chat')}>시작하기</button>
                    )}
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
                            <h2
                                ref={titleRef}
                                className={styles.chatTitle}
                                style={{ fontSize: `${titleFontSize}rem` }}
                            >
                                {topic}
                            </h2>
                            <p
                                ref={descRef}
                                className={styles.chatDescription}
                                style={{ fontSize: `${descFontSize}rem` }}
                            >
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* 🟢 Chat Logs */}
                    <div className={styles.chatWrapper}>
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'agree' && !m.parentId).map((msg) => (
                                    <React.Fragment key={msg.id}>
                                        <div className={`${styles.messageBubble} ${styles.agreeMessage}`}>
                                            {msg.text}
                                            {viewMode === 'result' && (
                                                <button
                                                    className={styles.counterButton}
                                                    onClick={() => setReplyToId(msg.id)}
                                                >
                                                    반론하기
                                                </button>
                                            )}
                                        </div>
                                        {/* Replies */}
                                        {messages.filter(reply => reply.parentId === msg.id).map(reply => (
                                            <div key={reply.id} className={`${styles.messageBubble} ${styles.agreeMessage} ${styles.replyMessage}`}>
                                                ㄴ {reply.text}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.disagreeHeader}`}>반대</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'disagree' && !m.parentId).map((msg) => (
                                    <React.Fragment key={msg.id}>
                                        <div className={`${styles.messageBubble} ${styles.disagreeMessage}`}>
                                            {msg.text}
                                            {viewMode === 'result' && (
                                                <button
                                                    className={styles.counterButton}
                                                    onClick={() => setReplyToId(msg.id)}
                                                >
                                                    반론하기
                                                </button>
                                            )}
                                        </div>
                                        {/* Replies */}
                                        {messages.filter(reply => reply.parentId === msg.id).map(reply => (
                                            <div key={reply.id} className={`${styles.messageBubble} ${styles.disagreeMessage} ${styles.replyMessage}`}>
                                                ㄴ {reply.text}
                                            </div>
                                        ))}
                                    </React.Fragment>
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
                                placeholder={
                                    viewMode === 'verify' ? "의견 확인 단계입니다." :
                                        (viewMode === 'result' && !replyToId) ? "반론할 메세지를 선택하세요." :
                                            (viewMode === 'result' && replyToId) ? "반론 내용을 입력하세요..." :
                                                "의견을 입력하세요..."
                                }
                                disabled={viewMode === 'verify' || (viewMode === 'result' && !replyToId) || viewMode === 'chat'}
                            />
                            <button
                                className={styles.sendButton}
                                onClick={handleSendMessage}
                                disabled={viewMode === 'verify' || (viewMode === 'result' && !replyToId) || viewMode === 'chat'}
                                style={{
                                    backgroundColor: (viewMode === 'verify' || (viewMode === 'result' && !replyToId) || viewMode === 'chat') ? '#ccc' : '#2196F3',
                                    cursor: (viewMode === 'verify' || (viewMode === 'result' && !replyToId) || viewMode === 'chat') ? 'not-allowed' : 'pointer'
                                }}
                            >
                                전송
                            </button>
                        </div>
                        {localStorage.getItem('userRole') === 'TEACHER' && (
                            <div className={styles.actionButtons}>
                                <button className={styles.endButton} onClick={handleEnd}>종료</button>
                                <button className={viewMode === 'result' ? styles.resultButton : styles.startButton} style={{ position: 'static' }} onClick={handleNext}>
                                    {viewMode === 'result' ? '결과보기' : '다음'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

<<<<<<< HEAD
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
                        <div className={styles.resultBox}>결론 1</div>
                        <div className={styles.resultBox}>결론 2</div>
                        <div className={styles.resultBox}>결론 3</div>
                    </div>
                    {localStorage.getItem('userRole') === 'TEACHER' && (
                        <div style={{ textAlign: 'right', marginTop: '20px' }}>
                            <button className={styles.endButton} onClick={handleEnd}>종료</button>
                        </div>
                    )}
                </div>
            )}
=======

>>>>>>> 74ed53f4692dd058cf48520a7a50359842621839
        </div>
    );
};

export default DiscussionRoomPage;
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DiscussionRoomPage.module.css';
import { useDiscussion, getDiscussionRooms, type DisplayMessage } from '../../../shared/lib/useStomp';

const DiscussionRoomPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [discussion, setDiscussion] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const rooms = await getDiscussionRooms();
                const found = rooms.find((r: any) => String(r.id) === id || String(r.roomId) === id);
                if (found) {
                    setDiscussion({
                        ...found,
                        title: found.topicTitle || found.title,
                        description: found.topicDescription || found.description
                    });
                }
            } catch (e) {
                console.error("Failed to fetch room info", e);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [id]);

    // Use the high-level hook (Restores correct WebSocket logic)
    const {
        messages,
        vote,
        setVote,
        viewMode,
        setViewMode,
        userId,
        isConnected,
        lastError,
        sendChat,
        confirmStart,
        sendModeChange
    } = useDiscussion(id);

    const [inputValue, setInputValue] = useState('');
    const [replyToId, setReplyToId] = useState<string | null>(null);

    // Font size scaling refs & state (From User's Code)
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const [titleFontSize, setTitleFontSize] = useState(2.5); // rem
    const [descFontSize, setDescFontSize] = useState(1.5);   // rem

    const topic = discussion?.title || '';
    const description = discussion?.description || discussion?.content || '';

    // Font size scaling effects
    useEffect(() => { setTitleFontSize(2.5); }, [topic]);
    useEffect(() => { setDescFontSize(1.5); }, [description]);

    useEffect(() => {
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


    const handleNext = () => {
        let next: 'vote' | 'chat' | 'verify' | 'result' | 'final' = viewMode;
        if (viewMode === 'chat') next = 'verify';
        else if (viewMode === 'verify') next = 'result';
        else if (viewMode === 'result') next = 'final';

        if (next !== viewMode) {
            if (localStorage.getItem('userRole') === 'TEACHER') {
                sendModeChange(next);
            } else {
                setViewMode(next);
            }
        }
    };

    const handleSendMessage = () => {
        if (!inputValue.trim() || !vote) return;

        if (!isConnected) {
            const errorDetail = lastError
                ? (typeof lastError === 'string' ? lastError : (lastError.headers?.message || JSON.stringify(lastError)))
                : "알 수 없는 오류";
            alert(`❌ 연결이 끊겨있습니다. (Error: ${errorDetail}) 잠시 후 다시 시도해주세요.`);
            return;
        }

        sendChat(inputValue, replyToId || undefined);
        setInputValue('');
        setReplyToId(null);
    };


    const handleStart = () => {
        confirmStart();
    };

    const handleEnd = () => {
        if (!window.confirm("정말 종료하시겠습니까?")) return;
        localStorage.setItem('openPanel', 'discussion');
        navigate('/map');
    };

    // Speech Bubble Logic
    const [activeBubbles, setActiveBubbles] = useState<{ id: number, side: 'agree' | 'disagree', index: number, text: string }[]>([]);
    const agreeCounter = useRef(0);
    const disagreeCounter = useRef(0);
    const lastMessageCount = useRef(0);

    useEffect(() => {
        if (messages.length > lastMessageCount.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.type !== 'CHAT' && lastMsg.type !== undefined) return;

            // Determine rotation index
            let index = 0;
            if (lastMsg.side === 'agree') index = agreeCounter.current;
            else index = disagreeCounter.current;

            setActiveBubbles(prev => {
                const isOccupied = prev.some(b => b.side === lastMsg.side && b.index === index);
                if (isOccupied) return prev;

                const newBubble = { id: Date.now(), side: lastMsg.side as 'agree' | 'disagree', index, text: lastMsg.content };
                setTimeout(() => {
                    setActiveBubbles(current => current.filter(b => b.id !== newBubble.id));
                }, 3000);
                return [...prev, newBubble];
            });

            if (lastMsg.side === 'agree') agreeCounter.current = (agreeCounter.current + 1) % 3;
            else disagreeCounter.current = (disagreeCounter.current + 1) % 3;

            lastMessageCount.current = messages.length;
        }
    }, [messages]);


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
                            <h2 ref={titleRef} style={{ fontSize: `${titleFontSize}rem` }}>주제 : {topic}</h2>
                            <p ref={descRef} style={{ fontSize: `${descFontSize}rem` }}>설명 : {description}</p>
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
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {viewMode === 'vote' && (
                <div className={styles.header}>
                    <h1 ref={titleRef} className={styles.title} style={{ fontSize: `${titleFontSize}rem` }}>주제 : {topic}</h1>
                    <p ref={descRef} className={styles.description} style={{ fontSize: `${descFontSize}rem` }}>{description}</p>
                </div>
            )}

            {viewMode !== 'vote' && (
                <div className={styles.statusBar}>
                    <div className={`${styles.statusStep} ${viewMode === 'chat' ? styles.active : ''}`} onClick={() => setViewMode('chat')}>
                        <div className={styles.circle}>의견제시</div>
                    </div>
                    <div className={styles.line} />
                    <div className={`${styles.statusStep} ${viewMode === 'verify' ? styles.active : ''}`} onClick={() => setViewMode('verify')}>
                        <div className={styles.circle}>의견확인</div>
                    </div>
                    <div className={styles.line} />
                    <div className={`${styles.statusStep} ${viewMode === 'result' ? styles.active : ''}`} onClick={() => setViewMode('result')}>
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
                        >찬성</button>
                        <button
                            className={`${styles.voteButton} ${styles.disagreeButton}`}
                            onClick={(e) => { e.stopPropagation(); setVote(vote === 'disagree' ? null : 'disagree'); }}
                            style={{ opacity: vote === 'agree' ? 0.3 : 1 }}
                        >반대</button>
                    </div>
                    {localStorage.getItem('userRole') === 'TEACHER' && (
                        <button className={styles.startButton} onClick={handleStart}>시작하기</button>
                    )}
                </>
            )}

            {(viewMode === 'chat' || viewMode === 'verify' || viewMode === 'result') && (
                <div className={styles.chatContainer}>
                    <div className={styles.topSection}>
                        <div className={styles.kingImageWrapper}>
                            <img src="/assets/images/discussion/king.png" alt="King" className={styles.kingImage} />
                        </div>
                        <div className={styles.infoSection}>
                            <h2 ref={titleRef} className={styles.chatTitle} style={{ fontSize: `${titleFontSize}rem` }}>{topic}</h2>
                            <p ref={descRef} className={styles.chatDescription} style={{ fontSize: `${descFontSize}rem` }}>{description}</p>
                        </div>
                    </div>

                    <div className={styles.chatWrapper}>
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'agree' && !m.parentId).map((msg) => (
                                    <React.Fragment key={msg.id}>
                                        <div className={`${styles.messageBubble} ${styles.agreeMessage}`}>
                                            {msg.content}
                                            {viewMode === 'result' && (
                                                <button className={styles.counterButton} onClick={() => setReplyToId(msg.id || null)}>반론하기</button>
                                            )}
                                        </div>
                                        {messages.filter(reply => reply.parentId === msg.id).map(reply => (
                                            <div key={reply.id} className={`${styles.messageBubble} ${styles.agreeMessage} ${styles.replyMessage}`}>
                                                ㄴ {reply.content}
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
                                            {msg.content}
                                            {viewMode === 'result' && (
                                                <button className={styles.counterButton} onClick={() => setReplyToId(msg.id || null)}>반론하기</button>
                                            )}
                                        </div>
                                        {messages.filter(reply => reply.parentId === msg.id).map(reply => (
                                            <div key={reply.id} className={`${styles.messageBubble} ${styles.disagreeMessage} ${styles.replyMessage}`}>
                                                ㄴ {reply.content}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.humanSection}>
                        <div className={`${styles.humanGroup} ${styles.agreeGroup}`}>
                            {[1, 2, 3].map((_, i) => <img key={`agree-human-${i}`} src="/assets/images/discussion/yesman.png" alt="Human" className={styles.humanImage} />)}
                        </div>
                        <div className={`${styles.humanGroup} ${styles.disagreeGroup}`}>
                            {[1, 2, 3].map((_, i) => <img key={`disagree-human-${i}`} src="/assets/images/discussion/noman.png" alt="Human" className={styles.humanImage} />)}
                        </div>
                        {activeBubbles.map((bubble) => (
                            <div key={bubble.id} className={`${styles.speechBubble} ${bubble.side === 'agree' ? styles.bubbleAgree : styles.bubbleDisagree}`}
                                style={{ top: bubble.index === 0 ? '70px' : bubble.index === 1 ? 'calc(33% + 60px)' : 'calc(66% + 60px)' }}>
                                {bubble.text}
                            </div>
                        ))}
                    </div>

                    <div className={styles.bottomSection}>
                        <div className={styles.chatInputBar}>
                            {replyToId && (
                                <div style={{ position: 'absolute', top: '-40px', left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>To: {messages.find(m => m.id === replyToId)?.content.substring(0, 20)}...</span>
                                    <button onClick={() => setReplyToId(null)}>X</button>
                                </div>
                            )}
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
                                disabled={viewMode === 'verify' || (viewMode === 'result' && !replyToId)}
                            />
                            <button className={styles.sendButton} onClick={handleSendMessage} disabled={viewMode === 'verify' || (viewMode === 'result' && !replyToId)}>전송</button>
                        </div>
                        {localStorage.getItem('userRole') === 'TEACHER' && (
                            <div className={styles.actionButtons}>
                                <button className={styles.endButton} onClick={handleEnd}>종료</button>
                                <button className={viewMode === 'result' ? styles.resultButton : styles.startButton} onClick={handleNext}>
                                    {viewMode === 'result' ? '결과보기' : '다음'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscussionRoomPage;
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DiscussionRoomPage.module.css';
import { useDiscussion, getDiscussionRooms } from '../../../shared/lib/useStomp';

const DiscussionRoomPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [discussion, setDiscussion] = useState<any>(null);

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
        isConnected,
        lastError,
        sendChat,
        confirmStart,
        sendModeChange
    } = useDiscussion(id);

    // Debug: Log messages changes
    useEffect(() => {
        console.log('🎬 DiscussionRoomPage - messages changed:', messages.length, messages);
        console.log('🎬 Agree messages:', messages.filter(m => m.side === 'agree' && !m.parentId));
        console.log('🎬 Disagree messages:', messages.filter(m => m.side === 'disagree' && !m.parentId));
    }, [messages]);

    const [inputValue, setInputValue] = useState('');
    const [replyToId, setReplyToId] = useState<string | null>(null);

    // Refs for auto-scrolling chat logs
    const agreeChatRef = useRef<HTMLDivElement>(null);
    const disagreeChatRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (agreeChatRef.current) {
            agreeChatRef.current.scrollTop = agreeChatRef.current.scrollHeight;
        }
        if (disagreeChatRef.current) {
            disagreeChatRef.current.scrollTop = disagreeChatRef.current.scrollHeight;
        }
    }, [messages]);

    const topic = discussion?.title || '';
    const description = discussion?.description || discussion?.content || '';

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

        const parentMessageId = replyToId;
        sendChat(inputValue, replyToId || undefined);
        setInputValue('');
        setReplyToId(null);

        // If this was a reply, scroll to the parent message after a short delay
        if (parentMessageId) {
            setTimeout(() => {
                const parentElement = document.querySelector(`[data-message-id="${parentMessageId}"]`);
                if (parentElement) {
                    parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };


    const [isExiting, setIsExiting] = useState(false);

    const handleStart = () => {
        setIsExiting(true);
        setTimeout(() => {
            confirmStart();
            setIsExiting(false); // Reset for safety though component might unmount
        }, 800); // Wait for 0.8s animation + buffer
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
        // ... (Return final view) ...
        return (
            <div className={styles.container}>
                <div className={styles.resultContainer}>
                    <div className={styles.resultTopRow}>
                        <div className={`${styles.resultBox} ${styles.topLeftBox}`}>
                            <img src="/assets/images/discussion/king.png" alt="King" className={styles.resultKingImage} />
                        </div>
                        <div className={`${styles.resultBox} ${styles.topRightBox}`}>
                            <h2>주제 : {topic}</h2>
                            <p>설명 : {description}</p>
                        </div>
                    </div>
                    <div className={styles.resultBottomRow}>
                        <div className={styles.resultBox}>결론 1</div>
                        <div className={styles.resultBox}>결론 2</div>
                        <div className={styles.resultBox}>결론 3</div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button className={styles.endButton} onClick={handleEnd}>종료</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {viewMode === 'vote' && (
                <div className={styles.header}>
                    <img src="/assets/images/logo2.png" className={styles.headerDecoLeft} alt="decoration" />
                    <img src="/assets/images/logo2.png" className={styles.headerDecoRight} alt="decoration" />
                    <div className={styles.hyunpan}>
                        <h1 className={styles.title}>{topic}</h1>
                        <p className={styles.description}>{description}</p>
                    </div>
                </div>
            )}

            {viewMode !== 'vote' && (
                <div className={styles.statusBar}>
                    {/* ... (Status bar content) ... */}
                    <div
                        className={`${styles.statusStep} ${viewMode === 'chat' ? styles.active : ''}`}
                        onClick={() => localStorage.getItem('userRole') === 'TEACHER' && sendModeChange('chat')}
                        style={{ cursor: localStorage.getItem('userRole') === 'TEACHER' ? 'pointer' : 'default' }}
                    >
                        <div className={styles.circle}>의견제시</div>
                    </div>
                    <div className={styles.line} />
                    <div
                        className={`${styles.statusStep} ${viewMode === 'verify' ? styles.active : ''}`}
                        onClick={() => localStorage.getItem('userRole') === 'TEACHER' && sendModeChange('verify')}
                        style={{ cursor: localStorage.getItem('userRole') === 'TEACHER' ? 'pointer' : 'default' }}
                    >
                        <div className={styles.circle}>의견확인</div>
                    </div>
                    <div className={styles.line} />
                    <div
                        className={`${styles.statusStep} ${viewMode === 'result' ? styles.active : ''}`}
                        onClick={() => localStorage.getItem('userRole') === 'TEACHER' && sendModeChange('result')}
                        style={{ cursor: localStorage.getItem('userRole') === 'TEACHER' ? 'pointer' : 'default' }}
                    >
                        <div className={styles.circle}>반론</div>
                    </div>
                </div>
            )}

            {viewMode === 'vote' && (
                <>
                    <div className={styles.voteContainer}>
                        <button
                            className={`${styles.voteButton} ${styles.agreeButton} ${vote === 'agree' ? styles.selectedVote : ''} ${isExiting ? styles.exitLeft : ''}`}
                            onClick={(e) => { e.stopPropagation(); setVote(vote === 'agree' ? null : 'agree'); }}
                            style={{ opacity: vote === 'disagree' ? 0.3 : 1 }}
                        ><span>찬성</span></button>

                        <button
                            className={`${styles.voteButton} ${styles.disagreeButton} ${vote === 'disagree' ? styles.selectedVote : ''} ${isExiting ? styles.exitRight : ''}`}
                            onClick={(e) => { e.stopPropagation(); setVote(vote === 'disagree' ? null : 'disagree'); }}
                            style={{ opacity: vote === 'agree' ? 0.3 : 1 }}
                        ><span>반대</span></button>

                        <div className={`${styles.vsBadge} ${isExiting ? styles.fadeOut : ''}`}>VS</div>
                    </div>
                    {localStorage.getItem('userRole') === 'TEACHER' ? (
                        <div className={styles.voteActionButtons}>
                            <button className={styles.endButton} onClick={handleEnd}>종료</button>
                            <button className={styles.startButton} onClick={handleStart}>시작하기</button>
                        </div>
                    ) : (
                        <button className={styles.studentEndButton} onClick={handleEnd}>종료</button>
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
                            <div className={styles.royalBadge}>논제</div>
                            <h2 className={styles.chatTitle}>{topic}</h2>
                            <p className={styles.chatDescription}>{description}</p>
                        </div>
                    </div>

                    <div className={styles.chatWrapper}>
                        <div
                            className={`${styles.chatColumn} ${vote === 'agree' ? styles.selectedColumn : ''}`}
                        >
                            <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                            <div className={styles.chatLog} ref={agreeChatRef}>
                                {messages.filter(m => m.side === 'agree' && !m.parentId).map((msg, index) => (
                                    <React.Fragment key={msg.id || `msg-${index}`}>
                                        <div
                                            className={`${styles.messageBubble} ${styles.agreeMessage}`}
                                            data-message-id={msg.id}
                                        >
                                            {msg.content || '[Empty message]'}
                                            {viewMode === 'result' && (
                                                <button className={styles.counterButton} onClick={() => setReplyToId(msg.id || null)}>반론하기</button>
                                            )}
                                        </div>
                                        {messages.filter(reply => reply.parentId === msg.id).map((reply, replyIndex) => (
                                            <div
                                                key={reply.id || `reply-${index}-${replyIndex}`}
                                                className={`${styles.messageBubble} ${styles.agreeMessage} ${styles.replyMessage}`}
                                            >
                                                ㄴ {reply.content}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div
                            className={`${styles.chatColumn} ${vote === 'disagree' ? styles.selectedColumn : ''}`}
                        >
                            <div className={`${styles.columnHeader} ${styles.disagreeHeader}`}>반대</div>
                            <div className={styles.chatLog} ref={disagreeChatRef}>
                                {messages.filter(m => m.side === 'disagree' && !m.parentId).map((msg, index) => (
                                    <React.Fragment key={msg.id || `msg-${index}`}>
                                        <div
                                            className={`${styles.messageBubble} ${styles.disagreeMessage}`}
                                            data-message-id={msg.id}
                                        >
                                            {msg.content || '[Empty message]'}
                                            {viewMode === 'result' && (
                                                <button className={styles.counterButton} onClick={() => setReplyToId(msg.id || null)}>반론하기</button>
                                            )}
                                        </div>
                                        {messages.filter(reply => reply.parentId === msg.id).map((reply, replyIndex) => (
                                            <div
                                                key={reply.id || `reply-${index}-${replyIndex}`}
                                                className={`${styles.messageBubble} ${styles.disagreeMessage} ${styles.replyMessage}`}
                                            >
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
                            {activeBubbles.filter(b => b.side === 'agree').map((bubble) => (
                                <div key={bubble.id} className={`${styles.speechBubble} ${styles.bubbleAgree}`}
                                    style={{ top: bubble.index === 0 ? '30px' : bubble.index === 1 ? 'calc(33% + 20px)' : 'calc(66% + 20px)' }}>
                                    {bubble.text}
                                </div>
                            ))}
                        </div>
                        <div className={`${styles.humanGroup} ${styles.disagreeGroup}`}>
                            {[1, 2, 3].map((_, i) => <img key={`disagree-human-${i}`} src="/assets/images/discussion/noman.png" alt="Human" className={styles.humanImage} />)}
                            {activeBubbles.filter(b => b.side === 'disagree').map((bubble) => (
                                <div key={bubble.id} className={`${styles.speechBubble} ${styles.bubbleDisagree}`}
                                    style={{ top: bubble.index === 0 ? '30px' : bubble.index === 1 ? 'calc(33% + 20px)' : 'calc(66% + 20px)' }}>
                                    {bubble.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {localStorage.getItem('userRole') === 'TEACHER' && (
                        <div className={styles.actionButtons}>
                            <button className={styles.endButton} onClick={handleEnd}>종료</button>
                            <button className={viewMode === 'result' ? styles.resultButton : styles.startButton} onClick={handleNext}>
                                {viewMode === 'result' ? '결과보기' : '다음'}
                            </button>
                        </div>
                    )}

                    {viewMode !== 'verify' && (
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiscussionRoomPage;
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
        sendModeChange,
        sendVoteStatus,
        sendEndSession
    } = useDiscussion(id);

    // Debug: Log messages changes
    useEffect(() => {
        console.log('🎬 DiscussionRoomPage - messages changed:', messages.length, messages);
        console.log('🎬 Agree messages:', messages.filter(m => m.side === 'agree' && !m.parentId));
        console.log('🎬 Disagree messages:', messages.filter(m => m.side === 'disagree' && !m.parentId));
    }, [messages]);

    const [inputValue, setInputValue] = useState('');
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [flippedBoxes, setFlippedBoxes] = useState<{ [key: number]: boolean }>({});
    const [isTopicCollapsed, setIsTopicCollapsed] = useState(true);

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
                    parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

        const userRole = localStorage.getItem('userRole');

        // If teacher, send END_SESSION signal to all students
        if (userRole === 'TEACHER') {
            console.log('👨‍🏫 Teacher ending session, sending END_SESSION signal');
            sendEndSession();
        }

        // Navigate to map page
        localStorage.setItem('openPanel', 'discussion');
        navigate('/map');
    };


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
                        {[1, 2, 3].map((num) => (
                            <div
                                key={num}
                                className={`${styles.flipCard} ${flippedBoxes[num] ? styles.flipped : ''}`}
                                onClick={() => setFlippedBoxes(prev => ({ ...prev, [num]: !prev[num] }))}
                            >
                                <div className={styles.flipCardInner}>
                                    <div className={`${styles.flipCardFront} ${styles.resultBox}`}>
                                        결론 {num}
                                    </div>
                                    <div className={`${styles.flipCardBack} ${styles.resultBox}`}>
                                        뒷면 {num}
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    <div className={styles.topSectionWrapper}>
                        <div className={`${styles.topSection} ${isTopicCollapsed ? styles.topSectionCollapsed : ''}`}>
                            <div className={styles.kingImageWrapper}>
                                <img src="/assets/images/discussion/king.png" alt="King" className={styles.kingImage} />
                            </div>
                            <div className={styles.infoSection}>
                                <div className={styles.royalBadge}>논제</div>
                                <h2 className={styles.chatTitle}>{topic}</h2>
                                <p className={styles.chatDescription}>{description}</p>
                            </div>
                        </div>
                        <button
                            className={`${styles.collapseButton} ${isTopicCollapsed ? styles.collapseButtonHidden : ''}`}
                            onClick={() => setIsTopicCollapsed(!isTopicCollapsed)}
                        >
                            <span>{isTopicCollapsed ? '논제 보기' : '논제 숨기기'}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={isTopicCollapsed ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                        </button>
                    </div>


                    <div className={styles.chatWrapper}>
                        {/* chat 모드: 카카오톡 스타일 통합 채팅 */}
                        {viewMode === 'chat' && (
                            <div className={styles.kakaoColumn}>
                                <div className={styles.kakaoChatLog} ref={agreeChatRef}>
                                    {messages.filter(m => !m.parentId).map((msg, index) => (
                                        <div
                                            key={msg.id || `msg-${index}`}
                                            className={`${styles.kakaoMessageRow} ${msg.side === 'agree' ? styles.kakaoLeft : styles.kakaoRight}`}
                                        >
                                            {msg.side === 'agree' && (
                                                <img src="/assets/images/discussion/yesman.png" alt="찬성" className={styles.kakaoProfileImg} />
                                            )}
                                            <div className={`${styles.kakaoBubble} ${msg.side === 'agree' ? styles.kakaoBubbleAgree : styles.kakaoBubbleDisagree}`}>
                                                {msg.content || '[Empty message]'}
                                            </div>
                                            {msg.side === 'disagree' && (
                                                <img src="/assets/images/discussion/noman.png" alt="반대" className={styles.kakaoProfileImg} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* verify, result 모드: 찬성/반대 두 컬럼 */}
                        {(viewMode === 'verify' || viewMode === 'result') && (
                            <>
                                {/* 찬성 컬럼 (왼쪽) */}
                                <div className={styles.chatColumn}>
                                    <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                                    <div className={styles.chatLog}>
                                        {messages.filter(m => !m.parentId && m.side === 'agree').map((msg, index) => (
                                            <div key={msg.id || `agree-msg-${index}`} className={styles.messageGroup}>
                                                <div
                                                    className={`${styles.messageBubble} ${styles.agreeMessage}`}
                                                    data-message-id={msg.id}
                                                >
                                                    <span className={styles.messageContent}>{msg.content || '[Empty message]'}</span>
                                                    {viewMode === 'result' && (
                                                        <button
                                                            className={styles.counterButton}
                                                            onClick={() => setReplyToId(msg.id || null)}
                                                        >
                                                            반론
                                                        </button>
                                                    )}
                                                </div>
                                                {/* 반론 표시 */}
                                                {messages.filter(reply => reply.parentId === msg.id).map((reply, replyIndex) => (
                                                    <div key={reply.id || `reply-${replyIndex}`} className={styles.replyWrapper}>
                                                        <div className={`${styles.messageBubble} ${styles.replyMessage} ${reply.side === 'agree' ? styles.replyAgree : styles.replyDisagree}`}>
                                                            <span className={styles.replyArrow}>ㄴ</span>
                                                            {reply.content || '[Empty reply]'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 반대 컬럼 (오른쪽) */}
                                <div className={styles.chatColumn}>
                                    <div className={`${styles.columnHeader} ${styles.disagreeHeader}`}>반대</div>
                                    <div className={styles.chatLog} ref={disagreeChatRef}>
                                        {messages.filter(m => !m.parentId && m.side === 'disagree').map((msg, index) => (
                                            <div key={msg.id || `disagree-msg-${index}`} className={styles.messageGroup}>
                                                <div
                                                    className={`${styles.messageBubble} ${styles.disagreeMessage}`}
                                                    data-message-id={msg.id}
                                                >
                                                    <span className={styles.messageContent}>{msg.content || '[Empty message]'}</span>
                                                    {viewMode === 'result' && (
                                                        <button
                                                            className={styles.counterButton}
                                                            onClick={() => setReplyToId(msg.id || null)}
                                                        >
                                                            반론
                                                        </button>
                                                    )}
                                                </div>
                                                {/* 반론 표시 */}
                                                {messages.filter(reply => reply.parentId === msg.id).map((reply, replyIndex) => (
                                                    <div key={reply.id || `reply-${replyIndex}`} className={styles.replyWrapper}>
                                                        <div className={`${styles.messageBubble} ${styles.replyMessage} ${reply.side === 'agree' ? styles.replyAgree : styles.replyDisagree}`}>
                                                            <span className={styles.replyArrow}>ㄴ</span>
                                                            {reply.content || '[Empty reply]'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>


                    {/* 신하 아이콘 - chat 모드에서는 숨김 */}
                    {viewMode !== 'chat' && (
                        <div className={styles.humanSection}>
                            <div className={`${styles.humanGroup} ${styles.agreeGroup}`}>
                                {[1, 2, 3].map((_, i) => <img key={`agree-human-${i}`} src="/assets/images/discussion/yesman.png" alt="Human" className={styles.humanImage} />)}
                            </div>
                            <div className={`${styles.humanGroup} ${styles.disagreeGroup}`}>
                                {[1, 2, 3].map((_, i) => <img key={`disagree-human-${i}`} src="/assets/images/discussion/noman.png" alt="Human" className={styles.humanImage} />)}
                            </div>
                        </div>
                    )}

                    {localStorage.getItem('userRole') === 'TEACHER' && (
                        <div className={styles.actionButtons}>
                            <div className={styles.voteButtons}>
                                <button
                                    className={`${styles.teacherVoteBtn} ${styles.agreeVoteButton} ${vote === 'agree' ? styles.activeVote : ''}`}
                                    onClick={() => sendVoteStatus('agree')}
                                >
                                    찬성
                                </button>
                                <button
                                    className={`${styles.teacherVoteBtn} ${styles.disagreeVoteButton} ${vote === 'disagree' ? styles.activeVote : ''}`}
                                    onClick={() => sendVoteStatus('disagree')}
                                >
                                    반대
                                </button>
                            </div>
                            <div className={styles.mainButtons}>
                                <button className={styles.endButton} onClick={handleEnd}>종료</button>
                                <button className={viewMode === 'result' ? styles.resultButton : styles.startButton} onClick={handleNext}>
                                    {viewMode === 'result' ? '결과보기' : '다음'}
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode !== 'verify' && (
                        <div className={styles.bottomSection}>
                            {/* 반론 대상 메시지 표시 */}
                            {replyToId && (
                                <div className={styles.replyIndicator}>
                                    <span className={styles.replyIndicatorText}>
                                        @ {messages.find(m => m.id === replyToId)?.content?.substring(0, 50)}...
                                    </span>
                                    <button
                                        className={styles.replyIndicatorClose}
                                        onClick={() => setReplyToId(null)}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <div className={styles.chatInputBar}>
                                <input
                                    className={styles.chatInput}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={viewMode === 'result' && !replyToId ? "반론할 의견을 선택하세요..." : (replyToId ? "반론을 입력하세요..." : "의견을 입력하세요...")}
                                    disabled={viewMode === 'result' && !replyToId}
                                />
                                <button
                                    className={styles.sendButton}
                                    onClick={handleSendMessage}
                                    disabled={viewMode === 'result' && !replyToId}
                                >전송</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiscussionRoomPage;
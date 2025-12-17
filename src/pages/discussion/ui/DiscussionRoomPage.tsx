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

    // Load from localStorage
    const saved = localStorage.getItem('discussions');
    const discussions = saved ? JSON.parse(saved) : [];
    const discussion = discussions.find((d: any) => String(d.id) === id);

    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'result'>('vote');

    // Store message object
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
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


    const handleStart = () => {
        if (!vote) return alert('입장을 선택해주세요!');
        setViewMode('chat');
        connect();
    };

    const handleSendMessage = () => {
        if (!inputValue.trim() || !vote || !isConnected) return;

        const chatMessage = {
            sender: username,
            content: inputValue,
            type: 'CHAT',
            userId: userId,
            roomId: id,
            side: vote
        };

        sendMessage("/app/chat.sendMessage/" + id, chatMessage);
        setInputValue('');
    };

    const handleEnd = () => {
        if (!window.confirm("정말 종료하시겠습니까?")) return;
        disconnect();
        localStorage.setItem('openPanel', 'discussion');
        navigate('/map');
    };

    const handleResult = () => {
        setViewMode('result');
    };

    if (!discussion) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Discussion Not Found</h1>
                    <button className={styles.startButton} onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    const topic = discussion.title;
    const description = discussion.description || discussion.content;

    return (
        <div className={styles.container}>
            {viewMode !== 'result' && (
                <div className={styles.header}>
                    <h1 className={styles.title}>주제 : {topic}</h1>
                    <p className={styles.description}>내용 : {description}</p>
                </div>
            )}

            {viewMode === 'vote' && (
                <>
                    <div className={styles.voteContainer}>
                        <button
                            className={`${styles.voteButton} ${styles.agreeButton}`}
                            onClick={() => setVote('agree')}
                            style={{ opacity: vote === 'disagree' ? 0.3 : 1, border: vote === 'agree' ? '4px solid #333' : 'none' }}
                        >
                            찬성
                        </button>
                        <button
                            className={`${styles.voteButton} ${styles.disagreeButton}`}
                            onClick={() => setVote('disagree')}
                            style={{ opacity: vote === 'agree' ? 0.3 : 1, border: vote === 'disagree' ? '4px solid #333' : 'none' }}
                        >
                            반대
                        </button>
                    </div>

                    <button className={styles.startButton} onClick={handleStart}>
                        시작하기
                    </button>
                </>
            )}

            {viewMode === 'chat' && (
                <div className={styles.chatContainer}>
                    <div className={styles.chatWrapper}>
                        {/* Agree Column */}
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.agreeHeader}`}>찬성</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'agree').map((msg, idx) => (
                                    <div key={idx} className={`${styles.messageBubble} ${styles.agreeMessage}`}>
                                        <strong>{msg.sender}: </strong>{msg.content}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Disagree Column */}
                        <div className={styles.chatColumn}>
                            <div className={`${styles.columnHeader} ${styles.disagreeHeader}`}>반대</div>
                            <div className={styles.chatLog}>
                                {messages.filter(m => m.side === 'disagree').map((msg, idx) => (
                                    <div key={idx} className={`${styles.messageBubble} ${styles.disagreeMessage}`}>
                                        <strong>{msg.sender}: </strong>{msg.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.bottomSection}>
                        <div className={styles.chatInputBar}>
                            <input
                                className={styles.chatInput}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`${vote === 'agree' ? '찬성' : '반대'} 의견을 입력하세요...`}
                                disabled={!isConnected}
                            />
                            <button className={styles.sendButton} onClick={handleSendMessage} disabled={!isConnected}>
                                전송
                            </button>
                        </div>
                        <div className={styles.actionButtons}>
                            <button className={styles.endButton} onClick={handleEnd}>종료</button>
                            <button className={styles.resultButton} onClick={handleResult}>결과</button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'result' && (
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

import { useRef, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient, type Message } from '@stomp/stompjs';
import { getAuthHeaders } from '../../shared/api/api-utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// --- Types ---
export interface ChatMessage {
    id?: string;
    parentId?: string;
    // userId?: string;
    sender: string;
    content: string;
    type: 'CHAT' | 'JOIN' | 'LEAVE' | 'STATUS' | 'END_SESSION';
    side?: 'agree' | 'disagree';
    status?: 'PRO' | 'CON';
}

export interface DisplayMessage extends ChatMessage {
    side: 'agree' | 'disagree';
}

export interface CreateRoomPayload {
    topicTitle: string;
    topicDescription: string;
    participantCount: number;
    grade: number;
    classroom: number;
    // teacherId: string;
}

export interface DiscussionRoom {
    roomId: string; // The DTO returns 'roomId' (UUID)
    topicTitle: string;
    topicDescription: string;
    teacherCode: number;
    participantCount: number;
    createdAt: string;
    grade?: number;
    classroom?: number;
    // Helper fields for UI if needed, but strict DTO mapping is best.
    id?: string; // We might map roomId to id for frontend compatibility
    title?: string;
    description?: string;
}

// --- API Functions ---
// --- API Functions ---
export const createShortDiscussionRoom = async (payload: CreateRoomPayload) => {
    try {
        console.log("📤 Creating room with payload:", payload);
        console.log("📤 Grade:", payload.grade, "Classroom:", payload.classroom);

        const response = await fetch(`${API_BASE_URL}/debate/room`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders() as Record<string, string>
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, roomId: data.roomId };
        } else {
            const errorText = await response.text();
            return { success: false, error: `${response.status} ${errorText}` };
        }
    } catch (error) {
        console.error("Error creating room:", error);
        return { success: false, error: 'Failed to connect to backend' };
    }
};

export const getDiscussionRooms = async (): Promise<DiscussionRoom[]> => {
    try {
        const token = localStorage.getItem('accessToken');
        // const userId = localStorage.getItem('userId');
        console.log("Fetching rooms with token:", token ? "Present" : "Missing");

        const headers = { ...getAuthHeaders() };

        let url = `${API_BASE_URL}/debate/roomList`;
        // if (userId) {
        //     url += `?userId=${userId}`;
        // }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        console.log("Fetch rooms status:", response.status);

        if (response.ok) {
            const data: DiscussionRoom[] = await response.json();
            console.log("Rooms fetched:", data);

            // Sort by createdAt ascending (oldest first)
            const sortedData = data.sort((a, b) => {
                const dateA = Array.isArray(a.createdAt) ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2], a.createdAt[3] || 0, a.createdAt[4] || 0, a.createdAt[5] || 0).getTime() : new Date(a.createdAt).getTime();
                const dateB = Array.isArray(b.createdAt) ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2], b.createdAt[3] || 0, b.createdAt[4] || 0, b.createdAt[5] || 0).getTime() : new Date(b.createdAt).getTime();
                return dateA - dateB;
            });

            // Map backend DTO to frontend structure if necessary, or just return.
            // Frontend currently expects: { id, title, description, content... }
            // Let's normalize it here to avoid breaking UI.
            return sortedData.map(room => ({
                ...room,
                id: room.roomId,
                title: room.topicTitle,
                description: room.topicDescription,
                content: room.topicDescription // Fallback for some UI logic
            }));
        } else {
            console.error("Failed to fetch rooms:", await response.text());
            return [];
        }
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
    }
};

export const deleteDiscussionRoom = async (roomId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log("Deleting room:", roomId);

        const headers = { ...getAuthHeaders() };

        const response = await fetch(`${API_BASE_URL}/debate/room/${roomId}`, {
            method: 'DELETE',
            headers: headers
        });

        console.log("Delete room status:", response.status);

        if (response.ok) {
            console.log("Room deleted successfully:", roomId);
            return { success: true };
        } else {
            const errorText = await response.text();
            console.error("Failed to delete room:", errorText);
            return { success: false, error: `${response.status} ${errorText}` };
        }
    } catch (error) {
        console.error("Error deleting room:", error);
        return { success: false, error: 'Failed to connect to backend' };
    }
};

// --- Base Hook: useStomp ---
interface UseStompConfig {
    url: string;
    onConnect?: (frame: any) => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
}

export const useStomp = ({ url, onConnect, onDisconnect, onError }: UseStompConfig) => {
    const stompClientRef = useRef<CompatClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState<any>(null);

    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    const onErrorRef = useRef(onError);

    // Update refs on render
    useEffect(() => {
        onConnectRef.current = onConnect;
        onDisconnectRef.current = onDisconnect;
        onErrorRef.current = onError;
    }, [onConnect, onDisconnect, onError]);

    const connect = useCallback(() => {
        if (stompClientRef.current?.connected) {
            return; // Already connected
        }

        const token = localStorage.getItem('accessToken');

        // ✅ URL에 토큰을 쿼리 파라미터로 추가
        const socketUrl = token ? `${url}?token=${token}` : url;

        console.log('🔌 Connecting to WebSocket with token:', token ? 'Present' : 'Missing');

        const client = Stomp.over(() => new SockJS(socketUrl));
        client.debug = (str) => {
            console.log('🐛 [STOMP DEBUG]', str);
        };

        const connectHeaders: any = {};
        if (token) {
            connectHeaders['Authorization'] = `Bearer ${token}`;
        }

        client.connect(
            connectHeaders, // STOMP CONNECT 프레임에 헤더 추가
            (frame: any) => {
                console.log('✅ Stomp Connected: ' + frame);
                setIsConnected(true);
                setLastError(null);
                if (onConnectRef.current) onConnectRef.current(frame);
            },
            (error: any) => {
                console.error('❌ Stomp Error:', error);
                setIsConnected(false);
                setLastError(error);
                if (onErrorRef.current) onErrorRef.current(error);
            }
        );

        stompClientRef.current = client;
    }, [url]);
    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.disconnect(() => {
                console.log('Stomp Disconnected');
                setIsConnected(false);
                if (onDisconnectRef.current) onDisconnectRef.current();
            });
            stompClientRef.current = null;
        }
    }, []);

    const subscribe = useCallback((destination: string, callback: (message: Message) => void) => {
        if (!stompClientRef.current || !stompClientRef.current.connected) {
            console.warn('Cannot subscribe: Stomp client not connected');
            return;
        }
        return stompClientRef.current.subscribe(destination, callback);
    }, []);

    const sendMessage = useCallback((destination: string, body: any, headers: any = {}) => {
        if (!stompClientRef.current || !stompClientRef.current.connected) {
            console.warn('Cannot send message: Stomp client not connected');
            return;
        }
        stompClientRef.current.send(destination, headers, JSON.stringify(body));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    return {
        connect,
        disconnect,
        subscribe,
        sendMessage,
        isConnected,
        lastError,
        client: stompClientRef.current
    };
};

// --- High-Level Hook: useDiscussion ---
export const useDiscussion = (roomId: string | undefined) => {
    // 1. User Data from localStorage
    const [userId] = useState(() => localStorage.getItem('userId') ?? '');
    const [username] = useState(() => localStorage.getItem('nickname') ?? 'Guest');

    // 2. State Management
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'verify' | 'result' | 'final'>('vote');
    const [isAnonymous, setIsAnonymous] = useState(false);


    const [participantVotes, setParticipantVotes] = useState<Record<string, 'agree' | 'disagree'>>({});

    // 3. Helpers
    const handleIncomingMessage = useCallback((message: any) => {
        console.log('🔍 handleIncomingMessage called with type:', message.type, 'full message:', message);

        // 0. Update Vote Counts (Capture status from ANY message type if present)
        // Fallback to message.sender if userId is missing (which seems to be the case for STATUS messages)
        const userKey = message.userId || message.sender;

        if (userKey && (message.status || message.type === 'STATUS')) {
            let voteSide: 'agree' | 'disagree' | null = null;
            if (message.status === 'PRO') voteSide = 'agree';
            else if (message.status === 'CON') voteSide = 'disagree';

            if (voteSide) {
                setParticipantVotes(prev => {
                    if (prev[userKey] === voteSide) return prev;
                    console.log(`🗳️ Updating vote for ${userKey}: ${voteSide}`);
                    return { ...prev, [userKey]: voteSide! };
                });
            }
        }

        if (message.type === 'JOIN' || message.type === 'LEAVE') {
            console.log('⏭️ Skipping JOIN/LEAVE message');
            return;
        }

        // Handle END_SESSION messages - navigate students to map page
        if (message.type === 'END_SESSION') {
            console.log('🚪 END_SESSION received');
            const userRole = localStorage.getItem('userRole');
            if (userRole !== 'TEACHER') {
                console.log('👨‍🎓 Student: navigating to map page');
                localStorage.setItem('openPanel', 'discussion');
                window.location.href = '/map';
            }
            return;
        }

        // Check for special mode change message sent via chat
        if (message.content && typeof message.content === 'string' && message.content.startsWith('__MODE_CHANGE__:')) {
            const nextMode = message.content.replace('__MODE_CHANGE__:', '');
            console.log('📢 MODE_CHANGE detected via chat:', nextMode);
            setViewMode(nextMode as any);

            // Auto-vote logic for students when moving past 'vote' stage
            if (nextMode !== 'vote') {
                setVote(prevVote => {
                    if (prevVote === null) {
                        const randomVote = Math.random() < 0.5 ? 'agree' : 'disagree';
                        console.log(`🔄 Auto-voting as '${randomVote}' for user who hadn't voted yet.`);
                        return randomVote;
                    }
                    return prevVote;
                });
            }
            return; // Don't display this as a chat message
        }

        // Check for VOTE message via chat
        if (message.content && typeof message.content === 'string' && message.content.startsWith('__VOTE__:')) {
            const voteSideStr = message.content.replace('__VOTE__:', '');
            console.log('🗳️ VOTE detected via chat:', voteSideStr, 'from:', message.sender);

            const userKey = message.userId || message.sender;
            if (userKey) {
                setParticipantVotes(prev => {
                    const newVotes = { ...prev };
                    if (voteSideStr === 'cancel') {
                        delete newVotes[userKey];
                        return newVotes;
                    }

                    if (voteSideStr === 'agree' || voteSideStr === 'disagree') {
                        newVotes[userKey] = voteSideStr as 'agree' | 'disagree';
                        return newVotes;
                    }
                    return prev;
                });
            }
            return; // Don't display
        }

        // Check for ANONYMOUS message via chat
        if (message.content && typeof message.content === 'string' && message.content.startsWith('__ANONYMOUS__:')) {
            const anonSignal = message.content.replace('__ANONYMOUS__:', '');
            console.log('🕵️ ANONYMOUS signal detected:', anonSignal);
            if (anonSignal === 'ON') setIsAnonymous(true);
            else if (anonSignal === 'OFF') setIsAnonymous(false);
            return; // Don't display
        }

        // Skip STATUS messages (they're for internal state management)
        if (message.type === 'STATUS') {
            console.log('⏭️ Skipping STATUS message');
            return;
        }

        // Filter out anonymous system messages from chat log processing
        // (They are already handled by DiscussionRoomPage via messages prop, but good to keep clean here if needed)
        // Actually, DiscussionRoomPage filters them at render time, so we let them pass through to 'messages' state
        // so that the component can see them and toggle state.

        let side: 'agree' | 'disagree' = 'agree';
        if (message.status === 'CON') side = 'disagree';
        else if (message.status === 'PRO') side = 'agree';
        else if (message.side) side = message.side;

        const displayMsg: DisplayMessage = {
            ...message,
            content: message.content || message.text || '',
            side: side
        };

        console.log('➕ Adding message to display:', displayMsg);
        setMessages((prev) => {
            const newMessages = [...prev, displayMsg];
            console.log('📝 Messages updated. Total count:', newMessages.length);
            return newMessages;
        });

        // if (message.type === 'CHAT' && message.userId === userId) {
        //     // alert("✅ 채팅 전송 성공! (Backend를 거쳐 Redis에 저장되었습니다)");
        //     // Alert removed as per typical UX, or kept if requested. User removed it in recent edit.
        // }
    }, [userId, setViewMode, setVote, setParticipantVotes]);

    // 4. WebSocket Integration
    const { connect, disconnect, subscribe, sendMessage, isConnected, lastError } = useStomp({
        url: `/api/ws-stomp`,
        onConnect: () => {
            console.log('🔗 onConnect callback triggered, roomId:', roomId);
            if (!roomId) return;

            // moderation 알림 구독 추가
            subscribe('/user/queue/moderation', (msg) => {
                try {
                const payload = JSON.parse(msg.body);
                console.log('Moderation event:', payload);

                if (payload.type === 'warning') {
                    alert(payload.notice);
                } else if (payload.type === 'blocked') {
                    alert(payload.notice);
                    // TODO: 입력창 잠금 + 카운트다운
                }
                } catch (e) {
                console.warn('Moderation message parse failed:', msg.body);
                }
            });

            const subscription = subscribe('/topic/room/' + roomId, (chatMessage) => {
                console.log('📨 Raw WebSocket message received:', chatMessage);
                const parsed = JSON.parse(chatMessage.body);
                console.log('📨 Parsed message:', parsed);

                handleIncomingMessage(parsed);
            });

            console.log('✅ Subscribed to /topic/room/' + roomId, subscription);

            // Auto-Join on Connect
            console.log('📤 Sending JOIN message with userId:', userId);
            sendMessage('/app/room/' + roomId + '/join', {
                sender: username,
                type: 'JOIN',
                userId: userId,
            });
        },
        onError: (error) => {
            const errorMsg = typeof error === 'string' ? error : (error?.headers?.message || "WebSocket Error");
            console.error(`🚨 WebSocket 오류 발생: ${errorMsg}`, error);
        }
    });

    // Auto-connect
    useEffect(() => {
        if (roomId) connect();
        return () => disconnect();
    }, [roomId, connect, disconnect]);


    // Track previous viewMode to detect transitions
    const prevViewModeRef = useRef(viewMode);

    // Auto-send vote status for STUDENTS when transitioning from 'vote' to other modes
    useEffect(() => {
        const prevMode = prevViewModeRef.current;
        prevViewModeRef.current = viewMode;

        // Only send if transitioning from 'vote' AND user is a student (not teacher)
        if (prevMode === 'vote' && viewMode !== 'vote' && localStorage.getItem('userRole') !== 'TEACHER') {
            // Determine vote to send (use current or random 50% if not voted)
            const voteToSend = vote || (Math.random() < 0.5 ? 'agree' : 'disagree');
            const status = voteToSend === 'agree' ? 'PRO' : 'CON';

            console.log('📤 Student auto-sending vote status on mode change:', { status, userId, viewMode });

            if (roomId && isConnected) {
                sendMessage(
                    "/app/room/" + roomId + "/status",
                    { status: status, userId: userId }
                );
            }
        }
    }, [viewMode, vote, roomId, isConnected, sendMessage, userId]);


    // 5. Actions

    const sendChat = (content: string, parentId?: string) => {
        console.log('💬 sendChat called:', { content, vote, roomId, viewMode, isConnected, userId });

        if (!roomId || !viewMode) {
            console.warn('⚠️ Cannot send chat: missing roomId or viewMode');
            return;
        }

        if (!vote) {
            console.warn('⚠️ Cannot send chat: no vote selected');
            alert('투표를 먼저 선택해주세요!');
            return;
        }

        const status = vote === 'agree' ? 'PRO' : 'CON';

        // Send chat message with status and userId
        console.log('📤 Sending chat message:', { content, status, parentId, userId });
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: content,
                status: status,
                parentId: parentId,
                userId: userId,
                sender: username,
                type: 'CHAT',
            }
        );
    };

    // Non-persisting system signal (no type: 'CHAT')
    const sendSystemSignal = (signalContent: string) => {
        if (!roomId || !isConnected) return;
        console.log('📤 Sending system signal (no persist):', signalContent);
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: signalContent,
                status: 'PRO',
                userId: userId,
                sender: username,
            }
        );
    };

    const sendVoteStatus = (selectedVote: 'agree' | 'disagree') => {
        if (!roomId) return;
        setVote(selectedVote);
        const status = selectedVote === 'agree' ? 'PRO' : 'CON';
        console.log('📤 Sending STATUS message with userId:', userId);
        sendMessage(
            "/app/room/" + roomId + "/status",
            { status: status, userId: userId }
        );
        // vote 모드일 때만 chat으로 전환 (선생님이 다른 모드에서 버튼 누를 때는 모드 유지)
        if (viewMode === 'vote') {
            setViewMode('chat');
        }
    };

    const sendModeChange = (nextMode: string) => {
        console.log('🔄 sendModeChange called:', { nextMode, roomId, isConnected });
        if (!roomId || !isConnected) {
            console.warn('⚠️ Cannot send mode change: roomId or connection missing');
            return;
        }

        // Update local state immediately for teacher
        setViewMode(nextMode as any);
        console.log('✅ Local viewMode updated to:', nextMode);

        // Send as CHAT message with special format for students to detect
        console.log('📤 Sending MODE_CHANGE message with userId:', userId);
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: `__MODE_CHANGE__:${nextMode}`,
                status: 'PRO',
                userId: userId,
            }
        );
        console.log('✅ Mode change message sent via chat:', nextMode);
    };

    const sendEndSession = () => {
        console.log('🚪 sendEndSession called:', { roomId, isConnected });
        if (!roomId || !isConnected) {
            console.warn('⚠️ Cannot send end session: roomId or connection missing');
            return;
        }

        console.log('📤 Sending END_SESSION message (no persist)');
        // Omit type to prevent DB save
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: '__END_SESSION__',
                status: 'PRO',
                userId: userId,
                sender: username,
            }
        );
        console.log('✅ End session message sent');
    };

    const setVoteLocal = (v: 'agree' | 'disagree' | null) => {
        console.log('🗳️ Vote changed:', { from: vote, to: v });
        if (v === null) {
            setVote(null);
        } else {
            setVote(v);
        }
    };

    const broadcastVote = (selectedVote: 'agree' | 'disagree' | null) => {
        if (!roomId || !isConnected) return;

        let content = '';
        let status = 'PRO'; // Default fallback, backend might require one of PRO/CON

        if (selectedVote === null) {
            content = '__VOTE__:cancel';
        } else {
            content = `__VOTE__:${selectedVote}`;
            status = selectedVote === 'agree' ? 'PRO' : 'CON';
        }

        console.log('📤 Broadcasting vote (no persist):', selectedVote || 'CANCEL');

        // Omit type: 'CHAT' to prevent DB save (same as sendModeChange)
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: content,
                status: status,
                userId: userId,
                sender: username
            }
        );
    };

    return {
        // State
        messages,
        vote,
        viewMode,
        // userId,
        username,
        isConnected, // Exposed for UI indicators
        lastError,
        agreeCount: Object.values(participantVotes).filter(v => v === 'agree').length,
        disagreeCount: Object.values(participantVotes).filter(v => v === 'disagree').length,
        isAnonymous,

        // Actions
        setVote: setVoteLocal,
        broadcastVote,
        setViewMode,
        sendChat,
        sendSystemSignal,
        sendVoteStatus, // This combines setting vote (if needed) and sending status
        sendModeChange,
        sendEndSession,
        confirmStart: () => { // Replacement for handleStart logic
            console.log('🚀 confirmStart called:', { roomId, vote, isConnected });
            if (!roomId) {
                console.warn('⚠️ Cannot start: no roomId');
                return;
            }
            // Randomly select if no vote selected
            let currentVote = vote;
            if (!currentVote) {
                currentVote = Math.random() < 0.5 ? 'agree' : 'disagree';
                console.log(`🔄 Auto-setting vote to ${currentVote}`);
                setVote(currentVote);
            }

            const status = currentVote === 'agree' ? 'PRO' : 'CON';

            if (!isConnected) {
                console.warn('⚠️ Cannot start: Stomp client not connected');
                alert('연결이 끊겼습니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            console.log('📤 Sending status message:', { status, userId });
            sendMessage(
                "/app/room/" + roomId + "/status",
                { status: status, userId: userId }
            );
            // Also notify room about mode change if teacher
            if (localStorage.getItem('userRole') === 'TEACHER') {
                console.log('👨‍🏫 Teacher: sending mode change to chat');
                sendModeChange('chat');
            } else {
                console.log('👨‍🎓 Student: setting local viewMode to chat');
                setViewMode('chat');
            }
        }
    };
};

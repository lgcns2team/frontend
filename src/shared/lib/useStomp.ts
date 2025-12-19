import { useRef, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient, type Message } from '@stomp/stompjs';

// --- Types ---
export interface ChatMessage {
    id?: string;
    parentId?: string;
    // userId?: string;
    sender: string;
    content: string;
    type: 'CHAT' | 'JOIN' | 'LEAVE' | 'STATUS';
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
    // Helper fields for UI if needed, but strict DTO mapping is best.
    id?: string; // We might map roomId to id for frontend compatibility
    title?: string;
    description?: string;
}

// --- API Functions ---
// --- API Functions ---
export const createShortDiscussionRoom = async (payload: CreateRoomPayload) => {
    try {
        const response = await fetch('/api/ai/debate/room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
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

        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let url = '/api/ai/debate/roomList';
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

            // Map backend DTO to frontend structure if necessary, or just return.
            // Frontend currently expects: { id, title, description, content... }
            // Let's normalize it here to avoid breaking UI.
            return data.map(room => ({
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

    client.connect(
        {}, // 헤더는 비워둠 (SockJS에서는 CONNECT 헤더 제어가 어려움)
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
    // 1. Mock Data Generation
    // const [userId] = useState(() => crypto.randomUUID());
    // const [username] = useState(() => `User ${Math.floor(Math.random() * 100)}`);
    const [username] = useState(() => localStorage.getItem('nickname') ?? 'Guest');

    // 2. State Management
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'verify' | 'result' | 'final'>('vote');

    // 3. Helpers
    const handleIncomingMessage = useCallback((message: any) => {
        console.log('🔍 handleIncomingMessage called with type:', message.type, 'full message:', message);

        if (message.type === 'JOIN' || message.type === 'LEAVE') {
            console.log('⏭️ Skipping JOIN/LEAVE message');
            return;
        }

        // Handle MODE_CHANGE messages for state synchronization
        if (message.type === 'MODE_CHANGE') {
            const nextMode = message.content;
            console.log('📢 MODE_CHANGE received:', nextMode);
            setViewMode(nextMode);

            // Auto-vote logic for students when moving past 'vote' stage
            if (nextMode !== 'vote') {
                setVote(prevVote => {
                    if (prevVote === null) {
                        const defaultVote = 'agree';
                        console.log("🔄 Auto-voting as 'agree' for user who hadn't voted yet.");
                        return defaultVote;
                    }
                    return prevVote;
                });
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

        // Check if message contains viewMode field (alternative mode change detection)
        if (message.viewMode) {
            const nextMode = message.viewMode;
            console.log('📢 ViewMode detected in message:', nextMode);
            setViewMode(nextMode);

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
            return;
        }

        // Skip STATUS messages (they're for internal state management)
        if (message.type === 'STATUS') {
            console.log('⏭️ Skipping STATUS message');
            return;
        }

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
    }, []);

    // 4. WebSocket Integration
    const { connect, disconnect, subscribe, sendMessage, isConnected, lastError } = useStomp({
        url: '/api/ai/ws-stomp',
        onConnect: (frame) => {
            if (!roomId) return;
            subscribe('/topic/room/' + roomId, (chatMessage) => {
                const parsed = JSON.parse(chatMessage.body);
                console.log('📨 Received message:', parsed);
                handleIncomingMessage(parsed);
            });

            // Auto-Join on Connect
            // sendMessage(
            //     "/app/room/" + roomId + "/join",
            //     { sender: username, type: 'JOIN', roomId: roomId, side: vote }
            // );
            sendMessage('/app/room/' + roomId + '/join', {
                sender: username,
                type: 'JOIN',
            });
        },
        onError: (error) => {
            const errorMsg = typeof error === 'string' ? error : (error?.headers?.message || "WebSocket Error");
            alert(`🚨 채팅 오류 발생: ${errorMsg}`);
        }
    });

    // Auto-connect
    useEffect(() => {
        if (roomId) connect();
        return () => disconnect();
    }, [roomId, connect, disconnect]);


    // 5. Actions
    const joinRoom = () => {
        // if (roomId && isConnected) {
        //     sendMessage(
        //         "/app/room/" + roomId + "/join",
        //         { sender: username, type: 'JOIN', userId: userId, roomId: roomId, side: vote }
        //     );
        // }
        if (roomId && isConnected) {
            sendMessage('/app/room/' + roomId + '/join', {
                sender: username,
                type: 'JOIN',
            });
        }
    };

    const sendChat = (content: string, parentId?: string) => {
        console.log('💬 sendChat called:', { content, vote, roomId, viewMode, isConnected });

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

        // Ensure status is sent to backend before sending chat
        console.log('📤 Ensuring status is set:', status);
        // sendMessage(
        //     "/app/room/" + roomId + "/status",
        //     { status: status, userId: userId }
        // );
        sendMessage('/app/room/' + roomId + '/chat', {
            content,
            parentId,
            // status, // 서버가 필요하면 주석 해제
        });

        // Small delay to ensure status is processed
        setTimeout(() => {
            console.log('📤 Sending chat message:', { content, status, parentId });
            sendMessage(
                "/app/room/" + roomId + "/chat",
                {
                    content: content,
                    status: status,
                    parentId: parentId,
                    // userId: userId
                }
            );
        }, 100);
    };

    const sendVoteStatus = (selectedVote: 'agree' | 'disagree') => {
        if (!roomId) return;
        setVote(selectedVote);
        // Note: The actual backend call for status usually happens via 'handleStart' in UI
        // But we can expose a method to sync it.
        const status = selectedVote === 'agree' ? 'PRO' : 'CON';
        sendMessage(
            "/app/room/" + roomId + "/status",
            { status: status }
        );
        setViewMode('chat');
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
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: `__MODE_CHANGE__:${nextMode}`,
                status: 'PRO'
                // userId: userId
            }
        );
        console.log('✅ Mode change message sent via chat:', nextMode);
    };

    const setVoteLocal = (v: 'agree' | 'disagree' | null) => {
        console.log('🗳️ Vote changed:', { from: vote, to: v });
        if (v === null) {
            setVote(null);
        } else {
            setVote(v);
        }
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

        // Actions
        setVote: setVoteLocal,
        setViewMode,
        sendChat,
        sendVoteStatus, // This combines setting vote (if needed) and sending status
        sendModeChange,
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

            console.log('📤 Sending status message:', { status });
            sendMessage(
                "/app/room/" + roomId + "/status",
                { status: status }
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

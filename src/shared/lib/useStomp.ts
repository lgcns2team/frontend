import { useRef, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient, type Message } from '@stomp/stompjs';

// --- Types ---
export interface ChatMessage {
    id?: string;
    parentId?: string;
    userId?: string;
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
    teacherId: string;
}

// --- API Functions ---
export const createShortDiscussionRoom = async (payload: CreateRoomPayload) => {
    try {
        const response = await fetch('/api/ai/debate/room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

        const client = Stomp.over(() => new SockJS(url));

        client.connect({}, (frame: any) => {
            console.log('Stomp Connected: ' + frame);
            setIsConnected(true);
            setLastError(null);
            if (onConnectRef.current) onConnectRef.current(frame);
        }, (error: any) => {
            console.error('Stomp Error:', error);
            setIsConnected(false);
            setLastError(error);
            if (onErrorRef.current) onErrorRef.current(error);
        });

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
    const [userId] = useState(() => crypto.randomUUID());
    const [username] = useState(() => `User ${Math.floor(Math.random() * 100)}`);

    // 2. State Management
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
    const [viewMode, setViewMode] = useState<'vote' | 'chat' | 'verify' | 'result' | 'final'>('vote');

    // 3. Helpers
    const handleIncomingMessage = useCallback((message: any) => {
        if (message.type === 'JOIN' || message.type === 'LEAVE') return;

        let side: 'agree' | 'disagree' = 'agree';
        if (message.status === 'CON') side = 'disagree';
        else if (message.status === 'PRO') side = 'agree';
        else if (message.side) side = message.side;

        const displayMsg: DisplayMessage = {
            ...message,
            content: message.content || message.text || '',
            side: side
        };

        setMessages((prev) => [...prev, displayMsg]);

        if (message.type === 'CHAT' && message.userId === userId) {
            // alert("✅ 채팅 전송 성공! (Backend를 거쳐 Redis에 저장되었습니다)");
            // Alert removed as per typical UX, or kept if requested. User removed it in recent edit.
        }
    }, [userId]);

    // 4. WebSocket Integration
    const { connect, disconnect, subscribe, sendMessage, isConnected, lastError } = useStomp({
        url: '/ws-stomp',
        onConnect: (frame) => {
            if (!roomId) return;
            subscribe('/topic/room/' + roomId, (chatMessage) => {
                handleIncomingMessage(JSON.parse(chatMessage.body));
            });

            // Auto-Join on Connect
            sendMessage(
                "/app/room/" + roomId + "/join",
                { sender: username, type: 'JOIN', userId: userId, roomId: roomId, side: vote }
            );
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
        if (roomId && isConnected) {
            sendMessage(
                "/app/room/" + roomId + "/join",
                { sender: username, type: 'JOIN', userId: userId, roomId: roomId, side: vote }
            );
        }
    };

    const sendChat = (content: string, parentId?: string) => {
        if (!roomId || !viewMode) return;
        const status = vote === 'agree' ? 'PRO' : 'CON';
        sendMessage(
            "/app/room/" + roomId + "/chat",
            {
                content: content,
                status: status,
                parentId: parentId,
                userId: userId
            }
        );
    };

    const sendVoteStatus = (selectedVote: 'agree' | 'disagree') => {
        if (!roomId) return;
        setVote(selectedVote);
        // Note: The actual backend call for status usually happens via 'handleStart' in UI
        // But we can expose a method to sync it.
        const status = selectedVote === 'agree' ? 'PRO' : 'CON';
        sendMessage(
            "/app/room/" + roomId + "/status",
            { status: status, userId: userId }
        );
        setViewMode('chat');
    };

    const setVoteLocal = (v: 'agree' | 'disagree') => setVote(v);

    return {
        // State
        messages,
        vote,
        viewMode,
        userId,
        username,
        isConnected, // Exposed for UI indicators
        lastError,

        // Actions
        setVote: setVoteLocal,
        setViewMode,
        sendChat,
        sendVoteStatus, // This combines setting vote (if needed) and sending status
        confirmStart: () => { // Replacement for handleStart logic
            if (!vote || !roomId) return;
            const status = vote === 'agree' ? 'PRO' : 'CON';
            sendMessage(
                "/app/room/" + roomId + "/status",
                { status: status, userId: userId }
            );
            setViewMode('chat');
        }
    };
};

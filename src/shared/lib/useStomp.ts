import { useRef, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient, type Message } from '@stomp/stompjs';

interface UseStompConfig {
    url: string;
    onConnect?: (frame: any) => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
}

export const useStomp = ({ url, onConnect, onDisconnect, onError }: UseStompConfig) => {
    const stompClientRef = useRef<CompatClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        if (stompClientRef.current?.connected) {
            return; // Already connected
        }

        const socket = new SockJS(url);
        const client = Stomp.over(socket);

        client.connect({}, (frame: any) => {
            console.log('Stomp Connected: ' + frame);
            setIsConnected(true);
            if (onConnect) onConnect(frame);
        }, (error: any) => {
            console.error('Stomp Error:', error);
            setIsConnected(false);
            if (onError) onError(error);
        });

        stompClientRef.current = client;
    }, [url, onConnect, onError]);

    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.disconnect(() => {
                console.log('Stomp Disconnected');
                setIsConnected(false);
                if (onDisconnect) onDisconnect();
            });
            stompClientRef.current = null;
        }
    }, [onDisconnect]);

    const subscribe = useCallback((destination: string, callback: (message: Message) => void) => {
        if (!stompClientRef.current || !isConnected) {
            console.warn('Cannot subscribe: Stomp client not connected');
            return;
        }
        return stompClientRef.current.subscribe(destination, callback);
    }, [isConnected]);

    const sendMessage = useCallback((destination: string, body: any, headers: any = {}) => {
        if (!stompClientRef.current || !isConnected) {
            console.warn('Cannot send message: Stomp client not connected');
            return;
        }
        stompClientRef.current.send(destination, headers, JSON.stringify(body));
    }, [isConnected]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stompClientRef.current) {
                // We don't auto-disconnect here because sometimes we want to persist across simple re-renders,
                // BUT for a hook usage, usually we want cleanup.
                // However, be careful if the component unmounts for a moment.
                // For now, let's auto-disconnect for safety.
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
        client: stompClientRef.current
    };
};

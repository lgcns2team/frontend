import { getStreamingHeaders, getUserId } from './api-utils';

/**
 * Stream event types from AI chat API
 */
export interface AIChatStreamEvent {
    type: 'content' | 'citations' | 'done' | 'error';
    text?: string;
    count?: number;
    total_length?: number;
    message?: string;
}
/**
 * AI 대화 히스토리 아이템 구조
 */
export interface ChatHistoryItem {
    role: 'user' | 'assistant' | 'ai';
    content: string,
    createdAt?: string;
}

/**
 * AI 인물과의 대화 히스토리 불러오기
 * @param promptId - 인물의 prompt ID
 */
export const getCharacterChatHistory = async (
    promptId: string
) : Promise<ChatHistoryItem[]> => {
    const userId = getUserId();
    // 백엔드 엔드포인트에 맞춰 URL 생성
    const url = `/api/ai-person/${promptId}/history?userId=${userId}`;

    console.log('📜 [getCharacterChatHistory] Fetching history:', { url, promptId });

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 인증 토큰이 필요하다면 기존 유틸리티 활용
                ...getStreamingHeaders(), 
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [getCharacterChatHistory] Success:', data.length, 'messages found');
        return data;
    } catch (error) {
        console.error('❌ [getCharacterChatHistory] Error:', error);
        return []; 
    }
}

/**
 * Callback function for handling streaming chunks
 */
export type StreamCallback = (text: string) => void;

/**
 * Send a message to AI character chat and receive streaming response
 * @param promptId - Character's prompt ID
 * @param message - User's message
 * @param onChunk - Callback function called for each text chunk
 */
export const sendCharacterMessage = async (
    promptId: string,
    message: string,
    onChunk: StreamCallback
): Promise<void> => {
    const userId = getUserId();
    const url = `/api/ai-person/${promptId}/chat?userId=${userId}`;

    console.log('🚀 [sendCharacterMessage] Starting request:', { url, promptId, userId });

    const response = await fetch(url, {
        method: 'POST',
        headers: getStreamingHeaders(),
        body: JSON.stringify({ message }),
    });

    console.log('📥 [sendCharacterMessage] Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [sendCharacterMessage] Request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        console.error('❌ [sendCharacterMessage] Response body is null');
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim();
                if (!dataStr || dataStr === '[DONE]') continue;

                // Try JSON parsing, fallback to plain text
                try {
                    const event: AIChatStreamEvent = JSON.parse(dataStr);
                    console.log('📦 [sendCharacterMessage] Parsed event:', event.type);
                    if (event.type === 'content' && event.text) {
                        onChunk(event.text);
                    } else if (typeof event === 'string') {
                        onChunk(event);
                    }
                } catch (e) {
                    // Not JSON, treat as plain text
                    console.log('📝 [sendCharacterMessage] Plain text chunk:', dataStr.substring(0, 50));
                    if (dataStr) {
                        onChunk(dataStr);
                    }
                }
            }
        }
    }
};

/**
 * Send a message to general AI chat and receive streaming response
 * @param message - User's message
 * @param onChunk - Callback function called for each text chunk
 */
export const sendGeneralMessage = async (
    message: string,
    onChunk: StreamCallback
): Promise<void> => {
    const url = '/api/ai/chat';
    console.log('🚀 [sendGeneralMessage] Starting request:', { url, message: message.substring(0, 50) });

    const response = await fetch(url, {
        method: 'POST',
        headers: getStreamingHeaders(),
        body: JSON.stringify({ message }),
    });

    console.log('📥 [sendGeneralMessage] Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [sendGeneralMessage] Request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        console.error('❌ [sendGeneralMessage] Response body is null');
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim();
                if (!dataStr || dataStr === '[DONE]') continue;

                try {
                    const event: AIChatStreamEvent = JSON.parse(dataStr);

                    if (event.type === 'content' && event.text) {
                        onChunk(event.text);
                    } else if (event.type === 'citations') {
                        console.log('📚 Received citations:', event.count);
                    } else if (event.type === 'done') {
                        console.log('✅ Stream completed');
                    } else if (event.type === 'error') {
                        console.error('❌ Error from backend:', event.message);
                    }
                } catch (e) {
                    console.error('Error parsing SSE JSON:', e, 'Data:', dataStr);
                }
            }
        }
    }
};
